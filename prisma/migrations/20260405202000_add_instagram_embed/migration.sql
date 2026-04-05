-- CreateTable
CREATE TABLE "InstagramEmbed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "permalink" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramEmbed_permalink_key" ON "InstagramEmbed"("permalink");
