# agnc. media website

The site the Stannp letters point to. Restaurants see the posts we make and an example 30-day plan, then request the free 30-day launch plan through a short step-by-step form. They upload their menu and book a call 3 or 4 days later. The plan is only handed over on that call.

Built with Next.js 14 (app router), Supabase for requests and files, and Resend for email. Hosted on Vercel.

## Pages

- `/` is the home page. Its sections, in order (the ids are the page anchors, e.g. `/#d4`):
  - **d1, What we do**: the headline and the hero post (opening day at Beirut Station). It plays on its own when motion is on, and opens the reel viewer.
  - **d2, The posts**: the seven posts in launch order, then four photos. A card plays on hover (desktop) or when it is centred (phone), and opens the reel viewer on that post. "Watch all seven like a customer would" opens it on post 01.
  - **d4, Thirty days**: an example 30-day plan as a calendar (a swiper on smaller screens). The four jobs filter it, a day opens its brief, and the opening-day field moves the plan to the restaurant's own date.
  - **d5, How it works**: the three steps with real dates from today, the price, and "Terms and questions".
  - **d7, Nes & Gaby**.
  - **d8, Your plan**: the last call to action.

  Around them: the two-row header with the section nav and the MOTION switch, the footer, and on the phone a bottom bar (shown once the hero's button has scrolled away) with the sections menu. The menu sheet, the reel viewer and the plan form are overlays: only one is open at a time, the browser's back button closes the top one, and the bottom bar hides while any of them is open.

  Every plan button on the page (header, d1, d4, d5, d8, the menu sheet, the bottom bar and the reel viewer) opens the plan form over the page; on `/privacy` it goes to `/plan`. The opening day picked in d4 and at the form's step 3 is the same answer: change one and the other follows. The third date in d5 is the first day the form offers for the call.

  Motion: videos play muted, one at a time, and only while on screen. Anyone with reduced motion turned on, or who turns the MOTION switch off, gets no autoplay and no animation, and every video stops; the play buttons still work. With Save-Data on, nothing autoplays either.
- `/plan` is the same form as a page, for direct links to the form only. It opens straight on step 1 and never says what agnc. is, so letters and QR codes go to the home page instead, with a ref (`https://…/?ref=letter-oct`): its first screen says who we are. The form has 8 short steps:
  1. What's the name on the door? (restaurant name and postcode);
  2. What do you serve? (cuisines, or "Something else");
  3. When do you open? (a date, or already open, this month, next month);
  4. Got a menu we can see? (upload a file, or skip for now);
  5. What matters most in month one? (one of three goals);
  6. Anything else we should know? (notes and their Instagram);
  7. Pick a time for your handover call (3 or 4 days ahead);
  8. Where should we send it? (name, email, phone, and "WhatsApp me before the call").

  The form doesn't ask how to hold the call any more: every call is by phone (`booking.callHow`), and the WhatsApp switch is saved at the end of the notes. The menu is only uploaded when the request is sent. If someone else takes the time first, the form goes back to step 7 to pick another.

  Answers are kept in the browser as a draft, so a reload doesn't lose them. Add `?ref=letter-oct` (or `?r=` / `utm_source=`) to the home page link or QR code on the letter to see which mailing a request came from. The ref is kept from the moment the page loads, so it survives the visitor looking round before they open the form.
- `/privacy` is a draft privacy notice. Fill in the placeholders before going live.

## Run it locally

```bash
npm install
npm run dev
```

With no Supabase keys, the form still works locally. Requests go to `.data/requests.json` and uploads go to `.data/uploads/`. That fallback is off in production, where a missing key returns an error rather than losing a request. To try the production build locally with the same fallback, run `npm run build` and then `AGNC_LOCAL_DATA=1 npx next start` (it never applies on Vercel).

Code comments that say "D 223" or "P4" point at lines of the design artboards: B-desktop (D) and the phone screens B-phone-1, 2, 4 and 5 (P1, P2, P4, P5).

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

Every placeholder is in [`lib/config.ts`](lib/config.ts) and shows on the page in its square brackets until it's filled in, so nobody mistakes it for a real detail. A link left as `""` shows as plain text, not as a link.

- `site.email`, `site.whatsapp`, `site.instagram` and `site.companyNumber`: the footer. The email and WhatsApp number also appear in the form's error messages and the privacy notice.
- `site.whatsappLink` and `site.instagramLink`: the real links (`https://wa.me/447700900123`, the Instagram profile URL).
- `site.monthlyPrice`: "From [PRICE] a month" in d5.
- `site.legalName` and `site.address`: the privacy notice's "trading as" line.
- `client.instagramLink`: Beirut Station's Instagram, for the line under the hero post.
- `team.nes.role` and `team.gaby.role`: d7.
- `terms.rolling`, `terms.ownership` and `terms.full`: the three answers in d5's "Terms and questions" that still need the real wording.
- `booking`: call times (`times`), which weekdays you take calls (`callDays`, 0 is Sunday), and how many days ahead (`daysAhead`, 3 and 4 by default). If a day isn't allowed, the form skips forward to the next allowed one. d5's dates follow the same settings.
- `app/privacy/page.tsx`: have the notice checked before going live. It now says "phone number" where it used to say "WhatsApp number".

## Adding or swapping posts

The site shows seven posts: d1's hero, d2's strip, the reel viewer and some of d4's days all draw on them.

1. Put the files in `public/work/`: the reel as MP4 (ideally under 8 MB) and a JPG poster with the same name, e.g. `reel-cedar-opening.mp4` and `reel-cedar-opening.jpg`. Reels are 576x1024 (9:16): the `reel()` helper assumes that size, so the page reserves the right space before the poster loads.
2. Add the reel to `reels` in [`lib/media.ts`](lib/media.ts), with a line saying what it shows (for screen readers):

   ```ts
   cedar: reel("cedar", "reel-cedar-opening", "Opening night at Cedar Grill, the dining room full"),
   ```

   and add its id to the `ReelId` type at the top. Photos go in `photos` in the same file, with their real width and height.
3. Change the post that should use it in [`content/posts.ts`](content/posts.ts): `reel: reels.cedar`, plus its title, running time (`len`), job, when it opens and goes out, and who made it. The array's order is the launch order.

The copy counts the posts ("Seven posts", "POST 03 / 07", "You've seen all seven"), so adding an eighth means changing those lines in `components/shell/ThePosts.tsx` and `components/shell/ReelViewer.tsx` too. `heroReel` in `lib/media.ts` picks the hero post, and d4's example days pick theirs in `content/calendar.ts` (`CAL_MEDIA`).

Phone videos are usually HDR, which looks washed out on the web. Convert them to standard range first. This is how the current reels were made:

```bash
ffmpeg -i in.MOV -an -vf "scale=576:1024,zscale=tin=arib-std-b67:min=bt2020nc:pin=bt2020:t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,fps=30,format=yuv420p" \
  -c:v libx264 -preset slow -crf 28 -maxrate 1400k -bufsize 2800k -movflags +faststart public/work/name.mp4
```

The poster can be cut from the same file: `ffmpeg -i public/work/name.mp4 -frames:v 1 -q:v 3 public/work/name.jpg`.

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
