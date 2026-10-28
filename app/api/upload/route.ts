import { randomUUID } from "crypto";
import { upload } from "@/lib/config";
import { londonToday } from "@/lib/dates";
import { json, limited, oops } from "@/lib/guard";
import { signedUpload, storeReady } from "@/lib/store";

export const dynamic = "force-dynamic";

const EXT = /\.(pdf|jpe?g|png|webp|heic|heif)$/i;

// Hands the browser a one-time link to put a menu or photo straight into storage
export async function POST(req: Request) {
  if (!storeReady()) return oops("Uploads are offline right now", 503);
  if (limited(req, "upload", 30, 10 * 60 * 1000)) return oops("Too many uploads, try again in a few minutes", 429);
  const body = (await req.json().catch(() => null)) as { name?: unknown; type?: unknown; size?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name : "";
  const type = typeof body?.type === "string" ? body.type : "";
  const size = typeof body?.size === "number" ? body.size : 0;
  // Some phones send HEIC photos with no type, so the file extension counts too
  if (!(upload.types.includes(type) || EXT.test(name))) return oops("That file type isn't supported. Use a PDF or photo.", 400);
  if (size <= 0 || size > upload.maxBytes) return oops("That file is over 20 MB", 400);

  const safe = name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(-80) || "file";
  const path = `${londonToday().slice(0, 7)}/${randomUUID()}/${safe}`;
  try {
    const { url, local } = await signedUpload(path);
    return json({ path, url, local });
  } catch (e) {
    console.error(e);
    return oops("Couldn't start the upload", 500);
  }
}
