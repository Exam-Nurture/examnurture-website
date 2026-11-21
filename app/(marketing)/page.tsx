"use client";

/**
 * Homepage (v2). One job: get the student to their exam.
 *
 * Sections, in order: hero with exam search → proof line → popular exams →
 * what you get → plans. Removed in v2 because they repeated other sections:
 * exam marquee, testimonials (return only when verified), closing CTA with
 * repeated stats, FAQ (moved to /pricing). Plan copy comes from lib/plans.ts.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Search, Sparkles, Target, Timer } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/lib/config";
import PlanCards from "@/components/marketing/PlanCards";

/* ── Data (backend; sections hide when data is missing, never show fake numbers) ── */

interface FeaturedExam {
  name: string;
  tag: string;
  slug: string | null;
  state: string | null;
  board: string | null;
  description: string | null;
  numTests: number;
  numPYQ: number;
}

interface PlatformStats {
  exams: number;
  pyqPapers: number;
  testSeries: number;
  users: number;
}

function useJson<T>(path: string): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}${path}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: T) => {
        if (alive) setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [path]);
  return data;
}

/* ── Shared bits ── */

const display = { fontFamily: "var(--font-sora)" } as const;

const QUICK_EXAMS = ["JPSC", "JSSC CGL", "BPSC", "SSC CGL", "IBPS PO", "Railway NTPC"];

const FEATURES = [
  { icon: FileText, title: "Past papers", text: "Every year, with solutions.", href: "/pyq/all" },
  { icon: Timer, title: "Mock tests", text: "The real CBT interface.", href: "/series/all" },
  { icon: Sparkles, title: "Daily practice", text: "10 questions a day.", href: "/daily-quiz" },
  { icon: Target, title: "Weak-topic plan", text: "Know what to fix next.", href: "/dashboard" },
];

function SectionHead({ title, link }: { title: string; link?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4">
      <h2 className="text-2xl font-bold text-[var(--ink-1)] sm:text-[1.75rem]" style={display}>
        {title}
      </h2>
      {link && (
        <Link href={link.href} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline">
          {link.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/* ── Hero ── */

function Hero() {
  const { user } = useAuth();
  return (
    <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 pb-14 pt-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pb-20 lg:pt-20">
      <div className="flex flex-col gap-6">
        <h1 className="text-[2.5rem] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--ink-1)] sm:text-6xl" style={display}>
          Crack your exam with real papers.
        </h1>
        <p className="text-lg text-[var(--ink-2)]">
          Past papers, CBT mocks and daily practice, in English and <span lang="hi">हिंदी</span>.
        </p>

        {/* Plain GET form: works without JavaScript; /exams reads ?q= */}
        <form action="/exams" role="search" className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-[var(--ink-1)] bg-[var(--card)] p-1.5 pl-4">
          <Search className="h-5 w-5 flex-none text-[var(--ink-3)]" aria-hidden="true" />
          <label htmlFor="hero-exam-search" className="sr-only">Search your exam</label>
          <input
            id="hero-exam-search"
            name="q"
            type="search"
            placeholder="Search your exam: JPSC, SSC CGL, IBPS PO…"
            className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-[var(--ink-1)] outline-none placeholder:text-[var(--ink-3)]"
          />
          <button type="submit" className="min-h-11 rounded-[10px] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2" aria-label="Popular exams">
          {QUICK_EXAMS.map((name) => (
            <Link
              key={name}
              href={`/exams?q=${encodeURIComponent(name)}`}
              className="inline-flex min-h-9 items-center rounded-full border border-[var(--line)] px-3.5 text-sm text-[var(--ink-2)] hover:border-[var(--brand-line)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
            >
              {name}
            </Link>
          ))}
        </div>

        {user && (
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-[var(--brand)] hover:underline">
            Continue to your dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* Example of the real test interface. Illustrative only. */}
      <figure className="hidden flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--bg-secondary)] p-5 lg:flex" aria-label="Example mock test question">
        <div className="flex items-center justify-between text-xs text-[var(--ink-3)]">
          <span>JPSC Prelims · Mock 7 · Q 14 / 100</span>
          <span className="font-semibold tabular-nums text-[var(--ink-1)]" style={display}>01:42:09</span>
        </div>
        <p className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--card)] p-4 text-[15px] text-[var(--ink-1)]">
          Which river is called the “Sorrow of Bengal” and rises in Jharkhand?
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          <li className="rounded-[9px] border border-[var(--line-soft)] bg-[var(--card)] px-3.5 py-2.5 text-[var(--ink-2)]">A. Subarnarekha</li>
          <li className="flex items-center justify-between rounded-[9px] border-[1.5px] border-[var(--green)] bg-[var(--green-soft)] px-3.5 py-2.5 font-medium text-[var(--ink-1)]">
            B. Damodar <span className="text-[var(--green)]">✓ Correct</span>
          </li>
          <li className="rounded-[9px] border border-[var(--line-soft)] bg-[var(--card)] px-3.5 py-2.5 text-[var(--ink-2)]">C. Koel</li>
        </ul>
      </figure>
    </section>
  );
}

/* ── Proof line: shown once, only with real numbers ── */

function ProofLine() {
  const stats = useJson<PlatformStats>("/stats");
  if (!stats) return null;
  const items = [
    { v: stats.exams, l: "exams" },
    { v: stats.pyqPapers, l: "past papers" },
    { v: stats.testSeries, l: "test series" },
    { v: stats.users, l: "students" },
  ].filter((i) => i.v > 0);
  if (items.length === 0) return null;
  return (
    <div className="border-y border-[var(--line-soft)]">
      <dl className="mx-auto flex max-w-[1180px] flex-wrap gap-x-10 gap-y-3 px-4 py-5 sm:px-6">
        {items.map((i) => (
          <div key={i.l} className="flex items-baseline gap-1.5">
            <dt className="sr-only">{i.l}</dt>
            <dd className="text-xl font-bold tabular-nums text-[var(--ink-1)]" style={display}>
              {i.v.toLocaleString("en-IN")}+
            </dd>
            <span className="text-sm text-[var(--ink-3)]" aria-hidden="true">{i.l}</span>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ── Popular exams: compact cards, 3 facts each ── */

function PopularExams() {
  const exams = useJson<FeaturedExam[]>("/featured-exams");
  if (!exams || exams.length === 0) return null;
  return (
    <section className="bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6">
        <SectionHead title="Popular exams" link={{ href: "/exams", label: "All exams" }} />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {exams.slice(0, 8).map((exam) => (
            <li key={exam.name}>
              <Link
                href={exam.slug ? `/exams/${exam.slug}` : `/exams?q=${encodeURIComponent(exam.name)}`}
                className="flex h-full flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--card)] p-4 hover:border-[var(--brand-line)] hover:shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-9 min-w-9 place-items-center rounded-[9px] bg-[var(--bg-secondary)] px-1.5 text-[11px] font-bold text-[var(--ink-2)]" style={display}>
                    {(exam.board || exam.tag || exam.name).slice(0, 5).toUpperCase()}
                  </span>
                  {exam.state && <span className="text-xs text-[var(--ink-3)]">{exam.state}</span>}
                </div>
                <span className="font-semibold text-[var(--ink-1)]" style={display}>{exam.name}</span>
                <span className="mt-auto flex gap-3 text-xs text-[var(--ink-3)]">
                  {exam.numTests > 0 && <span>{exam.numTests} mocks</span>}
                  {exam.numPYQ > 0 && <span>{exam.numPYQ} past papers</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── What you get ── */

function Features() {
  return (
    <section className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6">
      <SectionHead title="Everything for one exam, in one place" />
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, text, href }) => (
          <li key={title}>
            <Link href={href} className="group flex gap-4 sm:flex-col sm:gap-3">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-semibold text-[var(--ink-1)] group-hover:text-[var(--brand)]" style={display}>{title}</span>
                <span className="text-sm text-[var(--ink-3)]">{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Plans ── */

function Plans() {
  return (
    <section className="mx-auto max-w-[1180px] px-4 pb-20 pt-6 sm:px-6">
      <SectionHead title="Start free. Pay for one exam." link={{ href: "/pricing", label: "Pricing details" }} />
      <PlanCards />
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[var(--bg)]">
      <Hero />
      <ProofLine />
      <PopularExams />
      <Features />
      <Plans />
    </div>
  );
}
