"use client";

/**
 * Overview widgets — each one is a self-contained bento cell that renders its
 * own loading, empty and populated states.
 */

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check, Flame, Lock, Target, TrendingUp, TrendingDown, Minus,
  ArrowUpRight, FileText, BookMarked, Layers, Trophy, Activity as ActivityIcon,
} from "lucide-react";
import {
  Bezel, Eyebrow, SectionHead, Skel, Sparkline, Track, TONE,
  type Tone, relativeDate, scoreTone,
} from "./ui";
import type { ActivityItem, SeriesLite } from "./useHubData";

/* ══════════════════════════════════════════════════════
   Stat widget
══════════════════════════════════════════════════════ */

export interface StatSpec {
  key: string;
  label: string;
  value: string | number | null;
  suffix?: string;
  icon: React.ReactNode;
  tone: Tone;
  /** Small caption under the value. */
  caption: string;
  /** Direction arrow next to the caption. */
  direction?: "up" | "down" | "flat";
  /** Rendered instead of the value when the metric has no data yet. */
  lockedHint?: string;
  href?: string;
}

export function StatWidget({ spec, loading }: { spec: StatSpec; loading?: boolean }) {
  const locked = spec.value === null || spec.value === undefined;
  const t = TONE[spec.tone];

  const Arrow =
    spec.direction === "up" ? TrendingUp : spec.direction === "down" ? TrendingDown : Minus;
  const arrowColor =
    spec.direction === "up"
      ? "var(--green)"
      : spec.direction === "down"
        ? "var(--red)"
        : "var(--d-ink-4)";

  const body = (
    <Bezel
      interactive={Boolean(spec.href)}
      className="h-full"
      innerClassName="h-full px-4 py-4 flex flex-col gap-3.5"
    >
      {/* Row 1: icon + label share a line, so the tile stays compact */}
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: t.bg, color: t.fg, border: `1px solid ${t.line}` }}
        >
          {spec.icon}
        </span>
        <span className="d-eyebrow min-w-0 truncate">{spec.label}</span>
        {spec.href && (
          <ArrowUpRight
            size={14}
            className="ml-auto shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ color: "var(--d-ink-4)" }}
          />
        )}
      </div>

      {/* Row 2: the number */}
      {loading ? (
        <Skel className="h-8 w-20 rounded-lg" />
      ) : locked ? (
        <div
          className="flex items-center gap-1.5 text-[13px] font-medium"
          style={{ color: "var(--d-ink-4)" }}
        >
          <Lock size={13} />
          {spec.lockedHint ?? "Not enough data"}
        </div>
      ) : (
        <div
          className="d-num flex items-baseline gap-1 text-[29px] font-semibold leading-none"
          style={{ fontFamily: "var(--font-sora)", color: "var(--d-ink)" }}
        >
          {spec.value}
          {spec.suffix && (
            <span className="text-[15px] font-medium" style={{ color: "var(--d-ink-4)" }}>
              {spec.suffix}
            </span>
          )}
        </div>
      )}

      {/* Row 3: caption, pinned to the bottom so all four tiles align */}
      <div className="mt-auto">
        {loading ? (
          <Skel className="h-3 w-24 rounded-full" />
        ) : (
          <div className="flex items-center gap-1.5 text-[11.5px] font-medium">
            {!locked && spec.direction && (
              <Arrow size={12} style={{ color: arrowColor }} className="shrink-0" />
            )}
            <span className="truncate" style={{ color: "var(--d-ink-3)" }}>
              {spec.caption}
            </span>
          </div>
        )}
      </div>
    </Bezel>
  );

  return spec.href ? (
    <Link href={spec.href} className="group block h-full d-focus rounded-[22px]">
      {body}
    </Link>
  ) : (
    <div className="group h-full">{body}</div>
  );
}

/* ══════════════════════════════════════════════════════
   Accuracy trend
══════════════════════════════════════════════════════ */

export function TrendPanel({
  trend,
  accuracy,
  loading,
}: {
  trend: number[];
  accuracy: number | null;
  loading?: boolean;
}) {
  const enough = trend.length >= 2;
  const delta = enough ? trend[trend.length - 1] - trend[0] : 0;

  return (
    <Bezel className="h-full" innerClassName="h-full px-5 sm:px-6 py-6 flex flex-col">
      <SectionHead
        size="sm"
        eyebrow="Performance"
        title="Accuracy trend"
        sub="Score percentage across your recent attempts"
      />

      {loading ? (
        <div className="mt-7 flex-1">
          <Skel className="h-8 w-24 rounded-lg" />
          <Skel className="mt-6 h-[90px] w-full rounded-xl" />
        </div>
      ) : !enough ? (
        <div className="mt-7 flex flex-1 flex-col items-center justify-center py-6 text-center">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: "var(--d-inset)", color: "var(--d-ink-4)" }}
          >
            <ActivityIcon size={18} />
          </span>
          <p className="mt-4 text-[13px]" style={{ color: "var(--d-ink-3)", maxWidth: "34ch" }}>
            Finish at least two tests and your accuracy curve will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <div
                className="d-num flex items-baseline gap-1 text-[30px] font-semibold leading-none"
                style={{ fontFamily: "var(--font-sora)", color: "var(--d-ink)" }}
              >
                {accuracy ?? trend[trend.length - 1]}
                <span className="text-[15px] font-medium" style={{ color: "var(--d-ink-4)" }}>
                  %
                </span>
              </div>
              <div className="d-eyebrow mt-2.5">Average accuracy</div>
            </div>

            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[11px] font-semibold"
              style={{
                background: delta >= 0 ? "var(--green-soft)" : "var(--red-soft)",
                color: delta >= 0 ? "var(--green)" : "var(--red)",
                border: `1px solid ${delta >= 0 ? "rgba(59,170,111,0.26)" : "rgba(217,92,92,0.26)"}`,
              }}
            >
              {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {delta >= 0 ? "+" : ""}
              {delta} pts
            </div>
          </div>

          <div className="mt-5 flex-1">
            <Sparkline
              points={trend}
              tone={delta >= 0 ? "green" : "amber"}
              height={92}
            />
            <div
              className="mt-2 flex justify-between text-[10px] font-medium"
              style={{ color: "var(--d-ink-4)" }}
            >
              <span>Oldest</span>
              <span>Latest</span>
            </div>
          </div>
        </>
      )}
    </Bezel>
  );
}

/* ══════════════════════════════════════════════════════
   Activity feed
══════════════════════════════════════════════════════ */

export function ActivityFeed({
  items,
  loading,
}: {
  items: ActivityItem[];
  loading?: boolean;
}) {
  return (
    <Bezel className="h-full" innerClassName="h-full px-5 sm:px-6 py-6 flex flex-col">
      <SectionHead
        size="sm"
        eyebrow="Timeline"
        title="Recent activity"
        action={items.length > 0 ? { label: "All results", href: "/dashboard/series" } : undefined}
      />

      {loading ? (
        <div className="mt-6 flex flex-col gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skel className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1">
                <Skel className="h-3.5 w-[70%] rounded-md" />
                <Skel className="mt-2 h-3 w-[40%] rounded-md" />
              </div>
              <Skel className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center py-8 text-center">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: "var(--d-inset)", color: "var(--d-ink-4)" }}
          >
            <FileText size={18} />
          </span>
          <p className="mt-4 text-[13px]" style={{ color: "var(--d-ink-3)", maxWidth: "32ch" }}>
            No attempts yet. Your completed tests will appear here as a timeline.
          </p>
        </div>
      ) : (
        <ol className="relative mt-6 flex flex-col">
          {/* Spine */}
          <span
            aria-hidden="true"
            className="absolute left-[15px] top-2 bottom-6 w-px"
            style={{ background: "var(--d-line-soft)" }}
          />

          {items.slice(0, 5).map((item, i) => {
            const tone: Tone = item.pct !== undefined ? scoreTone(item.pct) : "neutral";
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex items-start gap-3.5 pb-5 last:pb-0"
              >
                <span
                  className="relative z-[1] mt-0.5 flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: TONE[tone].bg,
                    color: TONE[tone].fg,
                    border: `1px solid ${TONE[tone].line}`,
                    boxShadow: "0 0 0 4px var(--d-surface)",
                  }}
                >
                  <Check size={13} strokeWidth={2.6} />
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[13px] font-semibold leading-snug"
                    style={{ color: "var(--d-ink)" }}
                  >
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11.5px]" style={{ color: "var(--d-ink-4)" }}>
                    {item.sub} · {relativeDate(item.when)}
                  </p>
                </div>

                {item.pct !== undefined && (
                  <span
                    className="d-num shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{
                      background: TONE[tone].bg,
                      color: TONE[tone].fg,
                      border: `1px solid ${TONE[tone].line}`,
                    }}
                  >
                    {item.pct}%
                  </span>
                )}
              </motion.li>
            );
          })}
        </ol>
      )}
    </Bezel>
  );
}

/* ══════════════════════════════════════════════════════
   Focus areas (weak topics)
══════════════════════════════════════════════════════ */

export function FocusPanel({
  topics,
  loading,
}: {
  topics: { topicName: string; strength: number }[];
  loading?: boolean;
}) {
  return (
    <Bezel className="h-full" innerClassName="h-full px-5 sm:px-6 py-6 flex flex-col">
      <SectionHead
        size="sm"
        eyebrow="Where to improve"
        title="Focus areas"
        sub="Topics with the lowest measured strength"
      />

      {loading ? (
        <div className="mt-6 flex flex-col gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <Skel className="h-3.5 w-[60%] rounded-md" />
              <Skel className="mt-2.5 h-[6px] w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center py-8 text-center">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: "var(--d-inset)", color: "var(--d-ink-4)" }}
          >
            <Target size={18} />
          </span>
          <p className="mt-4 text-[13px]" style={{ color: "var(--d-ink-3)", maxWidth: "32ch" }}>
            Attempt a few tests and we&apos;ll surface the topics worth your next hour.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          {topics.map((t) => {
            const tone: Tone = t.strength < 45 ? "red" : t.strength < 65 ? "amber" : "green";
            return (
              <div key={t.topicName}>
                <div className="mb-2.5 flex items-baseline justify-between gap-3">
                  <span
                    className="truncate text-[13px] font-medium"
                    style={{ color: "var(--d-ink)" }}
                  >
                    {t.topicName}
                  </span>
                  <span
                    className="d-num shrink-0 text-[12px] font-semibold"
                    style={{ color: TONE[tone].fg }}
                  >
                    {t.strength}%
                  </span>
                </div>
                <Track value={t.strength} tone={tone} />
              </div>
            );
          })}
        </div>
      )}
    </Bezel>
  );
}

/* ══════════════════════════════════════════════════════
   Test-series rail
══════════════════════════════════════════════════════ */

export function SeriesRail({
  series,
  loading,
}: {
  series: SeriesLite[];
  loading?: boolean;
}) {
  return (
    <Bezel innerClassName="px-5 sm:px-6 py-6">
      <SectionHead
        eyebrow="Your library"
        title="Test series"
        sub="Everything you have access to, with progress at a glance"
        action={{ label: "View all", href: "/dashboard/series" }}
      />

      {loading ? (
        <div className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="d-well p-4">
              <Skel className="h-2.5 w-14 rounded-full" />
              <Skel className="mt-3.5 h-4 w-[85%] rounded-md" />
              <Skel className="mt-2 h-4 w-[55%] rounded-md" />
              <Skel className="mt-5 h-[6px] w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : series.length === 0 ? (
        <div className="mt-6 d-well flex flex-col items-center px-6 py-10 text-center">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: "var(--d-surface)", color: "var(--d-ink-4)", border: "1px solid var(--d-line-soft)" }}
          >
            <Layers size={18} />
          </span>
          <p className="mt-4 text-[13.5px] font-medium" style={{ color: "var(--d-ink-2)" }}>
            No test series yet
          </p>
          <p className="mt-1.5 text-[12.5px]" style={{ color: "var(--d-ink-4)", maxWidth: "40ch" }}>
            Enrol in a series to get structured, full-length practice.
          </p>
          <Link
            href="/series/all"
            className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold d-focus"
            style={{ color: "var(--blue-ink)" }}
          >
            Explore series <ArrowUpRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {series.slice(0, 3).map((s) => {
            const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
            return (
              <Link
                key={s.id}
                href={`/dashboard/series/${s.id}`}
                className="group d-well flex flex-col p-4 transition-all duration-300 hover:-translate-y-[2px] d-focus"
              >
                <div className="flex items-center justify-between gap-2">
                  <Eyebrow>{s.exam}</Eyebrow>
                  {!s.isPaid && (
                    <span
                      className="rounded-full px-2 py-[3px] text-[9.5px] font-bold leading-none"
                      style={{
                        background: "var(--green-soft)",
                        color: "var(--green)",
                        border: "1px solid rgba(59,170,111,0.26)",
                      }}
                    >
                      FREE
                    </span>
                  )}
                </div>

                <p
                  className="mt-3 line-clamp-2 text-[13.5px] font-semibold leading-snug transition-colors duration-200 group-hover:text-[var(--blue-ink)]"
                  style={{ color: "var(--d-ink)" }}
                >
                  {s.title}
                </p>

                <div className="mt-auto pt-5">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-[11px]" style={{ color: "var(--d-ink-4)" }}>
                      {s.total > 0 ? `${s.done} / ${s.total} tests` : "Tests coming soon"}
                    </span>
                    <span
                      className="d-num text-[11px] font-semibold"
                      style={{ color: "var(--d-ink-3)" }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <Track value={pct} tone={pct >= 60 ? "green" : "blue"} height={5} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Bezel>
  );
}

/* ══════════════════════════════════════════════════════
   Quick launch tiles
══════════════════════════════════════════════════════ */

const LAUNCH = [
  { href: "/dashboard/pyq",         label: "Previous papers", desc: "Solve real exam papers", icon: FileText,   tone: "blue" as Tone },
  { href: "/dashboard/daily-quiz",  label: "Daily quiz",      desc: "Ten questions a day",    icon: Flame,      tone: "amber" as Tone },
  { href: "/dashboard/saved-blogs", label: "Reading list",    desc: "Saved articles & notes", icon: BookMarked, tone: "violet" as Tone },
  { href: "/exams",                 label: "Browse exams",    desc: "Find your next target",  icon: Trophy,     tone: "cyan" as Tone },
];

export function QuickLaunch() {
  return (
    <Bezel innerClassName="px-5 sm:px-6 py-6">
      <SectionHead size="sm" eyebrow="Shortcuts" title="Jump back in" />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {LAUNCH.map(({ href, label, desc, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="group d-well flex flex-col gap-3 p-4 transition-all duration-300 hover:-translate-y-[2px] d-focus"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[11px]"
              style={{
                background: TONE[tone].bg,
                color: TONE[tone].fg,
                border: `1px solid ${TONE[tone].line}`,
              }}
            >
              <Icon size={16} />
            </span>
            <span>
              <span
                className="block text-[13px] font-semibold transition-colors duration-200 group-hover:text-[var(--blue-ink)]"
                style={{ color: "var(--d-ink)" }}
              >
                {label}
              </span>
              <span className="mt-1 block text-[11.5px]" style={{ color: "var(--d-ink-4)" }}>
                {desc}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </Bezel>
  );
}
