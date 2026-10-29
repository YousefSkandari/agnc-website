// Talking to the server: the call times, the menu upload and the plan request itself (PORT-PLAN 4.3).

export type Slot = { time: string; taken: boolean };
export type SlotDay = { date: string; weekday: string; label: string; inDays: number; times: Slot[] };

export async function fetchSlots(signal?: AbortSignal): Promise<SlotDay[]> {
  const r = await fetch("/api/slots", { cache: "no-store", signal });
  const j = (await r.json().catch(() => ({}))) as { days?: SlotDay[]; error?: string };
  if (!r.ok || !Array.isArray(j.days)) throw new Error(j.error || "Couldn't load the call times");
  return j.days;
}

export class UploadError extends Error {}

// Puts the file straight into storage through the one-time link the server hands out (same as the old form)
function put(url: string, file: File) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new UploadError("Upload failed, try again")));
    xhr.onerror = () => reject(new UploadError("Upload failed, check your connection"));
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    xhr.send(body);
  });
}

// The menu is uploaded only when the request is sent: until then it stays on the visitor's device
export async function uploadMenu(file: File): Promise<string> {
  let r: Response;
  try {
    r = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
    });
  } catch {
    throw new UploadError("Upload failed, check your connection");
  }
  const j = (await r.json().catch(() => ({}))) as { path?: string; url?: string; error?: string };
  if (!r.ok || !j.path || !j.url) throw new UploadError(j.error || "Upload failed, try again");
  await put(j.url, file);
  return j.path;
}

export type Payload = {
  restaurant: string;
  postcode: string;
  cuisines: string[];
  cuisineOther: string;
  opening: string;
  openingDate: string;
  files: string[];
  menuLater: boolean;
  goal: string;
  notes: string;
  whatsappFirst: boolean;
  instagram: string;
  date: string;
  time: string;
  name: string;
  email: string;
  whatsapp: string;
  ref: string;
  website: string;
};

export type SubmitResult =
  | { kind: "ok"; ics: string | null }
  | { kind: "taken"; error: string }
  | { kind: "problems"; problems: Record<string, string> }
  | { kind: "error"; error: string; status: number }
  | { kind: "offline" };

export async function submitPlan(p: Payload): Promise<SubmitResult> {
  let r: Response;
  try {
    r = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
  } catch {
    return { kind: "offline" };
  }
  const j = (await r.json().catch(() => ({}))) as {
    ok?: boolean;
    ics?: unknown;
    error?: string;
    taken?: boolean;
    problems?: Record<string, string>;
  };
  if (r.ok && j.ok) return { kind: "ok", ics: typeof j.ics === "string" && j.ics ? j.ics : null };
  if (r.status === 409) return { kind: "taken", error: j.error || "Someone just booked that time. Pick another one." };
  if (r.status === 400 && j.problems && typeof j.problems === "object" && Object.keys(j.problems).length) {
    return { kind: "problems", problems: j.problems };
  }
  return { kind: "error", error: j.error || "", status: r.status };
}
