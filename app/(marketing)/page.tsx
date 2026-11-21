"use client";

/**
 * Homepage (v2). One job: get the student to their exam.
 *
 * Calm by design: a soft indigo wash behind the hero, soft cards (no hard
 * outlines), generous space, one accent colour for actions.
 *
 * Order: hero + exam search → proof line → browse by category (static, always
 * shown) → popular exams (live) → what you get → plans. Sections fed by the
 * API hide when data is missing; nothing shows invented numbers.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Banknote, Building2, Check, ClipboardList, FileText, Landmark,
  Search, Shield, Sparkles, Target, Timer, TrainFront,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/lib/config";
import PlanCards from "@/components/marketing/PlanCards";
import HeroGeometry from "@/components/marketing/HeroGeometry";

/* ── Data ── */

interface FeaturedExam {
  name: string;
  tag: string;
  slug: string | null;
  state: string | null;
  board: string | null;
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

/* ── Content ── */

const display = { fontFamily: "var(--font-sora)" } as const;

const QUICK_EXAMS = ["JPSC", "JSSC CGL", "BPSC", "SSC CGL", "IBPS PO", "Railway NTPC"];

/* Navigation shortcuts, not data: each opens the exam search for that group. */
const CATEGORIES = [
  { icon: Landmark, name: "State PSC", hint: "JPSC · BPSC", q: "PSC" },
  { icon: ClipboardList, name: "State SSC", hint: "JSSC · BSSC", q: "SSC" },
  { icon: Shield, name: "Police", hint: "Daroga · SI", q: "Police" },
  { icon: Banknote, name: "Banking", hint: "SBI · IBPS · RBI", q: "Bank" },
  { icon: Building2, name: "Central", hint: "SSC CGL · CHSL", q: "SSC CGL" },
  { icon: TrainFront, name: "Railway", hint: "NTPC · Group D", q: "Railway" },
];

const FEATURES = [
  { icon: FileText, title: "Past papers", text: "Every year, with solutions.", href: "/pyq/all" },
  { icon: Timer, title: "Mock tests", text: "The real CBT interface.", href: "/series/all" },
  { icon: Sparkles, title: "Daily practice", text: "A few questions every day.", href: "/daily-quiz" },
  { icon: Target, title: "Weak-topic plan", text: "Know what to fix next.", href: "/dashboard" },
];

const TRUST = ["Free to start", "Real exam interface", "English & हिंदी"];

function SectionHead({ title, link }: { title: string; link?: { href: string; label: string } }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-[-0.01em] text-[var(--ink-1)] sm:text-[1.85rem]" style={display}>
          {title}
        </h2>
        <span className="en-grow" aria-hidden="true" />
      </div>
      {link && (
        <Link href={link.href} className="inline-flex min-h-11 flex-none items-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline">
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
    <section className="en-hero-deep">
      <HeroGeometry />
      <div className="relative mx-auto flex max-w-[760px] flex-col items-center gap-7 px-4 pb-20 pt-16 text-center sm:px-6 lg:pb-28 lg:pt-24">
        <h1 className="en-rise text-[2.6rem] font-bold leading-[1.05] tracking-[-0.025em] text-white sm:text-6xl lg:text-[4.2rem]" style={display}>
          Crack your exam with <span className="text-[#C9CBFF]">real papers.</span>
        </h1>
        <p style={{ animationDelay: "80ms" }} className="en-rise max-w-[520px] text-lg leading-relaxed text-white/80">
          Past papers, mock tests and daily practice for JPSC, BPSC, SSC, Banking and Railway exams.
        </p>

        {/* Plain GET form: works without JavaScript; /exams reads ?q= */}
        <form
          action="/exams"
          role="search"
          style={{ animationDelay: "160ms" }}
          className="en-rise flex w-full max-w-[600px] items-center gap-2 rounded-[18px] bg-[var(--card)] p-2 pl-5 shadow-[0_20px_50px_-12px_rgba(10,12,60,.55)] ring-1 ring-white/20 focus-within:ring-4 focus-within:ring-white/30"
        >
          <Search className="h-5 w-5 flex-none text-[var(--ink-3)]" aria-hidden="true" />
          <label htmlFor="hero-exam-search" className="sr-only">Search your exam</label>
          <input
            id="hero-exam-search"
            name="q"
            type="search"
            placeholder="Search your exam"
            className="min-h-12 min-w-0 flex-1 bg-transparent text-base text-[var(--ink-1)] outline-none placeholder:text-[var(--ink-3)]"
          />
          <button type="submit" className="min-h-12 rounded-[12px] bg-[var(--brand)] px-6 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-hover)]">
            Search
          </button>
        </form>

        <div style={{ animationDelay: "240ms" }} className="en-rise flex flex-wrap justify-center gap-2" aria-label="Popular exams">
          {QUICK_EXAMS.map((name) => (
            <Link
              key={name}
              href={`/exams?q=${encodeURIComponent(name)}`}
              className="inline-flex min-h-9 items-center rounded-full bg-white/10 px-4 text-sm text-white/90 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"
            >
              {name}
            </Link>
          ))}
        </div>

        <ul style={{ animationDelay: "320ms" }} className="en-rise flex flex-wrap justify-center gap-x-6 gap-y-2 pt-1 text-sm text-white/75">
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#8BE3B0]" aria-hidden="true" />
              {t.includes("हिंदी") ? <>English &amp; <span lang="hi">हिंदी</span></> : t}
            </li>
          ))}
        </ul>

        {user && (
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-white hover:underline">
            Continue to your dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
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
    <dl className="mx-auto flex max-w-[1180px] flex-wrap justify-center gap-x-12 gap-y-3 border-b border-[var(--line-soft)] px-4 py-6 sm:px-6">
      {items.map((i) => (
        <div key={i.l} className="flex items-baseline gap-1.5">
          <dt className="sr-only">{i.l}</dt>
          <dd className="text-xl font-bold tabular-nums text-[var(--ink-1)]" style={display}>{i.v.toLocaleString("en-IN")}+</dd>
          <span className="text-sm text-[var(--ink-3)]" aria-hidden="true">{i.l}</span>
        </div>
      ))}
    </dl>
  );
}

/* ── Browse by category (always shown) ── */

function Categories() {
  return (
    <section className="reveal mx-auto max-w-[1180px] px-4 py-16 sm:px-6">
      <SectionHead title="Browse by category" link={{ href: "/exams", label: "All exams" }} />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.map(({ icon: Icon, name, hint, q }, i) => (
          <li key={name} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
            <Link href={`/exams?q=${encodeURIComponent(q)}`} className="group en-card en-card-link flex h-full flex-col gap-4 p-5">
              <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-[var(--brand-soft)] text-[var(--brand)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold text-[var(--ink-1)]" style={display}>{name}</span>
                <span className="text-xs text-[var(--ink-3)]">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Popular exams (live) ── */

function PopularExams() {
  const exams = useJson<FeaturedExam[]>("/featured-exams");
  if (!exams || exams.length === 0) return null;
  return (
    <section className="en-band-soft">
      <div className="reveal mx-auto max-w-[1180px] px-4 py-16 sm:px-6">
        <SectionHead title="Popular exams" link={{ href: "/exams", label: "All exams" }} />
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exams.slice(0, 8).map((exam, i) => (
            <li key={exam.name} className="reveal" style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
              <Link
                href={exam.slug ? `/exams/${exam.slug}` : `/exams?q=${encodeURIComponent(exam.name)}`}
                className="en-card en-card-link flex h-full flex-col gap-3 p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-10 min-w-10 place-items-center rounded-[10px] bg-[var(--brand-soft)] px-2 text-[11px] font-bold text-[var(--brand)]" style={display}>
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
    <section>
      <div className="reveal mx-auto max-w-[1180px] px-4 py-16 sm:px-6">
        <SectionHead title="Everything for one exam, in one place" />
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text, href }, i) => (
            <li key={title} className="reveal" style={{ transitionDelay: `${i * 90}ms` }}>
              <Link href={href} className="group en-card en-card-link flex h-full flex-col gap-4 p-6">
                <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-[var(--brand)] text-[var(--brand-ink)] shadow-[0_8px_18px_-8px_var(--brand)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-6">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[1.05rem] font-semibold text-[var(--ink-1)]" style={display}>{title}</span>
                  <span className="text-sm text-[var(--ink-3)]">{text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Plans ── */

function Plans() {
  return (
    <section className="en-band-soft">
      <div className="reveal mx-auto max-w-[1180px] px-4 py-20 sm:px-6">
      <SectionHead title="Start free. Pick your level." link={{ href: "/pricing", label: "Pricing details" }} />
      <PlanCards />
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[var(--bg)]">
      <Hero />
      <ProofLine />
      <Categories />
      <PopularExams />
      <Features />
      <Plans />
    </div>
  );
}
