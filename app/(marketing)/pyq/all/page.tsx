"use client";

/**
 * Past papers catalogue (v2).
 *   deep hero with search → exam, year, price and Saved filters → soft cards.
 * Uses the backend's real field names (totalQs, durationMin, totalMarks, price,
 * hasSolutions); the old page read totalQuestions/durationSec/marks/isPremium,
 * which don't exist, so counts showed 0 and nothing was ever marked paid.
 * Bookmarks keep the existing localStorage key so saved papers carry over.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Download, Lock } from "lucide-react";
import PageHero, { HeroSearch } from "@/components/marketing/PageHero";
import { apiGetPYQPapers } from "@/lib/api";

interface Paper {
  id: string;
  title: string;
  year: number;
  shift?: string | null;
  totalQs: number;
  totalMarks: number;
  durationMin: number;
  pdfUrl?: string | null;
  hasSolutions: boolean;
  price: number;
  exam?: { id: string; name: string; shortName?: string; board?: { shortName?: string } | null } | null;
}

type Access = "all" | "free" | "paid" | "saved";
const BOOKMARK_KEY = "en_pyq_bookmarks";
const display = { fontFamily: "var(--font-sora)" } as const;

function readBookmarks(): Set<string> {
  try {
    const raw = window.localStorage.getItem(BOOKMARK_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function Catalogue() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [items, setItems] = useState<Paper[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(params.get("q") ?? "");

  const exam = params.get("exam") ?? "all";
  const year = params.get("year") ?? "all";
  const access = (params.get("access") as Access) ?? "all";

  // read after mount (localStorage isn't available during server render)
  useEffect(() => {
    const id = requestAnimationFrame(() => setSaved(readBookmarks()));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let alive = true;
    (apiGetPYQPapers({ limit: 100 }) as Promise<{ items: Paper[] }>)
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

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  useEffect(() => {
    const t = setTimeout(() => setParam("q", q.trim() || null), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...next]));
      } catch {
        /* storage unavailable: keep in memory */
      }
      return next;
    });
  }

  const exams = useMemo(() => {
    const m = new Map<string, { id: string; name: string; n: number }>();
    (items ?? []).forEach((p) => {
      if (!p.exam) return;
      const cur = m.get(p.exam.id) ?? { id: p.exam.id, name: p.exam.name, n: 0 };
      cur.n += 1;
      m.set(p.exam.id, cur);
    });
    return [...m.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }, [items]);

  const years = useMemo(() => [...new Set((items ?? []).map((p) => p.year))].sort((a, b) => b - a), [items]);

  const visible = useMemo(() => {
    const needle = (params.get("q") ?? "").toLowerCase();
    return (items ?? [])
      .filter((p) => exam === "all" || p.exam?.id === exam)
      .filter((p) => year === "all" || String(p.year) === year)
      .filter((p) => (access === "free" ? p.price <= 0 : access === "paid" ? p.price > 0 : access === "saved" ? saved.has(p.id) : true))
      .filter((p) => !needle || `${p.title} ${p.exam?.name ?? ""} ${p.year}`.toLowerCase().includes(needle))
      .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  }, [items, exam, year, access, saved, params]);

  const filtered = exam !== "all" || year !== "all" || access !== "all" || !!params.get("q");
  const selectCls = "min-h-11 rounded-[12px] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--ink-1)] outline-none focus:ring-2 focus:ring-[var(--brand-line)]";

  return (
    <div className="bg-[var(--bg)]">
      <PageHero eyebrow="Past papers" title="Every year, with solutions." subtitle="Attempt real papers in the exam interface, or download the PDF.">
        <HeroSearch id="pyq-search" label="Search past papers" placeholder="Search by exam or year, e.g. JPSC 2023" value={q} onChange={setQ} />
      </PageHero>

      <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Show" className="inline-flex rounded-[12px] bg-[var(--bg-secondary)] p-1">
            {(["all", "free", "paid", "saved"] as Access[]).map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={access === a}
                onClick={() => setParam("access", a)}
                className={`min-h-9 rounded-[9px] px-4 text-sm capitalize transition-colors ${
                  access === a ? "bg-[var(--card)] font-semibold text-[var(--ink-1)] shadow-[var(--shadow-xs)]" : "text-[var(--ink-3)] hover:text-[var(--ink-1)]"
                }`}
              >
                {a === "saved" ? `Saved${saved.size ? ` · ${saved.size}` : ""}` : a}
              </button>
            ))}
          </div>
          <label htmlFor="pyq-exam" className="sr-only">Exam</label>
          <select id="pyq-exam" value={exam} onChange={(e) => setParam("exam", e.target.value)} className={selectCls}>
            <option value="all">All exams</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.n})</option>)}
          </select>
          <label htmlFor="pyq-year" className="sr-only">Year</label>
          <select id="pyq-year" value={year} onChange={(e) => setParam("year", e.target.value)} className={selectCls}>
            <option value="all">All years</option>
            {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <p className="ml-auto text-sm text-[var(--ink-3)]" aria-live="polite">
            {items ? `${visible.length} ${visible.length === 1 ? "paper" : "papers"}` : ""}
            {filtered && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  router.replace(pathname, { scroll: false });
                }}
                className="ml-3 font-semibold text-[var(--brand)] hover:underline"
              >
                Clear
              </button>
            )}
          </p>
        </div>

        <div className="pt-8">
          {failed ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <p className="font-semibold text-[var(--ink-1)]">Couldn&apos;t load past papers.</p>
              <button onClick={() => setReload((n) => n + 1)} className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)]">Try again</button>
            </div>
          ) : items === null ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => <li key={i} className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-[var(--bg-secondary)]" />)}
            </ul>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <p className="font-semibold text-[var(--ink-1)]">{access === "saved" ? "No saved papers yet." : "No papers match."}</p>
              <p className="text-sm text-[var(--ink-3)]">{access === "saved" ? "Tap the bookmark on any paper to save it here." : "Try another exam or year, or clear the filters."}</p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p, i) => {
                const free = p.price <= 0;
                const isSaved = saved.has(p.id);
                return (
                  <li key={p.id} className="reveal" style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                    <article className="en-card en-card-link flex h-full flex-col gap-4 p-6">
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid h-10 min-w-10 place-items-center rounded-[10px] bg-[var(--brand-soft)] px-2 text-[11px] font-bold tabular-nums text-[var(--brand)]" style={display}>
                          {p.year}
                        </span>
                        <div className="flex items-center gap-2">
                          {free ? (
                            <span className="rounded-full bg-[var(--green-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--green)]">Free</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ink-2)]"><Lock className="h-3 w-3" aria-hidden="true" />In plans</span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleSave(p.id)}
                            aria-pressed={isSaved}
                            aria-label={isSaved ? `Remove ${p.title} from saved` : `Save ${p.title}`}
                            className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${isSaved ? "bg-[var(--brand)] text-[var(--brand-ink)]" : "text-[var(--ink-3)] hover:bg-[var(--bg-secondary)] hover:text-[var(--ink-1)]"}`}
                          >
                            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <h2 className="text-[1.05rem] font-semibold leading-snug text-[var(--ink-1)]" style={display}>{p.title}</h2>
                        {p.exam && (
                          <Link href={`/exams/${p.exam.id}`} className="text-sm text-[var(--ink-3)] hover:text-[var(--brand)]">{p.exam.name}</Link>
                        )}
                      </div>

                      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ink-3)]">
                        {p.shift && <span>{p.shift}</span>}
                        {p.totalQs > 0 && <span>{p.totalQs} questions</span>}
                        {p.durationMin > 0 && <span>{p.durationMin} min</span>}
                        {p.hasSolutions && <span>Solutions</span>}
                      </p>

                      <div className="mt-auto flex items-center gap-2 pt-1">
                        {free ? (
                          <Link href={`/dashboard/pyq/${p.id}`} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand)] px-4 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-hover)]">
                            Attempt
                          </Link>
                        ) : (
                          <Link href="/pricing" className="inline-flex min-h-10 flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-4 text-sm font-semibold text-[var(--ink-1)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">
                            See plans
                          </Link>
                        )}
                        {free && p.pdfUrl && p.pdfUrl !== "#" && (
                          <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer" aria-label={`Download ${p.title} PDF`} className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] text-[var(--ink-2)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">
                            <Download className="h-4 w-4" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AllPyqPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Catalogue />
    </Suspense>
  );
}
