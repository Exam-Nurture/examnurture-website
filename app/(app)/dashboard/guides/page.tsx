"use client";

/**
 * Study guides (v2). Guide content (levels, topics, notes, PYQ counts) lives in
 * GUIDES below. The old per-exam hex tints were decorative and are gone: every
 * guide now uses the brand colour tokens.
 * Topics marked "locked" show a calm upgrade card linking to /pricing, plus the
 * plans link (per-guide checkout removed: no checkout exists yet).
 */

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Lock } from "lucide-react";
import AppPage from "@/components/app/AppPage";

type TopicStatus = "done" | "in-progress" | "locked" | "available";

type Topic = {
  name: string;
  notes: number;
  pyqs: number;
  strength: number; // 0-100
  status: TopicStatus;
};

type Level = {
  level: number;
  label: string;
  topics: Topic[];
};

type ExamGuide = {
  id: string;
  boardId: string;
  name: string;
  shortName: string;
  about: string;
  totalTopics: number;
  totalNotes: number;
  totalPYQs: number;
  levels: Level[];
};

const GUIDES: ExamGuide[] = [
  {
    id: "jpsc",
    boardId: "state-psc",
    name: "JPSC Prelims 2025",
    shortName: "JPSC",
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


const display = { fontFamily: "var(--font-sora)" } as const;

const statusMeta: Record<TopicStatus, { label: string; cls: string }> = {
  done: { label: "Done", cls: "bg-[var(--green-soft)] text-[var(--green)]" },
  "in-progress": { label: "In progress", cls: "bg-[var(--brand-soft)] text-[var(--brand)]" },
  available: { label: "Ready", cls: "bg-[var(--bg-secondary)] text-[var(--ink-2)]" },
  locked: { label: "Locked", cls: "bg-[var(--bg-secondary)] text-[var(--ink-3)]" },
};

export default function GuidesPage() {
  const [activeGuide, setActiveGuide] = useState("jpsc");
  const [openLevels, setOpenLevels] = useState<Set<number>>(new Set([1]));

  const guide = GUIDES.find((g) => g.id === activeGuide) ?? GUIDES[0];

  const toggleLevel = (lvl: number) =>
    setOpenLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) next.delete(lvl);
      else next.add(lvl);
      return next;
    });

  const allTopics = guide.levels.flatMap((l) => l.topics);
  const doneTopics = allTopics.filter((t) => t.status === "done").length;
  const inProg = allTopics.filter((t) => t.status === "in-progress").length;
  const pct = allTopics.length ? Math.round(((doneTopics + inProg * 0.5) / allTopics.length) * 100) : 0;
  const hasLocked = allTopics.some((t) => t.status === "locked");

  return (
    <AppPage title="Guides" subtitle="Your syllabus, one level at a time." width="narrow">
      {/* Exam picker */}
      <div role="group" aria-label="Exam" className="flex flex-wrap gap-2">
        {GUIDES.map((g) => {
          const on = activeGuide === g.id;
          return (
            <button
              key={g.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setActiveGuide(g.id);
                setOpenLevels(new Set([1]));
              }}
              className={`min-h-11 rounded-full px-4 text-sm transition-colors ${
                on ? "bg-[var(--brand)] font-semibold text-[var(--brand-ink)]" : "bg-[var(--bg-secondary)] text-[var(--ink-2)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
              }`}
            >
              {g.shortName}
            </button>
          );
        })}
      </div>

      {/* Guide summary */}
      <section aria-labelledby="guide-title" className="en-card flex flex-col gap-5 p-6">
        <div>
          <h2 id="guide-title" className="text-xl font-bold text-[var(--ink-1)]" style={display}>{guide.name}</h2>
          <p className="mt-1 text-sm text-[var(--ink-3)]">{guide.about}</p>
        </div>
        <p className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--ink-3)]">
          <span><strong className="font-semibold text-[var(--ink-1)]">{guide.totalTopics}</strong> topics</span>
          <span><strong className="font-semibold text-[var(--ink-1)]">{guide.totalNotes}</strong> notes</span>
          <span><strong className="font-semibold text-[var(--ink-1)]">{guide.totalPYQs}</strong> past-paper questions</span>
        </p>
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-[var(--ink-3)]">{doneTopics} of {allTopics.length} topics done</span>
            <span className="font-semibold tabular-nums text-[var(--ink-1)]">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress">
            <div className="h-full rounded-full bg-[var(--brand)] transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      {/* Locked / upgrade prompt */}
      {hasLocked && (
        <section aria-labelledby="locked-title" className="en-card flex flex-col gap-4 bg-[var(--brand-soft)] p-6 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-[12px] bg-[var(--card)] text-[var(--brand)]">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 id="locked-title" className="font-semibold text-[var(--ink-1)]" style={display}>Some topics are locked</h2>
            <p className="mt-0.5 text-sm text-[var(--ink-2)]">Choose a plan, or buy this guide on its own, to open every topic.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/pricing" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
              See plans
            </Link>
            {/* Per-guide purchase removed: the site has no checkout yet. */}
          </div>
        </section>
      )}

      {/* Levels */}
      <ul className="flex flex-col gap-3">
        {guide.levels.map((lvl, idx) => {
          const isOpen = openLevels.has(lvl.level);
          const lvlDone = lvl.topics.filter((t) => t.status === "done").length;
          const panelId = `level-${guide.id}-${lvl.level}`;
          return (
            <li key={lvl.level} className="reveal" style={{ transitionDelay: `${idx * 60}ms` }}>
              <div className="en-card overflow-hidden">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleLevel(lvl.level)}
                  className="flex min-h-14 w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--bg-secondary)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--brand)]"
                >
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--brand)]">L{lvl.level}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[var(--ink-1)]">{lvl.label}</span>
                    <span className="text-sm text-[var(--ink-3)]">{lvlDone} of {lvl.topics.length} done</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 flex-none text-[var(--ink-3)] transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>

                {isOpen && (
                  <ul id={panelId} className="flex flex-col gap-2 px-3 pb-3">
                    {lvl.topics.map((topic) => {
                      const st = statusMeta[topic.status];
                      const locked = topic.status === "locked";
                      return (
                        <li key={topic.name} className="flex items-center gap-4 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className={`font-medium ${locked ? "text-[var(--ink-3)]" : "text-[var(--ink-1)]"}`}>{topic.name}</p>
                            <p className="mt-0.5 text-sm text-[var(--ink-3)]">
                              {topic.notes} notes · {topic.pyqs} past-paper questions
                              {topic.strength > 0 && ` · ${topic.strength}% strength`}
                            </p>
                          </div>
                          <span className={`inline-flex flex-none items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                            {locked && <Lock className="h-3 w-3" aria-hidden="true" />}
                            {st.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </AppPage>
  );
}
