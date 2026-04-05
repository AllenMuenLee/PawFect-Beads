import { NextResponse } from "next/server";

import { ensureDatabaseInitialized } from "@/src/lib/db-init";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    await ensureDatabaseInitialized();

    const rows = (await prisma.$queryRaw`
      SELECT "mimeType", "dataBase64"
      FROM "UploadedImage"
      WHERE "id" = ${id}
      LIMIT 1
    `) as Array<{ mimeType: string; dataBase64: string }>;

    const image = rows[0];
    if (!image) {
      return NextResponse.json({ error: "找不到圖片" }, { status: 404 });
    }

    const buffer = Buffer.from(image.dataBase64, "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": image.mimeType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "讀取圖片失敗" }, { status: 500 });
  }
}
