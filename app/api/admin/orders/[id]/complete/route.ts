import { NextResponse } from "next/server";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { ORDER_STATUS } from "@/src/lib/order-status";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const { id } = await context.params;

  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: ORDER_STATUS.COMPLETED,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
  }
}
