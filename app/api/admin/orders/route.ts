import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("includeDeleted") === "1";

    const orders = await prisma.order.findMany({
      where: includeDeleted ? undefined : { deletedAt: null },
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            isCompleted: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return NextResponse.json({ orders: [] });
    }

    return NextResponse.json({ error: "讀取訂單失敗" }, { status: 500 });
  }
}
