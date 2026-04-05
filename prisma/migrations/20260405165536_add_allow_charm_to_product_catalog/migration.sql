-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "categoryType" TEXT NOT NULL,
    "allowCharm" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductCatalog" ("categoryType", "createdAt", "id", "isActive", "name", "price", "allowCharm", "updatedAt")
SELECT "categoryType", "createdAt", "id", "isActive", "name", "price",
       CASE WHEN "categoryType" = 'ring' THEN 0 ELSE 1 END,
       "updatedAt"
FROM "ProductCatalog";
DROP TABLE "ProductCatalog";
ALTER TABLE "new_ProductCatalog" RENAME TO "ProductCatalog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
