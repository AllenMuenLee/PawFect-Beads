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

  return NextResponse.json({ order });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const { id } = await context.params;

  try {
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
  }
}
