"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { choices, site, upload } from "@/lib/config";

type Slot = { time: string; taken: boolean };
type Day = { date: string; weekday: string; label: string; inDays: number; times: Slot[] };
type FileItem = { id: string; name: string; path?: string; progress: number; status: "uploading" | "done" | "error"; error?: string };
type Answers = {
  restaurant: string;
  postcode: string;
  cuisines: string[];
  cuisineOther: string;
  opening: string;
  menuLater: boolean;
  goal: string;
  notes: string;
  instagram: string;
  date: string;
  time: string;
  how: string;
  name: string;
  email: string;
  whatsapp: string;
};
type Done = { callText: string; how: string; calendar: string };

const TOTAL = 8;
const DRAFT = "agnc-plan-draft-v1";
const blank: Answers = {
  restaurant: "", postcode: "", cuisines: [], cuisineOther: "", opening: "", menuLater: false, goal: "", notes: "", instagram: "",
  date: "", time: "", how: "Video", name: "", email: "", whatsapp: "",
};
// Which step to send someone back to when the server rejects an answer
const stepOf: Record<string, number> = { restaurant: 0, cuisines: 1, slot: 6, name: 7, email: 7, whatsapp: 7 };

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
const phoneOk = (s: string) => /^\+?[\d\s()-]{7,20}$/.test(s.trim());

// Puts the file straight into storage through the one-time link, reporting progress as it goes
function put(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed, try again")));
    xhr.onerror = () => reject(new Error("Upload failed, check your connection"));
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    xhr.send(body);
  });
}

export default function PlanForm() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(blank);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState("");
  const [days, setDays] = useState<Day[] | null>(null);
  const [slotsFailed, setSlotsFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [over, setOver] = useState(false);
  const [restored, setRestored] = useState(false);
  const ref = useRef("");
  const hp = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => {
    setA((x) => ({ ...x, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: "" } : e));
  };

  // Pick up where they left off if they closed the tab half way
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    ref.current = (q.get("ref") || q.get("r") || q.get("utm_source") || "").slice(0, 60);
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT) || "null");
      if (d?.a) {
        setA({ ...blank, ...d.a, date: "", time: "" });
        setFiles((d.files || []).filter((f: FileItem) => f.status === "done"));
        setStep(Math.min(Number(d.step) || 0, TOTAL - 1));
        if (!ref.current && d.ref) ref.current = d.ref;
      }
    } catch {}
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored || done) return;
    try {
      localStorage.setItem(DRAFT, JSON.stringify({ a, step, ref: ref.current, files: files.filter((f) => f.status === "done") }));
    } catch {}
  }, [a, step, files, restored, done]);

  const loadSlots = useCallback(async () => {
    setSlotsFailed(false);
    try {
      const r = await fetch("/api/slots", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      const list = j.days as Day[];
      setDays(list);
      // Keep their pick if it's still free, otherwise start on the first day with a free time
      setA((x) => {
        const day = list.find((d) => d.date === x.date) || list.find((d) => d.times.some((t) => !t.taken)) || list[0];
        const stillFree = day?.times.some((t) => t.time === x.time && !t.taken);
        return { ...x, date: day?.date || "", time: stillFree ? x.time : "" };
      });
    } catch {
      setSlotsFailed(true);
    }
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    if (step === 6) loadSlots();
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [step, loadSlots]);

  const go = (n: number) => {
    setBanner("");
    setStep(Math.max(0, Math.min(TOTAL, n)));
  };
  const pickThenNext = (k: "opening" | "goal", v: string) => {
    set(k, v);
    setTimeout(() => go(step + 1), 280);
  };

  const uploading = files.some((f) => f.status === "uploading");
  const doneFiles = files.filter((f) => f.status === "done" && f.path);

  async function addFiles(list: FileList | File[]) {
    const room = upload.maxFiles - files.filter((f) => f.status !== "error").length;
    const picked = Array.from(list).slice(0, Math.max(0, room));
    if (!picked.length) return setBanner(`That's the most files we can take (${upload.maxFiles}). WhatsApp us any extras.`);
    setBanner("");
    await Promise.all(
      picked.map(async (file) => {
        const id = uid();
        const patch = (p: Partial<FileItem>) => setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, ...p } : f)));
        setFiles((fs) => [...fs, { id, name: file.name, progress: 0, status: "uploading" }]);
        try {
          if (file.size > upload.maxBytes) throw new Error("Over 20 MB, try a smaller file");
          const r = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
          });
          const j = await r.json();
          if (!r.ok) throw new Error(j.error || "Upload failed");
          await put(j.url, file, (p) => patch({ progress: p }));
          patch({ status: "done", progress: 1, path: j.path });
          setA((x) => ({ ...x, menuLater: false }));
        } catch (e) {
          patch({ status: "error", error: e instanceof Error ? e.message : "Upload failed" });
        }
      }),
    );
  }

  const removeFile = (id: string) => setFiles((fs) => fs.filter((f) => f.id !== id));

  function contactErrors() {
    const e: Record<string, string> = {};
    if (!a.name.trim()) e.name = "Add your name";
    if (!emailOk(a.email)) e.email = "That email doesn't look right";
    if (!phoneOk(a.whatsapp)) e.whatsapp = "That number doesn't look right";
    return e;
  }

  async function submit() {
    const e = contactErrors();
    setErrors(e);
    if (Object.keys(e).length) return;
    if (uploading) return setBanner("Your menu is still uploading. Give it a moment, then press Book my call again.");
    setSending(true);
    setBanner("");
    try {
      const r = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...a, files: doneFiles.map((f) => f.path), ref: ref.current, website: hp.current?.value || "" }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setDone({ callText: j.callText, how: j.how, calendar: j.calendar });
        try {
          localStorage.removeItem(DRAFT);
        } catch {}
        go(TOTAL);
      } else if (r.status === 409) {
        setA((x) => ({ ...x, time: "" }));
        await loadSlots();
        setStep(6);
        setBanner(j.error || "Someone just booked that time. Pick another one.");
      } else if (j.problems) {
        setErrors(j.problems);
        const first = Math.min(...Object.keys(j.problems).map((k) => stepOf[k] ?? 7));
        setStep(first);
        setBanner(j.error);
      } else {
        setBanner(j.error || `Something went wrong. Try again, or WhatsApp us on ${site.whatsapp}.`);
      }
    } catch {
      setBanner(`Couldn't send that. Check your connection and try again, or WhatsApp us on ${site.whatsapp}.`);
    } finally {
      setSending(false);
    }
  }

  const day = days?.find((d) => d.date === a.date);
  const timeFree = !!day?.times.some((t) => t.time === a.time && !t.taken);
  const noTimes = !!days && days.every((d) => d.times.every((t) => t.taken));
  const callText = day && a.time ? `${day.weekday} ${day.label} at ${a.time}` : "";

  function next() {
    if (step === 0 && !a.restaurant.trim()) return setErrors({ restaurant: "Add your restaurant's name" });
    if (step === 7) return submit();
    go(step + 1);
  }
  const nextOff = (step === 1 && !a.cuisines.length) || (step === 6 && !timeFree) || sending;
  const nextLabel = sending ? "Booking..." : step === 7 ? "Book my call" : step === 6 && !timeFree ? "Pick a time first" : "Continue";
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !nextOff) {
      e.preventDefault();
      next();
    }
  };
  const field = (k: "restaurant" | "postcode" | "cuisineOther" | "instagram" | "name" | "email" | "whatsapp") => ({
    id: `f-${k}`,
    className: "in",
    value: a[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value),
    onKeyDown: onEnter,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `e-${k}` : undefined,
  });
  const err = (k: string) => (errors[k] ? <p className="err" id={`e-${k}`}>{errors[k]}</p> : null);
  const q = (text: string) => (
    <h1 className="q" ref={heading} tabIndex={-1}>{text}</h1>
  );

  return (
    <div className="wizard">
      <aside className="wizard-side" aria-label="Your free plan">
        <div className="media">
          <div className="top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/agnc-logo.svg" alt="agnc. media" style={{ height: 30, width: "auto" }} />
            <span className="tag">REEL · 0:15</span>
          </div>
          <div className="bottom">
            <span className="caps">Your free 30-day launch plan</span>
            <span className="serif">Let&apos;s plan your first month.</span>
            <ol className="timeline">
              <li><span className="mono">TODAY</span><span>You answer a few questions.</span></li>
              <li><span className="mono">DAYS 1 TO 3</span><span>We write your plan.</span></li>
              <li><span className="mono">DAY 3 OR 4</span><span>We walk you through it on a call.</span></li>
            </ol>
          </div>
        </div>
      </aside>

      <div className="wizard-main">
        <header className="wizard-top">
          <Link href="/" className="back-home">← agnc. media</Link>
          <Link href="/" aria-label="agnc. media home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="wizard-logo" src="/agnc-logo.svg" alt="agnc. media" />
          </Link>
          <span className="help-line">Questions? <a href={site.whatsappLink}>WhatsApp us</a></span>
        </header>

        {step < TOTAL && (
          <div className="progress">
            <div className="segs" aria-hidden="true">
              {Array.from({ length: TOTAL }, (_, i) => <span key={i} className={i <= step ? "on" : ""} />)}
            </div>
            <span className="mono" aria-live="polite">STEP {step + 1} OF {TOTAL}</span>
          </div>
        )}

        <main className="wizard-body" id="main">
          {banner && <div className="banner" role="alert">{banner}</div>}

          {step === 0 && (
            <div className="stepbox" key="s0">
              {q("What's your restaurant called?")}
              <p className="help">Your free 30-day launch plan starts here. About five minutes, mostly taps.</p>
              <div className="fields">
                <div>
                  <label className="lbl" htmlFor="f-restaurant">Restaurant name</label>
                  <input {...field("restaurant")} autoComplete="organization" />
                  {err("restaurant")}
                </div>
                <div>
                  <label className="lbl" htmlFor="f-postcode">Postcode <span className="opt">(optional)</span></label>
                  <input {...field("postcode")} autoComplete="postal-code" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="stepbox" key="s1">
              {q("What do you cook?")}
              <p className="help">Pick all that fit.</p>
              <div className="choices" role="group" aria-label="Cuisine">
                {choices.cuisines.map((c) => {
                  const on = a.cuisines.includes(c);
                  return (
                    <button key={c} type="button" className="choice" aria-pressed={on}
                      onClick={() => {
                        set("cuisines", on ? a.cuisines.filter((x) => x !== c) : [...a.cuisines, c]);
                        // The box for "Something else" opens below the chips, off screen on phones
                        if (c === "Something else" && !on) setTimeout(() => document.getElementById("f-cuisineOther")?.scrollIntoView({ block: "center" }), 60);
                      }}>
                      {c}
                    </button>
                  );
                })}
              </div>
              {err("cuisines")}
              {a.cuisines.includes("Something else") && (
                <div className="other">
                  <label className="lbl" htmlFor="f-cuisineOther">What do you cook? <span className="opt">(optional)</span></label>
                  <input {...field("cuisineOther")} maxLength={60} placeholder="e.g. Peruvian, vegan, seafood" />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="stepbox" key="s2">
              {q("When do you open?")}
              <p className="help">Roughly is fine.</p>
              <div className="tiles" role="group" aria-label="Opening">
                {choices.opening.map((o) => (
                  <button key={o} type="button" className="choice tile" aria-pressed={a.opening === o} onClick={() => pickThenNext("opening", o)}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="stepbox" key="s3">
              {q("Got a menu? Drop it in.")}
              <p className="help">It&apos;s the heart of your plan. A rough draft or phone photos are fine.</p>
              <label
                className={`drop${over ? " over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
              >
                <span className="icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111110" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
                </span>
                <span>
                  <strong>{doneFiles.length ? "Add another file" : "Drop your menu here, or browse"}</strong>
                  <small>PDF or photos, up to 20 MB each</small>
                </span>
                <input className="sr-only" type="file" multiple accept=".pdf,image/*,.heic,.heif"
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
              </label>
              {files.length > 0 && (
                <ul className="files" aria-label="Your files">
                  {files.map((f) => (
                    <li className="file" key={f.id}>
                      <span className="name">{f.name}</span>
                      <span>
                        {f.status === "uploading" && <span className="state">{Math.round(f.progress * 100)}%</span>}
                        {f.status === "done" && <button type="button" className="link-btn small" onClick={() => removeFile(f.id)} aria-label={`Remove ${f.name}`}>Remove</button>}
                        {f.status === "error" && <span className="state bad">{f.error}</span>}
                      </span>
                      {f.status === "uploading" && <span className="bar"><span style={{ width: `${Math.round(f.progress * 100)}%` }} /></span>}
                    </li>
                  ))}
                </ul>
              )}
              {!doneFiles.length && (
                <button type="button" className="link-btn" onClick={() => { set("menuLater", true); setTimeout(() => go(4), 200); }}>
                  No menu yet? I&apos;ll WhatsApp it later
                </button>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="stepbox" key="s4">
              {q("What would make your first month a win?")}
              <p className="help">Pick the one that matters most.</p>
              <div className="tiles wide" role="group" aria-label="Goal">
                {choices.goals.map((g) => (
                  <button key={g} type="button" className="choice tile tall" aria-pressed={a.goal === g} onClick={() => pickThenNext("goal", g)}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="stepbox" key="s5">
              {q("Anything else we should know?")}
              <p className="help">Optional. What makes your place different, the story behind the food, anything at all.</p>
              <div>
                <label className="lbl" htmlFor="f-notes">A few words</label>
                <textarea id="f-notes" className="in" value={a.notes} maxLength={3000} onChange={(e) => set("notes", e.target.value)} />
              </div>
              <div style={{ maxWidth: 380 }}>
                <label className="lbl" htmlFor="f-instagram">Instagram <span className="opt">(if you have one)</span></label>
                <input {...field("instagram")} placeholder="@" autoCapitalize="none" />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="stepbox" key="s6">
              {q("Pick a time for your walkthrough.")}
              <p className="help">Your plan takes us three days to write, so these are your two days. About 30 minutes.</p>
              {slotsFailed && (
                <div className="banner">Couldn&apos;t load the times. <button type="button" className="link-btn" style={{ minHeight: 0 }} onClick={loadSlots}>Try again</button></div>
              )}
              {!days && !slotsFailed && <p className="help">Loading times...</p>}
              {noTimes && <div className="banner">Both days are fully booked. WhatsApp us on {site.whatsapp} and we&apos;ll fit you in.</div>}
              {days && (
                <>
                  <div className="tiles" role="group" aria-label="Pick a day">
                    {days.map((d) => (
                      <button key={d.date} type="button" className="choice day" aria-pressed={a.date === d.date}
                        onClick={() => setA((x) => ({ ...x, date: d.date, time: d.times.some((t) => t.time === x.time && !t.taken) ? x.time : "" }))}>
                        <span className="mono">IN {d.inDays} DAYS</span>
                        <span className="serif">{d.weekday}</span>
                        <b>{d.label}</b>
                      </button>
                    ))}
                  </div>
                  {day && (
                    <div className="choices" role="group" aria-label={`Times on ${day.weekday}`}>
                      {day.times.map((t) => (
                        <button key={t.time} type="button" className="choice" style={{ minWidth: 100 }} disabled={t.taken}
                          aria-pressed={a.time === t.time} onClick={() => set("time", t.time)}>
                          {t.time}<span className="sr-only">{t.taken ? ", taken" : ""}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="how-row" role="group" aria-label="How should we call?">
                    <span>Call me by</span>
                    {choices.how.map((h) => (
                      <button key={h} type="button" className="choice" aria-pressed={a.how === h} onClick={() => set("how", h)}>{h}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="stepbox" key="s7">
              {q("Last bit. Where should we send the invite?")}
              <p className="help">{callText ? `Your call: ${callText}, by ${a.how.toLowerCase()}.` : "Pick a call time first."}</p>
              <div className="fields">
                <div>
                  <label className="lbl" htmlFor="f-name">Your name</label>
                  <input {...field("name")} autoComplete="name" />
                  {err("name")}
                </div>
                <div>
                  <label className="lbl" htmlFor="f-email">Email</label>
                  <input {...field("email")} type="email" autoComplete="email" autoCapitalize="none" />
                  {err("email")}
                </div>
                <div>
                  <label className="lbl" htmlFor="f-whatsapp">WhatsApp number</label>
                  <input {...field("whatsapp")} type="tel" autoComplete="tel" />
                  {err("whatsapp")}
                </div>
              </div>
              <input ref={hp} className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <p className="small-print">We only use this to write your plan and talk to you about it. <Link href="/privacy">Privacy notice</Link>.</p>
            </div>
          )}

          {step < TOTAL && (
            <div className="wizard-nav">
              {step > 0 && <button type="button" className="back" onClick={() => go(step - 1)} disabled={sending}>Back</button>}
              <button type="button" className="go" onClick={next} disabled={nextOff}>
                {nextLabel} <span aria-hidden="true">→</span>
              </button>
            </div>
          )}

          {step === TOTAL && done && (
            <div className="stepbox" key="done">
              <span className="caps">All done</span>
              {q(a.name.trim() ? `You're booked in, ${a.name.trim().split(" ")[0]}.` : "You're booked in.")}
              <div className="booked">
                <span className="mono">YOUR WALKTHROUGH</span>
                <span className="serif">{done.callText}, by {done.how.toLowerCase()}</span>
              </div>
              <p className="help">A calendar invite is on its way to {a.email}. We&apos;ll write your plan over the next three days and walk you through it on the call. It&apos;s yours to keep.</p>
              <div className="wizard-nav" style={{ position: "static", border: 0, margin: 0, padding: 0, background: "none" }}>
                <a className="go" href={done.calendar} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
                <Link className="back" href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Back to the site</Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
