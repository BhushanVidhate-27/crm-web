import fs from "node:fs/promises";
import path from "node:path";

export const MEDIA_DIR = path.join(process.cwd(), "data", "uploads");

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const mediaMaxBytes = () => MAX_IMAGE_BYTES;
export const mediaMaxLabel = () => "10 MB";

export function mimeOf(file: string): string {
  const ext = (file.split(".").pop() ?? "").toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    default:
      return "image/jpeg";
  }
}

export async function saveMedia(buffer: Buffer, mime: string): Promise<{ file: string }> {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
  const file = `med_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${EXT_BY_MIME[mime] ?? "jpg"}`;
  await fs.writeFile(path.join(MEDIA_DIR, file), buffer);
  return { file };
}

export async function deleteMedia(file: string): Promise<void> {
  try {
    await fs.unlink(path.join(MEDIA_DIR, path.basename(file)));
  } catch {
    /* file already gone — the entry is removed either way */
  }
}