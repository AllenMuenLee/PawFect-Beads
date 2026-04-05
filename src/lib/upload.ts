import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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
    throw new Error("???????? 8MB");
  }

  const extension = getExtension(file);
  const filename = `${randomUUID()}${extension}`;
  const publicDir = path.join(process.cwd(), "public");
  const uploadDir = path.join(publicDir, "uploads");
  const filePath = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return `/uploads/${filename}`;
}

