"use client";

import Link from "next/link";
import { Clock } from "lucide-react";

interface SeriesProps {
  title: string; subtitle: string;
  done: number; total: number; daysLeft: number;
  tint: string; nextTest: string; href: string;
}

function SeriesCard({ title, subtitle, done, total, daysLeft, tint, nextTest, href }: SeriesProps) {
  const pct = Math.round((done / total) * 100);
  return (
    <div className="card card-lift p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: tint }} />
          <span className="text-xs font-bold tracking-wider" style={{ color: tint }}>SERIES</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-4)" }}>
          <Clock size={12} /> {daysLeft} days left
        </span>
      </div>

      <div
        className="text-sm font-semibold leading-snug"
        style={{ color: "var(--ink-1)", fontFamily: "var(--font-sora)" }}
      >
        {title}
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--ink-4)" }}>{subtitle}</div>

      {/* Progress */}
      <div className="mt-5 mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span style={{ color: "var(--ink-4)" }}>Progress</span>
          <span>
            <strong style={{ color: "var(--ink-1)" }}>{done}</strong>
            <span style={{ color: "var(--ink-4)" }}> / {total} · {pct}%</span>
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--line-soft)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tint, opacity: 0.85 }} />
        </div>
      </div>

      {/* Next up */}
      <div className="rounded-lg px-3.5 py-3 mb-4" style={{ background: "var(--bg)" }}>
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ink-4)" }}>
          Next up
        </div>
        <div className="text-xs font-medium" style={{ color: "var(--ink-1)" }}>{nextTest}</div>
      </div>

      <div className="flex gap-2.5">
        <Link
          href={href}
          className="flex-1 py-2.5 text-center text-sm font-semibold rounded-lg text-white transition-all hover:brightness-105"
          style={{ background: tint }}
        >
          Continue →
        </Link>
        <button
          className="px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
          style={{ border: "1px solid var(--line)", color: "var(--ink-3)", background: "transparent" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--line-soft)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          Details
        </button>
      </div>
    </div>
  );
}

export default function TestSeriesCards() {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>My Test Series</div>
          <div className="text-xs mt-1" style={{ color: "var(--ink-4)" }}>2 active series</div>
        </div>
        <Link href="/dashboard/series" className="text-xs font-semibold hover:underline" style={{ color: "var(--blue)" }}>
          Browse all →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SeriesCard
          title="JPSC Prelims 2025 — Grand Series"
          subtitle="20 full mocks + 40 subject tests"
          done={4} total={20} daysLeft={63}
          tint="var(--violet)"
          nextTest="Full Mock #05"
          href="/dashboard/series"
        />
        <SeriesCard
          title="IBPS PO 2025 — Complete Pack"
          subtitle="25 full mocks + reasoning drills"
          done={8} total={25} daysLeft={118}
          tint="var(--blue)"
          nextTest="Quantitative Aptitude — DI Special"
          href="/dashboard/series"
        />
      </div>
    </div>
  );
}
