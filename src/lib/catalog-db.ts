import { prisma } from "@/src/lib/prisma";
import type { ProductCatalogItem } from "@/src/lib/catalog";

export async function getActiveCatalogProducts(): Promise<ProductCatalogItem[]> {
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
