"use client";

/**
 * Daily quiz landing (v2): deep hero with one action, the weekly subject plan
 * (today highlighted), and three short reasons. Logged-in students go straight
 * to /dashboard/daily-quiz; others sign in first.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Brain, CheckCircle2, FlaskConical, Globe2, Landmark, Lightbulb,
  Newspaper, Scale, Timer, TrendingUp, Flame,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/auth/AuthModal";
import PageHero, { SectionTitle } from "@/components/marketing/PageHero";

const WEEK = [
  { day: "Monday", subject: "Indian History", icon: Landmark },
  { day: "Tuesday", subject: "Geography", icon: Globe2 },
  { day: "Wednesday", subject: "Indian Polity", icon: Scale },
  { day: "Thursday", subject: "Indian Economy", icon: TrendingUp },
  { day: "Friday", subject: "General Science", icon: FlaskConical },
  { day: "Saturday", subject: "Current Affairs", icon: Newspaper },
  { day: "Sunday", subject: "Aptitude & Reasoning", icon: Brain },
];

const REASONS = [
  { icon: Timer, title: "About 15 minutes", text: "Short enough to do every day." },
  { icon: Lightbulb, title: "Solutions right away", text: "Learn from each mistake as you go." },
  { icon: Flame, title: "Keep a streak", text: "Small daily practice adds up." },
];

const display = { fontFamily: "var(--font-sora)" } as const;

export default function DailyQuizLandingPage() {
  const { user, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  // computed after mount so server and browser agree (the server's day may differ)
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setToday(new Date().toLocaleString("en-US", { weekday: "long" })));
    return () => cancelAnimationFrame(id);
  }, []);
  const todays = WEEK.find((w) => w.day === today);

  const cta = "inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-white px-7 text-base font-semibold text-[#3D3FB8] shadow-[0_16px_40px_-12px_rgba(10,12,60,.6)] transition-transform hover:-translate-y-0.5";

  return (
    <div className="bg-[var(--bg)]">
      <PageHero
        align="center"
        eyebrow="Daily quiz · Free"
        title="One quiz a day."
        subtitle={todays ? `Today: ${todays.subject}. A new subject every day, with solutions.` : "A new subject every day, with solutions."}
      >
        <div className="flex flex-col items-center gap-5">
          {loading ? (
            <div className="h-12 w-52 animate-pulse rounded-[14px] bg-white/20" />
          ) : user ? (
            <Link href="/dashboard/daily-quiz" className={cta}>
              Take today&apos;s quiz <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" onClick={() => setShowModal(true)} className={cta}>
              Sign in to start <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/75">
            {["New questions daily", "Instant solutions", "Always free"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#8BE3B0]" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </PageHero>

      {/* Weekly plan */}
      <section className="reveal mx-auto max-w-[1180px] px-4 py-16 sm:px-6">
        <SectionTitle>This week&apos;s plan</SectionTitle>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {WEEK.map(({ day, subject, icon: Icon }, i) => {
            const isToday = day === today;
            return (
              <li key={day} className="reveal" style={{ transitionDelay: `${i * 60}ms` }}>
                <div
                  className={`en-card relative flex h-full flex-col items-center gap-3 px-3 py-6 text-center transition-transform duration-300 ${
                    isToday ? "!border-[var(--brand)] -translate-y-1 !shadow-[inset_0_0_0_1px_var(--brand),0_16px_36px_-14px_rgba(61,63,184,.45)]" : ""
                  }`}
                  aria-current={isToday ? "date" : undefined}
                >
                  {isToday && (
                    <span className="absolute -top-2.5 rounded-full bg-[var(--brand)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                      Today
                    </span>
                  )}
                  <span className={`grid h-12 w-12 place-items-center rounded-[14px] ${isToday ? "bg-[var(--brand)] text-[var(--brand-ink)]" : "bg-[var(--brand-soft)] text-[var(--brand)]"}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">{day.slice(0, 3)}</span>
                  <span className="text-sm font-semibold leading-snug text-[var(--ink-1)]" style={display}>{subject}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Why */}
      <section className="en-band-soft">
        <div className="reveal mx-auto max-w-[1180px] px-4 py-16 sm:px-6">
          <SectionTitle>Why daily works</SectionTitle>
          <ul className="grid gap-5 md:grid-cols-3">
            {REASONS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="reveal" style={{ transitionDelay: `${i * 90}ms` }}>
                <div className="en-card flex h-full items-start gap-4 p-6">
                  <span className="grid h-11 w-11 flex-none place-items-center rounded-[12px] bg-[var(--brand)] text-[var(--brand-ink)] shadow-[0_8px_18px_-8px_var(--brand)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="font-semibold text-[var(--ink-1)]" style={display}>{title}</span>
                    <span className="text-sm text-[var(--ink-3)]">{text}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {showModal && <AuthModal onClose={() => setShowModal(false)} next="/dashboard/daily-quiz" />}
    </div>
  );
}
