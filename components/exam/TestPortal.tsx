"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Clock, ChevronLeft, ChevronRight, X, AlertTriangle, Send,
  Flag, RotateCcw, ArrowRight, Maximize2, Minimize2,
} from "lucide-react";
import QuestionViewer, { Question } from "./QuestionViewer";
import { useAuth } from "@/lib/auth-context";

/* ─── Types ─────────────────────────────────── */
export type QuestionStatus =
  | "not-visited"
  | "not-answered"
  | "answered"
  | "marked"
  | "answered-marked";

export interface TestPortalProps {
  testId: string;
  title: string;
  durationSec: number;
  questions: Question[];
  onSubmit: (answers: Record<string, number>, timeTakenSec: number) => Promise<void>;
}

/* ─── Helpers ────────────────────────────────── */
function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ─── NTA-standard 5-state palette ─── */
const STATUS_STYLE: Record<QuestionStatus, React.CSSProperties> = {
  "not-visited":     { background: "#ffffff", color: "#6b7280", border: "1.5px solid #d1d5db" },
  "not-answered":    { background: "#ef4444", color: "#ffffff", border: "1.5px solid #dc2626" },
  "answered":        { background: "#16a34a", color: "#ffffff", border: "1.5px solid #15803d" },
  "marked":          { background: "#7c3aed", color: "#ffffff", border: "1.5px solid #6d28d9" },
  "answered-marked": { background: "#7c3aed", color: "#ffffff", border: "1.5px solid #15803d", boxShadow: "inset 0 0 0 2px #16a34a" },
};

const STATUS_INFO: { key: QuestionStatus; label: string; short: string }[] = [
  { key: "answered",         label: "Answered",          short: "Answered"     },
  { key: "not-answered",     label: "Not Answered",      short: "Not Ans"      },
  { key: "marked",           label: "Marked for Review", short: "Marked"       },
  { key: "answered-marked",  label: "Ans + Marked",      short: "Ans+Mark"     },
  { key: "not-visited",      label: "Not Visited",       short: "Not Visited"  },
];

/* ─── Component ──────────────────────────────── */
export default function TestPortal({ testId, title, durationSec, questions, onSubmit }: TestPortalProps) {
  const { user } = useAuth();
  const [currentIdx, setCurrentIdx]               = useState(0);
  const [answers, setAnswers]                     = useState<Record<string, number>>({});
  const [visited, setVisited]                     = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview]     = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft]                   = useState(durationSec);
  const [showConfirm, setShowConfirm]             = useState(false);
  const [submitting, setSubmitting]               = useState(false);
  const [activeSectionIdx, setActiveSectionIdx]   = useState(0);
  const [isFullscreen, setIsFullscreen]           = useState(false);
  const startedAt = useRef(Date.now());

  /* Build sections from question subjects */
  const sections = useMemo(() => {
    const map = new Map<string, number[]>();
    questions.forEach((q, idx) => {
      const sec = q.subject?.trim() || "General";
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(idx);
    });
    return Array.from(map.entries()).map(([name, indices]) => ({ name, indices }));
  }, [questions]);

  const hasMultipleSections = sections.length > 1;
  const activeSection  = sections[activeSectionIdx] ?? sections[0];
  const visibleIndices = activeSection?.indices ?? questions.map((_, i) => i);

  /* Track visited when current question changes */
  useEffect(() => {
    const q = questions[currentIdx];
    if (!q) return;
    setVisited(prev => {
      if (prev.has(q.id)) return prev;
      const next = new Set(prev);
      next.add(q.id);
      return next;
    });
  }, [currentIdx, questions]);

  /* Auto-sync active section when navigating questions */
  useEffect(() => {
    if (!hasMultipleSections) return;
    const idx = sections.findIndex(sec => sec.indices.includes(currentIdx));
    if (idx !== -1 && idx !== activeSectionIdx) setActiveSectionIdx(idx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  /* Timer */
  useEffect(() => {
    if (timeLeft <= 0) { handleSubmit(); return; }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  /* Compute status for any question */
  const getStatus = useCallback((q: Question): QuestionStatus => {
    if (!visited.has(q.id)) return "not-visited";
    const answered = answers[q.id] !== undefined;
    const marked   = markedForReview.has(q.id);
    if (answered && marked) return "answered-marked";
    if (answered)            return "answered";
    if (marked)              return "marked";
    return "not-answered";
  }, [answers, visited, markedForReview]);

  /* Aggregate counts across whole test */
  const counts = useMemo(() => {
    const c: Record<QuestionStatus, number> = {
      "not-visited": 0, "not-answered": 0, "answered": 0, "marked": 0, "answered-marked": 0,
    };
    questions.forEach(q => { c[getStatus(q)]++; });
    return c;
  }, [questions, getStatus]);

  const question = questions[currentIdx];

  /* Actions */
  const handleSelect = useCallback((optionIndex: number) => {
    const q = questions[currentIdx];
    if (!q) return;
    setAnswers(prev => ({ ...prev, [q.id]: optionIndex }));
  }, [questions, currentIdx]);

  const handleSaveNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
  };

  const handleMarkReviewNext = () => {
    const q = questions[currentIdx];
    if (!q) return;
    setMarkedForReview(prev => {
      const next = new Set(prev);
      next.add(q.id);
      return next;
    });
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
  };

  const handleClearResponse = () => {
    const q = questions[currentIdx];
    if (!q) return;
    setAnswers(prev => {
      const n = { ...prev };
      delete n[q.id];
      return n;
    });
    setMarkedForReview(prev => {
      if (!prev.has(q.id)) return prev;
      const next = new Set(prev);
      next.delete(q.id);
      return next;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const timeTakenSec = Math.round((Date.now() - startedAt.current) / 1000);
    await onSubmit(answers, timeTakenSec);
    setSubmitting(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isWarning = timeLeft <= 300;
  const initials = (user?.name || "Candidate")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const getSectionAnswered = (sec: typeof sections[0]) =>
    sec.indices.filter(idx => answers[questions[idx]?.id] !== undefined).length;

  if (!question) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "var(--card)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--ink-3)" }}>No questions available for this test.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--bg-secondary)" }}>

      {/* ── Top Bar ── */}
      <header
        className="flex items-center justify-between px-4 md:px-5 h-14 shrink-0 z-10"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--line-soft)" }}
      >
        {/* Brand + test title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-[12px] shrink-0"
            style={{ background: "var(--blue)" }}
          >
            EN
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold truncate leading-tight" style={{ color: "var(--ink-1)" }}>
              {title}
            </p>
            {hasMultipleSections && (
              <p className="text-[10px] leading-tight" style={{ color: "var(--ink-4)" }}>
                Section: <span className="font-semibold" style={{ color: "var(--ink-3)" }}>{activeSection?.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono font-bold text-[15px] tabular-nums transition-colors ${
          isWarning
            ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
            : "bg-[var(--bg-secondary)] text-[var(--ink-1)] border border-[var(--line-soft)]"
        }`}>
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ color: "var(--ink-3)", border: "1px solid var(--line-soft)" }}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110"
            style={{ background: "var(--blue)" }}
          >
            <Send className="w-4 h-4" /> Submit
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Question column */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Scrollable question area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6" style={{ background: "var(--card)" }}>
            <div className="max-w-3xl mx-auto">
              <QuestionViewer
                question={question}
                questionNumber={currentIdx + 1}
                totalQuestions={questions.length}
                selectedIndex={answers[question.id] ?? null}
                revealed={false}
                onSelect={handleSelect}
              />
            </div>
          </div>

          {/* Bottom action bar */}
          <div
            className="shrink-0 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-2"
            style={{ background: "var(--card)", borderTop: "1px solid var(--line-soft)" }}
          >
            {/* Left group: Mark + Clear */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkReviewNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all hover:bg-violet-50"
                style={{ color: "#7c3aed", border: "1.5px solid #c4b5fd" }}
              >
                <Flag className="w-3.5 h-3.5" /> Mark for Review &amp; Next
              </button>
              <button
                onClick={handleClearResponse}
                disabled={answers[question.id] === undefined}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--ink-2)", border: "1.5px solid var(--line)" }}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Response
              </button>
            </div>

            {/* Right group: Prev + Save&Next */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--ink-2)", border: "1.5px solid var(--line)" }}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={handleSaveNext}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-bold text-white transition-all disabled:opacity-50 hover:brightness-110"
                style={{ background: "var(--blue)" }}
              >
                Save &amp; Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* ── Right sidebar ── */}
        <aside
          className="hidden lg:flex flex-col w-[300px] shrink-0"
          style={{ borderLeft: "1px solid var(--line-soft)", background: "var(--card)" }}
        >

          {/* User profile chip */}
          <div
            className="px-4 py-3 flex items-center gap-3 shrink-0"
            style={{ borderBottom: "1px solid var(--line-soft)", background: "var(--bg-secondary)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[13px] shrink-0"
              style={{ background: "var(--blue)" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold truncate" style={{ color: "var(--ink-1)" }}>
                {user?.name || "Candidate"}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>
                Candidate
              </p>
            </div>
          </div>

          {/* 5-state status grid */}
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--line-soft)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "var(--ink-4)" }}>
              Status Overview
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {STATUS_INFO.map(({ key, short }) => (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center text-[12px] font-bold tabular-nums"
                    style={STATUS_STYLE[key]}
                  >
                    {counts[key]}
                  </div>
                  <span
                    className="text-[8.5px] text-center leading-tight font-medium"
                    style={{ color: "var(--ink-4)" }}
                  >
                    {short}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section navigator (only when multiple sections) */}
          {hasMultipleSections && (
            <div
              className="shrink-0 flex items-center gap-2 px-3 py-2.5"
              style={{ borderBottom: "1px solid var(--line-soft)", background: "var(--bg-secondary)" }}
            >
              <button
                onClick={() => setActiveSectionIdx(i => Math.max(0, i - 1))}
                disabled={activeSectionIdx === 0}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 hover:bg-[var(--card)]"
                style={{ color: "var(--ink-2)" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center min-w-0">
                <p className="text-[12px] font-bold truncate" style={{ color: "var(--ink-1)" }}>
                  {activeSection?.name}
                </p>
                <p className="text-[10px]" style={{ color: "var(--ink-4)" }}>
                  Section {activeSectionIdx + 1}/{sections.length}&nbsp;·&nbsp;{getSectionAnswered(activeSection)}/{activeSection?.indices.length} done
                </p>
              </div>

              <button
                onClick={() => setActiveSectionIdx(i => Math.min(sections.length - 1, i + 1))}
                disabled={activeSectionIdx === sections.length - 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 hover:bg-[var(--card)]"
                style={{ color: "var(--ink-2)" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Question palette grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--ink-4)" }}>
              Question Palette
            </p>
            <div className="grid grid-cols-5 gap-2">
              {visibleIndices.map(idx => {
                const q      = questions[idx];
                const status = getStatus(q);
                const isCur  = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className="aspect-square w-full rounded-md text-[12px] font-bold transition-all flex items-center justify-center hover:scale-105"
                    style={{
                      ...STATUS_STYLE[status],
                      ...(isCur ? { outline: "2.5px solid var(--blue)", outlineOffset: "2px" } : {}),
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom submit button */}
          <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--line-soft)" }}>
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110"
              style={{ background: "var(--blue)" }}
            >
              <Send className="w-4 h-4" /> Submit Test
            </button>
          </div>
        </aside>
      </div>

      {/* ── Submit Confirmation Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-[15px]" style={{ color: "var(--ink-1)" }}>Submit your test?</p>
                  <p className="text-[12px]" style={{ color: "var(--ink-4)" }}>You won't be able to change answers after this.</p>
                </div>
              </div>
              <button onClick={() => setShowConfirm(false)} className="shrink-0" style={{ color: "var(--ink-4)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {STATUS_INFO.map(({ key, short }) => (
                <div key={key} className="text-center p-2 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                  <div
                    className="w-9 h-9 mx-auto mb-1 rounded-md flex items-center justify-center text-[12px] font-bold tabular-nums"
                    style={STATUS_STYLE[key]}
                  >
                    {counts[key]}
                  </div>
                  <div className="text-[8.5px] font-medium leading-tight" style={{ color: "var(--ink-4)" }}>
                    {short}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--ink-1)", borderColor: "var(--line)" }}
              >
                Continue Test
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-70 hover:brightness-110"
                style={{ background: "var(--blue)" }}
              >
                {submitting ? "Submitting…" : "Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
