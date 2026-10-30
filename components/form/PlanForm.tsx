"use client";

// The eight-step plan form (D 884–1108, logic D 1873–1993; phone P4).
// mode "overlay": inside PlanOverlay's <dialog>; each step forward pushes a history entry, so the browser's back goes
//   back a step, and close returns to the page.
// mode "page": /plan, no dialog and no step history; close and "Back to the page" link to "/".
// One layout serves both: CSS turns it into the phone screen (P4) at 640px and below.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { choices, site, upload } from "@/lib/config";
import { addDays, daysBetween, londonToday, MONTHS, OPENING_MAX_DAYS, shortDay, type Ymd } from "@/lib/dates";
import { useCoarsePointer, useLondonToday, useMediaQuery, usePhone } from "@/lib/client/device";
import { useMotion } from "@/lib/client/motion";
import { useOpening, type Opening } from "@/lib/client/opening";
import { useOverlay } from "@/lib/client/overlay";
import { emailOk, parsePostcode, phoneOk } from "@/lib/validate";
import { IconAlert, IconCalendar, IconCheck, IconClose, IconPrev, IconShare } from "@/components/ui/icons";
import { IconCalendarPhone, IconFile, IconSharePhone, IconUpload } from "./icons";
import {
  clearDrafts,
  EMPTY,
  GOALS,
  MAX,
  nameFromUrl,
  readDraft,
  refFromUrl,
  writeDraft,
  type Answers,
  type Draft,
  type GoalId,
} from "./draft";
import { fetchSlots, submitPlan, uploadMenu, UploadError, type SlotDay } from "./send";
import { useKeyboardInset } from "./useKeyboard";

export type PlanFormProps = {
  mode: "overlay" | "page";
  // Overlay mode only: close the overlay
  onClose?: () => void;
  // Overlay mode only: the overlay grew from the pill, so the content fades in after it (D .cin)
  entering?: boolean;
};

type StepN = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Step = StepN | "done";
// Fields that show an error under them
type Field = "name" | "postcode" | "cname" | "email" | "phone";
// Answers checked as a group (server problems only: the client never lets these through)
type Group = "cuisines" | "opening" | "goal" | "slot";
type CardChip = { label: string; val: string };
type Card = { name: string; chips: CardChip[] };
type Done = { when: string; ics: string | null; card: Card };

const STEPS: StepN[] = [1, 2, 3, 4, 5, 6, 7, 8];

const MSG: Record<Field, string> = {
  name: "Add the name on your door.",
  postcode: "Check the postcode. It looks like AB1 2CD.",
  cname: "Add your name.",
  email: "Check the email address.",
  phone: "Check the number, starting 0 or +44.",
};
const FIELD_ID: Record<Field, string> = {
  name: "pf-name",
  postcode: "pf-postcode",
  cname: "pf-cname",
  email: "pf-email",
  phone: "pf-phone",
};
const STEP_FIELDS: Partial<Record<StepN, Field[]>> = { 1: ["name", "postcode"], 8: ["cname", "email", "phone"] };

// Server problem keys: which step and which field or group they belong to
const PROBLEM: Record<string, { step: StepN; field?: Field; group?: Group; focus: string }> = {
  restaurant: { step: 1, field: "name", focus: "pf-name" },
  postcode: { step: 1, field: "postcode", focus: "pf-postcode" },
  cuisines: { step: 2, group: "cuisines", focus: "pf-food-0" },
  opening: { step: 3, group: "opening", focus: "pf-date" },
  goal: { step: 5, group: "goal", focus: "pf-goal-0" },
  slot: { step: 7, group: "slot", focus: "pf-day-0" },
  name: { step: 8, field: "cname", focus: "pf-cname" },
  email: { step: 8, field: "email", focus: "pf-email" },
  whatsapp: { step: 8, field: "phone", focus: "pf-phone" },
};

const OPENING_LABEL = { open: choices.opening[0], this: choices.opening[1], next: choices.opening[2] } as const;
const ALREADY_OPEN = "Already open. Your plan covers your next 30 days.";
// /api/submit keeps a date up to OPENING_MAX_DAYS ahead, so the form says so at step 3 rather than after Send
const TOO_FAR = "Pick a date in the next two years.";
const TOO_BIG = "That file’s too big. A photo of the menu works.";
// The upload route's own message, shown as soon as such a file is picked rather than after Send
const BAD_TYPE = "That file type isn't supported. Use a PDF or photo.";
const FILE_EXT = /\.(pdf|jpe?g|png|webp|heic|heif)$/i;
const OFFLINE = `Couldn't send that. Check your connection and try again, or WhatsApp us on ${site.whatsapp}.`;
const FAILED = `Something went wrong. Try again, or WhatsApp us on ${site.whatsapp}.`;

// The overlay's form is unmounted when it closes. What a reload would lose anyway (the step, the menu file, the done
// screen) is kept here for as long as the page is open, so closing by mistake and reopening carries on where it was
// (as on the artboard, where the form's state outlives the dialog). The answers themselves live in the draft.
const session: { step: Step; file: File | null; uploaded: { file: File; path: string } | null; done: Done | null } = {
  step: 1,
  file: null,
  uploaded: null,
  done: null,
};

function openingView(o: Opening, today: Ymd | null): { chip: string; line: string; already: boolean; far?: boolean } {
  if (o.kind === "open") return { chip: "OPEN NOW", line: ALREADY_OPEN, already: true };
  if (!today) return { chip: "", line: "", already: false };
  const m = Number(today.split("-")[1]) - 1;
  if (o.kind === "this") return { chip: `IN ${MONTHS[m].toUpperCase()}`, line: "", already: false };
  if (o.kind === "next") return { chip: `IN ${MONTHS[(m + 1) % 12].toUpperCase()}`, line: "", already: false };
  if (o.kind === "date" && o.date) {
    const n = daysBetween(today, o.date);
    if (n <= 0) return { chip: "OPEN NOW", line: ALREADY_OPEN, already: true };
    if (n > OPENING_MAX_DAYS) return { chip: "", line: "", already: false, far: true };
    const [, mm, dd] = o.date.split("-").map(Number);
    return {
      chip: `${dd} ${MONTHS[mm - 1].toUpperCase()}`,
      line: `You open ${shortDay(o.date)}. That’s ${n} ${n === 1 ? "day" : "days"}.`,
      already: false,
    };
  }
  return { chip: "", line: "", already: false };
}

// Keep the chosen slot if it is still offered and free; otherwise start on the first day with a free time
function reconcileSlot(a: Answers, days: SlotDay[]): Answers {
  const day = days.find((d) => d.date === a.call.date);
  if (!day) {
    const first = days.find((d) => d.times.some((t) => !t.taken));
    return { ...a, call: { date: first?.date ?? "", time: "" } };
  }
  const free = day.times.some((t) => t.time === a.call.time && !t.taken);
  return free ? a : { ...a, call: { date: day.date, time: "" } };
}

function stripRef(d: Draft): Answers {
  const a: Partial<Draft> = { ...d };
  delete a.ref;
  return a as Answers;
}

// The answers to start from: the draft (if any), with ?n= filling an empty restaurant name, and the ref from the URL
// winning over the draft's
function initial(): { a: Answers; ref: string } {
  const d = readDraft();
  const a = d ? stripRef(d) : { ...EMPTY };
  const n = nameFromUrl(window.location.search);
  if (n && !a.name) a.name = n;
  return { a, ref: refFromUrl(window.location.search) || d?.ref || "" };
}

function Why({ children, only, id }: { children: ReactNode; only?: boolean; id?: string }) {
  return (
    <div className="pf-why">
      <p className="pf-why-k">WHY WE ASK</p>
      <p className="pf-why-t" id={id}>
        {children}
      </p>
      {only && <p className="pf-why-only">ONLY NES &amp; GABY SEE YOUR ANSWERS</p>}
    </div>
  );
}

function ErrLine({ id, text, group }: { id: string; text: string; group?: boolean }) {
  return (
    <p className={group ? "pf-alert" : "pf-err"} id={id}>
      <IconAlert size={16} />
      <span>{text}</span>
    </p>
  );
}

export default function PlanForm({ mode, onClose, entering = false }: PlanFormProps) {
  const overlay = mode === "overlay";
  const { pushStep, popStep, onBack } = useOverlay();
  const { opening, setOpeningDate, setOpeningKind, clearOpening } = useOpening();
  const [motionSwitch] = useMotion();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const motion = motionSwitch && !reduced;
  const coarse = useCoarsePointer();
  const phone = usePhone();
  // The overlay's form only ever renders in the browser, so it can read today straight away; /plan waits for mount
  const mountedToday = useLondonToday();
  const today = mountedToday ?? (overlay ? londonToday() : null);

  // Overlay mode starts from the draft and the session at once (it never renders on the server); page mode reads
  // them after mount so the server HTML and the first client render match
  const [boot] = useState(() => (overlay ? initial() : null));
  const [restored, setRestored] = useState(overlay);
  const [step, setStep] = useState<Step>(() => (overlay ? session.step : 1));
  const [a, setA] = useState<Answers>(() => boot?.a ?? EMPTY);
  const ref = useRef(boot?.ref ?? "");
  const [menuName, setMenuName] = useState(() => (overlay && session.file ? session.file.name : ""));
  const file = useRef<File | null>(overlay ? session.file : null);
  const uploaded = useRef<{ file: File; path: string } | null>(overlay ? session.uploaded : null);
  const [done, setDone] = useState<Done | null>(() => (overlay ? session.done : null));

  const [shown, setShown] = useState<Partial<Record<Field, boolean>>>({});
  const [server, setServer] = useState<Partial<Record<Field | Group, string>>>({});
  const [fileErr, setFileErr] = useState("");
  const [alert, setAlert] = useState<{ step: StepN; text: string } | null>(null);
  const [days, setDays] = useState<SlotDay[] | null>(null);
  const [slotsFailed, setSlotsFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [icsUrl, setIcsUrl] = useState<string | null>(null);
  const [focusReq, setFocusReq] = useState<{ id: string | null; seq: number; top: boolean } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hpRef = useRef<HTMLInputElement>(null);
  const postcodeRef = useRef<HTMLInputElement>(null);
  const stepRef = useRef(step);
  stepRef.current = step;
  const sendingRef = useRef(false);
  const advTimer = useRef<number | undefined>(undefined);
  const copyTimer = useRef<number | undefined>(undefined);
  const finished = useRef(!!done);
  const pending = useRef<Draft | null>(null);
  const alive = useRef(true);

  const kb = useKeyboardInset(phone && step !== "done");
  const pc = parsePostcode(a.postcode);
  const ov = openingView(opening, today);

  // ---------- navigation ----------

  const go = useCallback(
    (n: Step, focusId: string | null = null) => {
      window.clearTimeout(advTimer.current);
      setStep(n);
      setFileErr("");
      setAlert(null);
      setFocusReq((r) => ({ id: focusId, seq: (r?.seq ?? 0) + 1, top: true }));
      if (overlay) session.step = n;
    },
    [overlay],
  );

  // Forward one step: a history entry in the overlay, so the browser's back comes back here
  const forward = useCallback(
    (from: StepN) => {
      if (overlay) pushStep();
      go(from === 8 ? "done" : ((from + 1) as StepN));
    },
    [overlay, pushStep, go],
  );

  const back = () => {
    if (sendingRef.current || typeof step !== "number" || step < 2) return;
    if (overlay) popStep();
    go((step - 1) as StepN);
  };

  // The browser's back button: one step back, or (on step 1 and on the done screen) let the overlay close
  useEffect(() => {
    if (!overlay) return;
    return onBack(() => {
      // While the request is in flight the step stays put (as the on-screen Back does): put the entry back
      if (sendingRef.current) {
        pushStep();
        return true;
      }
      const s = stepRef.current;
      if (typeof s === "number" && s > 1) {
        go((s - 1) as StepN);
        return true;
      }
      return false;
    });
  }, [overlay, onBack, go, pushStep]);

  // Reopened on a later step: put back one history entry per step, so back still walks the steps
  const repushed = useRef(false);
  useEffect(() => {
    if (!overlay || repushed.current) return;
    repushed.current = true;
    const s = stepRef.current;
    if (typeof s === "number") for (let i = 1; i < s; i++) pushStep();
  }, [overlay, pushStep]);

  // Focus follows the step: the new step's heading, or the field the server asked about
  useEffect(() => {
    if (!focusReq) return;
    if (focusReq.top) {
      const dlg = rootRef.current?.closest("dialog");
      if (dlg) dlg.scrollTop = 0;
      else window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
    const el = focusReq.id ? document.getElementById(focusReq.id) : headingRef.current;
    el?.focus({ preventScroll: focusReq.top && !focusReq.id });
  }, [focusReq]);

  // ---------- the draft ----------

  // /plan: restore after mount
  useEffect(() => {
    if (overlay) return;
    const init = initial();
    setA(init.a);
    ref.current = init.ref;
    setRestored(true);
  }, [overlay]);

  // Saved 300ms after the last change, and once more on the way out
  useEffect(() => {
    if (!restored || finished.current) return;
    const d = { ...a, ref: ref.current };
    pending.current = d;
    const id = window.setTimeout(() => {
      // A send that finished within these 300ms has already cleared the draft: don't write it back
      if (!finished.current) writeDraft(d);
      pending.current = null;
    }, 300);
    return () => window.clearTimeout(id);
  }, [a, restored]);

  useEffect(() => {
    alive.current = true;
    // A reload or a closed tab within those 300ms would otherwise lose the last answer typed
    const flush = () => {
      if (pending.current && !finished.current) writeDraft(pending.current);
      pending.current = null;
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      alive.current = false;
      window.clearTimeout(advTimer.current);
      window.clearTimeout(copyTimer.current);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
      flush();
    };
  }, []);

  // ---------- call times ----------

  const loadSlots = useCallback(async () => {
    setSlotsFailed(false);
    try {
      const list = await fetchSlots();
      if (!alive.current) return;
      setDays(list);
      setA((x) => reconcileSlot(x, list));
    } catch {
      if (alive.current) setSlotsFailed(true);
    }
  }, []);

  // When the form opens, and again on reaching step 7
  useEffect(() => {
    loadSlots();
  }, [loadSlots]);
  const prevStep = useRef(step);
  useEffect(() => {
    if (step === 7 && prevStep.current !== 7) loadSlots();
    prevStep.current = step;
  }, [step, loadSlots]);

  // ---------- the done screen's calendar file ----------

  useEffect(() => {
    if (!done?.ics) {
      setIcsUrl(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([done.ics], { type: "text/calendar" }));
    setIcsUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [done]);

  // ---------- answers ----------

  const patch = (p: Partial<Answers>) => setA((x) => ({ ...x, ...p }));
  const clearServer = (k: Field | Group) => setServer((s) => (s[k] ? { ...s, [k]: undefined } : s));
  const hide = (k: Field) => {
    setShown((s) => (s[k] ? { ...s, [k]: false } : s));
    clearServer(k);
  };

  const fieldOk: Record<Field, boolean> = {
    name: a.name.trim().length >= 2,
    postcode: pc.valid,
    cname: a.contact.name.trim().length > 0,
    email: emailOk(a.contact.email),
    phone: phoneOk(a.contact.phone),
  };
  const errOf = (k: Field) => server[k] || (shown[k] && !fieldOk[k] ? MSG[k] : "");

  const day = days?.find((d) => d.date === a.call.date) ?? null;
  const slotFree = !!day?.times.some((t) => t.time === a.call.time && !t.taken);
  const allBooked = !!days && days.length > 0 && days.every((d) => d.times.every((t) => t.taken));

  const valid = (n: StepN): boolean => {
    switch (n) {
      case 1:
        return fieldOk.name && fieldOk.postcode;
      case 2:
        return a.foods.length > 0;
      case 3:
        return opening.kind !== "" && !ov.far;
      case 4:
        return !!menuName || a.menuLater;
      case 5:
        return !!a.goal;
      case 6:
        return true;
      case 7:
        return slotFree;
      case 8:
        return fieldOk.cname && fieldOk.email && fieldOk.phone;
    }
  };

  // Continue pressed on an unfinished step: every error on it shows, and focus goes to the first one
  const tried = (n: StepN, focus: boolean) => {
    const fields = STEP_FIELDS[n];
    if (!fields) return;
    setShown((s) => {
      const next = { ...s };
      fields.forEach((f) => (next[f] = true));
      return next;
    });
    if (focus) {
      const bad = fields.find((f) => !fieldOk[f]);
      if (bad) document.getElementById(FIELD_ID[bad])?.focus();
    }
  };

  const onBlurField = (k: Field) => (e: { target: HTMLInputElement }) => {
    const has = e.target.value.length > 0;
    // The contact name says so when it is left empty; the others once something has been typed
    if (k === "cname" ? !has : has) setShown((s) => ({ ...s, [k]: true }));
  };

  const setContact = (p: Partial<Answers["contact"]>) => setA((x) => ({ ...x, contact: { ...x.contact, ...p } }));

  const toggleFood = (f: string) => {
    clearServer("cuisines");
    setA((x) => ({ ...x, foods: x.foods.includes(f) ? x.foods.filter((y) => y !== f) : [...x.foods, f] }));
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > upload.maxBytes) return setFileErr(TOO_BIG);
    if (!(upload.types.includes(f.type) || FILE_EXT.test(f.name))) return setFileErr(BAD_TYPE);
    file.current = f;
    uploaded.current = null;
    if (overlay) {
      session.file = f;
      session.uploaded = null;
    }
    setMenuName(f.name);
    patch({ menuLater: false });
    setFileErr("");
  };

  const skipMenu = () => {
    file.current = null;
    uploaded.current = null;
    if (overlay) {
      session.file = null;
      session.uploaded = null;
    }
    setMenuName("");
    patch({ menuLater: true });
    forward(4);
  };

  // Single-choice step: moves on by itself, after 300ms with motion, at once without (D 1942–1947)
  const pickGoal = (id: GoalId) => {
    clearServer("goal");
    patch({ goal: id });
    window.clearTimeout(advTimer.current);
    advTimer.current = window.setTimeout(
      () => {
        if (stepRef.current === 5) forward(5);
      },
      motion ? 300 : 0,
    );
  };

  const pickDay = (d: SlotDay) => {
    clearServer("slot");
    setA((x) => ({
      ...x,
      call: { date: d.date, time: d.times.some((t) => t.time === x.call.time && !t.taken) ? x.call.time : "" },
    }));
  };
  const pickTime = (t: string) => {
    clearServer("slot");
    setAlert((al) => (al?.step === 7 ? null : al));
    setA((x) => ({ ...x, call: { ...x.call, time: t } }));
  };

  // ---------- sending ----------

  const card = (): Card => ({
    name: a.name.trim(),
    chips: [
      { label: "POSTCODE", val: pc.valid ? pc.out : "" },
      { label: "FOOD", val: a.foods.length ? `${a.foods.length} PICKED` : "" },
      { label: "OPENING", val: ov.chip },
      { label: "MENU", val: menuName ? "ADDED" : a.menuLater ? "LATER" : "" },
      { label: "GOAL", val: GOALS.find((g) => g.id === a.goal)?.chip ?? "" },
    ],
  });

  const openingPayload = (): { opening: string; openingDate: string } => {
    if (opening.kind === "open" || opening.kind === "this" || opening.kind === "next") {
      return { opening: OPENING_LABEL[opening.kind], openingDate: "" };
    }
    if (opening.kind === "date") return { opening: ov.already ? OPENING_LABEL.open : "", openingDate: opening.date };
    return { opening: "", openingDate: "" };
  };

  async function send() {
    const firstBad = STEPS.find((n) => !valid(n));
    if (firstBad) {
      if (firstBad !== step) go(firstBad);
      tried(firstBad, firstBad === step);
      return;
    }
    sendingRef.current = true;
    setSending(true);
    setAlert(null);
    const snapshot = card();
    const call = a.call;

    // The menu goes up only now (once per file, so a retry after a 409 or a 400 doesn't upload it again)
    const files: string[] = [];
    const f = file.current;
    if (f) {
      if (uploaded.current?.file === f) files.push(uploaded.current.path);
      else {
        try {
          const path = await uploadMenu(f);
          uploaded.current = { file: f, path };
          if (overlay) session.uploaded = uploaded.current;
          files.push(path);
        } catch (e) {
          sendingRef.current = false;
          if (!alive.current) return;
          setSending(false);
          go(4);
          setFileErr(e instanceof UploadError ? e.message : "Upload failed, try again");
          return;
        }
      }
    }

    const res = await submitPlan({
      restaurant: a.name.trim(),
      postcode: a.postcode.trim(),
      cuisines: a.foods,
      cuisineOther: a.foods.includes("Something else") ? a.other.trim() : "",
      ...openingPayload(),
      files,
      menuLater: !files.length && a.menuLater,
      goal: GOALS.find((g) => g.id === a.goal)?.label ?? "",
      notes: a.notes.trim(),
      whatsappFirst: a.contact.whatsapp,
      instagram: a.instagram,
      date: call.date,
      time: call.time,
      name: a.contact.name.trim(),
      email: a.contact.email.trim(),
      whatsapp: a.contact.phone.trim(),
      ref: ref.current,
      website: hpRef.current?.value ?? "",
    });
    sendingRef.current = false;

    if (res.kind === "ok") {
      const d: Done = { when: `${shortDay(call.date)}, ${call.time}`, ics: res.ics, card: snapshot };
      finished.current = true;
      pending.current = null;
      clearDrafts();
      clearOpening();
      if (overlay) {
        session.done = d;
        session.step = "done";
      }
      if (!alive.current) return;
      setSending(false);
      setDone(d);
      // No history entry for the done screen: the browser's back closes the overlay from here
      go("done");
      return;
    }
    if (!alive.current) return;
    setSending(false);

    if (res.kind === "taken") {
      // Back on step 7 the times load again, with that one now taken
      setA((x) => ({ ...x, call: { ...x.call, time: "" } }));
      if (overlay && stepRef.current === 8) popStep();
      go(7);
      setAlert({ step: 7, text: res.error });
      return;
    }
    if (res.kind === "problems") {
      const known = Object.keys(res.problems).filter((k) => PROBLEM[k]);
      const next: Partial<Record<Field | Group, string>> = {};
      known.forEach((k) => {
        const p = PROBLEM[k];
        const key = p.field ?? p.group;
        if (key) next[key] = res.problems[k];
      });
      setServer(next);
      if (!known.length) {
        setAlert({ step: 8, text: FAILED });
        return;
      }
      const first = known.map((k) => PROBLEM[k]).sort((x, y) => x.step - y.step || order(x.focus) - order(y.focus))[0];
      if (first.step === step) setFocusReq((r) => ({ id: first.focus, seq: (r?.seq ?? 0) + 1, top: false }));
      else go(first.step, first.focus);
      return;
    }
    if (res.kind === "error") {
      // A file the server can't find any more is uploaded again on the next try
      if (res.status === 400 && files.length) {
        uploaded.current = null;
        if (overlay) session.uploaded = null;
      }
      setAlert({ step: 8, text: res.error || FAILED });
      return;
    }
    setAlert({ step: 8, text: OFFLINE });
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (sendingRef.current || typeof step !== "number") return;
    if (!valid(step)) return tried(step, true);
    if (step === 8) void send();
    else forward(step);
  };

  // Enter in the restaurant name moves on to the postcode (P4)
  const nameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      postcodeRef.current?.focus();
    }
  };

  const share = () => {
    const url = `${window.location.origin}/`;
    const flash = () => {
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    };
    const copy = () => {
      try {
        navigator.clipboard?.writeText(url).then(flash, () => {});
      } catch {}
    };
    if (typeof navigator.share === "function") {
      navigator.share({ title: "agnc. · free launch plan", url }).catch((err: unknown) => {
        // The visitor closed the share sheet: nothing to do. Anything else: copy the link instead.
        if (!(err instanceof DOMException && err.name === "AbortError")) copy();
      });
      return;
    }
    copy();
  };

  // ---------- render ----------

  const H = mode === "page" ? "h1" : "h2";
  const isDone = step === "done";
  const n = isDone ? 9 : step;
  const blocked = !isDone && (sending || !valid(step as StepN));
  const shownCard = done?.card ?? card();

  const field = (k: Field) => {
    const err = errOf(k);
    return {
      id: FIELD_ID[k],
      className: "fld",
      "aria-invalid": err ? (true as const) : undefined,
      "aria-describedby": err ? `${FIELD_ID[k]}-err` : undefined,
      onBlur: onBlurField(k),
    };
  };
  const errFor = (k: Field) => {
    const err = errOf(k);
    return err ? <ErrLine id={`${FIELD_ID[k]}-err`} text={err} /> : null;
  };
  const ruled = (k: Field) => `pf-field pf-field--rule${errOf(k) ? " is-bad" : ""}`;
  const stepAlert = alert && alert.step === step ? (
    <p className="pf-alert pf-banner" role="alert">
      <IconAlert size={16} />
      <span>{alert.text}</span>
    </p>
  ) : null;
  const heading = (text: string) => (
    <H className="pf-h" ref={headingRef} tabIndex={-1}>
      {text}
    </H>
  );

  const close =
    mode === "overlay" ? (
      <button type="button" className="icob pf-close" aria-label="Close the plan form" onClick={onClose}>
        <IconClose size={20} />
      </button>
    ) : (
      <a className="icob pf-close" href="/" aria-label="Close the plan form">
        <IconClose size={20} />
      </a>
    );

  return (
    <div className="pf" ref={rootRef}>
      {close}
      <div className={`pf-in${entering ? " pf-cin" : ""}`}>
        <div className="wrap pf-wrap">
          <div className="pf-grid">
            <div className="pf-col">
              <div className="pf-segs" aria-hidden="true">
                {STEPS.map((i) => (
                  <span key={i} className={`pf-seg${i < n ? " is-done" : i === n ? " is-cur" : ""}`}>
                    <span />
                  </span>
                ))}
              </div>
              <div className="pf-bar">
                {!isDone && typeof step === "number" && step > 1 && (
                  <button type="button" className="pf-back" aria-label={`Back to step ${step - 1}`} onClick={back}>
                    <IconPrev size={18} />
                    <span className="pf-back-txt">Back</span>
                  </button>
                )}
                <p className="pf-steplabel">{isDone ? "REQUEST SENT" : `STEP ${step} / 8`}</p>
              </div>

              {!isDone && (
                <form className="pf-form" noValidate onSubmit={onSubmit}>
                  <div className="pf-region" key={String(step)}>
                    {step === 1 && (
                      <div className="pf-step">
                        <div className="pf-head">
                          {heading("What’s the name on the door?")}
                          <p className="pf-sub">We’ll write the plan around it.</p>
                        </div>
                        {stepAlert}
                        <div className="pf-fields">
                          <div className={ruled("name")}>
                            <label className="pf-label" htmlFor="pf-name">
                              Restaurant name
                            </label>
                            <input
                              {...field("name")}
                              type="text"
                              autoComplete="organization"
                              autoCapitalize="words"
                              enterKeyHint="next"
                              maxLength={MAX.name}
                              value={a.name}
                              onChange={(e) => {
                                patch({ name: e.target.value });
                                hide("name");
                              }}
                              onKeyDown={nameKey}
                            />
                            {errFor("name")}
                          </div>
                          <div className={ruled("postcode")}>
                            <label className="pf-label" htmlFor="pf-postcode">
                              Postcode
                            </label>
                            <input
                              {...field("postcode")}
                              className="fld pf-upper"
                              ref={postcodeRef}
                              type="text"
                              autoComplete="postal-code"
                              autoCapitalize="characters"
                              inputMode="text"
                              enterKeyHint="done"
                              spellCheck={false}
                              maxLength={MAX.postcode}
                              value={a.postcode}
                              onChange={(e) => {
                                patch({ postcode: e.target.value.toUpperCase() });
                                hide("postcode");
                              }}
                            />
                            {errFor("postcode")}
                            {pc.valid && (
                              <p className="pf-echo">
                                <IconCheck size={14} />
                                <span>{pc.area ? `${pc.out} · ${pc.area}` : pc.out}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <Why only>Your name goes on your plan. Your postcode tells us who’s nearby to reach.</Why>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="pf-step">
                        <div className="pf-head">
                          {heading("What do you serve?")}
                          <p className="pf-sub">Pick as many as fit.</p>
                        </div>
                        {stepAlert}
                        <div
                          className="pf-chips pf-foods"
                          role="group"
                          aria-label="What you serve"
                          aria-describedby={server.cuisines ? "pf-foods-err" : undefined}
                        >
                          {choices.cuisines.map((c, i) => (
                            <button
                              key={c}
                              id={`pf-food-${i}`}
                              type="button"
                              className="chipb"
                              aria-pressed={a.foods.includes(c)}
                              onClick={() => toggleFood(c)}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        {server.cuisines && <ErrLine group id="pf-foods-err" text={server.cuisines} />}
                        {a.foods.includes("Something else") && (
                          <div className="pf-field pf-other">
                            <label className="pf-label" htmlFor="pf-other">
                              What else do you serve?
                            </label>
                            <input
                              id="pf-other"
                              className="fld"
                              type="text"
                              autoCapitalize="sentences"
                              enterKeyHint="done"
                              maxLength={MAX.other}
                              value={a.other}
                              onChange={(e) => patch({ other: e.target.value })}
                            />
                          </div>
                        )}
                        <Why>Your post ideas are built from what you actually serve.</Why>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="pf-step">
                        <div className="pf-head">{heading("When do you open?")}</div>
                        {stepAlert}
                        <div className="pf-chips" role="group" aria-label="When you open">
                          {(["open", "this", "next"] as const).map((k) => (
                            <button
                              key={k}
                              type="button"
                              className="chipb"
                              aria-pressed={opening.kind === k}
                              onClick={() => {
                                clearServer("opening");
                                setOpeningKind(k);
                              }}
                            >
                              {OPENING_LABEL[k]}
                            </button>
                          ))}
                        </div>
                        <div className={`pf-field pf-date pf-field--rule${server.opening || ov.far ? " is-bad" : ""}`}>
                          <label className="pf-label" htmlFor="pf-date">
                            Pick the date
                          </label>
                          <input
                            id="pf-date"
                            className="fld"
                            type="date"
                            min={today ?? undefined}
                            max={today ? addDays(today, OPENING_MAX_DAYS) : undefined}
                            value={opening.kind === "date" ? opening.date : ""}
                            aria-invalid={server.opening || ov.far ? true : undefined}
                            aria-describedby={server.opening || ov.far ? "pf-date-err" : undefined}
                            onChange={(e) => {
                              clearServer("opening");
                              setOpeningDate(e.target.value);
                            }}
                          />
                          {(server.opening || ov.far) && <ErrLine id="pf-date-err" text={ov.far ? TOO_FAR : server.opening!} />}
                          <div aria-live="polite">{ov.line && <p className="pf-openline">{ov.line}</p>}</div>
                        </div>
                        <Why>Your posting calendar counts down to your doors.</Why>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="pf-step">
                        <div className="pf-head">
                          {heading("Got a menu we can see?")}
                          <p className="pf-sub">A photo or a PDF is fine. A draft is fine too.</p>
                        </div>
                        {stepAlert}
                        <div className="pf-menu">
                          <input
                            id="pf-menu"
                            className="pf-fileinp"
                            type="file"
                            accept="application/pdf,image/*,.heic,.heif"
                            aria-describedby={fileErr ? "pf-menu-err pf-why4" : "pf-why4"}
                            onChange={onFile}
                          />
                          {!menuName ? (
                            <>
                              <label htmlFor="pf-menu" className="sec pf-add">
                                <IconShare size={18} className="pf-ico-dt" />
                                <IconUpload size={20} className="pf-ico-ph" />
                                <span>Add your menu</span>
                              </label>
                              <button type="button" className="ulink pf-skip" onClick={skipMenu}>
                                Skip for now
                              </button>
                            </>
                          ) : (
                            <p className="pf-file">
                              <IconCheck size={18} className="pf-ico-dt pf-file-ok" />
                              <IconFile size={20} className="pf-ico-ph pf-file-doc" />
                              <span className="pf-file-name">{menuName}</span>
                              <label htmlFor="pf-menu" className="pf-change">
                                Change
                              </label>
                            </p>
                          )}
                        </div>
                        {fileErr && (
                          <p className="pf-alert" id="pf-menu-err" role="alert">
                            <IconAlert size={16} />
                            <span>{fileErr}</span>
                          </p>
                        )}
                        <Why id="pf-why4">
                          Your post ideas start from your dishes. Your menu stays on this {coarse ? "phone" : "computer"} until
                          you send.
                        </Why>
                      </div>
                    )}

                    {step === 5 && (
                      <div className="pf-step">
                        <div className="pf-head">{heading("What matters most in month one?")}</div>
                        {stepAlert}
                        <div
                          className="pf-goals"
                          role="group"
                          aria-label="Your goal for month one"
                          aria-describedby={server.goal ? "pf-goal-err" : undefined}
                        >
                          {GOALS.map((g, i) => {
                            const on = a.goal === g.id;
                            return (
                              <button
                                key={g.id}
                                id={`pf-goal-${i}`}
                                type="button"
                                className="rowb pf-goal"
                                aria-pressed={on}
                                onClick={() => pickGoal(g.id)}
                              >
                                <span>{g.label}</span>
                                <span className="pf-goal-ind" aria-hidden="true">
                                  {on && <IconCheck size={20} />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {server.goal && <ErrLine group id="pf-goal-err" text={server.goal} />}
                        <Why>It decides which posts lead your calendar.</Why>
                      </div>
                    )}

                    {step === 6 && (
                      <div className="pf-step">
                        <div className="pf-head">{heading("Anything else we should know?")}</div>
                        {stepAlert}
                        <div className="pf-fields pf-fields--loose">
                          <div className="pf-field">
                            <label className="pf-label" htmlFor="pf-notes">
                              Anything else
                            </label>
                            <textarea
                              id="pf-notes"
                              className="fld pf-notes"
                              rows={4}
                              autoCapitalize="sentences"
                              maxLength={MAX.notes}
                              value={a.notes}
                              onChange={(e) => patch({ notes: e.target.value })}
                            />
                          </div>
                          <div className="pf-field">
                            <label className="pf-label" htmlFor="pf-insta">
                              Your Instagram (if you have one)
                            </label>
                            <div className="pf-insta">
                              <span className="pf-at" aria-hidden="true">
                                @
                              </span>
                              <input
                                id="pf-insta"
                                className="fld"
                                type="text"
                                autoCapitalize="none"
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck={false}
                                enterKeyHint="done"
                                maxLength={MAX.instagram + 1}
                                value={a.instagram}
                                onChange={(e) =>
                                  patch({
                                    instagram: e.target.value.replace(/^@+/, "").replace(/\s/g, "").slice(0, MAX.instagram),
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <Why>We’ll look at what’s already there before we plan.</Why>
                      </div>
                    )}

                    {step === 7 && (
                      <div className="pf-step">
                        <div className="pf-head">
                          {heading("Pick a time for your handover call.")}
                          <p className="pf-sub">We’ll walk you through your plan on the call.</p>
                        </div>
                        {stepAlert}
                        {!days && !slotsFailed && <p className="pf-slotmsg">Loading times...</p>}
                        {!days && slotsFailed && (
                          <p className="pf-slotmsg">
                            Couldn&apos;t load the times.{" "}
                            <button type="button" className="ulink pf-retry" onClick={loadSlots}>
                              Try again
                            </button>
                          </p>
                        )}
                        {days && (
                          <>
                            <fieldset className="pf-fs">
                              <legend className="pf-legend">Day</legend>
                              <div className="pf-slots pf-slots--days">
                                {days.map((d, i) => (
                                  <button
                                    key={d.date}
                                    id={`pf-day-${i}`}
                                    type="button"
                                    className="chipb pf-day"
                                    aria-pressed={a.call.date === d.date}
                                    onClick={() => pickDay(d)}
                                  >
                                    {shortDay(d.date)}
                                  </button>
                                ))}
                              </div>
                            </fieldset>
                            {day && (
                              <fieldset className="pf-fs" aria-describedby={server.slot ? "pf-slot-err" : undefined}>
                                <legend className="pf-legend">Time</legend>
                                <div className="pf-slots pf-slots--times">
                                  {day.times.map((t) => (
                                    <button
                                      key={t.time}
                                      type="button"
                                      className="chipb pf-time"
                                      disabled={t.taken}
                                      aria-pressed={a.call.time === t.time}
                                      onClick={() => pickTime(t.time)}
                                    >
                                      {t.time}
                                      {t.taken && <span className="sr-only">, taken</span>}
                                    </button>
                                  ))}
                                </div>
                              </fieldset>
                            )}
                            {server.slot && <ErrLine group id="pf-slot-err" text={server.slot} />}
                            {allBooked && (
                              <p className="pf-slotmsg">
                                Both days are fully booked. WhatsApp us on {site.whatsapp} and we&apos;ll fit you in.
                              </p>
                            )}
                          </>
                        )}
                        <Why>Your plan is written in 3 days and handed over on day 3 or 4.</Why>
                      </div>
                    )}

                    {step === 8 && (
                      <div className="pf-step">
                        <div className="pf-head">{heading("Where should we send it?")}</div>
                        {stepAlert}
                        <div className="pf-fields">
                          <div className={ruled("cname")}>
                            <label className="pf-label" htmlFor="pf-cname">
                              Your name
                            </label>
                            <input
                              {...field("cname")}
                              type="text"
                              autoComplete="name"
                              autoCapitalize="words"
                              enterKeyHint="next"
                              maxLength={MAX.cname}
                              value={a.contact.name}
                              onChange={(e) => {
                                setContact({ name: e.target.value });
                                hide("cname");
                              }}
                            />
                            {errFor("cname")}
                          </div>
                          <div className={ruled("email")}>
                            <label className="pf-label" htmlFor="pf-email">
                              Email
                            </label>
                            <input
                              {...field("email")}
                              type="email"
                              autoComplete="email"
                              autoCapitalize="none"
                              inputMode="email"
                              enterKeyHint="next"
                              spellCheck={false}
                              maxLength={MAX.email}
                              value={a.contact.email}
                              onChange={(e) => {
                                setContact({ email: e.target.value });
                                hide("email");
                              }}
                            />
                            {errFor("email")}
                          </div>
                          <div className={ruled("phone")}>
                            <label className="pf-label" htmlFor="pf-phone">
                              Phone
                            </label>
                            <input
                              {...field("phone")}
                              type="tel"
                              autoComplete="tel"
                              inputMode="tel"
                              enterKeyHint="done"
                              maxLength={MAX.phone}
                              value={a.contact.phone}
                              onChange={(e) => {
                                setContact({ phone: e.target.value });
                                hide("phone");
                              }}
                            />
                            {errFor("phone")}
                          </div>
                          <label className="pf-switch" htmlFor="pf-wa">
                            <input
                              id="pf-wa"
                              type="checkbox"
                              role="switch"
                              checked={a.contact.whatsapp}
                              onChange={(e) => setContact({ whatsapp: e.target.checked })}
                            />
                            <span>WhatsApp me before the call</span>
                          </label>
                        </div>
                        <input
                          ref={hpRef}
                          className="hp"
                          type="text"
                          name="website"
                          tabIndex={-1}
                          autoComplete="off"
                          aria-hidden="true"
                          defaultValue=""
                        />
                        <div className="pf-why">
                          <p className="pf-why-k">WHY WE ASK</p>
                          <p className="pf-why-t">So Nes &amp; Gaby can confirm your call. Nothing else.</p>
                          <p className="pf-why-only">ONLY NES &amp; GABY SEE YOUR ANSWERS</p>
                          <p className="pf-why-t pf-why-link">
                            <a href="/privacy">Privacy notice</a>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`pf-foot${kb ? " is-kb" : ""}`} style={kb ? ({ "--pf-kb": `${kb}px` } as CSSProperties) : undefined}>
                    <button type="submit" className="pill pf-go" aria-disabled={blocked ? true : undefined}>
                      {sending ? "Sending…" : step === 8 ? "Send my plan request" : "Continue"}
                    </button>
                    <p className="pf-reassure">ABOUT 5 MIN · NO CARD, NO CONTRACT</p>
                  </div>
                </form>
              )}

              {isDone && done && (
                <div className="pf-done" aria-live="polite">
                  <H className="pf-h pf-done-h" ref={headingRef} tabIndex={-1}>
                    Booked. {done.when}.
                  </H>
                  <p className="pf-done-p">
                    Your plan arrives on this call, and it’s yours to keep. If you want us to run it, every month we plan,
                    film and photograph, edit, post and report.
                  </p>
                  <div className="pf-done-acts">
                    {done.ics && (
                      <a href={icsUrl ?? undefined} download="agnc-handover.ics" className="sec pf-done-btn">
                        <IconCalendar size={18} className="pf-ico-dt" />
                        <IconCalendarPhone size={20} className="pf-ico-ph" />
                        <span>Add to calendar</span>
                      </a>
                    )}
                    <button type="button" className="sec pf-done-btn" onClick={share}>
                      <IconShare size={18} className="pf-ico-dt" />
                      <IconSharePhone size={20} className="pf-ico-ph" />
                      <span>{copied ? "Link copied" : "Share"}</span>
                    </button>
                  </div>
                  <p className="pf-done-note">Send this to whoever you’re opening with</p>
                  {mode === "overlay" ? (
                    <button type="button" className="ulink pf-done-back" onClick={onClose}>
                      Back to the page
                    </button>
                  ) : (
                    <a className="ulink pf-done-back" href="/">
                      Back to the page
                    </a>
                  )}
                </div>
              )}
            </div>

            <aside className="pf-aside" aria-label="Your plan so far">
              {/* Not a live region (D 1087 and P4 54 had aria-live): it would read the name back on every keystroke */}
              <div className={`paper pf-card${isDone ? " is-done" : ""}`}>
                <p className="pf-card-k">YOUR 30-DAY LAUNCH PLAN · {isDone ? "REQUESTED" : "DRAFT"}</p>
                <p className={`pf-card-name${shownCard.name ? "" : " is-empty"}`}>{shownCard.name || "Your restaurant"}</p>
                <div className="pf-card-chips">
                  {shownCard.chips.map((c) => (
                    <span key={c.label} className={`pf-chip${c.val ? " is-on" : ""}`}>
                      {c.val || c.label}
                    </span>
                  ))}
                </div>
                {isDone && done && (
                  <div className="pf-card-done">
                    <p>Handover call · {done.when}</p>
                    <p>Day-by-day posting calendar · post ideas</p>
                    <p>Opening-week shot list · local launch moves</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

// Within one step, server problems focus the field that comes first on screen
function order(id: string) {
  return ["pf-name", "pf-postcode", "pf-cname", "pf-email", "pf-phone"].indexOf(id);
}
