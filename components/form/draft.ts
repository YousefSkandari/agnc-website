// The plan form's answers, the draft kept in this browser, and where the visitor came from (?ref).
// No "use client" needed: nothing here is a component, and every storage call is guarded for the server.
import { choices } from "@/lib/config";

export const DRAFT_KEY = "agnc-plan-draft";
// The old site's draft, removed once a request is sent
const OLD_DRAFT_KEY = "agnc-plan-draft-v1";

export type GoalId = "found" | "busy" | "back";

// Goal ids, their labels (from config, so the server accepts them) and the plan card's short chip (D 1120–1124)
export const GOALS: { id: GoalId; label: string; chip: string }[] = [
  { id: "found", label: choices.goals[0], chip: "GET FOUND" },
  { id: "busy", label: choices.goals[1], chip: "BUSY WEEK" },
  { id: "back", label: choices.goals[2], chip: "COME BACK" },
];

export type Answers = {
  name: string;
  postcode: string;
  foods: string[];
  other: string;
  menuLater: boolean;
  goal: GoalId | "";
  notes: string;
  instagram: string;
  call: { date: string; time: string };
  contact: { name: string; email: string; phone: string; whatsapp: boolean };
};

// The draft never holds the menu file (it stays in memory) nor the opening (agnc-plan-opening, shared with d4)
export type Draft = Answers & { ref: string };

export const EMPTY: Answers = {
  name: "",
  postcode: "",
  foods: [],
  other: "",
  menuLater: false,
  goal: "",
  notes: "",
  instagram: "",
  call: { date: "", time: "" },
  contact: { name: "", email: "", phone: "", whatsapp: false },
};

// Field limits, used by the inputs and when a draft is read back
export const MAX = { name: 60, postcode: 10, other: 60, notes: 2000, instagram: 30, cname: 60, email: 120, phone: 20, ref: 60 };

const s = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

// Anything read back from storage is checked field by field: a stale or hand-edited draft can't break the form
export function sanitize(raw: unknown): Draft {
  const d = obj(raw);
  const call = obj(d.call);
  const contact = obj(d.contact);
  const foods = Array.isArray(d.foods) ? d.foods.filter((f): f is string => typeof f === "string" && choices.cuisines.includes(f)) : [];
  const goal = GOALS.some((g) => g.id === d.goal) ? (d.goal as GoalId) : "";
  return {
    name: s(d.name, MAX.name),
    postcode: s(d.postcode, MAX.postcode).toUpperCase(),
    foods: Array.from(new Set(foods)),
    other: s(d.other, MAX.other),
    menuLater: d.menuLater === true,
    goal,
    notes: s(d.notes, MAX.notes),
    instagram: s(d.instagram, MAX.instagram),
    call: { date: s(call.date, 10), time: s(call.time, 5) },
    contact: {
      name: s(contact.name, MAX.cname),
      email: s(contact.email, MAX.email),
      phone: s(contact.phone, MAX.phone),
      whatsapp: contact.whatsapp === true,
    },
    ref: s(d.ref, MAX.ref).trim(),
  };
}

export function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? sanitize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeDraft(d: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {}
}

export function clearDrafts() {
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(OLD_DRAFT_KEY);
  } catch {}
}

// Where the visitor came from: ?ref= (the postcard QR codes), ?r= or ?utm_source=
export function refFromUrl(search: string): string {
  try {
    const q = new URLSearchParams(search);
    return (q.get("ref") || q.get("r") || q.get("utm_source") || "").trim().slice(0, MAX.ref);
  } catch {
    return "";
  }
}

// ?n= prefills the restaurant name (a link sent to a named restaurant)
export function nameFromUrl(search: string): string {
  try {
    return (new URLSearchParams(search).get("n") || "").trim().slice(0, 40);
  } catch {
    return "";
  }
}

// Called when the home page loads, before the form is ever opened: a ref in the URL is saved into the draft at once,
// so it survives the visitor moving around the site before they ask for their plan. An empty value never overwrites
// a stored one.
export function captureRef() {
  const ref = refFromUrl(window.location.search);
  if (!ref) return;
  const d = readDraft() ?? { ...EMPTY, ref: "" };
  if (d.ref !== ref) writeDraft({ ...d, ref });
}
