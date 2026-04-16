import { NextResponse } from "next/server";

import { ADD_ON_CHARM_PRICE, calculateOrderTotal } from "@/src/lib/cart";
import { BRACELET_SIZES } from "@/src/lib/catalog";
import { getCatalogProductMapByIds } from "@/src/lib/catalog-db";
import { ensureDatabaseInitialized } from "@/src/lib/db-init";
import {
  sendCustomerConfirmationEmail,
  sendOwnerOrderEmail,
  type EmailOrderPayload,
} from "@/src/lib/email";
import { writeEmailLog } from "@/src/lib/logger";
import { generateOrderNumber } from "@/src/lib/order-number";
import { ORDER_STATUS } from "@/src/lib/order-status";
import { prisma } from "@/src/lib/prisma";
import { createOrderPayloadSchema } from "@/src/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();

    const rawPayload = (await request.json()) as unknown;
    const parsed = createOrderPayloadSchema.safeParse(rawPayload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "訂單資料格式錯誤" }, { status: 400 });
    }

    const { items, checkout } = parsed.data;
    const productIds = [...new Set(items.map((item) => item.productId))];
    const productMap = await getCatalogProductMapByIds(productIds);

    const readyMadeProducts = await prisma.adminProduct.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        description: true,
        imageUrl: true,
      },
    });
    const readyMadeMap = new Map(readyMadeProducts.map((product) => [product.id, product]));
    const readyMadeDemand = new Map<string, number>();

    const itemsWithResolvedProduct = items.map((item) => {
      const catalogProduct = productMap.get(item.productId);
      if (catalogProduct) {
        const normalizedSizeValue = catalogProduct.categoryType === "necklace" ? "固定尺寸" : item.sizeValue.trim();

        if (
          catalogProduct.categoryType === "bracelet" &&
          !BRACELET_SIZES.includes(normalizedSizeValue as (typeof BRACELET_SIZES)[number])
        ) {
          throw new Error("手鍊尺寸僅可選 13-17");
        }

        if (catalogProduct.categoryType === "ring" && normalizedSizeValue.length < 1) {
          throw new Error("請填寫戒圍尺寸");
        }

        if (!catalogProduct.allowCharm && item.addOnCharmQuantity > 0) {
          throw new Error(`商品「${catalogProduct.name}」不可加購小綴飾`);
        }

        return {
          item,
          kind: "catalog" as const,
          product: catalogProduct,
          normalizedSizeValue,
        };
      }

      const readyMadeProduct = readyMadeMap.get(item.productId);
      if (!readyMadeProduct) {
        throw new Error("商品不存在或已下架，請重新加入購物車");
      }

      if (item.addOnCharmQuantity > 0) {
        throw new Error(`商品「${readyMadeProduct.name}」不可加購小綴飾`);
      }

      readyMadeDemand.set(item.productId, (readyMadeDemand.get(item.productId) ?? 0) + item.quantity);

      return {
        item,
        kind: "ready-made" as const,
        product: readyMadeProduct,
        normalizedSizeValue: "現貨",
      };
    });

    for (const [productId, quantity] of readyMadeDemand.entries()) {
      const product = readyMadeMap.get(productId);
      if (!product || product.stock < quantity) {
        throw new Error(`預製作品「${product?.name ?? "未知商品"}」庫存不足`);
      }
    }

    const orderNumber = generateOrderNumber();
    const totalAmount = calculateOrderTotal(
      itemsWithResolvedProduct.map(({ item, product, kind }) => ({
        quantity: item.quantity,
        addOnCharmQuantity: item.addOnCharmQuantity,
        unitPrice: product.price,
        allowCharm: kind === "catalog" ? product.allowCharm : false,
      })),
    );

    const createdOrder = await prisma.$transaction(async (tx) => {
      for (const [productId, quantity] of readyMadeDemand.entries()) {
        const updated = await tx.adminProduct.updateMany({
          where: {
            id: productId,
            stock: { gte: quantity },
          },
          data: {
            stock: { decrement: quantity },
          },
        });

        if (updated.count !== 1) {
          const product = readyMadeMap.get(productId);
          throw new Error(`預製作品「${product?.name ?? "未知商品"}」庫存不足`);
        }
      }

      return tx.order.create({
        data: {
          orderNumber,
          status: ORDER_STATUS.PROCESSING,
          customerGmail: checkout.customerGmail.trim(),
          customerInstagram: checkout.customerInstagram || null,
          customerLine: checkout.customerLine || null,
          note: checkout.note || null,
          totalAmount,
          items: {
            create: itemsWithResolvedProduct.map(({ item, product, kind, normalizedSizeValue }) => ({
              productId: product.id,
              productName: product.name,
              unitPrice: product.price,
              quantity: item.quantity,
              categoryType: kind === "catalog" ? product.categoryType : "ready-made",
              sizeValue: normalizedSizeValue,
              colorScheme: kind === "catalog" ? item.colorScheme : "依作品實物",
              styleDescription:
                kind === "catalog"
                  ? item.styleDescription
                  : item.styleDescription.trim() || product.description || "預製作品",
              addOnCharm: kind === "catalog" ? product.allowCharm && item.addOnCharmQuantity > 0 : false,
              addOnCharmQuantity: kind === "catalog" && product.allowCharm ? item.addOnCharmQuantity : 0,
              addOnCharmPrice:
                kind === "catalog" && product.allowCharm ? item.addOnCharmQuantity * ADD_ON_CHARM_PRICE : 0,
              referenceImageUrl:
                kind === "ready-made" ? product.imageUrl || item.referenceImageUrl || null : item.referenceImageUrl || null,
            })),
          },
        },
        include: { items: true },
      });
    });

    const emailPayload: EmailOrderPayload = {
      orderNumber: createdOrder.orderNumber,
      createdAt: createdOrder.createdAt,
      totalAmount: createdOrder.totalAmount,
      customerGmail: createdOrder.customerGmail,
      customerInstagram: createdOrder.customerInstagram,
      customerLine: createdOrder.customerLine,
      note: createdOrder.note,
      items: createdOrder.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        sizeValue: item.sizeValue,
        colorScheme: item.colorScheme,
        styleDescription: item.styleDescription,
        addOnCharm: item.addOnCharmQuantity > 0,
        addOnCharmQuantity: item.addOnCharmQuantity,
        referenceImageUrl: item.referenceImageUrl,
      })),
    };

    const emailErrors: string[] = [];

    try {
      await sendOwnerOrderEmail(emailPayload);
      await writeEmailLog({ orderId: createdOrder.id, recipient: process.env.OWNER_EMAIL || "owner", emailType: "owner", status: "sent" });
    } catch (error) {
      await writeEmailLog({
        orderId: createdOrder.id,
        recipient: process.env.OWNER_EMAIL || "owner",
        emailType: "owner",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "未知錯誤",
      });
      emailErrors.push("店家通知信寄送失敗");
    }

    if (createdOrder.customerGmail) {
      try {
        await sendCustomerConfirmationEmail(emailPayload);
        await writeEmailLog({ orderId: createdOrder.id, recipient: createdOrder.customerGmail, emailType: "customer", status: "sent" });
      } catch (error) {
        await writeEmailLog({
          orderId: createdOrder.id,
          recipient: createdOrder.customerGmail,
          emailType: "customer",
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "未知錯誤",
        });
        emailErrors.push("客戶確認信寄送失敗");
      }
    } else {
      await writeEmailLog({
        orderId: createdOrder.id,
        recipient: "no-gmail",
        emailType: "customer",
        status: "skipped",
        errorMessage: "客戶未提供 Gmail，略過確認信",
      });
    }

    if (emailErrors.length > 0) {
      return NextResponse.json(
        {
          orderNumber: createdOrder.orderNumber,
          error: `訂單已建立，但發生通知問題：${emailErrors.join("、")}`,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ orderNumber: createdOrder.orderNumber });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "建立訂單失敗";
    const isClientError =
      errorMessage.includes("商品不存在") ||
      errorMessage.includes("已下架") ||
      errorMessage.includes("尺寸") ||
      errorMessage.includes("不可加購") ||
      errorMessage.includes("庫存不足");

    return NextResponse.json({ error: errorMessage }, { status: isClientError ? 400 : 500 });
  }
}
