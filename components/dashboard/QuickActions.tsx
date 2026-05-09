"use client";

import Link from "next/link";
import { Play, BookOpen, Flame } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="card p-6">
      <div className="mb-5">
        <div className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>Quick Actions</div>
        <div className="text-xs mt-1" style={{ color: "var(--ink-4)" }}>Pick up where you left off</div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Resume last test — primary CTA */}
        <Link
          href="/exam/demo"
          className="flex items-center gap-3.5 px-4 py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: "var(--blue)", boxShadow: "0 4px 14px -4px var(--blue-soft)" }}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/20 text-white">
            <Play size={16} fill="white" stroke="none" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">Resume Last Test</div>
            <div className="text-xs text-white/75 mt-1 truncate">
              JPSC Prelims Mock 04 · Q 18 / 100
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold text-white font-mono">52:17</div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">remaining</div>
          </div>
        </Link>

        {/* Daily Quiz — streak CTA */}
        <Link
          href="/dashboard/daily-quiz"
          className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: "var(--amber-soft)", border: "1px solid var(--amber)" }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--amber)", color: "white" }}
          >
            <Flame size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>
              Daily Quiz
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>
              Today's challenge · Keep your streak alive 🔥
            </div>
          </div>
          <span
            className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-md flex-shrink-0 text-white"
            style={{ background: "var(--amber)" }}
          >
            LIVE
          </span>
        </Link>

        {/* Latest PYQ — secondary */}
        <Link
          href="/dashboard/pyq"
          className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: "var(--bg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-xs)" }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
          >
            <BookOpen size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>
              Latest JPSC PYQ
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>
              JPSC Prelims 2023 · Full Paper
            </div>
          </div>
          <span
            className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-md flex-shrink-0"
            style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
          >
            NEW
          </span>
        </Link>
      </div>
    </div>
  );
}
