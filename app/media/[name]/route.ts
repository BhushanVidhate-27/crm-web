import path from "node:path";
import { readFile } from "node:fs/promises";
import { MEDIA_DIR, mimeOf } from "@/lib/media-files";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safe = path.basename(name);
  try {
    const data = await readFile(path.join(MEDIA_DIR, safe));
    return new Response(data, {
      headers: {
        "Content-Type": mimeOf(safe),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}