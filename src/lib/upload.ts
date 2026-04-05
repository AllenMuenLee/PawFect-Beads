import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureDatabaseInitialized } from "@/src/lib/db-init";
import { prisma } from "@/src/lib/prisma";

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;

function getExtension(file: File) {
  const byMime = MIME_TO_EXTENSION[file.type.toLowerCase()];
  if (byMime) {
    return byMime;
  }

  const rawExt = path.extname(file.name || "").toLowerCase();
  if (rawExt && rawExt.length <= 5) {
    return rawExt;
  }

  return ".jpg";
}

export async function uploadReferenceImage(file: File) {
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error("上傳圖片不可超過 8MB");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = getExtension(file);
  const fileId = `${randomUUID()}${extension}`;

  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isPostgres = databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://");

  if (isPostgres) {
    await ensureDatabaseInitialized();
    await prisma.$executeRaw`
      INSERT INTO "UploadedImage" ("id", "mimeType", "dataBase64")
      VALUES (${fileId}, ${file.type || "image/jpeg"}, ${buffer.toString("base64")})
    `;

    return `/api/upload/${fileId}`;
  }

  const publicDir = path.join(process.cwd(), "public");
  const uploadDir = path.join(publicDir, "uploads");
  const filePath = path.join(uploadDir, fileId);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, buffer);

  return `/uploads/${fileId}`;
}
