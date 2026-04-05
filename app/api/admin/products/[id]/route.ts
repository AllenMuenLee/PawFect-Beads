import { NextResponse } from "next/server";
import { z } from "zod";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { prisma } from "@/src/lib/prisma";

const productSchema = z.object({
  name: z.string().trim().min(1, "商品名稱必填"),
  price: z.coerce.number().int().min(0, "價格不可小於 0"),
  categoryType: z.enum(["bracelet", "ring", "necklace"]),
  allowCharm: z.coerce.boolean(),
  isActive: z.coerce.boolean(),
});

export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const { id } = await context.params;

  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = productSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "輸入資料錯誤" }, { status: 400 });
  }

  try {
    const product = await prisma.productCatalog.update({
      where: { id },
      data: parsed.data,
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

  try {
    await prisma.productCatalog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "找不到商品" }, { status: 404 });
  }
}
