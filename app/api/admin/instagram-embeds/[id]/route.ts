import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const { id } = await context.params;

  try {
    await prisma.instagramEmbed.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return NextResponse.json({ error: "IG 貼文資料表尚未建立" }, { status: 500 });
    }

    return NextResponse.json({ error: "找不到貼文" }, { status: 404 });
  }
}
