import { NextResponse } from "next/server";

import { uploadReferenceImage } from "@/src/lib/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "\u8acb\u9078\u64c7\u8981\u4e0a\u50b3\u7684\u5716\u7247" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "\u50c5\u652f\u63f4\u5716\u7247\u6a94\u6848" }, { status: 400 });
    }

    const url = await uploadReferenceImage(file);

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "\u5716\u7247\u4e0a\u50b3\u5931\u6557",
      },
      { status: 500 },
    );
  }
}
