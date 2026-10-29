// Answer checks shared by the plan form (in the browser) and /api/submit (on the server), so both agree on what a
// postcode, a phone number and an email address look like. Pure functions: no "use client", no Node APIs.

// Outward codes around Beirut Station that get a place name on the form's postcode echo
export const OUTCODES: Record<string, string> = {
  TW20: "RUNNYMEDE",
  TW18: "SPELTHORNE",
  GU25: "RUNNYMEDE",
  KT16: "RUNNYMEDE",
};

export type Postcode = { valid: boolean; out: string; area: string };

// A UK postcode, with or without its space: "TW20 0AB", "tw200ab", "SW1A 1AA"
export function parsePostcode(v: unknown): Postcode {
  const s = String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
  const m = /^([A-Z]{1,2}\d[A-Z\d]?) ?\d[A-Z]{2}$/.exec(s);
  if (!m) return { valid: false, out: "", area: "" };
  return { valid: true, out: m[1], area: OUTCODES[m[1]] ?? "" };
}

export const postcodeOk = (v: unknown) => parsePostcode(v).valid;

// The outward code ("TW20"), or "" when the postcode isn't valid
export const outcode = (v: unknown) => parsePostcode(v).out;

// A UK number, starting 0 or +44. Spaces, brackets, dots and dashes are ignored.
export function phoneOk(v: unknown) {
  const d = String(v ?? "").replace(/[\s().-]/g, "");
  return /^(\+44\d{9,10}|0\d{9,10})$/.test(d);
}

export function emailOk(v: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v ?? "").trim());
}
