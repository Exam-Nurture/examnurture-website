"use client";

/**
 * Aggregates every source the overview needs into one view-model.
 *
 * Live data wins. The demo dataset is only substituted when a request *fails*
 * (backend down / local dev without an API) — never when the backend
 * legitimately reports that the student has done nothing yet, because that
 * case has its own designed empty state.
 */

import { useEffect, useMemo, useState } from "react";
import {
  apiGetDashboard,
  apiGetAnalytics,
  apiGetTestSeries,
  type DashboardData,
  type AnalyticsData,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/* ══════════════════════════════════════════════════════
   View-model
══════════════════════════════════════════════════════ */

export type DayState = "done" | "today" | "future" | "missed";

export interface WeekDay {
  key: string;
  label: string;
  full: string;
  state: DayState;
  count: number;
}

export interface ResumeTarget {
  kind: "test" | "quiz" | "pyq";
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  /** 0–100, or null when the task has not been started. */
  progress: number | null;
  meta: { label: string; value: string }[];
}

export interface ActivityItem {
  id: string;
  title: string;
  sub: string;
  when: string;
  at: number;
  score?: number;
  total?: number;
  pct?: number;
}

export interface SeriesLite {
  id: string;
  title: string;
  exam: string;
  done: number;
  total: number;
  isPaid: boolean;
}

export interface HubData {
  attempts: number;
  accuracy: number | null;
  streak: number;
  bestStreak: number;
  pending: number;
  seriesAttended: number;
  pyqAttended: number;
  bookmarks: number;
  week: WeekDay[];
  weekActiveDays: number;
  resume: ResumeTarget | null;
  activity: ActivityItem[];
  trend: number[];
  series: SeriesLite[];
  weakTopics: { topicName: string; strength: number }[];
  upcoming: { id: string; title: string; scheduledAt: string }[];
}

export interface HubState {
  loading: boolean;
  data: HubData;
  /** True when at least one request failed and demo content is standing in. */
  isDemo: boolean;
}

/* ══════════════════════════════════════════════════════
   Demo dataset — only used when the API is unreachable
══════════════════════════════════════════════════════ */

const DEMO_ACTIVITY: ActivityItem[] = [
  { id: "d1", title: "JPSC Prelims — Full Mock 04", sub: "General Studies", when: "2h ago",     at: Date.now() - 7.2e6,  score: 128, total: 200, pct: 64 },
  { id: "d2", title: "Reasoning — Syllogisms Drill", sub: "Chapter test",    when: "Yesterday",  at: Date.now() - 9e7,    score: 24,  total: 30,  pct: 80 },
  { id: "d3", title: "SSC CGL 2023 — Tier 1",        sub: "Previous paper",  when: "2d ago",     at: Date.now() - 1.8e8,  score: 142, total: 200, pct: 71 },
  { id: "d4", title: "Indian Polity — Fundamental Rights", sub: "Subject test", when: "4d ago", at: Date.now() - 3.5e8,  score: 31,  total: 50,  pct: 62 },
  { id: "d5", title: "Quantitative Aptitude — DI Set", sub: "Chapter test",   when: "6d ago",    at: Date.now() - 5.2e8,  score: 18,  total: 25,  pct: 72 },
];

const DEMO_SERIES: SeriesLite[] = [
  { id: "demo-1", title: "JPSC Prelims 2026 — Grand Test Series", exam: "JPSC", done: 6,  total: 20, isPaid: true },
  { id: "demo-2", title: "SSC CGL Tier 1 — Complete Pack",        exam: "SSC CGL", done: 11, total: 25, isPaid: true },
  { id: "demo-3", title: "Railway NTPC — Foundation Mocks",       exam: "NTPC", done: 2,  total: 15, isPaid: false },
];

const DEMO_RESUME: ResumeTarget = {
  kind: "test",
  eyebrow: "Pick up where you left off",
  title: "JPSC Prelims — Full Mock 05",
  subtitle: "General Studies Paper I · 100 questions",
  href: "/dashboard/series",
  cta: "Resume test",
  progress: 42,
  meta: [
    { label: "Answered", value: "42 / 100" },
    { label: "Time left", value: "52:17" },
    { label: "Marked", value: "6" },
  ],
};

function demoWeek(): WeekDay[] {
  // Mark a handful of the days already elapsed this week.
  const now = new Date();
  const sinceMonday = (now.getDay() + 6) % 7;
  const keys: string[] = [];
  for (let i = 0; i <= sinceMonday; i++) {
    if (i % 2 === 0 || i === sinceMonday) keys.push(dayKeyOffset(sinceMonday - i));
  }
  return buildWeek(keys, keys.map((_, i) => (i % 3) + 1));
}

/* ══════════════════════════════════════════════════════
   Date helpers
══════════════════════════════════════════════════════ */

const DAY_LABEL = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function dayKeyOffset(back: number): string {
  const d = new Date();
  d.setDate(d.getDate() - back);
  return dayKey(d);
}

/**
 * Builds the current calendar week, Monday → Sunday.
 *
 * A trailing-7-day window was tried first but produced orderings like
 * "T W T F S S M" under a "This week" heading, which reads as a bug.
 * Days later in the week are marked `future` rather than `missed`.
 *
 * `activeKeys` marks days with at least one attempt; `counts` is optional and
 * positionally aligned to `activeKeys`.
 */
function buildWeek(activeKeys: string[], counts?: number[]): WeekDay[] {
  const active = new Map<string, number>();
  activeKeys.forEach((k, i) => active.set(k, counts?.[i] ?? 1));

  const now = new Date();
  const todayKey = dayKey(now);
  // getDay(): 0 = Sunday. Shift so Monday is the first column.
  const sinceMonday = (now.getDay() + 6) % 7;

  const out: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - sinceMonday + i);
    const key = dayKey(d);
    const hit = active.get(key) ?? 0;

    out.push({
      key,
      label: DAY_LABEL[d.getDay()],
      full: DAY_FULL[d.getDay()],
      count: hit,
      state:
        hit > 0 ? "done" : key === todayKey ? "today" : i > sinceMonday ? "future" : "missed",
    });
  }
  return out;
}

/* ══════════════════════════════════════════════════════
   Hook
══════════════════════════════════════════════════════ */

const EMPTY: HubData = {
  attempts: 0,
  accuracy: null,
  streak: 0,
  bestStreak: 0,
  pending: 0,
  seriesAttended: 0,
  pyqAttended: 0,
  bookmarks: 0,
  week: buildWeek([]),
  weekActiveDays: 0,
  resume: null,
  activity: [],
  trend: [],
  series: [],
  weakTopics: [],
  upcoming: [],
};

export function useHubData(): HubState {
  const { user } = useAuth();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [series, setSeries] = useState<SeriesLite[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    Promise.allSettled([
      apiGetDashboard(),
      apiGetAnalytics(),
      apiGetTestSeries({ limit: 8 }),
    ]).then((results) => {
      if (!alive) return;

      const [d, a, s] = results;
      if (d.status === "fulfilled") setDash(d.value);
      if (a.status === "fulfilled") setAnalytics(a.value);
      if (s.status === "fulfilled") {
        const items = ((s.value as { items?: unknown[] })?.items ?? []) as Record<string, any>[];
        setSeries(
          items.map((it) => ({
            id: String(it.id),
            title: String(it.title ?? "Test series"),
            exam: String(it.exam?.shortName ?? it.exam?.name ?? "General"),
            done: Number(it.completedTests ?? 0),
            total: Number(it.totalTests ?? it.tests?.length ?? 0),
            isPaid: Boolean(it.isPaid),
          })),
        );
      }

      // Only fall back when the two primary endpoints both failed — a partial
      // response is still real data and must not be overwritten with fiction.
      setFailed(d.status === "rejected" && a.status === "rejected");
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, []);

  const data = useMemo<HubData>(() => {
    if (failed) {
      const trend = [52, 58, 55, 63, 61, 69, 66, 74, 71, 78];
      return {
        attempts: 37,
        accuracy: 71,
        streak: 5,
        bestStreak: 14,
        pending: 2,
        seriesAttended: 3,
        pyqAttended: 12,
        bookmarks: 24,
        week: demoWeek(),
        weekActiveDays: 5,
        resume: DEMO_RESUME,
        activity: DEMO_ACTIVITY,
        trend,
        series: DEMO_SERIES,
        weakTopics: [
          { topicName: "Modern Indian History", strength: 38 },
          { topicName: "Data Interpretation", strength: 46 },
          { topicName: "Indian Polity", strength: 58 },
        ],
        upcoming: [],
      };
    }

    const stats = user?.stats;
    const history = analytics?.attemptHistory ?? [];
    const progress = analytics?.scoreProgress ?? [];
    const recent = dash?.recentAttempts ?? [];

    /* ── Accuracy: mean of score/totalMarks across every recorded attempt ── */
    const scored = history.filter((h) => h.totalMarks > 0);
    const accuracy = scored.length
      ? Math.round(
          (scored.reduce((sum, h) => sum + h.score / h.totalMarks, 0) / scored.length) * 100,
        )
      : null;

    /* ── Trend: chronological percentage series for the sparkline ── */
    const trend = progress
      .filter((p) => p.totalMarks > 0)
      .slice(-12)
      .map((p) => Math.round((p.score / p.totalMarks) * 100));

    /* ── Weekly ribbon derived from real attempt timestamps ── */
    const keyCounts = new Map<string, number>();
    history.forEach((h) => {
      if (!h.completedAt) return;
      const d = new Date(h.completedAt);
      if (Number.isNaN(d.getTime())) return;
      const k = dayKey(d);
      keyCounts.set(k, (keyCounts.get(k) ?? 0) + 1);
    });
    const keys = [...keyCounts.keys()];
    const week = buildWeek(keys, keys.map((k) => keyCounts.get(k) ?? 1));

    /* ── Activity feed ── */
    const activity: ActivityItem[] = recent.slice(0, 6).map((r) => {
      const pct = r.totalMarks > 0 ? Math.round((r.score / r.totalMarks) * 100) : undefined;
      return {
        id: r.id,
        title: r.test?.title ?? "Test attempt",
        sub: r.timeTakenSec
          ? `Completed in ${Math.round(r.timeTakenSec / 60)} min`
          : "Attempt recorded",
        when: r.completedAt,
        at: r.completedAt ? new Date(r.completedAt).getTime() : 0,
        score: r.score,
        total: r.totalMarks,
        pct,
      };
    });

    /* ── What to do next ── */
    const nextUp = dash?.upcomingTests?.[0];
    const quizReady = dash?.dailyPractice?.available;

    let resume: ResumeTarget | null = null;
    if (quizReady) {
      resume = {
        kind: "quiz",
        eyebrow: "Today's priority",
        title: "Daily Quiz is live",
        subtitle: `${dash?.dailyPractice.count ?? 10} questions · keeps your streak alive`,
        href: "/dashboard/daily-quiz",
        cta: "Start daily quiz",
        progress: null,
        meta: [
          { label: "Questions", value: String(dash?.dailyPractice.count ?? 10) },
          { label: "Streak", value: `${dash?.streak.current ?? 0} days` },
          { label: "Best", value: `${dash?.streak.longest ?? 0} days` },
        ],
      };
    } else if (nextUp) {
      resume = {
        kind: "test",
        eyebrow: "Scheduled next",
        title: nextUp.title,
        subtitle: new Date(nextUp.scheduledAt).toLocaleString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        }),
        href: `/dashboard/tests/${nextUp.id}`,
        cta: "Open test",
        progress: null,
        meta: [
          { label: "Duration", value: `${Math.round((nextUp.durationSec ?? 0) / 60)} min` },
        ],
      };
    } else if (recent[0]) {
      resume = {
        kind: "test",
        eyebrow: "Keep the momentum",
        title: "Review your last attempt",
        subtitle: recent[0].test?.title ?? "Recent test",
        href: `/results/${recent[0].id}`,
        cta: "View analysis",
        progress:
          recent[0].totalMarks > 0
            ? Math.round((recent[0].score / recent[0].totalMarks) * 100)
            : null,
        meta: [
          { label: "Score", value: `${recent[0].score} / ${recent[0].totalMarks}` },
        ],
      };
    }

    return {
      attempts: stats?.attempts ?? history.length,
      accuracy,
      streak: dash?.streak.current ?? stats?.streakCurrent ?? 0,
      bestStreak: dash?.streak.longest ?? stats?.streakLongest ?? 0,
      pending: (quizReady ? 1 : 0) + (dash?.upcomingTests?.length ?? 0),
      seriesAttended: stats?.attendedTestSeries ?? 0,
      pyqAttended: stats?.attendedPYQ ?? 0,
      bookmarks: stats?.bookmarks ?? 0,
      week,
      weekActiveDays: week.filter((d) => d.state === "done").length,
      resume,
      activity,
      trend,
      series: series ?? [],
      weakTopics:
        analytics?.weakTopics
          ?.slice(0, 4)
          .map((w) => ({ topicName: w.topicName, strength: Math.round(w.strength) })) ?? [],
      upcoming:
        dash?.upcomingTests?.slice(0, 3).map((t) => ({
          id: t.id,
          title: t.title,
          scheduledAt: t.scheduledAt,
        })) ?? [],
    };
  }, [failed, user, dash, analytics, series]);

  return { loading, data: loading ? EMPTY : data, isDemo: failed };
}
