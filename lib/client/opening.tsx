"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isYmd, type Ymd } from "@/lib/dates";

// When the restaurant opens, shared by the 30-day calendar (d4) and the form's step 3, so an answer given in one
// shows in the other (artboard logic: both read state.a.opening). Either one of the three chips, or a date.
// Kept in this browser only, read after hydration, and cleared once a plan request is sent.
export const OPENING_KEY = "agnc-plan-opening";

// "open" = We’re already open, "this" = This month, "next" = Next month, "date" = a picked date, "" = no answer
export type OpeningKind = "" | "open" | "this" | "next" | "date";
export type Opening = { kind: OpeningKind; date: Ymd | "" };

const EMPTY: Opening = { kind: "", date: "" };
const KINDS: OpeningKind[] = ["", "open", "this", "next", "date"];

function parse(raw: string | null): Opening {
  try {
    const v = raw ? (JSON.parse(raw) as Partial<Opening>) : null;
    if (!v || !KINDS.includes(v.kind as OpeningKind)) return EMPTY;
    if (v.kind === "date") return isYmd(v.date) ? { kind: "date", date: v.date } : EMPTY;
    return { kind: v.kind as OpeningKind, date: "" };
  } catch {
    return EMPTY;
  }
}

type Ctx = {
  opening: Opening;
  // A date from either date input; null or "" clears it
  setOpeningDate: (d: Ymd | null | "") => void;
  // One of the form's three chips
  setOpeningKind: (k: Exclude<OpeningKind, "date">) => void;
  clearOpening: () => void;
};

const OpeningContext = createContext<Ctx | null>(null);

export function OpeningProvider({ children }: { children: ReactNode }) {
  const [opening, setState] = useState<Opening>(EMPTY);

  useEffect(() => {
    try {
      setState(parse(localStorage.getItem(OPENING_KEY)));
    } catch {}
  }, []);

  const save = useCallback((o: Opening) => {
    setState(o);
    try {
      if (o.kind) localStorage.setItem(OPENING_KEY, JSON.stringify(o));
      else localStorage.removeItem(OPENING_KEY);
    } catch {}
  }, []);

  const setOpeningDate = useCallback((d: Ymd | null | "") => save(d && isYmd(d) ? { kind: "date", date: d } : EMPTY), [save]);
  const setOpeningKind = useCallback((k: Exclude<OpeningKind, "date">) => save({ kind: k, date: "" }), [save]);
  const clearOpening = useCallback(() => save(EMPTY), [save]);

  const value = useMemo(
    () => ({ opening, setOpeningDate, setOpeningKind, clearOpening }),
    [opening, setOpeningDate, setOpeningKind, clearOpening],
  );
  return <OpeningContext.Provider value={value}>{children}</OpeningContext.Provider>;
}

export function useOpening(): Ctx {
  const c = useContext(OpeningContext);
  if (!c) throw new Error("OpeningProvider is missing");
  return c;
}
