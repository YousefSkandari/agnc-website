import { json, oops } from "@/lib/guard";
import { local, saveLocalUpload } from "@/lib/store";

export const dynamic = "force-dynamic";

// Local only: stands in for the Supabase signed upload link when Supabase isn't set up (see local() in lib/store)
export async function PUT(req: Request) {
  if (!local()) return oops("Not found", 404);
  const path = new URL(req.url).searchParams.get("path") || "";
  const form = await req.formData();
  const file = Array.from(form.values()).find((v): v is File => typeof v !== "string");
  if (!path || !file) return oops("Missing file", 400);
  await saveLocalUpload(path, await file.arrayBuffer());
  return json({ ok: true });
}
