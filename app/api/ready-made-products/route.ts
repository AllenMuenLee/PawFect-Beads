import { NextResponse } from "next/server";

import { ensureDatabaseInitialized } from "@/src/lib/db-init";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  await ensureDatabaseInitialized();

  const products = await prisma.adminProduct.findMany({
    where: {
      stock: { gt: 0 },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      description: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ products });
}
