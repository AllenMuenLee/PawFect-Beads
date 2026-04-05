import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  try {
    const orders = await prisma.order.findMany({
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
