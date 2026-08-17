"use client";

/**
 * Student Focus Hub — shared primitives.
 *
 * Everything here is theme-agnostic: colours come from the `.dash` token layer
 * in globals.css, which declares a full light and dark pair for each variable.
 */

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════
   Double-Bezel card
══════════════════════════════════════════════════════ */

export interface BezelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the lift-on-hover interaction. */
  interactive?: boolean;
  /** Class names applied to the inner core rather than the outer shell. */
  innerClassName?: string;
  children?: React.ReactNode;
}

export function Bezel({
  interactive,
  className,
  innerClassName,
  children,
  ...rest
}: BezelProps) {
  return (
    <div
      className={cn("d-bezel", interactive && "d-bezel-hover", className)}
      {...rest}
    >
      <div className={cn("d-bezel-inner h-full", innerClassName)}>{children}</div>
    </div>
  );
}

/** Flush single-edge card — for dense lists where a bezel would be noisy. */
export function Flat({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("d-flat", className)} {...rest}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Typography
══════════════════════════════════════════════════════ */

export function Eyebrow({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <span className={cn("d-eyebrow", className)} style={tone ? { color: tone } : undefined}>
      {children}
    </span>
  );
}

/**
 * Section heading — eyebrow above, tracking-tight title, optional trailing link.
 */
export function SectionHead({
  eyebrow,
  title,
  sub,
  action,
  className,
  size = "md",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: string;
  action?: { label: string; href: string };
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h2
          className={cn("d-title", size === "md" ? "text-[19px]" : "text-[15px]")}
          style={{ fontFamily: "var(--font-sora)" }}
        >
          {title}
        </h2>
        {sub && (
          <p className="text-[12.5px] mt-1 d-measure" style={{ color: "var(--d-ink-3)" }}>
            {sub}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group shrink-0 inline-flex items-center gap-1.5 text-[12px] font-semibold d-focus"
          style={{ color: "var(--blue-ink)" }}
        >
          {action.label}
          <ArrowRight
            size={13}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}

/**
 * Page-level header — eyebrow, display title, supporting line, and an optional
 * cluster of counts plus one trailing action. Shared by all library pages so
 * they read as one product.
 */
export function PageHeader({
  eyebrow,
  title,
  sub,
  counts,
  action,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  counts?: { label: string; value: React.ReactNode; tone?: Tone }[];
  action?: { label: string; href: string; icon?: React.ReactNode };
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4"
    >
      <div className="min-w-0">
        <Eyebrow className="mb-2.5">{eyebrow}</Eyebrow>
        <h1
          className="d-display text-[26px] sm:text-[30px]"
          style={{ fontFamily: "var(--font-sora)" }}
        >
          {title}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--d-ink-3)" }}>
          {sub}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {counts?.map((c) => (
          <span
            key={c.label}
            className="inline-flex items-baseline gap-1.5 rounded-full px-3.5 py-2"
            style={{
              background: "var(--d-surface)",
              border: "1px solid var(--d-line-soft)",
            }}
          >
            <span
              className="d-num text-[14px] font-semibold leading-none"
              style={{ color: c.tone ? TONE[c.tone].fg : "var(--d-ink)" }}
            >
              {c.value}
            </span>
            <span className="text-[11.5px] leading-none" style={{ color: "var(--d-ink-4)" }}>
              {c.label}
            </span>
          </span>
        ))}

        {action && (
          <Link href={action.href} className="rounded-full d-focus">
            <span
              className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                background: "var(--blue-soft)",
                color: "var(--blue-ink)",
                border: "1px solid rgba(29,78,216,0.28)",
              }}
            >
              {action.icon}
              {action.label}
              <ArrowRight
                size={13}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        )}
      </div>
    </motion.header>
  );
}

/* ══════════════════════════════════════════════════════
   Badges & pills
══════════════════════════════════════════════════════ */

export type Tone = "blue" | "green" | "amber" | "red" | "violet" | "cyan" | "neutral";

export const TONE: Record<Tone, { fg: string; bg: string; line: string }> = {
  blue:    { fg: "var(--blue-ink)", bg: "var(--blue-soft)",   line: "rgba(29, 78, 216, 0.22)" },
  green:   { fg: "var(--green)",    bg: "var(--green-soft)",  line: "rgba(59, 170, 111, 0.26)" },
  amber:   { fg: "var(--amber)",    bg: "var(--amber-soft)",  line: "rgba(232, 169, 60, 0.28)" },
  red:     { fg: "var(--red)",      bg: "var(--red-soft)",    line: "rgba(217, 92, 92, 0.26)" },
  violet:  { fg: "var(--violet)",   bg: "var(--violet-soft)", line: "rgba(139, 92, 246, 0.26)" },
  cyan:    { fg: "var(--cyan-ink)", bg: "var(--cyan-soft)",   line: "rgba(6, 182, 212, 0.26)" },
  neutral: { fg: "var(--d-ink-3)",  bg: "var(--d-inset)",     line: "var(--d-line)" },
};

export function Badge({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px]",
        "text-[10.5px] font-semibold leading-none whitespace-nowrap",
        className,
      )}
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.line}` }}
    >
      {icon}
      {children}
    </span>
  );
}

/** Small square icon chip used beside titles. */
export function IconChip({
  children,
  tone = "blue",
  size = 36,
  radius = 12,
}: {
  children: React.ReactNode;
  tone?: Tone;
  size?: number;
  radius?: number;
}) {
  const t = TONE[tone];
  return (
    <span
      className="inline-flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.line}`,
      }}
    >
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   Progress
══════════════════════════════════════════════════════ */

export function Track({
  value,
  tone = "blue",
  height = 6,
  className,
}: {
  /** 0–100 */
  value: number;
  tone?: Tone;
  height?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("d-track", className)} style={{ height }} role="presentation">
      <span style={{ width: `${pct}%`, background: TONE[tone].fg }} />
    </div>
  );
}

/** Circular progress ring with a value in the middle. */
export function Ring({
  value,
  size = 92,
  stroke = 8,
  tone = "blue",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  children?: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--d-inset-2)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE[tone].fg}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Sparkline — hand-rolled SVG, no chart dependency
══════════════════════════════════════════════════════ */

export function Sparkline({
  points,
  tone = "blue",
  height = 56,
  className,
}: {
  points: number[];
  tone?: Tone;
  height?: number;
  className?: string;
}) {
  const id = React.useId();
  if (points.length < 2) return null;

  const W = 100;
  const H = 100;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  // Pad the range so a flat-ish series still reads as a line, not an edge.
  const norm = points.map((p) => 90 - ((p - min) / span) * 76);
  const step = W / (points.length - 1);

  const line = norm
    .map((y, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const fg = TONE[tone].fg;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fg} stopOpacity="0.28" />
          <stop offset="100%" stopColor={fg} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={fg}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={W}
        cy={norm[norm.length - 1]}
        r="3"
        fill={fg}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   Skeletons
══════════════════════════════════════════════════════ */

export function Skel({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={cn("d-skel", className)} style={style} aria-hidden="true" />;
}

/** Screen-reader announcement for any loading region. */
export function LoadingRegion({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Empty state
══════════════════════════════════════════════════════ */

export function EmptyState({
  art,
  eyebrow,
  title,
  body,
  action,
  secondary,
}: {
  art?: React.ReactNode;
  eyebrow?: string;
  title: string;
  body: string;
  action?: { label: string; href: string };
  secondary?: React.ReactNode;
}) {
  return (
    <Bezel innerClassName="px-6 py-14 sm:py-16">
      <div className="flex flex-col items-center text-center">
        {art ?? <EmptyArt />}
        {eyebrow && <Eyebrow className="mt-8 mb-3">{eyebrow}</Eyebrow>}
        <h3
          className="d-display text-[21px] sm:text-[24px]"
          style={{ fontFamily: "var(--font-sora)" }}
        >
          {title}
        </h3>
        <p
          className="mt-2.5 text-[13.5px] leading-relaxed"
          style={{ color: "var(--d-ink-3)", maxWidth: "42ch" }}
        >
          {body}
        </p>
        {(action || secondary) && (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {action && (
              <Link href={action.href} className="d-focus">
                <PrimaryButton>{action.label}</PrimaryButton>
              </Link>
            )}
            {secondary}
          </div>
        )}
      </div>
    </Bezel>
  );
}

/**
 * Default empty-state illustration — concentric rings with a floating card,
 * drawn from tokens so it recolours itself in dark mode.
 */
export function EmptyArt({ icon }: { icon?: React.ReactNode }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 148, height: 108 }}>
      <svg width="148" height="108" viewBox="0 0 148 108" fill="none" aria-hidden="true">
        <circle cx="74" cy="54" r="49" stroke="var(--d-line-soft)" strokeWidth="1" />
        <circle cx="74" cy="54" r="34" stroke="var(--d-line)" strokeWidth="1" strokeDasharray="3 5" />
        <rect
          x="46" y="34" width="56" height="40" rx="9"
          fill="var(--d-surface)" stroke="var(--d-line)" strokeWidth="1"
        />
        <rect x="55" y="45" width="30" height="4" rx="2" fill="var(--d-inset-2)" />
        <rect x="55" y="55" width="20" height="4" rx="2" fill="var(--d-inset-2)" />
        <circle cx="112" cy="30" r="9" fill="var(--blue-soft)" stroke="var(--blue-ink)" strokeWidth="1" strokeOpacity="0.35" />
        <circle cx="34" cy="76" r="6" fill="var(--cyan-soft)" stroke="var(--cyan-ink)" strokeWidth="1" strokeOpacity="0.3" />
      </svg>
      {icon && (
        <span
          className="absolute"
          style={{ color: "var(--blue-ink)", top: 44, left: "50%", transform: "translateX(-50%)" }}
        >
          {icon}
        </span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Buttons
══════════════════════════════════════════════════════ */

export function PrimaryButton({
  children,
  icon,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }) {
  return (
    <button
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full",
        "px-5 py-[11px] text-[13.5px] font-semibold tracking-[-0.01em] text-white",
        "transition-all duration-300 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.985] d-focus",
        className,
      )}
      style={{
        background: "var(--blue-ink)",
        boxShadow: "0 1px 2px rgba(13,40,126,.22), 0 8px 22px -10px rgba(13,40,126,.55)",
      }}
      {...rest}
    >
      {children}
      {icon ?? (
        <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
      )}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full",
        "px-4 py-[10px] text-[13px] font-semibold transition-all duration-200 d-focus",
        "hover:-translate-y-[1px]",
        className,
      )}
      style={{
        color: "var(--d-ink-2)",
        background: "var(--d-surface)",
        border: "1px solid var(--d-line)",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════
   Motion presets
══════════════════════════════════════════════════════ */

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export const stagger = (delay = 0.04) => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: delay, delayChildren: 0.05 } },
});

/* ══════════════════════════════════════════════════════
   Formatting helpers
══════════════════════════════════════════════════════ */

export function pluralize(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function relativeDate(input?: string | Date | null): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < day) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function scoreTone(pct: number): Tone {
  if (pct >= 75) return "green";
  if (pct >= 50) return "amber";
  return "red";
}
