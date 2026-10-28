# agnc. media website

The site the Stannp letters point to. Restaurants see the reels and photos, then request the free 30-day launch plan through a short step-by-step form. They upload their menu and book a call 3 or 4 days later. The plan is only handed over on that call.

Built with Next.js 14 (app router), Supabase for requests and files, and Resend for email. Hosted on Vercel.

## Pages

- `/` is the home page: the hero, the work grid, what's in the plan, how it works, the offer, about Nes & Gaby.
- `/plan` is the form, 8 short steps:
  1. restaurant name and postcode;
  2. cuisines;
  3. opening date;
  4. menu upload;
  5. the goal for month one;
  6. anything else, plus Instagram;
  7. pick a day and time;
  8. contact details.

  Answers are kept in the browser as a draft, so a reload doesn't lose them. Add `?ref=letter-oct` (or `?r=` / `utm_source=`) to the letter's link or QR code to see which mailing a request came from.
- `/privacy` is a draft privacy notice. Fill in the placeholders before going live.

## Run it locally

```bash
npm install
npm run dev
```

With no Supabase keys, the form still works locally. Requests go to `.data/requests.json` and uploads go to `.data/uploads/`. That fallback is off in production, where a missing key returns an error rather than losing a request.

## Going live

1. **Supabase.** In the project's SQL Editor, run [`supabase/setup.sql`](supabase/setup.sql). It does three things:
   - creates the `plan_requests` table;
   - adds the rule that stops two people booking the same slot;
   - creates the private `plan-files` bucket.

   It's safe to run again.
2. **Resend** (optional, but you'll want it). Create an account and verify your domain. Without it, requests are still saved, just no emails go out. With it:
   - the restaurant gets a confirmation with a calendar invite attached;
   - you get an email with their answers and 14-day download links for their files.
3. **Vercel.** Import the repo, then add these environment variables (see [`.env.example`](.env.example)):

   | Variable | What it is |
   | --- | --- |
   | `SUPABASE_URL` | Supabase > Project Settings > API |
   | `SUPABASE_SECRET_KEY` | The secret (service role) key from the same page. Server only. |
   | `RESEND_API_KEY` | From Resend |
   | `EMAIL_FROM` | e.g. `agnc. media <hello@yourdomain.com>`, on the verified domain |
   | `NOTIFY_EMAIL` | Where new requests go. Comma-separate for both of you. |
   | `NEXT_PUBLIC_SITE_URL` | Optional. The live address for link previews; without it the project's production domain is used. |

4. **Domain.** Add it in Vercel > Project > Domains, then put the same address on the letters.

## Things to fill in

- `lib/config.ts`: WhatsApp number and link, email, Instagram, monthly price.
- `lib/config.ts` → `booking`: call times, which weekdays you take calls (`callDays`, 0 is Sunday), and how many days ahead (`daysAhead`, 3 and 4 by default). If a day isn't allowed, the form skips forward to the next allowed one.
- `app/page.tsx`: Nes & Gaby's roles and a line about you both. Add your photos the same way as the work media below.
- `app/privacy/page.tsx`: legal name and registered address.

## Adding reels and photos

1. Put the files in `public/work/`. Use MP4 for reels, ideally under 8 MB each, and JPG or WebP for photos.
2. Add or edit an entry in [`content/work.ts`](content/work.ts):

   ```ts
   { kind: "Reels", label: "REEL · 0:15", client: "Cedar Grill", caption: "Opening night", aspect: "9/16",
     src: "/work/cedar-opening.mp4", poster: "/work/cedar-opening.jpg", featured: true },
   ```

   - `kind` decides which tab it shows under: Reels, Photos or Launches.
   - `aspect` can be `9/16`, `1/1` or `4/5`.
   - The first five `featured` items fill the strip under the headline, and the third one sits in the middle.

   Reels play silently on a loop when they're on screen and pause when they're not. Anyone who has reduced motion turned on sees the poster instead.

## Seeing requests

Open Supabase > Table Editor > `plan_requests`. Each row has:

- the answers;
- the call time (`call_at`, in UTC; `call_date` and `call_time` are London time);
- the uploaded file paths, found in Storage > `plan-files`.

To free a slot after a cancellation, set `status` to `cancelled`. The statuses are `booked`, `done`, `cancelled` and `no_show`.

## How booking stays safe

- The server only accepts a day the form offered and a time on the list.
- A unique index in the database refuses a second booking for the same slot. If two people pick the same time at once, the second is sent back to choose again.
- Uploads go straight from the browser to Supabase through one-time links. That gets around Vercel's 4.5 MB request limit, and the files stay private.
- There's a hidden honeypot field and a per-IP rate limit to keep bots out.
