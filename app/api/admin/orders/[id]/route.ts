import { NextResponse } from "next/server";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
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
          id: true,
          productName: true,
          quantity: true,
          sizeValue: true,
          colorScheme: true,
          styleDescription: true,
          addOnCharmQuantity: true,
          isCompleted: true,
          referenceImageUrl: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
  }
  if (order.deletedAt) {
    return NextResponse.json({ error: "訂單已在回收區" }, { status: 400 });
  }

  return NextResponse.json({ order });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const { id } = await context.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
            categoryType: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
    }

    const readyMadeRestock = new Map<string, number>();
    for (const item of order.items) {
      if (item.categoryType !== "ready-made") {
        continue;
      }

      readyMadeRestock.set(item.productId, (readyMadeRestock.get(item.productId) ?? 0) + item.quantity);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      for (const [productId, quantity] of readyMadeRestock.entries()) {
        await tx.adminProduct.updateMany({
          where: { id: productId },
          data: {
            stock: { increment: quantity },
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
  }
}
