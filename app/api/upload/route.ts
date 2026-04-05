import { NextResponse } from "next/server";

import { uploadReferenceImage } from "@/src/lib/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "請選擇要上傳的圖片" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "僅支援圖片檔案" }, { status: 400 });
    }

    const url = await uploadReferenceImage(file);

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "圖片上傳失敗",
      },
      { status: 500 },
    );
  }
}
