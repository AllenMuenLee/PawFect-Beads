import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getAdminSessionCookieConfig, verifyAdminSessionToken } from "@/src/lib/admin-auth";

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieConfig().name)?.value;

  return verifyAdminSessionToken(token);
}

export async function guardAdminApi() {
  const authenticated = await hasAdminSession();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function requireAdminPageSession() {
  const authenticated = await hasAdminSession();

  if (!authenticated) {
    redirect("/admin");
  }
}
