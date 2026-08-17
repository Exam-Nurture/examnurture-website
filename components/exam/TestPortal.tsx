"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock, ChevronLeft, ChevronRight, X, AlertTriangle, Send,
  Flag, RotateCcw, ArrowRight, Maximize2, Minimize2, LayoutGrid,
  Keyboard, Check,
} from "lucide-react";
import QuestionViewer, { Question } from "./QuestionViewer";
import LanguageSelect from "./LanguageSelect";
import { availableLanguages } from "./languages";
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

/* ─── Helpers ───────────────────────────────── */
function formatTime(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/* Palette colours resolve from the exam-shell token scope, so the whole
   5-state system re-tints correctly in dark mode. */
const STATUS_STYLE: Record<QuestionStatus, React.CSSProperties> = {
  "not-visited": {
    background: "var(--x-unvisited)",
    color: "var(--x-unvisited-ink)",
    border: "1.5px solid var(--x-unvisited-line)",
  },
  "not-answered": {
    background: "var(--x-unanswered)",
    color: "var(--x-unanswered-ink)",
    border: "1.5px solid var(--x-unanswered)",
  },
  answered: {
    background: "var(--x-answered)",
    color: "var(--x-answered-ink)",
    border: "1.5px solid var(--x-answered)",
  },
  marked: {
    background: "var(--x-marked)",
    color: "var(--x-marked-ink)",
    border: "1.5px solid var(--x-marked)",
  },
  "answered-marked": {
    background: "var(--x-marked)",
    color: "var(--x-marked-ink)",
    border: "1.5px solid var(--x-answered)",
    boxShadow: "inset 0 0 0 2.5px var(--x-answered)",
  },
};

const STATUS_INFO: { key: QuestionStatus; label: string; short: string }[] = [
  { key: "answered",        label: "Answered",          short: "Answered" },
  { key: "not-answered",    label: "Not answered",      short: "Not ans" },
  { key: "marked",          label: "Marked for review", short: "Marked" },
  { key: "answered-marked", label: "Answered + marked", short: "Ans+mark" },
  { key: "not-visited",     label: "Not visited",       short: "Not seen" },
];

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "1 – 4", action: "Select option A – D" },
  { keys: "→  /  N", action: "Save & next" },
  { keys: "←  /  P", action: "Previous question" },
  { keys: "M", action: "Mark for review & next" },
  { keys: "C", action: "Clear response" },
];

/* ─── Component ─────────────────────────────── */
export default function TestPortal({
  title,
  durationSec,
  questions,
  onSubmit,
}: TestPortalProps) {
  const { user } = useAuth();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lang, setLang] = useState("en");

  const startedAt = useRef(Date.now());
  const submittedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const languages = useMemo(() => availableLanguages(questions), [questions]);

  /* Sections derived from question subjects */
  const sections = useMemo(() => {
    const map = new Map<string, number[]>();
    questions.forEach((q, idx) => {
      const sec = q.subject?.trim() || "General";
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(idx);
    });
    return [...map.entries()].map(([name, indices]) => ({ name, indices }));
  }, [questions]);

  const hasMultipleSections = sections.length > 1;
  const activeSection = sections[activeSectionIdx] ?? sections[0];
  const visibleIndices = activeSection?.indices ?? questions.map((_, i) => i);
  const question = questions[currentIdx];

  /* Mark visited */
  useEffect(() => {
    const q = questions[currentIdx];
    if (!q) return;
    setVisited((prev) => {
      if (prev.has(q.id)) return prev;
      const next = new Set(prev);
      next.add(q.id);
      return next;
    });
    // Long questions otherwise keep the previous scroll offset.
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIdx, questions]);

  /* Keep the section navigator in sync with manual navigation */
  useEffect(() => {
    if (!hasMultipleSections) return;
    const idx = sections.findIndex((sec) => sec.indices.includes(currentIdx));
    if (idx !== -1 && idx !== activeSectionIdx) setActiveSectionIdx(idx);
  }, [currentIdx, hasMultipleSections, sections, activeSectionIdx]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const timeTakenSec = Math.round((Date.now() - startedAt.current) / 1000);
    await onSubmit(answers, timeTakenSec);
    setSubmitting(false);
  }, [answers, onSubmit]);

  /* Timer — a single interval that ticks off wall-clock, so a backgrounded
     tab cannot gain the student extra time. */
  useEffect(() => {
    const endAt = startedAt.current + durationSec * 1000;
    const id = setInterval(() => {
      const remaining = Math.round((endAt - Date.now()) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        handleSubmit();
      }
    }, 500);
    return () => clearInterval(id);
  }, [durationSec, handleSubmit]);

  const getStatus = useCallback(
    (q: Question): QuestionStatus => {
      if (!visited.has(q.id)) return "not-visited";
      const answered = answers[q.id] !== undefined;
      const marked = markedForReview.has(q.id);
      if (answered && marked) return "answered-marked";
      if (answered) return "answered";
      if (marked) return "marked";
      return "not-answered";
    },
    [answers, visited, markedForReview],
  );

  const counts = useMemo(() => {
    const c: Record<QuestionStatus, number> = {
      "not-visited": 0,
      "not-answered": 0,
      answered: 0,
      marked: 0,
      "answered-marked": 0,
    };
    questions.forEach((q) => c[getStatus(q)]++);
    return c;
  }, [questions, getStatus]);

  const answeredTotal = counts.answered + counts["answered-marked"];
  const progressPct = questions.length ? (answeredTotal / questions.length) * 100 : 0;

  /* ── Actions ── */
  const handleSelect = useCallback(
    (optionIndex: number) => {
      const q = questions[currentIdx];
      if (!q) return;
      setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }));
    },
    [questions, currentIdx],
  );

  const goNext = useCallback(() => {
    setCurrentIdx((i) => Math.min(questions.length - 1, i + 1));
  }, [questions.length]);

  const goPrev = useCallback(() => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  }, []);

  const handleMarkReviewNext = useCallback(() => {
    const q = questions[currentIdx];
    if (!q) return;
    setMarkedForReview((prev) => new Set(prev).add(q.id));
    goNext();
  }, [questions, currentIdx, goNext]);

  const handleClearResponse = useCallback(() => {
    const q = questions[currentIdx];
    if (!q) return;
    setAnswers((prev) => {
      const n = { ...prev };
      delete n[q.id];
      return n;
    });
    setMarkedForReview((prev) => {
      if (!prev.has(q.id)) return prev;
      const next = new Set(prev);
      next.delete(q.id);
      return next;
    });
  }, [questions, currentIdx]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showConfirm || showKeys) return;
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();
      if (k >= "1" && k <= "6") {
        const idx = Number(k) - 1;
        const opts = questions[currentIdx]?.options?.length ?? 0;
        if (idx < opts) {
          e.preventDefault();
          handleSelect(idx);
        }
        return;
      }
      if (k === "arrowright" || k === "n") {
        e.preventDefault();
        goNext();
      } else if (k === "arrowleft" || k === "p") {
        e.preventDefault();
        goPrev();
      } else if (k === "m") {
        e.preventDefault();
        handleMarkReviewNext();
      } else if (k === "c") {
        e.preventDefault();
        handleClearResponse();
      } else if (k === "?") {
        e.preventDefault();
        setShowKeys(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    showConfirm, showKeys, currentIdx, questions,
    handleSelect, goNext, goPrev, handleMarkReviewNext, handleClearResponse,
  ]);

  /* Warn before an accidental tab close mid-test */
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

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
  const isCritical = timeLeft <= 60;
  const initials = (user?.name || "Candidate")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sectionAnswered = (sec: (typeof sections)[0]) =>
    sec.indices.filter((idx) => answers[questions[idx]?.id] !== undefined).length;

  if (!question) {
    return (
      <div className="exam-shell fixed inset-0 z-50 flex items-center justify-center">
        <p className="text-sm font-medium" style={{ color: "var(--x-ink-3)" }}>
          No questions available for this test.
        </p>
      </div>
    );
  }

  /* ── Palette (shared by sidebar + mobile sheet) ── */
  const paletteGrid = (
    <div className="grid grid-cols-5 gap-2">
      {visibleIndices.map((idx) => {
        const q = questions[idx];
        const status = getStatus(q);
        const isCur = idx === currentIdx;
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => {
              setCurrentIdx(idx);
              setShowPalette(false);
            }}
            aria-current={isCur}
            aria-label={`Question ${idx + 1}, ${STATUS_INFO.find((s) => s.key === status)?.label}`}
            className="flex aspect-square w-full items-center justify-center rounded-[10px] text-[12.5px] font-bold tabular-nums transition-transform duration-150 hover:scale-[1.07] d-focus"
            style={{
              ...STATUS_STYLE[status],
              ...(isCur
                ? { outline: "2.5px solid var(--blue-ink)", outlineOffset: 2 }
                : {}),
            }}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );

  const statusGrid = (
    <div className="grid grid-cols-5 gap-1.5">
      {STATUS_INFO.map(({ key, short, label }) => (
        <div key={key} className="flex flex-col items-center gap-1.5" title={label}>
          <div
            className="flex h-9 w-full items-center justify-center rounded-[9px] text-[12px] font-bold tabular-nums"
            style={STATUS_STYLE[key]}
          >
            {counts[key]}
          </div>
          <span
            className="text-center text-[8.5px] font-semibold leading-tight"
            style={{ color: "var(--x-ink-4)" }}
          >
            {short}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="exam-shell fixed inset-0 z-50 flex flex-col">
      {/* ══ Top bar ══ */}
      <header
        className="relative z-20 flex h-[58px] shrink-0 items-center gap-3 px-3 sm:px-5"
        style={{
          background: "var(--x-surface)",
          borderBottom: "1px solid var(--x-line-soft)",
        }}
      >
        {/* Identity */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-[11.5px] font-black text-white"
            style={{ background: "var(--blue-ink)" }}
          >
            EN
          </span>
          <div className="min-w-0">
            <p
              className="truncate text-[13.5px] font-semibold leading-tight"
              style={{ color: "var(--x-ink)", letterSpacing: "-0.015em" }}
            >
              {title}
            </p>
            <p className="truncate text-[11px] leading-tight" style={{ color: "var(--x-ink-4)" }}>
              {hasMultipleSections ? (
                <>
                  {activeSection?.name} · Q{currentIdx + 1} of {questions.length}
                </>
              ) : (
                <>
                  Question {currentIdx + 1} of {questions.length}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div
          className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-[7px] font-mono text-[15px] font-bold tabular-nums sm:px-4 ${
            isCritical ? "x-urgent" : ""
          }`}
          style={
            isWarning
              ? {
                  background: "var(--red-soft)",
                  color: "var(--x-unanswered)",
                  border: "1px solid rgba(217,92,92,0.35)",
                }
              : {
                  background: "var(--x-inset)",
                  color: "var(--x-ink)",
                  border: "1px solid var(--x-line-soft)",
                }
          }
          role="timer"
          aria-live={isWarning ? "polite" : "off"}
        >
          <Clock size={15} />
          {formatTime(timeLeft)}
        </div>

        {/* Right actions */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <LanguageSelect options={languages} value={lang} onChange={setLang} />

          <button
            type="button"
            onClick={() => setShowKeys(true)}
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
            className="hidden h-9 w-9 items-center justify-center rounded-full transition-colors lg:flex d-focus"
            style={{
              color: "var(--x-ink-3)",
              background: "var(--x-inset)",
              border: "1px solid var(--x-line-soft)",
            }}
          >
            <Keyboard size={15} />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit full screen" : "Enter full screen"}
            aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
            className="hidden h-9 w-9 items-center justify-center rounded-full transition-colors md:flex d-focus"
            style={{
              color: "var(--x-ink-3)",
              background: "var(--x-inset)",
              border: "1px solid var(--x-line-soft)",
            }}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-[9px] text-[13px] font-semibold text-white transition-transform duration-200 hover:-translate-y-[1px] d-focus"
            style={{
              background: "var(--blue-ink)",
              boxShadow: "0 6px 18px -10px rgba(13,40,126,.7)",
            }}
          >
            <Send size={14} />
            <span className="hidden sm:inline">Submit</span>
          </button>
        </div>

        {/* Answered-progress hairline */}
        <div
          className="absolute inset-x-0 bottom-0 h-[2px]"
          style={{ background: "var(--x-inset-2)" }}
          aria-hidden="true"
        >
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${progressPct}%`,
              background: "var(--x-answered)",
            }}
          />
        </div>
      </header>

      {/* ══ Body ══ */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Paper */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-7">
            <div className="mx-auto max-w-[760px]">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="x-paper p-4 sm:p-6"
              >
                <QuestionViewer
                  question={question}
                  questionNumber={currentIdx + 1}
                  totalQuestions={questions.length}
                  selectedIndex={answers[question.id] ?? null}
                  revealed={false}
                  onSelect={handleSelect}
                  lang={lang}
                />
              </motion.div>
            </div>
          </div>

          {/* Action bar */}
          <div
            className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-3 sm:px-6"
            style={{
              background: "var(--x-surface)",
              borderTop: "1px solid var(--x-line-soft)",
            }}
          >
            <button
              type="button"
              onClick={handleMarkReviewNext}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-[9px] text-[12.5px] font-semibold transition-all duration-200 hover:-translate-y-[1px] d-focus"
              style={{
                color: "var(--x-marked)",
                background: "var(--violet-soft)",
                border: "1px solid rgba(139,92,246,0.32)",
              }}
            >
              <Flag size={13} />
              <span className="hidden sm:inline">Mark &amp; next</span>
              <span className="sm:hidden">Mark</span>
            </button>

            <button
              type="button"
              onClick={handleClearResponse}
              disabled={answers[question.id] === undefined}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-[9px] text-[12.5px] font-semibold transition-all duration-200 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-35 d-focus"
              style={{
                color: "var(--x-ink-2)",
                background: "var(--x-inset)",
                border: "1px solid var(--x-line-soft)",
              }}
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Clear</span>
            </button>

            {/* Mobile palette trigger */}
            <button
              type="button"
              onClick={() => setShowPalette(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-[9px] text-[12.5px] font-semibold transition-all duration-200 lg:hidden d-focus"
              style={{
                color: "var(--x-ink-2)",
                background: "var(--x-inset)",
                border: "1px solid var(--x-line-soft)",
              }}
            >
              <LayoutGrid size={13} />
              {answeredTotal}/{questions.length}
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIdx === 0}
                className="inline-flex items-center gap-1 rounded-full px-3.5 py-[9px] text-[12.5px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 d-focus"
                style={{
                  color: "var(--x-ink-2)",
                  background: "var(--x-inset)",
                  border: "1px solid var(--x-line-soft)",
                }}
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={currentIdx === questions.length - 1}
                className="group inline-flex items-center gap-1.5 rounded-full px-5 py-[9px] text-[13px] font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-40 d-focus"
                style={{
                  background: "var(--blue-ink)",
                  boxShadow: "0 6px 18px -10px rgba(13,40,126,.7)",
                }}
              >
                Save &amp; next
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </div>
        </main>

        {/* ══ Sidebar ══ */}
        <aside
          className="hidden w-[300px] shrink-0 flex-col lg:flex"
          style={{
            background: "var(--x-surface)",
            borderLeft: "1px solid var(--x-line-soft)",
          }}
        >
          {/* Candidate */}
          <div
            className="flex shrink-0 items-center gap-3 px-4 py-3.5"
            style={{
              borderBottom: "1px solid var(--x-line-soft)",
              background: "var(--x-inset)",
            }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
              style={{ background: "var(--blue-ink)" }}
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p
                className="truncate text-[13px] font-semibold"
                style={{ color: "var(--x-ink)" }}
              >
                {user?.name || "Candidate"}
              </p>
              <p className="x-eyebrow mt-1">Candidate</p>
            </div>
          </div>

          {/* Status */}
          <div
            className="shrink-0 px-4 py-3.5"
            style={{ borderBottom: "1px solid var(--x-line-soft)" }}
          >
            <p className="x-eyebrow mb-3">Status overview</p>
            {statusGrid}
          </div>

          {/* Section navigator */}
          {hasMultipleSections && (
            <div
              className="flex shrink-0 items-center gap-2 px-3 py-2.5"
              style={{
                borderBottom: "1px solid var(--x-line-soft)",
                background: "var(--x-inset)",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveSectionIdx((i) => Math.max(0, i - 1))}
                disabled={activeSectionIdx === 0}
                aria-label="Previous section"
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:opacity-25 d-focus"
                style={{ color: "var(--x-ink-2)" }}
              >
                <ChevronLeft size={15} />
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p
                  className="truncate text-[12.5px] font-semibold"
                  style={{ color: "var(--x-ink)" }}
                >
                  {activeSection?.name}
                </p>
                <p className="text-[10.5px]" style={{ color: "var(--x-ink-4)" }}>
                  Section {activeSectionIdx + 1}/{sections.length} ·{" "}
                  {sectionAnswered(activeSection)}/{activeSection?.indices.length} done
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveSectionIdx((i) => Math.min(sections.length - 1, i + 1))
                }
                disabled={activeSectionIdx === sections.length - 1}
                aria-label="Next section"
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:opacity-25 d-focus"
                style={{ color: "var(--x-ink-2)" }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Palette */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="x-eyebrow mb-3">Question palette</p>
            {paletteGrid}
          </div>

          {/* Submit */}
          <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--x-line-soft)" }}>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-[13.5px] font-semibold text-white transition-transform duration-200 hover:-translate-y-[1px] d-focus"
              style={{
                background: "var(--blue-ink)",
                boxShadow: "0 8px 22px -12px rgba(13,40,126,.7)",
              }}
            >
              <Send size={15} /> Submit test
            </button>
          </div>
        </aside>
      </div>

      {/* ══ Mobile palette sheet ══ */}
      <AnimatePresence>
        {showPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end lg:hidden"
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(4,6,10,0.5)", backdropFilter: "blur(3px)" }}
              onClick={() => setShowPalette(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              role="dialog"
              aria-modal="true"
              aria-label="Question palette"
              className="relative flex max-h-[82vh] w-full flex-col rounded-t-[22px]"
              style={{
                background: "var(--x-surface)",
                borderTop: "1px solid var(--x-line)",
              }}
            >
              <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
                <div>
                  <p className="x-eyebrow">Question palette</p>
                  <p
                    className="mt-1.5 text-[15px] font-semibold"
                    style={{ color: "var(--x-ink)" }}
                  >
                    {answeredTotal} of {questions.length} answered
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPalette(false)}
                  aria-label="Close palette"
                  className="flex h-9 w-9 items-center justify-center rounded-full d-focus"
                  style={{ background: "var(--x-inset)", color: "var(--x-ink-3)" }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 pb-3">{statusGrid}</div>

              <div className="flex-1 overflow-y-auto px-5 pb-6">{paletteGrid}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Keyboard shortcuts ══ */}
      <AnimatePresence>
        {showKeys && (
          <Modal onClose={() => setShowKeys(false)} label="Keyboard shortcuts">
            <div className="mb-5 flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                style={{
                  background: "var(--blue-soft)",
                  color: "var(--blue-ink)",
                  border: "1px solid rgba(29,78,216,0.24)",
                }}
              >
                <Keyboard size={18} />
              </span>
              <div>
                <p className="text-[15px] font-semibold" style={{ color: "var(--x-ink)" }}>
                  Keyboard shortcuts
                </p>
                <p className="text-[12px]" style={{ color: "var(--x-ink-4)" }}>
                  Move faster without the mouse
                </p>
              </div>
            </div>

            <ul className="flex flex-col gap-1.5">
              {SHORTCUTS.map((s) => (
                <li
                  key={s.keys}
                  className="flex items-center justify-between rounded-[10px] px-3 py-2.5"
                  style={{ background: "var(--x-inset)" }}
                >
                  <span className="text-[13px]" style={{ color: "var(--x-ink-2)" }}>
                    {s.action}
                  </span>
                  <kbd
                    className="rounded-[7px] px-2.5 py-1 font-mono text-[11.5px] font-semibold"
                    style={{
                      background: "var(--x-surface)",
                      color: "var(--x-ink)",
                      border: "1px solid var(--x-line)",
                    }}
                  >
                    {s.keys}
                  </kbd>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setShowKeys(false)}
              className="mt-5 w-full rounded-full py-3 text-[13.5px] font-semibold text-white d-focus"
              style={{ background: "var(--blue-ink)" }}
            >
              Got it
            </button>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══ Submit confirmation ══ */}
      <AnimatePresence>
        {showConfirm && (
          <Modal onClose={() => setShowConfirm(false)} label="Confirm submission">
            <div className="mb-5 flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                style={{
                  background: "var(--amber-soft)",
                  color: "var(--amber)",
                  border: "1px solid rgba(232,169,60,0.3)",
                }}
              >
                <AlertTriangle size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[15.5px] font-semibold" style={{ color: "var(--x-ink)" }}>
                  Submit your test?
                </p>
                <p className="mt-1 text-[12.5px]" style={{ color: "var(--x-ink-3)" }}>
                  You won&apos;t be able to change answers after this.
                </p>
              </div>
            </div>

            {counts["not-visited"] + counts["not-answered"] > 0 && (
              <div
                className="mb-4 flex items-start gap-2.5 rounded-[11px] px-3.5 py-2.5 text-[12.5px]"
                style={{
                  background: "var(--amber-soft)",
                  color: "var(--amber)",
                  border: "1px solid rgba(232,169,60,0.28)",
                }}
              >
                <AlertTriangle size={14} className="mt-px shrink-0" />
                <span>
                  {counts["not-visited"] + counts["not-answered"]} question
                  {counts["not-visited"] + counts["not-answered"] === 1 ? "" : "s"} still
                  unanswered.
                </span>
              </div>
            )}

            <div className="mb-5 grid grid-cols-5 gap-2">
              {STATUS_INFO.map(({ key, short }) => (
                <div
                  key={key}
                  className="rounded-[11px] p-2 text-center"
                  style={{ background: "var(--x-inset)" }}
                >
                  <div
                    className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-[9px] text-[12px] font-bold tabular-nums"
                    style={STATUS_STYLE[key]}
                  >
                    {counts[key]}
                  </div>
                  <div
                    className="text-[8.5px] font-semibold leading-tight"
                    style={{ color: "var(--x-ink-4)" }}
                  >
                    {short}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-full py-3 text-[13.5px] font-semibold transition-colors d-focus"
                style={{
                  color: "var(--x-ink)",
                  background: "var(--x-inset)",
                  border: "1px solid var(--x-line)",
                }}
              >
                Keep going
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[13.5px] font-semibold text-white transition-all disabled:opacity-70 d-focus"
                style={{
                  background: "var(--blue-ink)",
                  boxShadow: "0 8px 22px -12px rgba(13,40,126,.7)",
                }}
              >
                {submitting ? (
                  "Submitting…"
                ) : (
                  <>
                    <Check size={15} /> Submit now
                  </>
                )}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Shared modal shell ─────────────────────── */
function Modal({
  children,
  onClose,
  label,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(4,6,10,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative w-full max-w-[440px] rounded-[20px] p-5 sm:p-6"
        style={{
          background: "var(--x-surface)",
          border: "1px solid var(--x-line)",
          boxShadow: "0 32px 80px -24px rgba(0,0,0,0.5)",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
