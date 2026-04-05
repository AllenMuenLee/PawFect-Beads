import { PrismaClient } from "@prisma/client";

import { PRODUCT_CATALOG } from "../src/lib/catalog";

const prisma = new PrismaClient();

async function main() {
  for (const product of PRODUCT_CATALOG) {
    await prisma.productCatalog.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        price: product.price,
        categoryType: product.categoryType,
        allowCharm: product.allowCharm,
        isActive: true,
      },
      create: {
        id: product.id,
        name: product.name,
        price: product.price,
        categoryType: product.categoryType,
        allowCharm: product.allowCharm,
        isActive: true,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
