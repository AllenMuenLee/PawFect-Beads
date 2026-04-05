import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { sendCustomerPickupReadyEmail, type EmailOrderPayload } from "@/src/lib/email";
import { writeEmailLog } from "@/src/lib/logger";
import { ORDER_STATUS } from "@/src/lib/order-status";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

type CompleteOrderPayload = {
  pickupTime?: string;
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const body = (await request.json().catch(() => ({}))) as CompleteOrderPayload;
  const pickupTime = body.pickupTime?.trim();

  if (!pickupTime) {
    return NextResponse.json({ error: "請輸入領件時間" }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: ORDER_STATUS.COMPLETED,
      },
      include: {
        items: true,
      },
    });

    const emailPayload: EmailOrderPayload = {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      customerGmail: order.customerGmail,
      customerInstagram: order.customerInstagram,
      customerLine: order.customerLine,
      note: order.note,
      items: order.items.map((item) => ({
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

    let emailWarning: string | null = null;

    if (order.customerGmail) {
      try {
        await sendCustomerPickupReadyEmail(emailPayload, pickupTime);
        await writeEmailLog({ orderId: order.id, recipient: order.customerGmail, emailType: "customer", status: "sent" });
      } catch (error) {
        await writeEmailLog({
          orderId: order.id,
          recipient: order.customerGmail,
          emailType: "customer",
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "未知錯誤",
        });
        emailWarning = "已出貨，但可領件通知信寄送失敗";
      }
    } else {
      await writeEmailLog({
        orderId: order.id,
        recipient: "no-gmail",
        emailType: "customer",
        status: "skipped",
        errorMessage: "客戶未提供 Gmail，略過可領件通知信",
      });
      emailWarning = "已出貨，但客戶未提供 Gmail，未寄送可領件通知信";
    }

    return NextResponse.json({ order: { id: order.id, status: order.status }, warning: emailWarning });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
    }

    return NextResponse.json({ error: "出貨失敗" }, { status: 500 });
  }
}
