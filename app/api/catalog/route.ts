import { NextResponse } from "next/server";

import { getActiveCatalogProducts } from "@/src/lib/catalog-db";

export const runtime = "nodejs";

export async function GET() {
  const products = await getActiveCatalogProducts();

  return NextResponse.json({ products });
}
