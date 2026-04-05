import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { guardAdminApi } from "@/src/lib/admin-guard";
import { extractInstagramPermalink, toInstagramEmbedUrl } from "@/src/lib/instagram-embed";
import { prisma } from "@/src/lib/prisma";

const instagramEmbedSchema = z.object({
  title: z.string().trim().max(60, "標題最多 60 字").optional(),
  embedInput: z.string().trim().min(1, "請貼上 IG 內嵌碼或貼文網址"),
  sortOrder: z.coerce.number().int().min(0, "排序不可小於 0").default(0),
});

export const runtime = "nodejs";

export async function GET() {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  try {
    const embeds = await prisma.instagramEmbed.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      embeds: embeds.map((item) => ({
        ...item,
        embedUrl: toInstagramEmbedUrl(item.permalink),
      })),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return NextResponse.json({ embeds: [] });
    }

    return NextResponse.json({ error: "讀取 IG 貼文失敗" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guardResponse = await guardAdminApi();
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = instagramEmbedSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "輸入資料錯誤" }, { status: 400 });
  }

  const permalink = extractInstagramPermalink(parsed.data.embedInput);
  if (!permalink) {
    return NextResponse.json({ error: "無法辨識 IG 貼文，請貼完整內嵌碼或貼文網址" }, { status: 400 });
  }

  try {
    const embed = await prisma.instagramEmbed.create({
      data: {
        title: parsed.data.title || null,
        permalink,
        sortOrder: parsed.data.sortOrder,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        embed: {
          ...embed,
          embedUrl: toInstagramEmbedUrl(embed.permalink),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "這篇貼文已經新增過了" }, { status: 409 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return NextResponse.json({ error: "IG 貼文資料表尚未建立" }, { status: 500 });
    }

    return NextResponse.json({ error: "新增貼文失敗" }, { status: 500 });
  }
}
