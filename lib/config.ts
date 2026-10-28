// Everything Nes & Gaby might want to change without touching the pages. Square-bracket values are placeholders
// still to be filled in.
export const site = {
  name: "agnc. media",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://agnc.media",
  whatsapp: "[07XXX XXX XXX]",
  // Digits only, with the country code and no leading zero: 447700900123
  whatsappLink: "https://wa.me/",
  email: "[hello@yourdomain.com]",
  instagram: "[@yourinstagram]",
  instagramLink: "https://instagram.com/",
  monthlyPrice: "[YOUR PRICE]",
  city: "London",
};

export const booking = {
  timeZone: "Europe/London",
  // Calls are offered this many days after the form is sent (the plan takes three days to write)
  daysAhead: [3, 4],
  // Local London times, 24-hour clock
  times: ["10:00", "11:30", "14:00", "16:30"],
  callMinutes: 30,
  // 0 = Sunday ... 6 = Saturday. If day 3 or 4 lands on a day not listed, the next listed day is offered instead.
  callDays: [0, 1, 2, 3, 4, 5, 6],
};

export const choices = {
  cuisines: ["Lebanese", "North African", "African", "Middle Eastern", "Mediterranean", "Smash burgers", "Something else"],
  opening: ["Already open", "This month", "Next month", "In 2 to 3 months", "Not sure yet"],
  goals: ["A packed opening week", "Regulars who come back", "More delivery orders", "A following before we open"],
  how: ["Video", "Phone"],
};

export const upload = {
  maxBytes: 20 * 1024 * 1024,
  maxFiles: 6,
  types: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
};
