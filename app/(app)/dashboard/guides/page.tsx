"use client";

import { useState } from "react";
import { BookOpen, FileText, ChevronDown, ChevronUp, CheckCircle2, ExternalLink, Zap } from "lucide-react";
import { EXAM_BOARDS } from "@/lib/data/examData";

/**
 * Guide content lives here (levels, topics, notes, PYQ counts).
 * Board metadata (name, tint, pattern) is derived from examData.ts.
 * To add a new guide: (1) add the exam to examData with hasGuide:true,
 * (2) add a GUIDE_CONTENT entry below with the same boardId.
 */

/* ─── Types ─── */
type TopicStatus = "done" | "in-progress" | "locked" | "available";

type Topic = {
  name: string;
  notes: number;
  pyqs: number;
  strength: number;  // 0–100
  status: TopicStatus;
};

type Level = {
  level: number;
  label: string;
  topics: Topic[];
};

type ExamGuide = {
  id: string;
  boardId: string;    // matches ExamBoard.id in examData.ts
  name: string;
  shortName: string;
  tint: string;       // fallback if examData board not found
  colorSoft: string;
  about: string;
  totalTopics: number;
  totalNotes: number;
  totalPYQs: number;
  levels: Level[];
};

/* ─── Guide content data ───────────────────────────────────────
   boardId links each guide to examData.ts for metadata enrichment.
   Content (levels, topics) stays here as it is learning content.
──────────────────────────────────────────────────────────────── */
const GUIDES: ExamGuide[] = [
  {
    id: "jpsc",
    boardId: "state-psc",
    name: "JPSC Prelims 2025",
    shortName: "JPSC",
    tint: "#8B5CF6",
    colorSoft: "#F5F3FF",
    about: "Jharkhand Public Service Commission · 100 Qs · 2 hrs · Paper I",
    totalTopics: 18,
    totalNotes: 120,
    totalPYQs: 600,
    levels: [
      {
        level: 1,
        label: "Foundation",
        topics: [
          { name: "Indian History & Freedom Struggle", notes: 14, pyqs: 80, strength: 71, status: "done" },
          { name: "Indian Constitution & Polity",      notes: 12, pyqs: 60, strength: 55, status: "in-progress" },
          { name: "Jharkhand State — History & Culture", notes: 10, pyqs: 50, strength: 0, status: "available" },
        ],
      },
      {
        level: 2,
        label: "Core GK",
        topics: [
          { name: "Indian Economy & Budget",  notes: 10, pyqs: 55, strength: 0, status: "available" },
          { name: "Geography — India & World", notes: 11, pyqs: 48, strength: 0, status: "available" },
          { name: "Science & Technology",      notes: 8,  pyqs: 40, strength: 0, status: "available" },
          { name: "Environment & Ecology",     notes: 6,  pyqs: 30, strength: 0, status: "locked" },
        ],
      },
      {
        level: 3,
        label: "Reasoning & Aptitude",
        topics: [
          { name: "Syllogisms & Statements",     notes: 6,  pyqs: 28, strength: 0, status: "locked" },
          { name: "Blood Relations & Directions", notes: 5,  pyqs: 22, strength: 0, status: "locked" },
          { name: "Series & Analogies",           notes: 5,  pyqs: 25, strength: 0, status: "locked" },
          { name: "Coding & Decoding",            notes: 4,  pyqs: 18, strength: 0, status: "locked" },
        ],
      },
      {
        level: 4,
        label: "Current Affairs & Advanced",
        topics: [
          { name: "Current Affairs — National",         notes: 8,  pyqs: 35, strength: 0, status: "locked" },
          { name: "Current Affairs — Jharkhand",        notes: 5,  pyqs: 20, strength: 0, status: "locked" },
          { name: "Sports, Awards & Important Dates",   notes: 4,  pyqs: 18, strength: 0, status: "locked" },
        ],
      },
    ],
  },
  {
    id: "ibps-po",
    boardId: "banking-po",
    name: "IBPS PO Prelims 2025",
    shortName: "Banking",
    tint: "#2563EB",
    colorSoft: "#EFF6FF",
    about: "IBPS PO · 100 Qs · 1 hr · Sectional cutoff · 3 sections",
    totalTopics: 15,
    totalNotes: 95,
    totalPYQs: 520,
    levels: [
      {
        level: 1,
        label: "English Language",
        topics: [
          { name: "Reading Comprehension",      notes: 8, pyqs: 45, strength: 80, status: "done" },
          { name: "Error Detection & Fill Ups", notes: 6, pyqs: 38, strength: 0, status: "available" },
          { name: "Sentence Rearrangement",     notes: 5, pyqs: 30, strength: 0, status: "locked" },
        ],
      },
      {
        level: 2,
        label: "Quantitative Aptitude",
        topics: [
          { name: "Number Series & Simplification", notes: 7,  pyqs: 40, strength: 58, status: "in-progress" },
          { name: "Data Interpretation",            notes: 10, pyqs: 55, strength: 44, status: "in-progress" },
          { name: "Arithmetic — SI, CI, Profit",    notes: 8,  pyqs: 42, strength: 0, status: "locked" },
          { name: "Time, Speed & Work",              notes: 6,  pyqs: 35, strength: 0, status: "locked" },
        ],
      },
      {
        level: 3,
        label: "Reasoning Ability",
        topics: [
          { name: "Puzzles & Seating Arrangement", notes: 9, pyqs: 50, strength: 0, status: "locked" },
          { name: "Syllogisms",                    notes: 5, pyqs: 28, strength: 0, status: "locked" },
          { name: "Inequality & Coding",           notes: 6, pyqs: 32, strength: 0, status: "locked" },
          { name: "Blood Relations",               notes: 4, pyqs: 22, strength: 0, status: "locked" },
        ],
      },
    ],
  },
  {
    id: "ssc-cgl",
    boardId: "ssc-upper",
    name: "SSC CGL Tier I 2025",
    shortName: "SSC",
    tint: "#10B981",
    colorSoft: "#ECFDF5",
    about: "SSC CGL Tier I · 100 Qs · 1 hr · 4 sections · No sectional cutoff",
    totalTopics: 16,
    totalNotes: 100,
    totalPYQs: 480,
    levels: [
      {
        level: 1,
        label: "General Awareness",
        topics: [
          { name: "Static GK — History & Polity", notes: 10, pyqs: 45, strength: 0, status: "available" },
          { name: "Science — Physics, Chemistry",  notes: 8,  pyqs: 38, strength: 0, status: "available" },
          { name: "Current Affairs",               notes: 6,  pyqs: 30, strength: 0, status: "locked" },
        ],
      },
      {
        level: 2,
        label: "Reasoning",
        topics: [
          { name: "Analogies & Classification",     notes: 5, pyqs: 30, strength: 0, status: "locked" },
          { name: "Matrix & Word Formation",        notes: 4, pyqs: 22, strength: 0, status: "locked" },
          { name: "Venn Diagrams & Syllogisms",     notes: 5, pyqs: 25, strength: 0, status: "locked" },
        ],
      },
    ],
  },
  {
    id: "rrb-ntpc",
    boardId: "railway-ntpc",
    name: "RRB NTPC CBT 1 2025",
    shortName: "Railway",
    tint: "#F59E0B",
    colorSoft: "#FFFBEB",
    about: "RRB NTPC · 100 Qs · 1.5 hrs · General Awareness heavy",
    totalTopics: 12,
    totalNotes: 80,
    totalPYQs: 400,
    levels: [
      {
        level: 1,
        label: "General Awareness",
        topics: [
          { name: "Indian Railways — Facts & History", notes: 7, pyqs: 38, strength: 0, status: "available" },
          { name: "Current Affairs — 6 months",        notes: 6, pyqs: 30, strength: 0, status: "locked" },
          { name: "Geography & Environment",           notes: 6, pyqs: 28, strength: 0, status: "locked" },
        ],
      },
      {
        level: 2,
        label: "Mathematics",
        topics: [
          { name: "Number System & HCF/LCM",   notes: 5, pyqs: 25, strength: 0, status: "locked" },
          { name: "Percentage, Ratio & Average", notes: 6, pyqs: 28, strength: 0, status: "locked" },
        ],
      },
    ],
  },
];

const statusStyle: Record<TopicStatus, { dot: string; label: string }> = {
  done:        { dot: "#10B981", label: "Done" },
  "in-progress": { dot: "#F59E0B", label: "In Progress" },
  available:   { dot: "#2563EB", label: "Start" },
  locked:      { dot: "#CBD5E1", label: "Locked" },
};

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function GuidesPage() {
  const [activeGuide, setActiveGuide] = useState("jpsc");
  const [openLevels, setOpenLevels]   = useState<Set<number>>(new Set([1]));

  const guide = GUIDES.find((g) => g.id === activeGuide)!;

  const toggleLevel = (lvl: number) =>
    setOpenLevels((prev) => {
      const next = new Set(prev);
      next.has(lvl) ? next.delete(lvl) : next.add(lvl);
      return next;
    });

  // Compute overall progress
  const allTopics   = guide.levels.flatMap((l) => l.topics);
  const doneTopics  = allTopics.filter((t) => t.status === "done").length;
  const inProg      = allTopics.filter((t) => t.status === "in-progress").length;
  const pct         = Math.round(((doneTopics + inProg * 0.5) / allTopics.length) * 100);

  return (
    <div className="flex flex-col gap-7 fade-up" style={{ maxWidth: 960 }}>

      {/* Header */}
      <div>
        <h1
          className="text-[22px] font-bold tracking-tight"
          style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
        >
          Exam Guides
        </h1>
        <p className="text-[12px] mt-1.5" style={{ color: "var(--ink-4)" }}>
          Structured syllabus paths · Study notes · PYQ practice per topic — all in one place
        </p>
      </div>

      {/* Exam selector pills — boards that have guide content */}
      <div className="flex flex-wrap gap-2">
        {GUIDES.map((g) => {
          /* Enrich with examData for tint/colorSoft when possible */
          const board = EXAM_BOARDS.find((b) => b.id === g.boardId);
          const tint  = board?.tint ?? g.tint;
          return (
            <button
              key={g.id}
              onClick={() => { setActiveGuide(g.id); setOpenLevels(new Set([1])); }}
              className="px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-150"
              style={
                activeGuide === g.id
                  ? { background: tint, color: "white", boxShadow: `0 4px 10px -3px ${tint}55` }
                  : { background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink-2)" }
              }
            >
              {g.shortName}
            </button>
          );
        })}
      </div>

      {/* Guide hero card */}
      <div
        className="rounded-[16px] p-5 relative overflow-hidden"
        style={{ background: "white", border: `1.5px solid ${guide.tint}30`, boxShadow: "var(--shadow-sm)" }}
      >
        <div
          className="absolute -right-10 -top-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${guide.tint}10, transparent 70%)` }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div
              className="text-[18px] font-bold"
              style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
            >
              {guide.name}
            </div>
            <div className="text-[12px] mt-1" style={{ color: "var(--ink-3)" }}>{guide.about}</div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mt-3">
              {[
                { icon: <BookOpen size={12} />, val: guide.totalTopics, label: "Topics" },
                { icon: <FileText size={12} />, val: guide.totalNotes,  label: "Study Notes" },
                { icon: <Zap size={12} />,      val: guide.totalPYQs,   label: "PYQ Questions" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
                  <span style={{ color: guide.tint }}>{s.icon}</span>
                  <strong style={{ color: "var(--ink-1)" }}>{s.val}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress circle */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <ProgressCircle pct={pct} tint={guide.tint} />
            <span className="text-[11px]" style={{ color: "var(--ink-4)" }}>
              {doneTopics}/{allTopics.length} topics done
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span style={{ color: "var(--ink-3)" }}>Overall Progress</span>
            <span style={{ color: guide.tint, fontWeight: 600 }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: guide.tint }}
            />
          </div>
        </div>
      </div>

      {/* Level-by-level curriculum */}
      <div className="flex flex-col gap-3">
        {guide.levels.map((lvl) => {
          const isOpen   = openLevels.has(lvl.level);
          const lvlDone  = lvl.topics.filter((t) => t.status === "done").length;
          const lvlTotal = lvl.topics.length;
          const lvlPct   = Math.round((lvlDone / lvlTotal) * 100);

          return (
            <div
              key={lvl.level}
              className="rounded-[14px] overflow-hidden"
              style={{ background: "white", border: "1px solid var(--line-soft)", boxShadow: "var(--shadow-xs)" }}
            >
              {/* Level header */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[var(--bg)] transition-all duration-150"
                onClick={() => toggleLevel(lvl.level)}
              >
                {/* Level badge */}
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: guide.colorSoft, color: guide.tint }}
                >
                  L{lvl.level}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>
                      Level {lvl.level} — {lvl.label}
                    </span>
                    {lvlDone === lvlTotal && (
                      <CheckCircle2 size={14} style={{ color: "#10B981", flexShrink: 0 }} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 w-24 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${lvlPct}%`, background: guide.tint }}
                      />
                    </div>
                    <span className="text-[11px]" style={{ color: "var(--ink-4)" }}>
                      {lvlDone}/{lvlTotal} done · {lvlTotal} topics
                    </span>
                  </div>
                </div>

                {/* Jump link */}
                {!isOpen && lvl.level < guide.levels.length && (
                  <span
                    className="text-[11px] font-medium mr-2 hidden md:block"
                    style={{ color: guide.tint }}
                  >
                    Jump to L{lvl.level + 1}
                  </span>
                )}

                {isOpen
                  ? <ChevronUp  size={15} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
                  : <ChevronDown size={15} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
                }
              </button>

              {/* Topics — expand/collapse */}
              <div
                className="overflow-hidden transition-all duration-200"
                style={{ maxHeight: isOpen ? lvl.topics.length * 100 : 0 }}
              >
                <div style={{ borderTop: "1px solid var(--line-soft)" }}>
                  {lvl.topics.map((topic, i) => {
                    const st = statusStyle[topic.status];
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-4 px-5 py-3.5 transition-all duration-100 hover:bg-[var(--bg)]"
                        style={{
                          borderBottom: i < lvl.topics.length - 1 ? "1px solid var(--line-soft)" : "none",
                          opacity: topic.status === "locked" ? 0.55 : 1,
                        }}
                      >
                        {/* Status dot */}
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: st.dot }}
                        />

                        {/* Topic info */}
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-[13px] font-medium"
                            style={{ color: topic.status === "locked" ? "var(--ink-4)" : "var(--ink-1)" }}
                          >
                            {topic.name}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px]" style={{ color: "var(--ink-4)" }}>
                              {topic.notes} notes · {topic.pyqs} PYQs
                            </span>
                            {topic.strength > 0 && (
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: guide.colorSoft, color: guide.tint }}
                              >
                                {topic.strength}% strength
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Strength bar (if any) */}
                        {topic.strength > 0 && (
                          <div className="hidden md:block w-20">
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${topic.strength}%`,
                                  background: topic.strength >= 70 ? "#10B981" : topic.strength >= 50 ? "#F59E0B" : "#EF4444",
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* CTA */}
                        <button
                          disabled={topic.status === "locked"}
                          className="flex-shrink-0 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition-all duration-150 disabled:cursor-not-allowed"
                          style={
                            topic.status === "locked"
                              ? { background: "var(--bg)", color: "var(--ink-4)" }
                              : { background: guide.colorSoft, color: guide.tint }
                          }
                        >
                          {topic.status === "done" ? (
                            <span className="flex items-center gap-1">
                              Review <ExternalLink size={10} />
                            </span>
                          ) : topic.status === "in-progress" ? (
                            "Continue"
                          ) : topic.status === "available" ? (
                            "Start"
                          ) : (
                            "Locked"
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Progress Circle (SVG) ─── */
function ProgressCircle({ pct, tint }: { pct: number; tint: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={64} height={64} viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={32} cy={32} r={r} fill="none" stroke="var(--bg)" strokeWidth={5} />
      <circle
        cx={32} cy={32} r={r} fill="none"
        stroke={tint}
        strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 700ms ease" }}
      />
      <text
        x={32} y={36}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
        fill="var(--ink-1)"
        style={{ transform: "rotate(90deg)", transformOrigin: "32px 32px" }}
      >
        {pct}%
      </text>
    </svg>
  );
}
