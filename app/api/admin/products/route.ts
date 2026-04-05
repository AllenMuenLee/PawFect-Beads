import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { prisma } from "@/src/lib/prisma";

const productSchema = z.object({
  name: z.string().trim().min(1, "商品名稱必填"),
  price: z.coerce.number().int().min(0, "價格不可小於 0"),
  categoryType: z.enum(["bracelet", "ring", "necklace"]),
  allowCharm: z.coerce.boolean(),
  isActive: z.coerce.boolean().default(true),
});

export const runtime = "nodejs";

export async function GET() {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const products = await prisma.productCatalog.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = productSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "輸入資料錯誤" }, { status: 400 });
  }

  const product = await prisma.productCatalog.create({
    data: {
      id: `custom-${randomUUID()}`,
      ...parsed.data,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
