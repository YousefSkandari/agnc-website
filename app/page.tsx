import Link from "next/link";
import Media from "@/components/Media";
import { SiteFooter, SiteHeader } from "@/components/Site";
import WorkGrid from "@/components/WorkGrid";
import { site } from "@/lib/config";
import { work } from "@/content/work";

const kinds = ["Takeaways", "Cafés", "Fine dining", "Street food", "Burger joints", "Pizzerias", "Family restaurants", "Dessert spots", "Bakeries", "Delivery kitchens"];

const plan = [
  ["A day-by-day posting calendar", "Thirty days mapped out, from the first teaser to the end of your first month."],
  ["Post ideas for your dishes", "Every idea is built around your menu, so nothing reads like a template."],
  ["An opening week shot list", "What to film and photograph, and when, so you're never stuck for content."],
  ["Your local launch moves", "Who to reach near you, and how to get them through the door in week one."],
];

const how = [
  ["TODAY", "You fill in the form", "About five minutes. Upload your menu and tell us about your place."],
  ["DAYS 1 TO 3", "We write your plan", "We study your menu and your area, and plan your first month."],
  ["DAY 3 OR 4", "Your walkthrough call", "You pick the time when you send the form. We hand the plan over on the call."],
  ["AFTER THAT", "You launch", "Run the plan yourself, or let us run it for you."],
];

export default function Home() {
  const featured = work.filter((w) => w.featured).slice(0, 5);
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="orbs" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>
      <SiteHeader home />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap hero-copy">
            <div className="caps">Now serving · restaurants opening soon</div>
            <h1 id="hero-title">Full tables,<br />from day one.</h1>
            <p>Reels, photos and launch campaigns for new restaurants. Tell us about yours and we&apos;ll write your 30-day launch plan, free.</p>
            <div className="hero-actions">
              <Link className="pill" href="/plan">Get your free plan <span aria-hidden="true">→</span></Link>
              <a className="ghost" href="#work">Watch our work</a>
            </div>
          </div>
          <div className="strip" aria-label="Featured work">
            {featured.map((w, i) => (
              <Media key={i} item={w} showCaption={i === 2} play={i === 2} />
            ))}
          </div>
        </section>

        <section className="kitchens" aria-label="Restaurants we work with">
          <div className="tick" aria-hidden="true">
            {kinds.map((k, i) => (
              <span key={k} style={{ display: "contents" }}>
                {i > 0 && <span className="dot">·</span>}
                <span>{k}</span>
              </span>
            ))}
          </div>
          <p className="wrap">From takeaways to fine dining, we work with every kind of restaurant. Your plan is built around your food and your street.</p>
        </section>

        <section id="work" className="section">
          <div className="wrap stack reveal">
            <WorkGrid />
          </div>
        </section>

        <section id="plan" className="section tight">
          <div className="wrap stack-lg reveal">
            <div className="section-head">
              <div>
                <div className="caps">Your welcome gift</div>
                <h2 className="h2">A 30-day launch plan.<br />On the house.</h2>
              </div>
              <p className="lede">Built around your menu, your street and your opening date. Yours to keep, whether you work with us or not.</p>
            </div>
            <div className="cards">
              {plan.map(([t, d], i) => (
                <div className="card" key={t}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="section tight">
          <div className="wrap stack-lg reveal">
            <div className="section-head">
              <div>
                <div className="caps">How it works</div>
                <h2 className="h2">From form to first post.</h2>
              </div>
            </div>
            <ol className="steps">
              {how.map(([when, t, d]) => (
                <li key={when}>
                  <span className="when">{when}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section tight" aria-label="The welcome deal">
          <div className="wrap reveal">
            <div className="deal">
              <div>
                <div className="caps">Love the plan? Let us run it.</div>
                <h2 className="h2">Four months<br />for the price of three.</h2>
                <p>Sign a 3-month contract and your 4th month is on us. Content, posting and reporting, all handled.</p>
              </div>
              <div>
                <span className="price">From {site.monthlyPrice} a month</span>
                <Link className="pill dark" href="/plan">Start with the free plan <span aria-hidden="true">→</span></Link>
              </div>
            </div>
          </div>
        </section>

        <section id="us" className="section tight">
          <div className="wrap about reveal">
            <div className="about-photos">
              <figure>
                <div className="media" style={{ aspectRatio: "4/5" }}><span className="tag">PHOTO</span></div>
                <figcaption><span className="serif">Nes</span><span>[Role]</span></figcaption>
              </figure>
              <figure>
                <div className="media" style={{ aspectRatio: "4/5" }}><span className="tag">PHOTO</span></div>
                <figcaption><span className="serif">Gaby</span><span>[Role]</span></figcaption>
              </figure>
            </div>
            <div className="about-copy">
              <div className="caps">Who you&apos;ll work with</div>
              <h2 className="h2">Restaurants are all we do.</h2>
              <p>The first month decides so much for a new restaurant, and most opening marketing is a guess. We&apos;d rather plan it with you, around your food and your street.</p>
              <p>[A line or two about Nes &amp; Gaby.]</p>
            </div>
          </div>
        </section>

        <section className="closer" aria-labelledby="closer-title">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/agnc-outline.svg" alt="" aria-hidden="true" />
          <div className="wrap">
            <h2 id="closer-title" className="h2">Your first 30 days,<br />planned.</h2>
            <p>About five minutes now. Your plan, on a call, 3 or 4 days later.</p>
            <Link className="pill" href="/plan">Get your free plan <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
