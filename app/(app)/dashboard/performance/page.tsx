"use client";

/**
 * Performance (v2): everything about "how am I doing", in one calm page.
 *   summary numbers → score trend → weak topics → recent tests.
 * Data: /user/analytics (trend, weak topics), /user/dashboard (streaks),
 * /analytics/me (recent attempts with exam names).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { apiFetch, apiGetAnalytics, apiGetDashboard, type AnalyticsData, type DashboardData } from "@/lib/api";

interface MyAttempts {
  summary: { totalTestAttempts: number; totalPYQAttempts: number };
  testAttempts: {
    items: { attemptId: string; testId: string; testTitle: string; examName: string | null; pct: number; completedAt: string; timeTakenSec: number }[];
  };
}

const display = { fontFamily: "var(--font-sora)" } as const;

function tone(v: number) {
  return v < 40 ? "var(--red)" : v < 70 ? "var(--amber)" : "var(--green)";
}

function TrendChart({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <p className="py-10 text-center text-sm text-[var(--ink-3)]">Take two or more tests to see your trend.</p>;
  }
  const w = 640, h = 200, l = 34, r = 12, t = 12, b = 26;
  const x = (i: number) => l + (i / (values.length - 1)) * (w - l - r);
  const y = (v: number) => t + (1 - Math.max(0, Math.min(100, v)) / 100) * (h - t - b);
  const round = (n: number) => Math.round(n * 10) / 10;
  const pts = values.map((v, i) => `${round(x(i))},${round(y(v))}`).join(" ");
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full min-w-[420px]" role="img" aria-label={`Score trend across ${values.length} tests, from ${values[0]}% to ${values[values.length - 1]}%`}>
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line x1={l} x2={w - r} y1={round(y(g))} y2={round(y(g))} stroke="var(--line-soft)" strokeDasharray={g === 0 ? undefined : "3 5"} />
            <text x={l - 8} y={round(y(g)) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)">{g}%</text>
          </g>
        ))}
        <polygon points={`${round(x(0))},${round(y(0))} ${pts} ${round(x(values.length - 1))},${round(y(0))}`} fill="var(--brand-soft)" />
        <polyline points={pts} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {values.map((v, i) => (
          <circle key={i} cx={round(x(i))} cy={round(y(v))} r={i === values.length - 1 ? 5 : 3} fill={i === values.length - 1 ? "var(--brand)" : "var(--card)"} stroke="var(--brand)" strokeWidth="2" />
        ))}
        <text x={l} y={h - 6} fontSize="11" fill="var(--ink-3)">First</text>
        <text x={w - r} y={h - 6} fontSize="11" fill="var(--ink-3)" textAnchor="end">Latest</text>
      </svg>
    </div>
  );
}

export default function PerformancePage() {
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [mine, setMine] = useState<MyAttempts | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([apiGetAnalytics(), apiGetDashboard(), apiFetch("/analytics/me?limit=10") as Promise<MyAttempts>]).then(([a, d, m]) => {
      if (!alive) return;
      if (a.status === "fulfilled") setStats(a.value);
      if (d.status === "fulfilled") setDash(d.value);
      if (m.status === "fulfilled") setMine(m.value);
      if ([a, d, m].every((x) => x.status === "rejected")) setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const pcts = useMemo(
    () => (stats?.scoreProgress ?? []).filter((s) => s.totalMarks > 0).map((s) => Math.round((s.score / s.totalMarks) * 100)),
    [stats],
  );
  const avg = pcts.length ? Math.round(pcts.reduce((p, c) => p + c, 0) / pcts.length) : null;
  const best = pcts.length ? Math.max(...pcts) : null;
  const recentDelta = pcts.length >= 4 ? Math.round(pcts.slice(-3).reduce((p, c) => p + c, 0) / 3 - pcts.slice(0, -3).reduce((p, c) => p + c, 0) / (pcts.length - 3)) : null;

  const kpis = [
    { v: mine ? String(mine.summary.totalTestAttempts) : stats ? String(stats.attemptHistory.length) : "–", l: "mock tests" },
    { v: mine ? String(mine.summary.totalPYQAttempts) : "–", l: "past papers" },
    { v: avg !== null ? `${avg}%` : "–", l: "average score" },
    { v: best !== null ? `${best}%` : "–", l: "best score" },
    { v: dash ? `${dash.streak.current}` : "–", l: `day streak${dash ? ` · best ${dash.streak.longest}` : ""}` },
  ];

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-10 px-4 py-8 sm:px-6 lg:py-12">
      <header className="en-rise">
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-[var(--ink-1)] sm:text-4xl" style={display}>Performance</h1>
        <p className="mt-1 text-[var(--ink-3)]">How your scores are moving, and what to fix next.</p>
      </header>

      {failed && <p className="en-card p-6 text-sm text-[var(--ink-3)]">Couldn&apos;t load your performance right now. Try again in a moment.</p>}

      <section aria-label="Summary" style={{ animationDelay: "60ms" }} className="en-rise grid grid-cols-2 gap-4 sm:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.l} className="en-card p-5">
            <p className="text-2xl font-bold tabular-nums text-[var(--ink-1)]" style={display}>{k.v}</p>
            <p className="mt-0.5 text-xs text-[var(--ink-3)]">{k.l}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="trend-title" className="reveal en-card p-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="trend-title" className="text-lg font-semibold text-[var(--ink-1)]" style={display}>Score trend</h2>
          {recentDelta !== null && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${recentDelta >= 0 ? "bg-[var(--green-soft)] text-[var(--green)]" : "bg-[var(--red-soft)] text-[var(--red)]"}`}>
              Last 3 tests {recentDelta >= 0 ? "+" : ""}{recentDelta} pts vs before
            </span>
          )}
        </div>
        <TrendChart values={pcts.slice(-20)} />
      </section>

      <section aria-labelledby="weak-title" className="reveal">
        <h2 id="weak-title" className="mb-4 text-lg font-semibold text-[var(--ink-1)]" style={display}>Topics to work on</h2>
        {!stats || stats.weakTopics.length === 0 ? (
          <p className="en-card p-6 text-sm text-[var(--ink-3)]">Topic strengths appear after your first few tests.</p>
        ) : (
          <ul className="en-card divide-y divide-[var(--line-soft)]">
            {stats.weakTopics.map((t) => (
              <li key={`${t.examId}-${t.topicName}`} className="grid grid-cols-[1fr_120px_44px] items-center gap-4 px-5 py-3.5 sm:grid-cols-[1fr_200px_48px]">
                <span className="truncate text-[15px] text-[var(--ink-1)]">{t.topicName}</span>
                <span className="h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]" aria-hidden="true">
                  <span className="block h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, t.strength))}%`, background: tone(t.strength) }} />
                </span>
                <span className="text-right text-sm font-semibold tabular-nums" style={{ color: tone(t.strength) }}>{Math.round(t.strength)}%</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-title" className="reveal">
        <h2 id="recent-title" className="mb-4 text-lg font-semibold text-[var(--ink-1)]" style={display}>Recent tests</h2>
        {!mine || mine.testAttempts.items.length === 0 ? (
          <p className="en-card p-6 text-sm text-[var(--ink-3)]">
            No tests yet. <Link href="/dashboard/course#mocks" className="font-semibold text-[var(--brand)] hover:underline">Take your first mock</Link>.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mine.testAttempts.items.map((a) => (
              <li key={a.attemptId} className="en-card flex items-center gap-4 p-4 sm:p-5">
                <span className="grid h-12 w-14 flex-none place-items-center rounded-[12px] text-sm font-bold tabular-nums" style={{ ...display, color: tone(a.pct), background: "var(--bg-secondary)" }}>
                  {a.pct}%
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[var(--ink-1)]">{a.testTitle}</span>
                  <span className="block truncate text-xs text-[var(--ink-3)]">
                    {[a.examName, new Date(a.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), a.timeTakenSec ? `${Math.round(a.timeTakenSec / 60)} min` : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <Link href={`/exam/${a.testId}`} className="inline-flex min-h-10 flex-none items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-3.5 text-xs font-semibold text-[var(--ink-2)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Retake
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
