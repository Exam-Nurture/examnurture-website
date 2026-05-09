"use client";

import { Eye } from "lucide-react";
import Link from "next/link";

const ROWS = [
  { name: "JPSC Prelims Full Mock #04", subj: "All subjects",  date: "24 Apr 2026", score: "64/100", pct: 64, percentile: 81.4, grade: "good" as const },
  { name: "Reasoning — Syllogisms",     subj: "Chapter Test",  date: "23 Apr 2026", score: "18/30",  pct: 60, percentile: 72.0, grade: "mid"  as const },
  { name: "GK — Indian History",        subj: "Subject Test",  date: "21 Apr 2026", score: "14/25",  pct: 56, percentile: 63.5, grade: "low"  as const },
];

const GRADE = {
  good: { bg: "rgba(16,185,129,.1)",  fg: "#059669" },
  mid:  { bg: "rgba(245,158,11,.1)",  fg: "#B45309" },
  low:  { bg: "rgba(239,68,68,.1)",   fg: "#DC2626" },
};

export default function RecentTests() {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>Recent Tests</div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-4)" }}>Your last 3 attempts</div>
        </div>
        <a href="/dashboard/series" className="text-[11px] font-semibold hover:underline" style={{ color: "var(--blue)" }}>
          See all →
        </a>
      </div>

      {/* Table header */}
      <div
        className="hidden md:grid grid-cols-[2.5fr_1fr_1.2fr_1fr_1.1fr] gap-4 px-3 pb-2.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--ink-4)", borderBottom: "1px solid var(--line-soft)" }}
      >
        <div>Test</div>
        <div>Date</div>
        <div>Score</div>
        <div>Percentile</div>
        <div />
      </div>

      {ROWS.map((r) => {
        const g = GRADE[r.grade];
        return (
          <div
            key={r.name}
            className="flex flex-col md:grid md:grid-cols-[2.5fr_1fr_1.2fr_1fr_1.1fr] gap-3 md:gap-4 items-start md:items-center px-3 py-4 rounded-[8px] transition-all hover:bg-[var(--bg)]"
            style={{ borderBottom: "1px solid var(--line-soft)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: g.bg, color: g.fg }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M9 13h6M9 17h4" />
                </svg>
              </div>
              <div>
                <div className="text-[12px] font-semibold" style={{ color: "var(--ink-1)" }}>{r.name}</div>
                <div className="text-[10px]" style={{ color: "var(--ink-4)" }}>{r.subj}</div>
              </div>
            </div>
            <div className="text-[11px]" style={{ color: "var(--ink-3)" }}>{r.date}</div>
            <div>
              <div className="text-[12px] font-semibold font-mono" style={{ color: "var(--ink-1)" }}>{r.score}</div>
              <div className="h-1 mt-1.5 rounded-full overflow-hidden" style={{ background: "var(--line-soft)" }}>
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: g.fg, opacity: 0.7 }} />
              </div>
            </div>
            <div>
              <span
                className="text-[11px] font-bold px-2 py-1 rounded-[6px] font-mono"
                style={{ background: g.bg, color: g.fg }}
              >
                {r.percentile} %ile
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <button
                className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-all hover:bg-[var(--blue-soft)] hover:text-[var(--blue)]"
                style={{ color: "var(--ink-4)" }}
              >
                <Eye size={14} />
              </button>
              <Link
                href="/results/demo"
                className="text-[11px] font-semibold px-2 py-1.5 rounded-[6px] transition-all hover:bg-[var(--blue-soft)]"
                style={{ color: "var(--blue)" }}
              >
                Review →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
