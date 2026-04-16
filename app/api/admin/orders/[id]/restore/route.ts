import { NextResponse } from "next/server";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const { id } = await context.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        select: {
          productId: true,
          quantity: true,
          categoryType: true,
          productName: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
  }

  if (!order.deletedAt) {
    return NextResponse.json({ error: "訂單尚未刪除" }, { status: 400 });
  }

  const readyMadeDemand = new Map<string, { quantity: number; name: string }>();
  for (const item of order.items) {
    if (item.categoryType !== "ready-made") {
      continue;
    }

    const current = readyMadeDemand.get(item.productId);
    readyMadeDemand.set(item.productId, {
      quantity: (current?.quantity ?? 0) + item.quantity,
      name: item.productName,
    });
  }

  const readyMadeIds = [...readyMadeDemand.keys()];
  if (readyMadeIds.length > 0) {
    const products = await prisma.adminProduct.findMany({
      where: { id: { in: readyMadeIds } },
      select: {
        id: true,
        stock: true,
      },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const [productId, demand] of readyMadeDemand.entries()) {
      const product = productMap.get(productId);
      if (!product || product.stock < demand.quantity) {
        return NextResponse.json(
          { error: `還原失敗：預製作品「${demand.name}」庫存不足` },
          { status: 400 },
        );
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const [productId, demand] of readyMadeDemand.entries()) {
        const updated = await tx.adminProduct.updateMany({
          where: {
            id: productId,
            stock: { gte: demand.quantity },
          },
          data: {
            stock: { decrement: demand.quantity },
          },
        });

        if (updated.count !== 1) {
          throw new Error(`還原失敗：預製作品「${demand.name}」庫存不足`);
        }
      }

      await tx.order.update({
        where: { id },
        data: { deletedAt: null },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "還原訂單失敗";
    if (message.includes("庫存不足")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "還原訂單失敗" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
