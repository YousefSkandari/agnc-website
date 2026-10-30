import { booking, choices, upload } from "@/lib/config";
import { googleCalendarLink, icsFile } from "@/lib/calendar";
import { daysBetween, formatDay, isYmd, londonToUtc, londonToday, longDate, offeredDates, OPENING_MAX_DAYS, shortDay } from "@/lib/dates";
import { sendBookingEmails } from "@/lib/email";
import { json, limited, oops } from "@/lib/guard";
import { createRequest, fileLinks, filesExist, SlotTakenError, storeReady } from "@/lib/store";
import { emailOk, parsePostcode, phoneOk } from "@/lib/validate";

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
  // Stored as "SW1A 1AA" however it was typed (with or without its space)
  const pc = parsePostcode(str(b.postcode, 12));
  const postcode = pc.valid ? pc.full : str(b.postcode, 12).toUpperCase();
  const picked = Array.isArray(b.cuisines) ? b.cuisines.filter((c): c is string => choices.cuisines.includes(c as string)) : [];
  // "Something else" is swapped for what they typed, when they typed something
  const other = str(b.cuisineOther, 60);
  const cuisines = picked.map((c) => (c === "Something else" && other ? other : c));
  // A picked opening date is stored with its day written out, when it is still to come (and not absurdly far off).
  // Otherwise the chip answer stands: the form sends "We’re already open" for a date today or earlier.
  const od = str(b.openingDate, 10);
  const ahead = isYmd(od) ? daysBetween(londonToday(), od) : -1;
  const opening = isYmd(od) && ahead >= 1 && ahead <= OPENING_MAX_DAYS ? `${od} (${longDate(od)})` : oneOf(b.opening, choices.opening);
  const goal = oneOf(b.goal, choices.goals);
  const files = Array.isArray(b.files) ? b.files.filter((f): f is string => typeof f === "string" && FILE_PATH.test(f)).slice(0, upload.maxFiles) : [];
  const name = str(b.name, 80);
  const email = str(b.email, 160).toLowerCase();
  const whatsapp = str(b.whatsapp, 30);
  const wa = b.whatsappFirst === true;
  const date = str(b.date, 10);
  const time = oneOf(b.time, booking.times);
  // The form no longer asks how to hold the call: we phone on the number given
  const how = booking.callHow;

  // Someone who loaded the times just before midnight still gets the days they were shown
  const allowed = new Set([...offeredDates(), ...offeredDates(new Date(Date.now() - 3 * 3600 * 1000))]);
  const problems: Record<string, string> = {};
  if (!restaurant) problems.restaurant = "Add the name on your door.";
  if (!pc.valid) problems.postcode = "Check the postcode. It looks like AB1 2CD.";
  if (!cuisines.length) problems.cuisines = "Pick at least one.";
  if (!opening) problems.opening = "Pick when you open. A date in the next two years works.";
  if (!goal) problems.goal = "Pick what matters most.";
  if (!allowed.has(date) || !time) problems.slot = "Pick a day and time.";
  if (!name) problems.name = "Add your name.";
  if (!emailOk(email)) problems.email = "Check the email address.";
  if (!phoneOk(whatsapp)) problems.whatsapp = "Check the number, starting 0 or +44.";
  if (Object.keys(problems).length) return oops("Some answers need another look", 400, { problems });
  if (!(await filesExist(files))) return oops("One of your files didn't finish uploading. Try adding it again.", 400);

  const start = londonToUtc(date, time);
  const menuLater = !files.length && b.menuLater === true;
  const row = {
    restaurant,
    postcode,
    cuisines,
    opening,
    menu_files: files,
    menu_later: menuLater,
    goal,
    notes: [text(b.notes, 3000), `WhatsApp me before the call: ${wa ? "yes" : "no"}`].filter(Boolean).join("\n\n"),
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
  const ics = icsFile(event);
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
      ics,
      files: await fileLinks(files),
      answers: [
        ["Restaurant", restaurant],
        ["Postcode", row.postcode],
        ["Food", cuisines.join(", ")],
        ["Opening", row.opening],
        ["Menu", files.length ? `${files.length} file${files.length > 1 ? "s" : ""}` : menuLater ? "Skipped for now" : "None"],
        ["Goal", row.goal],
        ["Notes", row.notes],
        ["Instagram", row.instagram],
        ["Name", name],
        ["Email", email],
        ["Phone", whatsapp],
        ["WhatsApp first", wa ? "Yes" : "No"],
        ["Call", `${callText}, phone`],
        ["Came from", row.ref],
      ],
    });
  } catch (e) {
    // The booking is saved either way; a mail hiccup shouldn't show the restaurant an error
    console.error(e);
  }

  return json({
    ok: true,
    id,
    callText,
    when: `${shortDay(date)}, ${time}`,
    how,
    calendar: googleCalendarLink(event),
    ics,
  });
}
