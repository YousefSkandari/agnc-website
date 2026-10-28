import { site } from "./config";

// Emails go through Resend (resend.com) when RESEND_API_KEY is set. Without it the request is still saved and
// the emails are skipped, so a missing key never loses a booking.
const KEY = process.env.RESEND_API_KEY || "";
const FROM = process.env.EMAIL_FROM || "agnc. media <onboarding@resend.dev>";
const NOTIFY = (process.env.NOTIFY_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean);

type Mail = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: string }[];
};

async function send(mail: Mail): Promise<boolean> {
  if (!KEY || !mail.to.length) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      reply_to: mail.replyTo,
      attachments: mail.attachments,
    }),
  });
  if (!res.ok) console.error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.ok;
}

const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type Booking = {
  id: string;
  firstName: string;
  name: string;
  email: string;
  whatsapp: string;
  restaurant: string;
  callText: string;
  callShort: string;
  how: string;
  ics: string;
  answers: [string, string][];
  files: { path: string; url: string }[];
};

export async function sendBookingEmails(b: Booking) {
  const how =
    b.how === "Phone" ? `We'll ring you on ${b.whatsapp}.` : "We'll send you the video link before the call.";
  const paras = [
    `Hi ${b.firstName},`,
    `Thanks for telling us about ${b.restaurant}. Your walkthrough is booked for ${b.callText}.`,
    `Over the next three days we'll write your 30-day launch plan, then walk you through it on the call. It's yours to keep, whether you work with us or not. ${how}`,
    `Need to move it? Just reply to this email or WhatsApp us on ${site.whatsapp}.`,
  ];
  const toClient = send({
    to: [b.email],
    replyTo: NOTIFY[0],
    subject: `You're booked in: plan walkthrough, ${b.callShort}`,
    text: [...paras, "Nes & Gaby", "agnc. media"].join("\n\n"),
    html:
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#161616;max-width:560px">` +
      paras.map((p) => `<p>${h(p)}</p>`).join("") +
      `<p style="font-family:Georgia,serif;font-style:italic;font-size:22px;margin:24px 0 0">Nes &amp; Gaby</p>` +
      `<p style="color:#5A554D;font-size:13px;margin:4px 0 0">agnc. media</p></div>`,
    attachments: [{ filename: "agnc-walkthrough.ics", content: Buffer.from(b.ics).toString("base64") }],
  });

  const rows = b.answers.map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#5A554D;vertical-align:top">${h(k)}</td><td style="padding:6px 0">${h(v || "-")}</td></tr>`);
  const files = b.files.length
    ? b.files.map((f) => `<li><a href="${h(f.url)}">${h(f.path.split("/").pop() || f.path)}</a></li>`).join("")
    : "<li>No files. " + h(b.answers.find(([k]) => k === "Menu")?.[1] ?? "") + "</li>";
  const toUs = send({
    to: NOTIFY,
    replyTo: b.email,
    subject: `New plan request: ${b.restaurant}, call ${b.callShort}`,
    text: b.answers.map(([k, v]) => `${k}: ${v || "-"}`).join("\n") + "\n\nFiles:\n" + b.files.map((f) => f.url).join("\n"),
    html:
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#161616">` +
      `<h2 style="margin:0 0 12px">${h(b.restaurant)}</h2><p>Call: <b>${h(b.callText)}</b> (${h(b.how)})</p>` +
      `<table style="border-collapse:collapse">${rows.join("")}</table>` +
      `<h3>Menu and files</h3><ul>${files}</ul><p style="color:#5A554D;font-size:12px">File links last 14 days. Request ${h(b.id)}.</p></div>`,
    attachments: [{ filename: "agnc-walkthrough.ics", content: Buffer.from(b.ics).toString("base64") }],
  });

  const [client, us] = await Promise.all([toClient, toUs]);
  return { client, us };
}
