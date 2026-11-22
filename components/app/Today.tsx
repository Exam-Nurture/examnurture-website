"use client";

/**
 * Today (v2 dashboard). Three blocks, nothing else:
 *   1. Next step   — one action, chosen from real data
 *   2. Today       — daily quiz + the weakest topic
 *   3. Progress    — four numbers and a trend line; details on Performance
 *
 * Next step order: choose exam → first past paper → retry a weak mock
 * (last score < 50%) → next mock. There is no "resume" because the backend only
 * stores finished attempts.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Flame, Sparkles, Target } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMyExam } from "@/lib/my-exam";
import { apiGetAnalytics, apiGetDashboard, apiGetExamById, type AnalyticsData, type DashboardData } from "@/lib/api";
import ExamPicker from "@/components/app/ExamPicker";
import HeroGeometry from "@/components/marketing/HeroGeometry";

const display = { fontFamily: "var(--font-sora)" } as const;

function greeting(h: number) {
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <p className="text-xs text-[var(--ink-3)]">Your trend appears after two tests.</p>;
  const w = 240, h = 56, pad = 4;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - (Math.max(0, Math.min(100, v)) / 100) * (h - pad * 2);
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" role="img" aria-label={`Score trend over your last ${values.length} tests, latest ${values[values.length - 1]}%`}>
      <line x1="0" y1={h - pad} x2={w} y2={h - pad} stroke="var(--line-soft)" />
      <polygon points={`${pts[0][0]},${h - pad} ${line} ${lx},${h - pad}`} fill="var(--brand-soft)" />
      <polyline points={line} fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="4" fill="var(--brand)" />
    </svg>
  );
}

export default function Today() {
  const { user } = useAuth();
  const { exam, ready, setExam } = useMyExam();
  const [picking, setPicking] = useState(false);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([apiGetDashboard(), apiGetAnalytics()]).then(([d, a]) => {
      if (!alive) return;
      if (d.status === "fulfilled") setDash(d.value);
      if (a.status === "fulfilled") setStats(a.value);
      if (d.status === "rejected" && a.status === "rejected") setFailed(true);
    });
    const t = requestAnimationFrame(() => setHour(new Date().getHours()));
    return () => {
      alive = false;
      cancelAnimationFrame(t);
    };
  }, []);

  useEffect(() => {
    if (!exam) return;
    let alive = true;
    (apiGetExamById(exam.id) as Promise<{ daysLeft?: number | null }>)
      .then((e) => alive && setDaysLeft(typeof e.daysLeft === "number" && e.daysLeft > 0 ? e.daysLeft : null))
      .catch(() => alive && setDaysLeft(null));
    return () => {
      alive = false;
    };
  }, [exam]);

  const pcts = useMemo(
    () => (stats?.scoreProgress ?? []).filter((s) => s.totalMarks > 0).map((s) => Math.round((s.score / s.totalMarks) * 100)),
    [stats],
  );
  const tests = stats?.attemptHistory?.length ?? 0;
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
  const best = pcts.length ? Math.max(...pcts) : null;
  const streak = dash?.streak?.current ?? 0;
  const weakest = (stats?.weakTopics ?? []).filter((t) => t.strength < 70)[0] ?? null;
  const last = dash?.recentAttempts?.[0];
  const lastPct = last && last.totalMarks ? Math.round((last.score / last.totalMarks) * 100) : null;

  // ── Next step (one action) ──
  const next: { eyebrow: string; title: string; sub: string; cta: string; href?: string; onClick?: () => void } = !exam
    ? { eyebrow: "Start here", title: "Choose your exam", sub: "We'll set up your course, papers and mocks around it.", cta: "Choose exam", onClick: () => setPicking(true) }
    : tests === 0
      ? { eyebrow: "Next step", title: "Attempt your first past paper", sub: `See where you stand in ${exam.shortName || exam.name}. Takes one sitting.`, cta: "Open past papers", href: "/dashboard/course#papers" }
      : last && lastPct !== null && lastPct < 50
        ? { eyebrow: "Next step", title: `Retry ${last.test.title}`, sub: `You scored ${lastPct}% last time. A second attempt locks it in.`, cta: "Retry test", href: `/exam/${last.test.id}` }
        : { eyebrow: "Next step", title: "Take your next mock test", sub: "Keep the rhythm: one full mock moves your score the most.", cta: "Open mock tests", href: "/dashboard/course#mocks" };

  const first = user?.name?.split(" ")[0];
  const ctaCls = "inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-white px-6 text-sm font-semibold text-[#3D3FB8] shadow-[0_14px_32px_-12px_rgba(10,12,60,.6)] transition-transform hover:-translate-y-0.5";

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12">
      {/* Greeting + countdown */}
      <header className="en-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--ink-3)]">{hour === null ? " " : new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.02em] text-[var(--ink-1)] sm:text-4xl" style={display}>
            {hour === null ? "Welcome" : greeting(hour)}{first ? `, ${first}` : ""}
          </h1>
        </div>
        {daysLeft !== null && (
          <div className="flex items-center gap-3 rounded-[16px] bg-[var(--accent-soft)] px-4 py-2.5">
            <Calendar className="h-5 w-5 text-[var(--accent-ink)]" aria-hidden="true" />
            <p className="leading-tight">
              <span className="block text-xl font-bold tabular-nums text-[var(--accent-ink)]" style={display}>{daysLeft} days</span>
              <span className="text-xs text-[var(--accent-ink)]/80">to {exam?.shortName || exam?.name}</span>
            </p>
          </div>
        )}
      </header>

      {/* 1 · Next step */}
      <section
        aria-labelledby="next-title"
        style={{ animationDelay: "80ms" }}
        className="en-rise relative overflow-hidden rounded-[24px] text-white shadow-[0_24px_60px_-24px_rgba(27,29,99,.7)]"
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(70% 120% at 90% 0%, rgba(124,118,255,.55) 0%, transparent 60%), linear-gradient(155deg, #1B1D63 0%, #2A2C99 55%, #3D3FB8 100%)" }} aria-hidden="true" />
        <div className="opacity-70"><HeroGeometry variant="compact" chartSide="right" /></div>
        <div className="relative flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#C9CBFF]">{ready ? next.eyebrow : " "}</p>
            <h2 id="next-title" className="mt-2 text-2xl font-bold leading-tight sm:text-[1.75rem]" style={display}>{ready ? next.title : " "}</h2>
            <p className="mt-2 text-white/80">{ready ? next.sub : " "}</p>
          </div>
          {ready &&
            (next.href ? (
              <Link href={next.href} className={ctaCls}>{next.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            ) : (
              <button type="button" onClick={next.onClick} className={ctaCls}>{next.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            ))}
        </div>
      </section>

      {/* 2 · Today */}
      <section aria-labelledby="today-title" className="reveal">
        <h2 id="today-title" className="mb-4 text-lg font-semibold text-[var(--ink-1)]" style={display}>Today</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/daily-quiz" className="group en-card en-card-link flex items-start gap-4 p-5">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-[12px] bg-[var(--brand)] text-[var(--brand-ink)] shadow-[0_8px_18px_-8px_var(--brand)] transition-transform duration-300 group-hover:rotate-6">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[var(--ink-1)]">Daily quiz</span>
                {streak > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-ink)]">
                    <Flame className="h-3 w-3" aria-hidden="true" />{streak}-day streak
                  </span>
                )}
              </span>
              <span className="text-sm text-[var(--ink-3)]">{dash?.dailyPractice?.count ? `${dash.dailyPractice.count} questions picked for you` : "A few questions picked for you"}</span>
            </span>
          </Link>

          {weakest ? (
            <Link href="/dashboard/course#papers" className="group en-card en-card-link flex items-start gap-4 p-5">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-[12px] bg-[var(--red)]/10 text-[var(--red)] transition-transform duration-300 group-hover:rotate-6">
                <Target className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-[var(--ink-1)]">{weakest.topicName}</span>
                  <span className="text-xs font-semibold tabular-nums text-[var(--red)]">{Math.round(weakest.strength)}%</span>
                </span>
                <span className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                  <span className="block h-full rounded-full bg-[var(--red)]" style={{ width: `${Math.max(4, Math.min(100, weakest.strength))}%` }} />
                </span>
                <span className="text-sm text-[var(--ink-3)]">Your weakest topic. Practise it today.</span>
              </span>
            </Link>
          ) : (
            <div className="en-card flex items-start gap-4 p-5">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-[12px] bg-[var(--bg-secondary)] text-[var(--ink-3)]">
                <Target className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-semibold text-[var(--ink-1)]">Weak topics</span>
                <span className="text-sm text-[var(--ink-3)]">They appear here after your first test.</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 3 · Progress */}
      <section aria-labelledby="progress-title" className="reveal">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 id="progress-title" className="text-lg font-semibold text-[var(--ink-1)]" style={display}>Progress</h2>
          <Link href="/dashboard/performance" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline">
            Details <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {failed ? (
          <p className="en-card p-6 text-sm text-[var(--ink-3)]">Couldn&apos;t load your progress right now.</p>
        ) : (
          <div className="en-card grid gap-6 p-6 sm:grid-cols-[repeat(4,auto)_1fr] sm:items-center">
            {[
              { v: stats ? String(tests) : "–", l: "tests taken" },
              { v: avg !== null ? `${avg}%` : "–", l: "average score" },
              { v: best !== null ? `${best}%` : "–", l: "best score" },
              { v: dash ? String(streak) : "–", l: "day streak" },
            ].map((k) => (
              <div key={k.l}>
                <p className="text-2xl font-bold tabular-nums text-[var(--ink-1)]" style={display}>{k.v}</p>
                <p className="text-xs text-[var(--ink-3)]">{k.l}</p>
              </div>
            ))}
            <div className="min-w-0 sm:pl-4">
              <Sparkline values={pcts.slice(-10)} />
            </div>
          </div>
        )}
      </section>

      {picking && (
        <ExamPicker
          current={exam}
          onClose={() => setPicking(false)}
          onPick={(e) => {
            setExam(e);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
