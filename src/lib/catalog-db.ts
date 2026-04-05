import type { ProductCatalogItem } from "@/src/lib/catalog";
import { ensureDatabaseInitialized } from "@/src/lib/db-init";
import { prisma } from "@/src/lib/prisma";

export async function getActiveCatalogProducts(): Promise<ProductCatalogItem[]> {
  await ensureDatabaseInitialized();

  const products = await prisma.productCatalog.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      categoryType: true,
      allowCharm: true,
      isActive: true,
    },
  });

  return products as ProductCatalogItem[];
}

export async function getCatalogProductMapByIds(productIds: string[]) {
  await ensureDatabaseInitialized();

  const products = await prisma.productCatalog.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      categoryType: true,
      allowCharm: true,
      isActive: true,
    },
  });

  return new Map(products.map((product) => [product.id, product]));
}
