import { booking } from "@/lib/config";
import { daysBetween, formatDay, londonToday, offeredDates } from "@/lib/dates";
import { json, oops } from "@/lib/guard";
import { storeReady, takenSlots } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!storeReady()) return oops("Booking is offline right now", 503);
  try {
    const today = londonToday();
    const dates = offeredDates();
    const taken = await takenSlots(dates);
    return json({
      days: dates.map((d) => ({
        date: d,
        weekday: formatDay(d, { weekday: "long" }),
        label: formatDay(d, { day: "numeric", month: "long" }),
        inDays: daysBetween(today, d),
        times: booking.times.map((t) => ({ time: t, taken: taken.some((x) => x.date === d && x.time === t) })),
      })),
    });
  } catch (e) {
    console.error(e);
    return oops("Couldn't load the call times", 500);
  }
}
