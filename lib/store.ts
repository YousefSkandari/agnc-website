import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Plan requests live in the Supabase table public.plan_requests and uploaded files in the private plan-files bucket
// (supabase/setup.sql). Without Supabase settings, local development keeps both under .data/ instead, so the whole
// flow can be tried on a laptop. Production never falls back to local files.
const SB_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const SB_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const BUCKET = "plan-files";
const TABLE = "plan_requests";

const onSupabase = () => !!(SB_URL && SB_KEY);
const local = () => !onSupabase() && process.env.NODE_ENV !== "production";
export const storeReady = () => onSupabase() || local();

let client: SupabaseClient | null = null;
function sb() {
  client ??= createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export class SlotTakenError extends Error {}

export type PlanRequest = {
  restaurant: string;
  postcode: string;
  cuisines: string[];
  opening: string;
  menu_files: string[];
  menu_later: boolean;
  goal: string;
  notes: string;
  instagram: string;
  contact_name: string;
  email: string;
  whatsapp: string;
  call_date: string;
  call_time: string;
  call_how: string;
  call_at: string;
  ref: string;
  user_agent: string;
};

const DATA = path.join(process.cwd(), ".data");
const LOCAL_DB = path.join(DATA, "requests.json");

async function readLocal(): Promise<(PlanRequest & { id: string; status: string })[]> {
  try {
    return JSON.parse(await fs.readFile(LOCAL_DB, "utf8"));
  } catch {
    return [];
  }
}

export async function takenSlots(dates: string[]): Promise<{ date: string; time: string }[]> {
  if (local()) {
    return (await readLocal())
      .filter((r) => r.status !== "cancelled" && dates.includes(r.call_date))
      .map((r) => ({ date: r.call_date, time: r.call_time }));
  }
  const { data, error } = await sb().from(TABLE).select("call_date, call_time").in("call_date", dates).neq("status", "cancelled");
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data ?? []).map((r) => ({ date: String(r.call_date), time: String(r.call_time) }));
}

export async function createRequest(row: PlanRequest): Promise<string> {
  if (local()) {
    const all = await readLocal();
    if (all.some((r) => r.status !== "cancelled" && r.call_date === row.call_date && r.call_time === row.call_time)) {
      throw new SlotTakenError();
    }
    const id = randomUUID();
    all.push({ ...row, id, status: "booked" });
    await fs.mkdir(DATA, { recursive: true });
    await fs.writeFile(LOCAL_DB, JSON.stringify(all, null, 2));
    return id;
  }
  const { data, error } = await sb().from(TABLE).insert(row).select("id").single();
  // 23505: the unique index on (call_date, call_time) caught someone else booking the same slot first
  if (error?.code === "23505") throw new SlotTakenError();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return String(data.id);
}

// Files go straight from the browser to storage (Vercel caps request bodies at 4.5 MB, menus can be 20 MB)
export async function signedUpload(filePath: string): Promise<{ url: string; local: boolean }> {
  if (local()) return { url: `/api/upload/local?path=${encodeURIComponent(filePath)}`, local: true };
  const { data, error } = await sb().storage.from(BUCKET).createSignedUploadUrl(filePath);
  if (error) throw new Error(`Supabase storage: ${error.message}`);
  return { url: data.signedUrl, local: false };
}

export async function saveLocalUpload(filePath: string, body: ArrayBuffer) {
  if (!local()) throw new Error("Local uploads are only for development");
  const dest = path.join(DATA, "uploads", filePath);
  if (!dest.startsWith(path.join(DATA, "uploads") + path.sep)) throw new Error("Bad path");
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, Buffer.from(body));
}

// Links for the notification email, valid for two weeks
export async function fileLinks(paths: string[]): Promise<{ path: string; url: string }[]> {
  if (!paths.length) return [];
  if (local()) return paths.map((p) => ({ path: p, url: `file://${path.join(DATA, "uploads", p)}` }));
  const { data, error } = await sb().storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 24 * 14);
  if (error) return paths.map((p) => ({ path: p, url: "" }));
  return (data ?? []).map((d, i) => ({ path: paths[i], url: d.signedUrl ?? "" }));
}

// Only files uploaded through /api/upload for this form are accepted back on submit
export async function filesExist(paths: string[]): Promise<boolean> {
  if (!paths.length) return true;
  if (local()) {
    const checks = await Promise.all(paths.map((p) => fs.stat(path.join(DATA, "uploads", p)).then(() => true, () => false)));
    return checks.every(Boolean);
  }
  const folders = Array.from(new Set(paths.map((p) => p.split("/").slice(0, -1).join("/"))));
  const found = new Set<string>();
  for (const folder of folders) {
    const { data } = await sb().storage.from(BUCKET).list(folder, { limit: 100 });
    (data ?? []).forEach((f) => found.add(`${folder}/${f.name}`));
  }
  return paths.every((p) => found.has(p));
}
