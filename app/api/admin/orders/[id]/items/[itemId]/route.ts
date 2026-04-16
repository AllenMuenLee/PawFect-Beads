import { NextResponse } from "next/server";
import { z } from "zod";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { prisma } from "@/src/lib/prisma";

const payloadSchema = z.object({
  isCompleted: z.boolean(),
});

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const { id, itemId } = await context.params;
  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "輸入資料錯誤" }, { status: 400 });
  }

  try {
    const existing = await prisma.orderItem.findFirst({
      where: { id: itemId, orderId: id, order: { deletedAt: null } },
      select: { id: true, orderId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "找不到訂單項目" }, { status: 404 });
    }

    const orderItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { isCompleted: parsed.data.isCompleted },
      select: {
        id: true,
        orderId: true,
        isCompleted: true,
      },
    });

    return NextResponse.json({ orderItem });
  } catch {
    return NextResponse.json({ error: "找不到訂單項目" }, { status: 404 });
  }
}
