import { NextResponse } from "next/server";

import { ADD_ON_CHARM_PRICE, calculateOrderTotal } from "@/src/lib/cart";
import { BRACELET_SIZES, NECKLACE_SIZES } from "@/src/lib/catalog";
import { getCatalogProductMapByIds } from "@/src/lib/catalog-db";
import { ORDER_STATUS } from "@/src/lib/order-status";
import { ensureDatabaseInitialized } from "@/src/lib/db-init";
import {
  sendCustomerConfirmationEmail,
  sendOwnerOrderEmail,
  type EmailOrderPayload,
} from "@/src/lib/email";
import { writeEmailLog } from "@/src/lib/logger";
import { generateOrderNumber } from "@/src/lib/order-number";
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
    const productMap = await getCatalogProductMapByIds(items.map((item) => item.productId));

    const itemsWithCatalog = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error("商品不存在或已下架，請重新加入購物車");
      }

      if (product.categoryType === "bracelet" && !BRACELET_SIZES.includes(item.sizeValue as (typeof BRACELET_SIZES)[number])) {
        throw new Error("手鍊尺寸僅可選 13-17");
      }

      if (product.categoryType === "necklace" && !NECKLACE_SIZES.includes(item.sizeValue as (typeof NECKLACE_SIZES)[number])) {
        throw new Error("請選擇項鍊長度類型");
      }

      if (product.categoryType === "ring" && item.sizeValue.trim().length < 1) {
        throw new Error("請填寫戒圍尺寸");
      }

      if (!product.allowCharm && item.addOnCharmQuantity > 0) {
        throw new Error(`商品「${product.name}」不可加購小綴飾`);
      }

      return { item, product };
    });

    const orderNumber = generateOrderNumber();
    const totalAmount = calculateOrderTotal(
      itemsWithCatalog.map(({ item, product }) => ({
        quantity: item.quantity,
        addOnCharmQuantity: item.addOnCharmQuantity,
        unitPrice: product.price,
        allowCharm: product.allowCharm,
      })),
    );

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber,
        status: ORDER_STATUS.PROCESSING,
        customerGmail: checkout.customerGmail || null,
        customerInstagram: checkout.customerInstagram || null,
        customerLine: checkout.customerLine || null,
        note: checkout.note || null,
        totalAmount,
        items: {
          create: itemsWithCatalog.map(({ item, product }) => ({
            productId: product.id,
            productName: product.name,
            unitPrice: product.price,
            quantity: item.quantity,
            categoryType: product.categoryType,
            sizeValue: item.sizeValue,
            colorScheme: item.colorScheme,
            styleDescription: item.styleDescription,
            addOnCharm: product.allowCharm && item.addOnCharmQuantity > 0,
            addOnCharmQuantity: product.allowCharm ? item.addOnCharmQuantity : 0,
            addOnCharmPrice: product.allowCharm ? item.addOnCharmQuantity * ADD_ON_CHARM_PRICE : 0,
            referenceImageUrl: item.referenceImageUrl || null,
          })),
        },
      },
      include: { items: true },
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
    return NextResponse.json({ error: error instanceof Error ? error.message : "建立訂單失敗" }, { status: 500 });
  }
}
