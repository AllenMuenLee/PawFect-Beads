import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function hasRequiredModels(client: PrismaClient) {
  const requiredModels = ["order", "orderItem", "emailLog", "productCatalog", "adminProduct", "instagramEmbed"];
  const clientRecord = client as unknown as Record<string, unknown>;
  return requiredModels.every((model) => model in clientRecord);
}

const cachedClient = globalForPrisma.prisma;
export const prisma = cachedClient && hasRequiredModels(cachedClient) ? cachedClient : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
