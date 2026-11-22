"use client";

/**
 * Past papers (v2, in-app).
 *   Your attempts: soft rows from apiGetPYQAttempts, each with a Review link.
 *   All papers: public-style cards with exam / year / Free / Paid filters.
 * Uses the backend's real paper fields (totalQs, totalMarks, durationMin,
 * price, hasSolutions, pdfUrl, year, shift, exam). The old page also read the
 * wrong names in places. Attempt opens /dashboard/pyq/<id>, which forwards to
 * the exam screen; Review opens that screen with ?attemptId=.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Lock } from "lucide-react";
import AppPage from "@/components/app/AppPage";
import { apiGetPYQPapers, apiGetPYQAttempts } from "@/lib/api";

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
  exam?: { id: string; name: string; shortName?: string } | null;
}

interface Attempt {
  id: string;
  paperId: string;
  score: number;
  totalMarks: number;
  completedAt?: string | null;
  timeTakenSec?: number | null;
  paper?: { title?: string; year?: number } | null;
}

type Access = "all" | "free" | "paid";
const display = { fontFamily: "var(--font-sora)" } as const;

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-11 rounded-full px-4 text-sm transition-colors ${
        on ? "bg-[var(--brand)] font-semibold text-[var(--brand-ink)]" : "bg-[var(--bg-secondary)] text-[var(--ink-2)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
      }`}
    >
      {children}
    </button>
  );
}

function Retry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="en-card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <p className="font-semibold text-[var(--ink-1)]">{message}</p>
      <button type="button" onClick={onRetry} className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
        Try again
      </button>
    </div>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function PYQPage() {
  const [papers, setPapers] = useState<Paper[] | null>(null);
  const [papersFailed, setPapersFailed] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [attemptsFailed, setAttemptsFailed] = useState(false);
  const [reload, setReload] = useState(0);

  const [exam, setExam] = useState("all");
  const [year, setYear] = useState("all");
  const [access, setAccess] = useState<Access>("all");

  useEffect(() => {
    let alive = true;
    (apiGetPYQPapers({ limit: 100 }) as Promise<{ items?: Paper[] }>)
      .then((r) => {
        if (!alive) return;
        setPapers(r.items ?? []);
        setPapersFailed(false);
      })
      .catch(() => alive && setPapersFailed(true));
    (apiGetPYQAttempts() as Promise<unknown>)
      .then((r) => {
        if (!alive) return;
        setAttempts(Array.isArray(r) ? (r as Attempt[]) : []);
        setAttemptsFailed(false);
      })
      .catch(() => alive && setAttemptsFailed(true));
    return () => {
      alive = false;
    };
  }, [reload]);

  const exams = useMemo(() => {
    const m = new Map<string, string>();
    (papers ?? []).forEach((p) => p.exam && m.set(p.exam.id, p.exam.shortName || p.exam.name));
    return [...m.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [papers]);

  const years = useMemo(() => [...new Set((papers ?? []).map((p) => p.year))].sort((a, b) => b - a), [papers]);

  const visible = useMemo(
    () =>
      (papers ?? [])
        .filter((p) => exam === "all" || p.exam?.id === exam)
        .filter((p) => year === "all" || String(p.year) === year)
        .filter((p) => (access === "free" ? p.price <= 0 : access === "paid" ? p.price > 0 : true))
        .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title)),
    [papers, exam, year, access],
  );

  const filtered = exam !== "all" || year !== "all" || access !== "all";
  function clear() {
    setExam("all");
    setYear("all");
    setAccess("all");
  }

  return (
    <AppPage title="Past papers" subtitle="Attempt real papers, then review how you did.">
      {/* Your attempts */}
      <section aria-labelledby="attempts-title" className="reveal">
        <h2 id="attempts-title" className="mb-4 text-lg font-semibold text-[var(--ink-1)]" style={display}>Your attempts</h2>
        {attemptsFailed ? (
          <Retry message="Couldn't load your attempts." onRetry={() => setReload((n) => n + 1)} />
        ) : attempts === null ? (
          <ul className="flex flex-col gap-3" aria-busy="true" aria-label="Loading attempts">
            {[0, 1].map((i) => <li key={i} className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-[var(--bg-secondary)]" />)}
          </ul>
        ) : attempts.length === 0 ? (
          <div className="en-card px-6 py-8 text-center">
            <p className="font-semibold text-[var(--ink-1)]">No attempts yet.</p>
            <p className="mt-1 text-sm text-[var(--ink-3)]">Pick a paper below to begin.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {attempts.map((a) => {
              const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : null;
              const title = [a.paper?.year, a.paper?.title].filter(Boolean).join(" · ") || "Past paper";
              return (
                <li key={a.id} className="en-card flex flex-wrap items-center gap-x-5 gap-y-3 p-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--ink-1)]">{title}</p>
                    <p className="mt-0.5 text-sm text-[var(--ink-3)]">
                      {[formatDate(a.completedAt), a.timeTakenSec != null ? `${Math.floor(a.timeTakenSec / 60)} min ${a.timeTakenSec % 60} s` : ""].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {pct !== null && (
                    <p className="text-right">
                      <span className="block text-xl font-bold tabular-nums text-[var(--ink-1)]" style={display}>{pct}%</span>
                      <span className="text-xs tabular-nums text-[var(--ink-3)]">{a.score} / {a.totalMarks}</span>
                    </p>
                  )}
                  <Link
                    href={`/pyq/${a.paperId}?attemptId=${a.id}`}
                    aria-label={`Review ${title}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-5 text-sm font-semibold text-[var(--ink-1)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
                  >
                    Review
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* All papers */}
      <section aria-labelledby="papers-title" className="reveal">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 id="papers-title" className="text-lg font-semibold text-[var(--ink-1)]" style={display}>All papers</h2>
          <p className="text-sm text-[var(--ink-3)]" aria-live="polite">
            {papers ? `${visible.length} ${visible.length === 1 ? "paper" : "papers"}` : ""}
            {filtered && (
              <button type="button" onClick={clear} className="ml-3 min-h-11 font-semibold text-[var(--brand)] hover:underline">Clear</button>
            )}
          </p>
        </div>

        {papers && papers.length > 0 && (
          <div className="mb-6 flex flex-col gap-3">
            <div role="group" aria-label="Price" className="flex flex-wrap gap-2">
              {(["all", "free", "paid"] as Access[]).map((a) => (
                <Chip key={a} on={access === a} onClick={() => setAccess(a)}>{a === "all" ? "All" : a === "free" ? "Free" : "Paid"}</Chip>
              ))}
            </div>
            {exams.length > 1 && (
              <div role="group" aria-label="Exam" className="flex flex-wrap gap-2">
                <Chip on={exam === "all"} onClick={() => setExam("all")}>All exams</Chip>
                {exams.map((e) => <Chip key={e.id} on={exam === e.id} onClick={() => setExam(e.id)}>{e.name}</Chip>)}
              </div>
            )}
            {years.length > 1 && (
              <div role="group" aria-label="Year" className="flex flex-wrap gap-2">
                <Chip on={year === "all"} onClick={() => setYear("all")}>All years</Chip>
                {years.map((y) => <Chip key={y} on={year === String(y)} onClick={() => setYear(String(y))}>{y}</Chip>)}
              </div>
            )}
          </div>
        )}

        {papersFailed ? (
          <Retry message="Couldn't load past papers." onRetry={() => setReload((n) => n + 1)} />
        ) : papers === null ? (
          <ul className="grid gap-5 sm:grid-cols-2" aria-busy="true" aria-label="Loading papers">
            {[0, 1, 2, 3].map((i) => <li key={i} className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-[var(--bg-secondary)]" />)}
          </ul>
        ) : visible.length === 0 ? (
          <div className="en-card px-6 py-10 text-center">
            <p className="font-semibold text-[var(--ink-1)]">No papers match.</p>
            <p className="mt-1 text-sm text-[var(--ink-3)]">Try another exam or year, or clear the filters.</p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {visible.map((p, i) => {
              const free = p.price <= 0;
              return (
                <li key={p.id} className="reveal" style={{ transitionDelay: `${(i % 2) * 70}ms` }}>
                  <article className="en-card flex h-full flex-col gap-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-10 min-w-10 place-items-center rounded-[10px] bg-[var(--brand-soft)] px-2 text-[11px] font-bold tabular-nums text-[var(--brand)]" style={display}>
                        {p.year}
                      </span>
                      {free ? (
                        <span className="rounded-full bg-[var(--green-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--green)]">Free</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ink-2)]">
                          <Lock className="h-3 w-3" aria-hidden="true" />In plans
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[1.05rem] font-semibold leading-snug text-[var(--ink-1)]" style={display}>{p.title}</h3>
                      {p.exam && <p className="text-sm text-[var(--ink-3)]">{p.exam.name}</p>}
                    </div>
                    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ink-3)]">
                      {p.shift && <span>{p.shift}</span>}
                      {p.totalQs > 0 && <span>{p.totalQs} questions</span>}
                      {p.durationMin > 0 && <span>{p.durationMin} min</span>}
                      {p.hasSolutions && <span>Solutions</span>}
                    </p>
                    <div className="mt-auto flex items-center gap-2 pt-1">
                      {free ? (
                        <Link href={`/dashboard/pyq/${p.id}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-hover)]">
                          Attempt
                        </Link>
                      ) : (
                        <Link href="/pricing" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-5 text-sm font-semibold text-[var(--ink-1)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">
                          See plans
                        </Link>
                      )}
                      {free && p.pdfUrl && p.pdfUrl !== "#" && (
                        <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer" aria-label={`Download ${p.title} PDF`} className="grid h-11 w-11 place-items-center rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] text-[var(--ink-2)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">
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
      </section>
    </AppPage>
  );
}
