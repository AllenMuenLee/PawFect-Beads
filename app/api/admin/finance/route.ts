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

  const result = await prisma.order.aggregate({
    where: {
      status: ORDER_STATUS.COMPLETED,
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
}
