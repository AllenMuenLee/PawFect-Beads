import { NextResponse } from "next/server";

import { getAdminSessionCookieConfig } from "@/src/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const cookieConfig = getAdminSessionCookieConfig();

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieConfig.name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
