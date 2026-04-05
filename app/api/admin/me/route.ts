import { NextResponse } from "next/server";

import { hasAdminSession } from "@/src/lib/admin-guard";

export const runtime = "nodejs";

export async function GET() {
  const authenticated = await hasAdminSession();

  return NextResponse.json({ authenticated });
}
