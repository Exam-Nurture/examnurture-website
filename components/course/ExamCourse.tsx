"use client";

/**
 * Exam course (v2). Used by the public page /exams/[slug] and by the
 * dashboard's "My course" (/dashboard/course). Every exam uses the same layout and the same tabs, in
 * the same order, so a student who learns one exam page knows all of them.
 *
 *   Header: name + only the facts we actually have (no invented defaults)
 *   Card:   "Start preparing" with the one best first action
 *   Tabs:   Overview · Past papers · Mock tests · About   (URL hash, shareable)
 *
 * Not here yet, because the backend has no data for them: a public study-
 * material shelf, a Prelims/Mains switch and full/sectional/topic grouping
 * (needs Test.kind and Test.stage). Metadata + JSON-LD live in ./layout.tsx.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, Check, Download, ExternalLink, FileText, Lock, Sparkles } from "lucide-react";
import { apiGetExamById, apiGetPYQPapers, apiGetTestSeries } from "@/lib/api";
import { planForQualification } from "@/lib/plans";

/* ── Types (field names as the backend sends them) ── */

interface Exam {
  id: string;
  name: string;
  shortName?: string;
  fullName?: string;
  eligibility?: string;
  pattern?: string;
  subjects?: string | string[];
  upcomingDate?: string | null;
  daysLeft?: number | null;
  tentativeVacancies?: string | null;
  tentativeExamDate?: string | null;
  applicationStartDate?: string | null;
  applicationEndDate?: string | null;
  ageLimitInfo?: string | null;
  educationalQual?: string | null;
  applicationFee?: string | null;
  notificationUrl?: string | null;
  board?: { id: string; name: string; shortName: string; state?: { name: string } | null } | null;
  examCategory?: { id: number; name: string } | null;
}

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
}

interface Series {
  id: string;
  title: string;
  description?: string | null;
  totalTests: number;
  isPaid: boolean;
  isOwned?: boolean;
  price: number;
  discountedPrice?: number | null;
}

type Tab = "overview" | "papers" | "mocks" | "about";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "papers", label: "Past papers" },
  { id: "mocks", label: "Mock tests" },
  { id: "about", label: "About" },
];

const display = { fontFamily: "var(--font-sora)" } as const;
const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function useHashTab(): [Tab, (t: Tab) => void] {
  const [tab, setTab] = useState<Tab>("overview");
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#", "") as Tab;
      setTab(TABS.some((t) => t.id === h) ? h : "overview");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const go = useCallback((t: Tab) => {
    history.replaceState(null, "", t === "overview" ? window.location.pathname : `#${t}`);
    setTab(t);
  }, []);
  return [tab, go];
}

function splitList(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v;
  return (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

/* ── Small building blocks ── */

function Pill({ tone, children }: { tone: "good" | "neutral" | "accent" | "brand"; children: React.ReactNode }) {
  const cls = {
    good: "bg-[var(--green-soft)] text-[var(--green)]",
    neutral: "bg-[var(--bg-secondary)] text-[var(--ink-2)]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent-ink)]",
    brand: "bg-[var(--brand-soft)] text-[var(--brand)]",
  }[tone];
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}

function ShelfHead({ title, count, onAll }: { title: string; count?: number; onAll?: () => void }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-semibold text-[var(--ink-1)]" style={display}>{title}</h2>
      {onAll && count !== undefined && count > 3 && (
        <button onClick={onAll} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline">
          All {count} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[var(--radius)] border border-dashed border-[var(--line)] px-4 py-6 text-center text-sm text-[var(--ink-3)]">{children}</p>;
}

function PaperCard({ p }: { p: Paper }) {
  const free = p.price <= 0;
  return (
    <li className="en-card flex flex-col gap-2 p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-[var(--ink-1)]">{p.title}</span>
        {free ? <Pill tone="good">Free</Pill> : <Pill tone="neutral"><Lock className="h-3 w-3" aria-hidden="true" />In plans</Pill>}
      </div>
      <p className="flex flex-wrap gap-x-3 text-xs text-[var(--ink-3)]">
        <span>{p.year}{p.shift ? ` · ${p.shift}` : ""}</span>
        {p.totalQs > 0 && <span>{p.totalQs} Qs</span>}
        {p.durationMin > 0 && <span>{p.durationMin} min</span>}
        {p.hasSolutions && <span>Solutions</span>}
      </p>
      <div className="mt-auto flex items-center gap-2 pt-1">
        {free ? (
          <Link href={`/dashboard/pyq/${p.id}`} className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] bg-[var(--brand)] px-4 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
            Attempt
          </Link>
        ) : (
          <Link href="/pricing" className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] border border-[var(--line)] px-4 text-sm font-semibold text-[var(--ink-1)] hover:bg-[var(--surface-hover)]">
            See plans
          </Link>
        )}
        {p.pdfUrl && p.pdfUrl !== "#" && free && (
          <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer" aria-label={`Download ${p.title} PDF`} className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] border border-[var(--line)] text-[var(--ink-2)] hover:bg-[var(--surface-hover)]">
            <Download className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </li>
  );
}

function SeriesCard({ s }: { s: Series }) {
  const price = s.discountedPrice ?? s.price;
  return (
    <li>
      <Link href={`/series/${s.id}`} className="en-card en-card-link flex h-full flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-[var(--ink-1)]">{s.title}</span>
          {!s.isPaid ? <Pill tone="good">Free</Pill> : s.isOwned ? <Pill tone="brand"><Check className="h-3 w-3" aria-hidden="true" />Yours</Pill> : <Pill tone="neutral">{rupees(price)}</Pill>}
        </div>
        <p className="text-xs text-[var(--ink-3)]">{s.totalTests > 0 ? `${s.totalTests} tests` : "Tests coming soon"}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-[var(--brand)]">
          View tests <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}

/* ── Page ── */

export default function ExamCourse({ slug, stickyClass = "top-16" }: { slug: string; stickyClass?: string }) {
  const [tab, setTab] = useHashTab();

  const [exam, setExam] = useState<Exam | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [papers, setPapers] = useState<Paper[] | null>(null);
  const [series, setSeries] = useState<Series[] | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    apiGetExamById(slug)
      .then((data: Exam) => {
        if (!alive) return;
        setExam(data);
        setStatus("ok");
      })
      .catch((err: { status?: number; statusCode?: number }) => {
        if (!alive) return;
        setStatus((err?.status ?? err?.statusCode) === 404 ? "notfound" : "error");
      });
    return () => {
      alive = false;
    };
  }, [slug, attempt]);

  useEffect(() => {
    if (!exam) return;
    let alive = true;
    (apiGetPYQPapers({ examId: exam.id, limit: 100 }) as Promise<{ items: Paper[] }>)
      .then((r) => alive && setPapers(r.items ?? []))
      .catch(() => alive && setPapers([]));
    (apiGetTestSeries({ examId: exam.id, limit: 50 }) as Promise<{ items: Series[] }>)
      .then((r) => alive && setSeries(r.items ?? []))
      .catch(() => alive && setSeries([]));
    return () => {
      alive = false;
    };
  }, [exam]);

  const subjects = useMemo(() => splitList(exam?.subjects), [exam]);
  const papersByYear = useMemo(() => {
    const map = new Map<number, Paper[]>();
    (papers ?? []).forEach((p) => map.set(p.year, [...(map.get(p.year) ?? []), p]));
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [papers]);

  if (status === "notfound") notFound();

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6" aria-busy="true">
        <div className="h-4 w-48 animate-pulse rounded bg-[var(--bg-secondary)]" />
        <div className="mt-4 h-10 w-2/3 animate-pulse rounded bg-[var(--bg-secondary)]" />
        <div className="mt-6 h-24 animate-pulse rounded-[var(--radius)] bg-[var(--bg-secondary)]" />
      </div>
    );
  }

  if (status === "error" || !exam) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-24 text-center">
        <h1 className="text-xl font-bold text-[var(--ink-1)]" style={display}>Couldn&apos;t load this exam</h1>
        <p className="text-sm text-[var(--ink-3)]">Check your connection and try again.</p>
        <button
          onClick={() => {
            setStatus("loading");
            setAttempt((n) => n + 1);
          }}
          className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)]"
        >
          Try again
        </button>
      </div>
    );
  }

  const examDate = exam.upcomingDate || exam.tentativeExamDate;
  const facts = [
    examDate && { k: "Exam date", v: examDate },
    exam.tentativeVacancies && { k: "Vacancies", v: exam.tentativeVacancies },
    exam.applicationEndDate && { k: "Form closes", v: exam.applicationEndDate },
    exam.board?.state?.name && { k: "State", v: exam.board.state.name },
  ].filter(Boolean) as { k: string; v: string }[];

  const freePaper = (papers ?? []).find((p) => p.price <= 0);
  const plan = planForQualification(exam.educationalQual || exam.eligibility);
  const counts = { papers: papers?.length ?? 0, mocks: series?.length ?? 0 };

  const about = [
    { k: "Eligibility", v: exam.eligibility },
    { k: "Education", v: exam.educationalQual },
    { k: "Age limit", v: exam.ageLimitInfo },
    { k: "Exam pattern", v: exam.pattern },
    { k: "Application fee", v: exam.applicationFee },
    { k: "Application opens", v: exam.applicationStartDate },
    { k: "Application closes", v: exam.applicationEndDate },
    { k: "Exam date", v: examDate },
    { k: "Vacancies", v: exam.tentativeVacancies },
  ].filter((r) => r.v && String(r.v).trim());

  return (
    <div className="bg-[var(--bg)]">
      {/* ── Header (soft wash) ── */}
      <div className="en-band-hero">
      <header className="mx-auto grid max-w-[1180px] gap-8 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:pt-12">
        <div className="flex min-w-0 flex-col gap-4">
          <nav aria-label="Breadcrumb" className="text-sm text-[var(--ink-3)]">
            <Link href="/exams" className="hover:text-[var(--brand)]">Exams</Link>
            {exam.examCategory?.name && <> / <span>{exam.examCategory.name}</span></>}
            {exam.board?.shortName && <> / <Link href={`/exams?q=${encodeURIComponent(exam.board.shortName)}`} className="hover:text-[var(--brand)]">{exam.board.shortName}</Link></>}
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold leading-tight tracking-[-0.015em] text-[var(--ink-1)] sm:text-[2.6rem]" style={display}>
              {exam.name}
            </h1>
            {typeof exam.daysLeft === "number" && exam.daysLeft > 0 && (
              <Pill tone="accent"><Calendar className="h-3 w-3" aria-hidden="true" />{exam.daysLeft} days left</Pill>
            )}
          </div>
          {exam.fullName && exam.fullName !== exam.name && <p className="text-[var(--ink-2)]">{exam.fullName}</p>}
          {facts.length > 0 && (
            <dl className="flex flex-wrap gap-x-8 gap-y-3 pt-1">
              {facts.map((f) => (
                <div key={f.k} className="flex flex-col">
                  <dt className="text-xs text-[var(--ink-3)]">{f.k}</dt>
                  <dd className="font-semibold text-[var(--ink-1)]" style={display}>{f.v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Start preparing: one best first action */}
        <aside className="en-card en-rise flex flex-col gap-4 self-start p-6 !shadow-[var(--shadow-md)]">
          <div>
            <p className="font-semibold text-[var(--ink-1)]" style={display}>Start preparing</p>
            <p className="mt-1 text-sm text-[var(--ink-3)]">
              {papers === null || series === null ? "Loading…" : `${counts.papers} past papers · ${counts.mocks} mock series`}
            </p>
          </div>
          {freePaper ? (
            <Link href={`/dashboard/pyq/${freePaper.id}`} className="flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand)] px-4 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
              Attempt a free past paper
            </Link>
          ) : null}
          <button
            onClick={() => setTab("mocks")}
            className={`flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-semibold ${
              freePaper ? "border border-[var(--line)] text-[var(--ink-1)] hover:bg-[var(--surface-hover)]" : "bg-[var(--brand)] text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]"
            }`}
          >
            See mock tests
          </button>
          <p className="text-xs text-[var(--ink-3)]">
            {plan ? <>Included in the {plan.name} plan ({plan.price}{plan.unit ? ` ${plan.unit}` : ""}). </> : null}
            <Link href="/pricing" className="font-medium text-[var(--brand)] hover:underline">How pricing works</Link>
          </p>
        </aside>
      </header>
      </div>

      {/* ── Tabs ── */}
      <div className={`sticky ${stickyClass} z-10 border-b border-[var(--line-soft)] bg-[var(--bg)]/90 backdrop-blur`}>
        <div role="tablist" aria-label="Exam sections" className="mx-auto flex max-w-[1180px] gap-1 overflow-x-auto px-2 sm:px-4 [scrollbar-width:none]">
          {TABS.map((t) => {
            const count = t.id === "papers" ? counts.papers : t.id === "mocks" ? counts.mocks : undefined;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                aria-controls={`panel-${t.id}`}
                id={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`-mb-px min-h-12 whitespace-nowrap border-b-2 px-3 text-sm ${
                  on ? "border-[var(--ink-1)] font-semibold text-[var(--ink-1)]" : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink-1)]"
                }`}
              >
                {t.label}
                {count ? <span className="ml-1.5 text-[var(--ink-3)]">{count}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mx-auto max-w-[1180px] px-4 pb-20 pt-8 sm:px-6">
        {/* Overview: top of each shelf, same order everywhere */}
        {tab === "overview" && (
          <div className="flex flex-col gap-10">
            <section>
              <ShelfHead title="Past papers" count={counts.papers} onAll={() => setTab("papers")} />
              {papers === null ? <Empty>Loading…</Empty> : papers.length === 0 ? <Empty>No past papers for this exam yet.</Empty> : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{papers.slice(0, 3).map((p) => <PaperCard key={p.id} p={p} />)}</ul>
              )}
            </section>
            <section>
              <ShelfHead title="Mock tests" count={counts.mocks} onAll={() => setTab("mocks")} />
              {series === null ? <Empty>Loading…</Empty> : series.length === 0 ? <Empty>No mock tests for this exam yet.</Empty> : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{series.slice(0, 3).map((s) => <SeriesCard key={s.id} s={s} />)}</ul>
              )}
            </section>
            <section>
              <ShelfHead title="Daily practice" />
              <Link href="/daily-quiz" className="en-card en-card-link flex items-center gap-4 p-5 sm:max-w-md">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)]"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
                <span className="flex flex-col">
                  <span className="font-semibold text-[var(--ink-1)]">Today&apos;s quiz</span>
                  <span className="text-sm text-[var(--ink-3)]">A few questions a day. Free.</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
              </Link>
            </section>
            {subjects.length > 0 && (
              <section>
                <ShelfHead title="Subjects" />
                <ul className="flex flex-wrap gap-2">
                  {subjects.map((s) => <li key={s} className="rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--ink-2)]">{s}</li>)}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Past papers: grouped by year, newest first */}
        {tab === "papers" && (
          papers === null ? <Empty>Loading…</Empty> : papers.length === 0 ? <Empty>No past papers for this exam yet.</Empty> : (
            <div className="flex flex-col gap-8">
              {papersByYear.map(([year, list]) => (
                <section key={year}>
                  <h2 className="mb-3 flex items-baseline gap-2 text-lg font-semibold text-[var(--ink-1)]" style={display}>
                    {year} <span className="text-sm font-normal text-[var(--ink-3)]">{list.length} {list.length === 1 ? "paper" : "papers"}</span>
                  </h2>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map((p) => <PaperCard key={p.id} p={p} />)}</ul>
                </section>
              ))}
            </div>
          )
        )}

        {/* Mock tests: free first, then owned, then paid */}
        {tab === "mocks" && (
          series === null ? <Empty>Loading…</Empty> : series.length === 0 ? <Empty>No mock tests for this exam yet.</Empty> : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...series]
                .sort((a, b) => Number(a.isPaid) - Number(b.isPaid) || Number(!!b.isOwned) - Number(!!a.isOwned))
                .map((s) => <SeriesCard key={s.id} s={s} />)}
            </ul>
          )
        )}

        {/* About: only the fields we have */}
        {tab === "about" && (
          <div className="flex max-w-3xl flex-col gap-6">
            {about.length === 0 ? <Empty>Details for this exam will be added soon.</Empty> : (
              <dl className="en-card divide-y divide-[var(--line-soft)]">
                {about.map((r) => (
                  <div key={r.k} className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
                    <dt className="text-sm text-[var(--ink-3)]">{r.k}</dt>
                    <dd className="whitespace-pre-line text-[15px] text-[var(--ink-1)]">{r.v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {subjects.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-[var(--ink-1)]" style={display}>Subjects</h2>
                <ul className="flex flex-wrap gap-2">{subjects.map((s) => <li key={s} className="rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--ink-2)]">{s}</li>)}</ul>
              </div>
            )}
            {exam.notificationUrl && (
              <a href={exam.notificationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-[var(--brand)] hover:underline">
                <FileText className="h-4 w-4" aria-hidden="true" /> Official notification <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
