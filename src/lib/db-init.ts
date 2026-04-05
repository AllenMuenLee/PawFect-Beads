import { PRODUCT_CATALOG } from "@/src/lib/catalog";
import { prisma } from "@/src/lib/prisma";

type GlobalWithDbInit = typeof globalThis & {
  __pawfectDbInitPromise?: Promise<void>;
};

const globalForDbInit = globalThis as GlobalWithDbInit;

async function createPostgresTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Order" (
      "id" TEXT PRIMARY KEY,
      "orderNumber" TEXT NOT NULL UNIQUE,
      "status" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "customerGmail" TEXT,
      "customerInstagram" TEXT,
      "customerLine" TEXT,
      "note" TEXT,
      "totalAmount" INTEGER NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OrderItem" (
      "id" TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "productName" TEXT NOT NULL,
      "unitPrice" INTEGER NOT NULL,
      "quantity" INTEGER NOT NULL,
      "categoryType" TEXT NOT NULL,
      "sizeValue" TEXT NOT NULL,
      "colorScheme" TEXT NOT NULL,
      "styleDescription" TEXT NOT NULL,
      "addOnCharm" BOOLEAN NOT NULL DEFAULT false,
      "addOnCharmQuantity" INTEGER NOT NULL DEFAULT 0,
      "addOnCharmPrice" INTEGER NOT NULL DEFAULT 0,
      "isCompleted" BOOLEAN NOT NULL DEFAULT false,
      "referenceImageUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "OrderItem_orderId_fkey"
        FOREIGN KEY ("orderId")
        REFERENCES "Order"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EmailLog" (
      "id" TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "recipient" TEXT NOT NULL,
      "emailType" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "errorMessage" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EmailLog_orderId_fkey"
        FOREIGN KEY ("orderId")
        REFERENCES "Order"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailLog_orderId_idx" ON "EmailLog"("orderId");`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProductCatalog" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "price" INTEGER NOT NULL,
      "categoryType" TEXT NOT NULL,
      "allowCharm" BOOLEAN NOT NULL DEFAULT false,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AdminProduct" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "price" INTEGER NOT NULL,
      "stock" INTEGER NOT NULL,
      "description" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InstagramEmbed" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT,
      "permalink" TEXT NOT NULL UNIQUE,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function seedDefaultCatalogProducts() {
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

async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isPostgres = databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://");

  if (!isPostgres) {
    return;
  }

  await createPostgresTables();
  await seedDefaultCatalogProducts();
}

export async function ensureDatabaseInitialized() {
  if (!globalForDbInit.__pawfectDbInitPromise) {
    globalForDbInit.__pawfectDbInitPromise = initializeDatabase().catch((error) => {
      globalForDbInit.__pawfectDbInitPromise = undefined;
      throw error;
    });
  }

  await globalForDbInit.__pawfectDbInitPromise;
}
