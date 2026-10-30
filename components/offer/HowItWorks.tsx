"use client";

// d5, how it works and the price (artboard B-desktop 608-664). The three step dates are worked out from London's
// today after hydration (D 1156-1170), so the server HTML never carries a date; their line height is reserved. The
// call days come from offeredDates(), the same days the form offers at step 7.
import { useMemo } from "react";
import PlanButton from "@/components/ui/PlanButton";
import { IconPlus } from "@/components/ui/icons";
import { site, terms } from "@/lib/config";
import { useLondonToday } from "@/lib/client/device";
import { useSectionRef } from "@/lib/client/sections";
import { addDays, offeredDates, shortDay, shortMonth, weekdayOf, WEEKDAYS, type Ymd } from "@/lib/dates";
import { brand } from "@/lib/media";

const STEPS = ["Tell us about your place.", "We write your 30-day plan in 3 days.", "We hand it over on a call."] as const;

// "TODAY, THU 29 OCT", "FRI–SUN", "SUN 1 OR MON 2 NOV" (or "FRI 30 OCT OR SAT 31 OCT" across a month end)
function stepDates(today: Ymd): [string, string, string] {
  const wd = (d: Ymd) => WEEKDAYS[weekdayOf(d)];
  const s1 = `Today, ${shortDay(today)}`;
  const s2 = `${wd(addDays(today, 1))}–${wd(addDays(today, 3))}`;
  const [a, b] = offeredDates();
  let s3 = "";
  if (a && b) s3 = shortMonth(a) === shortMonth(b) ? `${wd(a)} ${Number(a.slice(8, 10))} or ${shortDay(b)}` : `${shortDay(a)} or ${shortDay(b)}`;
  else if (a) s3 = shortDay(a);
  return [s1.toUpperCase(), s2.toUpperCase(), s3.toUpperCase()];
}

const FAQ: readonly [string, string][] = [
  ["What’s in the plan?", "A day-by-day posting calendar, post ideas built around your menu, an opening-week shot list and local launch moves."],
  ["Why is it free?", "Because the quickest way to show you how we think is to do the thinking for your opening."],
  ["What do you need from me?", "Your menu (a photo is fine), time to shoot around your service, and access to your accounts."],
  ["Am I locked in?", `For three months, then ${terms.rolling}. The free plan comes with no contract at all.`],
  ["What do I keep?", terms.ownership],
  ["We opened last month. Too late?", "No. The plan covers your next 30 days."],
  [
    "Do you work with places like mine?",
    "Yes, every kind: takeaways, cafés, fine dining, street food, burger joints, pizzerias, family restaurants, dessert spots, bakeries and delivery kitchens.",
  ],
  ["Can you promise a queue?", "No. We can promise every post has a job, and every month you’ll see what each one did."],
  ["Do you take bookings?", "No. We make the posts that send people to wherever you take them."],
  ["Full terms", terms.full],
];

const MONTHLY = ["Plan.", "Film & photograph.", "Edit.", "Post.", "Report."] as const;

export default function HowItWorks() {
  const ref = useSectionRef("d5");
  const today = useLondonToday();
  const dates = useMemo(() => (today ? stepDates(today) : null), [today]);

  return (
    <section id="d5" ref={ref} aria-labelledby="d5-h" className="hiw">
      <div className="wrap">
        <div className="hiw-grid">
          <div className="hiw-main">
            <p className="kicker">HOW IT WORKS · PRICE</p>
            <h2 id="d5-h" className="h2">
              Start with a free plan. Decide after.
            </h2>
            <ol className="hiw-steps">
              {STEPS.map((s, i) => (
                <li key={s} className="hiw-step">
                  <span className="hiw-when">{dates?.[i] ?? ""}</span>
                  <p className="hiw-what">{s}</p>
                </li>
              ))}
            </ol>
            <div className="hiw-cta">
              <PlanButton />
            </div>
          </div>

          <div className="paper price">
            <img className="price-logo" src={brand.logo.src} alt={brand.logo.alt} width={72} height={17} />
            <p className="price-h">3 months, the 4th free</p>
            <p className="price-from">From {site.monthlyPrice} a month</p>
            <div className="price-list">
              <p className="price-every">EVERY MONTH</p>
              <ul className="price-rows">
                {MONTHLY.map((m) => (
                  <li key={m} className="price-row">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <details className="faq">
              <summary className="faq-sum">
                <span>Terms and questions</span>
                <IconPlus size={18} className="faq-plus" />
              </summary>
              <dl className="faq-dl">
                {FAQ.map(([q, a]) => (
                  <div key={q}>
                    <dt>{q}</dt>
                    <dd>{a}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
