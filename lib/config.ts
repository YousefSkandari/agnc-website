// Everything Nes & Gaby might want to change without touching the pages.
// Square-bracket values are placeholders still to be filled in. They show on the page exactly as written, so nobody
// mistakes them for real details. A link left as "" is not a link: the page shows the text without one.
export const site = {
  name: "agnc. media",
  // Falls back to the production domain Vercel gives every deployment, so this only needs setting to override it
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  email: "[EMAIL]",
  // The number as people should read it, e.g. 07700 900123
  whatsapp: "[WHATSAPP]",
  // https://wa.me/ followed by the number in digits only, with the country code and no leading zero:
  // https://wa.me/447700900123. Leave "" until it is known.
  whatsappLink: "",
  instagram: "[INSTAGRAM]",
  // e.g. https://www.instagram.com/agnc.media/ . Leave "" until it is known.
  instagramLink: "",
  companyNumber: "[COMPANY NO.]",
  // Shown as "From [PRICE] a month"
  monthlyPrice: "[PRICE]",
  city: "London",
};

// Our client on the hero. Leave the link "" until the real profile URL is confirmed: the line then shows as plain text.
export const client = {
  name: "Beirut Station",
  place: "Egham",
  instagramLink: "",
};

export const team = {
  nes: { name: "Nes", role: "[ROLE]" },
  gaby: { name: "Gaby", role: "[ROLE]" },
};

// The three answers in "Terms and questions" that still need the real wording
export const terms = {
  rolling: "[ROLLING TERMS]",
  ownership: "[OWNERSHIP TERMS]",
  full: "[FULL TERMS]",
};

export const booking = {
  timeZone: "Europe/London",
  // Calls are offered this many days after the form is sent (the plan takes three days to write)
  daysAhead: [3, 4],
  // Local London times, 24-hour clock. The design mock-up shows 10:30, 14:00 and 16:30; these are the live times.
  times: ["10:00", "11:30", "14:00", "16:30"],
  callMinutes: 30,
  // 0 = Sunday ... 6 = Saturday. If day 3 or 4 lands on a day not listed, the next listed day is offered instead.
  callDays: [0, 1, 2, 3, 4, 5, 6],
  // The form no longer asks how to hold the call: we phone on the number given
  callHow: "Phone",
};

export const choices = {
  // Alphabetical, so no kind of food comes first
  cuisines: [
    "African", "American", "Bakery", "Brazilian", "British", "Brunch", "Burgers", "Caribbean", "Chinese", "Coffee",
    "Desserts", "French", "Greek", "Indian", "Italian", "Japanese", "Korean", "Lebanese", "Mediterranean", "Mexican",
    "Middle Eastern", "Pakistani", "Persian", "Pizza", "Portuguese", "Spanish", "Thai", "Turkish", "Vegan", "Vietnamese",
    "Something else",
  ],
  opening: ["We’re already open", "This month", "Next month"],
  goals: ["Get found before we open", "A busy opening week", "Bring people back"],
  how: ["Video", "Phone"],
};

export const upload = {
  // Matches the plan-files bucket limit in supabase/setup.sql
  maxBytes: 20 * 1024 * 1024,
  maxFiles: 6,
  types: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
};
