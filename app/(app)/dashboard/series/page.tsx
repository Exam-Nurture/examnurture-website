"use client";

/**
 * Mock tests (in-app, v2). Search + soft filters over soft series cards.
 * Order: free first, then owned, then paid. "Yours" only appears when the API
 * reports ownership (isOwned) for at least one series.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Search, Timer } from "lucide-react";
import { apiGetTestSeries } from "@/lib/api";
import AppPage from "@/components/app/AppPage";

interface SeriesItem {
  id: string;
  title: string;
  totalTests: number;
  isPaid: boolean;
  isOwned?: boolean;
  price: number;
  discountedPrice?: number | null;
  exam?: { id: string; name: string; shortName?: string; board?: { shortName?: string } | null } | null;
}

type Access = "all" | "free" | "yours";

const display = { fontFamily: "var(--font-sora)" } as const;
const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function SeriesPage() {
  const [items, setItems] = useState<SeriesItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [q, setQ] = useState("");
  const [access, setAccess] = useState<Access>("all");
  const [exam, setExam] = useState("all");

  useEffect(() => {
    let alive = true;
    (apiGetTestSeries({ limit: 100 }) as Promise<{ items: SeriesItem[] }>)
      .then((r) => {
        if (!alive) return;
        setItems(r.items ?? []);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [reload]);

  const retry = () => {
    setFailed(false);
    setItems(null);
    setReload((n) => n + 1);
  };

  const hasOwned = (items ?? []).some((s) => s.isOwned);

  const exams = useMemo(() => {
    const m = new Map<string, { id: string; name: string; n: number }>();
    (items ?? []).forEach((s) => {
      if (!s.exam) return;
      const cur = m.get(s.exam.id) ?? { id: s.exam.id, name: s.exam.name, n: 0 };
      cur.n += 1;
      m.set(s.exam.id, cur);
    });
    return [...m.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }, [items]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rank = (s: SeriesItem) => (!s.isPaid ? 0 : s.isOwned ? 1 : 2);
    return (items ?? [])
      .filter((s) => (exam === "all" ? true : s.exam?.id === exam))
      .filter((s) => (access === "free" ? !s.isPaid : access === "yours" ? !!s.isOwned : true))
      .filter((s) => !needle || `${s.title} ${s.exam?.name ?? ""}`.toLowerCase().includes(needle))
      .sort((a, b) => rank(a) - rank(b));
  }, [items, exam, access, q]);

  const filtered = exam !== "all" || access !== "all" || q.trim() !== "";
  const options: Access[] = hasOwned ? ["all", "free", "yours"] : ["all", "free"];

  return (
    <AppPage title="Mock tests" subtitle="Practise in the real exam interface, with timer, palette and solutions." width="wide">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-4 focus-within:ring-2 focus-within:ring-[var(--brand-line)] sm:max-w-sm">
          <Search className="h-4 w-4 flex-none text-[var(--ink-3)]" aria-hidden="true" />
          <label htmlFor="app-series-search" className="sr-only">Search mock tests</label>
          <input
            id="app-series-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by exam or series"
            className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--ink-1)] outline-none placeholder:text-[var(--ink-3)]"
          />
        </div>

        <div role="group" aria-label="Access" className="inline-flex rounded-[12px] bg-[var(--bg-secondary)] p-1">
          {options.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={access === a}
              onClick={() => setAccess(a)}
              className={`min-h-11 rounded-[9px] px-4 text-sm capitalize transition-colors ${
                access === a ? "bg-[var(--card)] font-semibold text-[var(--ink-1)] shadow-[var(--shadow-xs)]" : "text-[var(--ink-3)] hover:text-[var(--ink-1)]"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {exams.length > 1 && (
          <>
            <label htmlFor="app-series-exam" className="sr-only">Exam</label>
            <select
              id="app-series-exam"
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--ink-1)]"
            >
              <option value="all">All exams</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.n})</option>
              ))}
            </select>
          </>
        )}

        <p className="ml-auto text-sm text-[var(--ink-3)]" aria-live="polite">
          {items ? `${visible.length} series` : ""}
          {filtered && items && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setAccess("all");
                setExam("all");
              }}
              className="ml-3 min-h-11 font-semibold text-[var(--brand)] hover:underline"
            >
              Clear
            </button>
          )}
        </p>
      </div>

      {failed ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center" role="alert">
          <p className="font-semibold text-[var(--ink-1)]">Couldn&apos;t load mock tests.</p>
          <p className="text-sm text-[var(--ink-3)]">Check your connection and try again.</p>
          <button type="button" onClick={retry} className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
            Try again
          </button>
        </div>
      ) : items === null ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading mock tests">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-[var(--bg-secondary)]" />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="font-semibold text-[var(--ink-1)]">{filtered ? "No mock tests match." : "No mock tests yet."}</p>
          <p className="text-sm text-[var(--ink-3)]">{filtered ? "Try another exam or clear the filters." : "New series will show up here."}</p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s, i) => {
            const price = s.discountedPrice ?? s.price;
            const struck = s.discountedPrice != null && s.discountedPrice < s.price;
            return (
              <li key={s.id} className="reveal" style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                <article className="en-card en-card-link relative flex h-full flex-col gap-4 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-10 min-w-10 place-items-center rounded-[10px] bg-[var(--brand-soft)] px-2 text-[11px] font-bold text-[var(--brand)]" style={display}>
                      {(s.exam?.board?.shortName || s.exam?.shortName || "EN").slice(0, 5).toUpperCase()}
                    </span>
                    {!s.isPaid ? (
                      <span className="rounded-full bg-[var(--green-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--green)]">Free</span>
                    ) : s.isOwned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
                        <Check className="h-3 w-3" aria-hidden="true" />Yours
                      </span>
                    ) : (
                      <span className="text-sm font-semibold tabular-nums text-[var(--ink-1)]">
                        {struck && <s className="mr-1.5 font-normal text-[var(--ink-3)]">{rupees(s.price)}</s>}
                        {rupees(price)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <h2 className="text-[1.05rem] font-semibold leading-snug text-[var(--ink-1)]" style={display}>
                      <Link href={`/dashboard/series/${s.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[var(--brand-line)]">
                        {s.title}
                      </Link>
                    </h2>
                    {s.exam && <p className="text-sm text-[var(--ink-3)]">{s.exam.name}</p>}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-1 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-[var(--ink-3)]">
                      <Timer className="h-4 w-4" aria-hidden="true" />
                      {s.totalTests > 0 ? `${s.totalTests} tests` : "Tests coming soon"}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--brand)]">
                      {!s.isPaid || s.isOwned ? "Start" : "View"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </AppPage>
  );
}
