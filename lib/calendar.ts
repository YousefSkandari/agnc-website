import { booking, site } from "./config";

export type CallEvent = { id: string; start: Date; how: string; restaurant: string; phone: string };

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const end = (e: CallEvent) => new Date(e.start.getTime() + booking.callMinutes * 60000);
// The page calls it the handover call (D 1018, D 1097); the artboard's invite reads the same (D 1973)
const title = "Your launch plan handover with agnc. media";

function details(e: CallEvent) {
  const how = e.how === "Phone" ? `We'll ring you on ${e.phone}.` : "We'll send you the video link before the call.";
  return `Nes & Gaby walk you through the 30-day launch plan for ${e.restaurant}. ${how} Need to move it? WhatsApp ${site.whatsapp}.`;
}

// iCalendar text escaping and 75-octet line folding (RFC 5545)
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function icsFile(e: CallEvent) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//agnc. media//Handover//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@agnc-media`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(end(e))}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(details(e))}`,
    `LOCATION:${esc(e.how === "Phone" ? "Phone call" : "Video call")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function googleCalendarLink(e: CallEvent) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp(e.start)}/${stamp(end(e))}`,
    details: details(e),
    location: e.how === "Phone" ? "Phone call" : "Video call",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
