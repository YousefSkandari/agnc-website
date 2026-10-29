import type { Metadata } from "next";
import Footer from "@/components/shell/Footer";
import Header from "@/components/shell/Header";
import { site } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy notice · agnc. media",
  description: "How agnc. media uses the details we hold about you, and how to make us stop.",
};

// Draft for Nes & Gaby to check. Square-bracket values still need filling in.
export default function Privacy() {
  return (
    <>
      <Header variant="page" />
      <main className="wrap prose" id="main">
        <h1>Privacy notice</h1>
        <p>This notice explains what agnc. media holds about you, why, and what you can ask us to do about it. Last updated 28 October 2026.</p>

        <h2>Who we are</h2>
        <p>agnc. media is a restaurant marketing agency run by Nes &amp; Gaby, trading as [legal name], [registered address]. We decide how your details are used, which makes us the controller under UK data protection law. You can reach us at {site.email} or on WhatsApp at {site.whatsapp}.</p>

        <h2>If we sent you a letter</h2>
        <p>We found your company on the public Companies House register, which lists new companies, their registered address and their directors. We used your company name, that address and the director&apos;s name to write to you once about our restaurant marketing.</p>
        <p>We do this because we have a legitimate interest in telling new restaurants about our services, and a letter is a light-touch way to do it. We keep these details for up to 12 months, then delete them unless you&apos;ve become a client.</p>
        <p>Don&apos;t want to hear from us again? Text STOP to {site.whatsapp} or email {site.email}. We&apos;ll stop straight away and keep only your company name on a do-not-contact list, so we don&apos;t write to you by mistake in future.</p>

        <h2>If you filled in our form</h2>
        <p>We collect what you give us: your name, email, phone number, your restaurant&apos;s name and postcode, your menu and any files you upload, your answers about your food and goals, and the call time you pick. We use it to write your 30-day launch plan, hold the call, and follow up about it.</p>
        <p>We use these details because you asked us to write your plan, and because we have a legitimate interest in following up with people who ask for one. We keep them for 12 months after your call, or for as long as you&apos;re a client and then six years for our accounts.</p>

        <h2>Who else sees your details</h2>
        <p>Only companies that help us run things, and only what they need:</p>
        <ul>
          <li>Supabase, which stores form answers and uploaded files (in Ireland).</li>
          <li>Vercel, which hosts this website.</li>
          <li>Resend, which sends our confirmation emails.</li>
          <li>Stannp, which prints and posts our letters.</li>
        </ul>
        <p>Some of these companies may handle data outside the UK. Where they do, they are bound by UK-approved safeguards such as the International Data Transfer Addendum. We never sell your details.</p>

        <h2>On this website</h2>
        <p>We don&apos;t use tracking or advertising cookies. While you fill in the form, your answers are saved on your own device so you can pick up where you left off. They&apos;re cleared once you send the form.</p>

        <h2>Your rights</h2>
        <p>You can ask for a copy of what we hold about you, ask us to correct or delete it, ask us to stop using it, or object to us contacting you. Just email {site.email}. We&apos;ll reply within a month.</p>
        <p>If you&apos;re unhappy with how we&apos;ve handled your details, you can complain to the Information Commissioner&apos;s Office at <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a> or on 0303 123 1113.</p>
      </main>
      <Footer />
    </>
  );
}
