import { booking, choices, upload } from "@/lib/config";
import { googleCalendarLink, icsFile } from "@/lib/calendar";
import { formatDay, londonToUtc, longDate, offeredDates } from "@/lib/dates";
import { sendBookingEmails } from "@/lib/email";
import { json, limited, oops } from "@/lib/guard";
import { createRequest, fileLinks, filesExist, SlotTakenError, storeReady } from "@/lib/store";

export const dynamic = "force-dynamic";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const oneOf = (v: unknown, list: string[]) => (typeof v === "string" && list.includes(v) ? v : "");
const FILE_PATH = /^\d{4}-\d{2}\/[0-9a-f-]{36}\/[\w.-]{1,80}$/;

export async function POST(req: Request) {
  if (!storeReady()) return oops("Booking is offline right now. WhatsApp us instead.", 503);
  if (limited(req, "submit", 8, 60 * 60 * 1000)) return oops("Too many tries, give it a few minutes", 429);
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return oops("Something went wrong sending that", 400);

  // A hidden field people never see; bots fill it in. Pretend it worked.
  if (str(b.website, 200)) return json({ ok: true, id: "thanks" });

  const restaurant = str(b.restaurant, 120);
  const cuisines = Array.isArray(b.cuisines) ? b.cuisines.filter((c): c is string => choices.cuisines.includes(c as string)) : [];
  const files = Array.isArray(b.files) ? b.files.filter((f): f is string => typeof f === "string" && FILE_PATH.test(f)).slice(0, upload.maxFiles) : [];
  const name = str(b.name, 80);
  const email = str(b.email, 160).toLowerCase();
  const whatsapp = str(b.whatsapp, 30);
  const date = str(b.date, 10);
  const time = oneOf(b.time, booking.times);
  const how = oneOf(b.how, choices.how) || "Video";

  // Someone who loaded the times just before midnight still gets the days they were shown
  const allowed = new Set([...offeredDates(), ...offeredDates(new Date(Date.now() - 3 * 3600 * 1000))]);
  const problems: Record<string, string> = {};
  if (!restaurant) problems.restaurant = "Add your restaurant's name";
  if (!cuisines.length) problems.cuisines = "Pick at least one";
  if (!allowed.has(date) || !time) problems.slot = "Pick a day and time";
  if (!name) problems.name = "Add your name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) problems.email = "That email doesn't look right";
  if (!/^\+?[\d\s()-]{7,20}$/.test(whatsapp)) problems.whatsapp = "That number doesn't look right";
  if (Object.keys(problems).length) return oops("Some answers need another look", 400, { problems });
  if (!(await filesExist(files))) return oops("One of your files didn't finish uploading. Try adding it again.", 400);

  const start = londonToUtc(date, time);
  const menuLater = !files.length && b.menuLater === true;
  const row = {
    restaurant,
    postcode: str(b.postcode, 12).toUpperCase(),
    cuisines,
    opening: oneOf(b.opening, choices.opening),
    menu_files: files,
    menu_later: menuLater,
    goal: oneOf(b.goal, choices.goals),
    notes: text(b.notes, 3000),
    instagram: str(b.instagram, 60),
    contact_name: name,
    email,
    whatsapp,
    call_date: date,
    call_time: time,
    call_how: how,
    call_at: start.toISOString(),
    ref: str(b.ref, 60),
    user_agent: str(req.headers.get("user-agent"), 300),
  };

  let id: string;
  try {
    id = await createRequest(row);
  } catch (e) {
    if (e instanceof SlotTakenError) return oops("Someone just booked that time. Pick another one.", 409, { taken: true });
    console.error(e);
    return oops("Couldn't save your answers. Try again, or WhatsApp us.", 500);
  }

  const callText = `${longDate(date)} at ${time}`;
  const callShort = `${formatDay(date, { weekday: "short", day: "numeric", month: "short" })} ${time}`;
  const event = { id, start, how, restaurant, phone: whatsapp };
  try {
    await sendBookingEmails({
      id,
      firstName: name.split(" ")[0],
      name,
      email,
      whatsapp,
      restaurant,
      callText,
      callShort,
      how,
      ics: icsFile(event),
      files: await fileLinks(files),
      answers: [
        ["Restaurant", restaurant],
        ["Postcode", row.postcode],
        ["Cooking", cuisines.join(", ")],
        ["Opening", row.opening],
        ["Menu", files.length ? `${files.length} file${files.length > 1 ? "s" : ""}` : menuLater ? "Will WhatsApp it later" : "None"],
        ["Goal", row.goal],
        ["Notes", row.notes],
        ["Instagram", row.instagram],
        ["Name", name],
        ["Email", email],
        ["WhatsApp", whatsapp],
        ["Call", `${callText}, ${how.toLowerCase()}`],
        ["Came from", row.ref],
      ],
    });
  } catch (e) {
    // The booking is saved either way; a mail hiccup shouldn't show the restaurant an error
    console.error(e);
  }

  return json({ ok: true, id, callText, how, calendar: googleCalendarLink(event) });
}
