"use client";

/**
 * Command Deck — the dashboard hero.
 *
 * Replaces the old standalone greeting banner, which spent ~200px of vertical
 * space on two lines of text. Here the greeting is demoted to a single compact
 * line and the hero's real estate is given to the two things a student
 * actually needs on arrival: what to do next, and how consistent they've been.
 *
 * Layout: a slim identity strip across the top, a hairline, then an
 * asymmetric two-pane body (action | consistency) divided by a vertical rule.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play, Flame, Check, ArrowRight, Compass, Sparkles, Clock,
} from "lucide-react";
import { Bezel, Eyebrow, Track, Skel } from "./ui";
import type { ResumeTarget, WeekDay } from "./useHubData";

function greetingFor(hours: number) {
  if (hours < 5) return "Still up";
  if (hours < 12) return "Good morning";
  if (hours < 17) return "Good afternoon";
  return "Good evening";
}

export default function CommandDeck({
  name,
  target,
  week,
  weekActiveDays,
  streak,
  bestStreak,
  loading,
}: {
  name: string;
  target: ResumeTarget | null;
  week: WeekDay[];
  weekActiveDays: number;
  streak: number;
  bestStreak: number;
  loading?: boolean;
}) {
  const now = new Date();
  const firstName = (name || "Student").split(" ")[0];
  const dateLabel = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Bezel innerClassName="relative">
      {/* Ambient wash — large, soft, top-right only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 62% 130% at 82% -10%, var(--blue-soft) 0%, transparent 60%)",
        }}
      />

      <div className="relative">
        {/* ── Identity strip ─────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 sm:px-7 pt-5 pb-4">
          <div className="min-w-0">
            <Eyebrow className="mb-2">{dateLabel}</Eyebrow>
            <h1
              className="d-display text-[21px] sm:text-[24px]"
              style={{ fontFamily: "var(--font-sora)" }}
            >
              {greetingFor(now.getHours())},{" "}
              <span style={{ color: "var(--blue-ink)" }}>{firstName}</span>
            </h1>
          </div>

          <StreakMedallion streak={streak} bestStreak={bestStreak} loading={loading} />
        </div>

        <hr className="d-rule" />

        {/* ── Two-pane body ──────────────────────────────── */}
        <div className="grid lg:grid-cols-[minmax(0,1.45fr)_1px_minmax(0,1fr)]">
          <ActionPane target={target} loading={loading} />

          <div className="hidden lg:block" style={{ background: "var(--d-line-soft)" }} />
          <hr className="d-rule lg:hidden" />

          <ConsistencyPane
            week={week}
            activeDays={weekActiveDays}
            streak={streak}
            loading={loading}
          />
        </div>
      </div>
    </Bezel>
  );
}

/* ══════════════════════════════════════════════════════
   Streak medallion — compact, sits in the identity strip
══════════════════════════════════════════════════════ */

function StreakMedallion({
  streak,
  bestStreak,
  loading,
}: {
  streak: number;
  bestStreak: number;
  loading?: boolean;
}) {
  const lit = streak > 0;
  return (
    <div
      className="flex shrink-0 items-center gap-3.5 rounded-full py-2 pl-2.5 pr-5"
      style={{ background: "var(--d-inset)", border: "1px solid var(--d-line-soft)" }}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{
          background: lit ? "var(--amber-soft)" : "var(--d-inset-2)",
          color: lit ? "var(--amber)" : "var(--d-ink-4)",
          border: `1px solid ${lit ? "rgba(232,169,60,0.32)" : "var(--d-line)"}`,
        }}
      >
        {lit ? <Flame size={16} /> : <Sparkles size={15} />}
      </span>

      <span className="leading-none">
        {loading ? (
          <Skel className="h-5 w-12 rounded-md" />
        ) : (
          <span
            className="d-num block text-[18px] font-semibold"
            style={{ fontFamily: "var(--font-sora)", color: "var(--d-ink)" }}
          >
            {streak}
            <span
              className="ml-1 text-[11px] font-medium tracking-normal"
              style={{ color: "var(--d-ink-3)" }}
            >
              {streak === 1 ? "day" : "days"}
            </span>
          </span>
        )}
        <span className="d-eyebrow mt-1.5 block">Streak</span>
      </span>

      <span className="h-8 w-px" style={{ background: "var(--d-line)" }} />

      <span className="leading-none">
        {loading ? (
          <Skel className="h-5 w-8 rounded-md" />
        ) : (
          <span
            className="d-num block text-[18px] font-semibold"
            style={{ fontFamily: "var(--font-sora)", color: "var(--d-ink-3)" }}
          >
            {bestStreak}
          </span>
        )}
        <span className="d-eyebrow mt-1.5 block">Best</span>
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Action pane — the one thing to do next
══════════════════════════════════════════════════════ */

function ActionPane({
  target,
  loading,
}: {
  target: ResumeTarget | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="px-5 sm:px-7 py-6">
        <Skel className="h-2.5 w-24 rounded-full" />
        <Skel className="mt-4 h-6 w-[70%] rounded-lg" />
        <Skel className="mt-2.5 h-4 w-[48%] rounded-md" />
        <Skel className="mt-6 h-[7px] w-full rounded-full" />
        <div className="mt-5 flex gap-2.5">
          <Skel className="h-[54px] flex-1 rounded-[14px]" />
          <Skel className="h-[54px] flex-1 rounded-[14px]" />
          <Skel className="h-[54px] flex-1 rounded-[14px]" />
        </div>
        <Skel className="mt-6 h-[46px] w-[180px] rounded-full" />
      </div>
    );
  }

  if (!target) {
    return (
      <div className="flex flex-col px-5 sm:px-7 py-6">
        <Eyebrow className="mb-3">Nothing queued</Eyebrow>
        <h2 className="d-display text-[19px]" style={{ fontFamily: "var(--font-sora)" }}>
          Choose your next paper
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--d-ink-3)" }}>
          Nothing is in progress. Start a full-length mock or solve a real
          previous-year paper.
        </p>
        <div className="mt-auto pt-6 flex flex-wrap gap-2.5">
          <Link href="/dashboard/series" className="d-focus rounded-full">
            <span
              className="group inline-flex items-center gap-2 rounded-full px-5 py-[11px] text-[13.5px] font-semibold text-white transition-transform duration-300 hover:-translate-y-[1px]"
              style={{
                background: "var(--blue-ink)",
                boxShadow: "0 1px 2px rgba(13,40,126,.22), 0 8px 22px -10px rgba(13,40,126,.55)",
              }}
            >
              Browse test series
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </Link>
          <Link href="/dashboard/pyq" className="d-focus rounded-full">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-[10px] text-[13px] font-semibold transition-transform duration-200 hover:-translate-y-[1px]"
              style={{
                color: "var(--d-ink-2)",
                background: "var(--d-surface)",
                border: "1px solid var(--d-line)",
              }}
            >
              <Compass size={14} />
              Previous papers
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 sm:px-7 py-6">
      <div className="flex items-center gap-2.5">
        <Eyebrow tone="var(--blue-ink)">{target.eyebrow}</Eyebrow>
        {target.kind === "quiz" && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[9.5px] font-bold leading-none"
            style={{
              background: "var(--amber-soft)",
              color: "var(--amber)",
              border: "1px solid rgba(232,169,60,0.32)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: "var(--amber)" }}
            />
            LIVE
          </span>
        )}
      </div>

      <h2
        className="mt-3 d-display text-[20px] sm:text-[23px]"
        style={{ fontFamily: "var(--font-sora)" }}
      >
        {target.title}
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--d-ink-3)" }}>
        {target.subtitle}
      </p>

      {target.progress !== null && (
        <div className="mt-5">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="d-eyebrow">Progress</span>
            <span
              className="d-num text-[12px] font-semibold"
              style={{ color: "var(--d-ink-2)" }}
            >
              {target.progress}%
            </span>
          </div>
          <Track value={target.progress} tone="blue" height={7} />
        </div>
      )}

      {target.meta.length > 0 && (
        <div
          className="mt-5 grid gap-2.5"
          style={{ gridTemplateColumns: `repeat(${Math.min(target.meta.length, 3)}, minmax(0,1fr))` }}
        >
          {target.meta.slice(0, 3).map((m) => (
            <div key={m.label} className="d-well px-3.5 py-2.5">
              <div className="d-eyebrow">{m.label}</div>
              <div
                className="d-num mt-1.5 text-[14.5px] font-semibold leading-none"
                style={{ color: "var(--d-ink)" }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-6">
        <Link href={target.href} className="inline-block rounded-full d-focus">
          <motion.span
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="group inline-flex items-center gap-2.5 rounded-full py-[11px] pl-5 pr-[6px] text-[13.5px] font-semibold text-white"
            style={{
              background: "var(--blue-ink)",
              boxShadow: "0 1px 2px rgba(13,40,126,.22), 0 10px 28px -12px rgba(13,40,126,.6)",
            }}
          >
            {target.cta}
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              <Play size={12} fill="currentColor" stroke="none" />
            </span>
          </motion.span>
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Consistency pane — week ribbon
══════════════════════════════════════════════════════ */

function ConsistencyPane({
  week,
  activeDays,
  streak,
  loading,
}: {
  week: WeekDay[];
  activeDays: number;
  streak: number;
  loading?: boolean;
}) {
  const weekAttempts = week.reduce((sum, d) => sum + d.count, 0);
  // Today still counts as available unless it has already been practised.
  const daysLeft =
    week.filter((d) => d.state === "future").length +
    (week.some((d) => d.state === "today") ? 1 : 0);

  return (
    <div className="flex flex-col px-5 sm:px-7 py-6">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>This week</Eyebrow>
        {!loading && (
          <span
            className="d-num text-[11.5px] font-semibold"
            style={{ color: "var(--d-ink-3)" }}
          >
            {activeDays}/7 active
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {(loading ? Array.from({ length: 7 }) : week).map((raw, i) => {
          const d = raw as WeekDay | undefined;
          if (loading || !d) {
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skel className="h-2.5 w-2.5 rounded-full" />
                <Skel className="h-12 w-full rounded-[10px]" />
              </div>
            );
          }

          const isDone = d.state === "done";
          const isToday = d.state === "today";
          const isFuture = d.state === "future";

          return (
            <div key={d.key} className="flex flex-col items-center gap-2">
              <span
                className="text-[9.5px] font-bold"
                style={{
                  color: isToday
                    ? "var(--blue-ink)"
                    : isFuture
                      ? "var(--d-ink-4)"
                      : "var(--d-ink-3)",
                }}
              >
                {d.label}
              </span>
              <motion.span
                initial={{ opacity: 0, scaleY: 0.6 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                title={`${d.full} — ${
                  isFuture
                    ? "upcoming"
                    : d.count > 0
                      ? `${d.count} attempt${d.count > 1 ? "s" : ""}`
                      : "no activity"
                }`}
                className="flex h-12 w-full items-center justify-center rounded-[10px]"
                style={
                  isDone
                    ? {
                        background: "var(--green-soft)",
                        color: "var(--green)",
                        border: "1px solid rgba(59,170,111,0.34)",
                      }
                    : isToday
                      ? {
                          background: "var(--blue-soft)",
                          color: "var(--blue-ink)",
                          border: "1.5px solid rgba(29,78,216,0.45)",
                        }
                      : isFuture
                        ? {
                            background: "transparent",
                            border: "1px dashed var(--d-line)",
                          }
                        : {
                            background: "var(--d-inset)",
                            border: "1px solid var(--d-line-soft)",
                          }
                }
              >
                {isDone && <Check size={14} strokeWidth={2.8} />}
                {isToday && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: "var(--blue-ink)" }}
                  />
                )}
              </motion.span>
            </div>
          );
        })}
      </div>

      {/* Week totals — keeps this pane as dense as the action pane beside it */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <div className="d-well px-3.5 py-2.5">
          <div className="d-eyebrow">Attempts</div>
          {loading ? (
            <Skel className="mt-2 h-4 w-8 rounded-md" />
          ) : (
            <div
              className="d-num mt-1.5 text-[14.5px] font-semibold leading-none"
              style={{ color: "var(--d-ink)" }}
            >
              {weekAttempts}
              <span
                className="ml-1 text-[10.5px] font-medium"
                style={{ color: "var(--d-ink-4)" }}
              >
                this week
              </span>
            </div>
          )}
        </div>
        <div className="d-well px-3.5 py-2.5">
          <div className="d-eyebrow">Days left</div>
          {loading ? (
            <Skel className="mt-2 h-4 w-8 rounded-md" />
          ) : (
            <div
              className="d-num mt-1.5 text-[14.5px] font-semibold leading-none"
              style={{ color: "var(--d-ink)" }}
            >
              {daysLeft}
              <span
                className="ml-1 text-[10.5px] font-medium"
                style={{ color: "var(--d-ink-4)" }}
              >
                to practise
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div className="d-well flex items-start gap-3 px-3.5 py-3">
          <span
            className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{
              background: streak > 0 ? "var(--amber-soft)" : "var(--d-inset-2)",
              color: streak > 0 ? "var(--amber)" : "var(--d-ink-4)",
            }}
          >
            <Clock size={13} />
          </span>
          <p className="text-[12px] leading-snug" style={{ color: "var(--d-ink-2)" }}>
            {loading
              ? ""
              : streak > 0
                ? `Practise today to reach day ${streak + 1}.`
                : "One attempt today starts a new streak."}
          </p>
        </div>
      </div>
    </div>
  );
}
