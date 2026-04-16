import { NextResponse } from "next/server";
import { z } from "zod";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { ensureDatabaseInitialized } from "@/src/lib/db-init";
import { prisma } from "@/src/lib/prisma";

const readyMadeProductSchema = z.object({
  name: z.string().trim().min(1, "商品名稱必填"),
  price: z.coerce.number().int().min(0, "價格不可小於 0"),
  stock: z.coerce.number().int().min(0, "庫存不可小於 0"),
  description: z.string().trim().min(1, "請填寫描述"),
  imageUrl: z.string().trim().max(500, "圖片路徑過長").optional().or(z.literal("")),
});

export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = readyMadeProductSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "輸入資料錯誤" }, { status: 400 });
  }

  const { id } = await context.params;
  await ensureDatabaseInitialized();

  try {
    const product = await prisma.adminProduct.update({
      where: { id },
      data: {
        ...parsed.data,
        imageUrl: parsed.data.imageUrl?.trim() ? parsed.data.imageUrl.trim() : null,
      },
    });

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "找不到商品" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const { id } = await context.params;
  await ensureDatabaseInitialized();

  try {
    await prisma.adminProduct.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "找不到商品" }, { status: 404 });
  }
}
