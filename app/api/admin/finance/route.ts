import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { ORDER_STATUS } from "@/src/lib/order-status";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  try {
    const result = await prisma.order.aggregate({
      where: {
        status: ORDER_STATUS.COMPLETED,
        deletedAt: null,
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalRevenue = result._sum.totalAmount ?? 0;
    const personalProfit = totalRevenue * 0.25;
    const donationAmount = totalRevenue * 0.75;

    return NextResponse.json({
      totalRevenue,
      personalProfit,
      donationAmount,
      revenueStatus: ORDER_STATUS.COMPLETED,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return NextResponse.json({
        totalRevenue: 0,
        personalProfit: 0,
        donationAmount: 0,
        revenueStatus: ORDER_STATUS.COMPLETED,
      });
    }

    return NextResponse.json({ error: "讀取財務資料失敗" }, { status: 500 });
  }
}
