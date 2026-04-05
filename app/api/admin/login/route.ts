import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createAdminSessionToken,
  getAdminSessionCookieConfig,
  isValidAdminPassword,
} from "@/src/lib/admin-auth";

const loginSchema = z.object({
  password: z.string().min(1, "請輸入密碼"),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "輸入資料錯誤" }, { status: 400 });
  }

  if (!isValidAdminPassword(parsed.data.password)) {
    return NextResponse.json({ error: "密碼錯誤" }, { status: 401 });
  }

  const token = createAdminSessionToken();
  const cookieConfig = getAdminSessionCookieConfig();

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieConfig.name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookieConfig.maxAge,
  });

  return response;
}
