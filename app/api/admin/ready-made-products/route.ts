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

export async function GET() {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  await ensureDatabaseInitialized();

  const products = await prisma.adminProduct.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = readyMadeProductSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "輸入資料錯誤" }, { status: 400 });
  }

  await ensureDatabaseInitialized();

  const product = await prisma.adminProduct.create({
    data: {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl?.trim() ? parsed.data.imageUrl.trim() : null,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
