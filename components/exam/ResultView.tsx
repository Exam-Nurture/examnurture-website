"use client";

/**
 * ResultView — Post-submission exam result screen
 * Shows: Score summary, subject breakdown, per-question review
 */

import { useState } from "react";
import { CheckCircle2, XCircle, MinusCircle, Trophy, BarChart3, ChevronDown } from "lucide-react";
import QuestionViewer, { Question } from "./QuestionViewer";

/* ─── Types ─────────────────────────────────── */
export interface AttemptResult {
  totalQuestions: number;
  correct: number;
  wrong: number;
  unattempted: number;
  totalMarks: number;
  scored: number;
  negMarks?: number;
  timeTakenSec?: number;
  rank?: number;
  percentile?: number;
  subjectStats?: { subject: string; correct: number; total: number }[];
}

export interface ResultViewProps {
  result: AttemptResult;
  questions: Question[];
  userAnswers: Record<string, number>;   // questionId → optionIndex
  onRetry?: () => void;
  onBack?: () => void;
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

/* ─── Score Ring ─────────────────────────────── */
function ScoreRing({ pct: p }: { pct: number }) {
  const r = 42, circ = 2 * Math.PI * r;
  const dash = (p / 100) * circ;
  const color = p >= 60 ? "#10b981" : p >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={112} height={112} className="rotate-[-90deg]">
      <circle cx={56} cy={56} r={r} fill="none" strokeWidth={8} stroke="var(--line-soft)" />
      <circle
        cx={56} cy={56} r={r}
        fill="none" strokeWidth={8} stroke={color}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

/* ─── Component ──────────────────────────────── */
export default function ResultView({ result, questions, userAnswers, onRetry, onBack }: ResultViewProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewIdx, setReviewIdx]   = useState(0);

  const scorePct = pct(result.scored, result.totalMarks);

  const reviewQuestion = questions[reviewIdx];
  const revealedQuestion: Question = {
    ...reviewQuestion,
    // correctIndex is already in the question object post-result
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8 fade-up">

      {/* ── Hero Score ── */}
      <div
        className="rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8"
        style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
      >
        {/* Ring */}
        <div className="relative shrink-0">
          <ScoreRing pct={scorePct} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black" style={{ color: "var(--ink-1)" }}>
              {result.scored}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: "var(--ink-4)" }}>
              / {result.totalMarks}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-xl font-extrabold" style={{ color: "var(--ink-1)" }}>
              {scorePct >= 60 ? "Well Done!" : scorePct >= 40 ? "Keep Practicing" : "Needs Improvement"}
            </span>
          </div>
          {result.percentile && (
            <p className="text-sm mb-4" style={{ color: "var(--ink-3)" }}>
              You scored better than <span className="font-bold" style={{ color: "var(--blue)" }}>{result.percentile}%</span> of students
            </p>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Correct",    value: result.correct,     icon: CheckCircle2, color: "text-emerald-500" },
              { label: "Wrong",      value: result.wrong,       icon: XCircle,      color: "text-red-500"     },
              { label: "Skipped",    value: result.unattempted, icon: MinusCircle,  color: "text-gray-400"    },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="text-center p-3 rounded-2xl" style={{ background: "var(--bg)" }}>
                <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                <div className="text-2xl font-black" style={{ color: "var(--ink-1)" }}>{value}</div>
                <div className="text-[10px] font-semibold" style={{ color: "var(--ink-4)" }}>{label}</div>
              </div>
            ))}
          </div>

          {result.timeTakenSec && (
            <p className="text-[12px] mt-3" style={{ color: "var(--ink-4)" }}>
              Time taken: <span className="font-semibold">{formatTime(result.timeTakenSec)}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Subject Breakdown ── */}
      {result.subjectStats && result.subjectStats.length > 0 && (
        <div
          className="rounded-3xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5" style={{ color: "var(--blue)" }} />
            <h2 className="text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>Subject-wise Accuracy</h2>
          </div>
          <div className="flex flex-col gap-4">
            {result.subjectStats.map(({ subject, correct, total }) => {
              const p = pct(correct, total);
              const barColor = p >= 60 ? "#10b981" : p >= 40 ? "#f59e0b" : "#ef4444";
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-semibold" style={{ color: "var(--ink-2)" }}>{subject}</span>
                    <span className="text-[12px] font-bold" style={{ color: "var(--ink-3)" }}>{correct}/{total} ({p}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${p}%`, background: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Question Review ── */}
      <div
        className="rounded-3xl"
        style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
      >
        <button
          onClick={() => setReviewOpen(v => !v)}
          className="w-full flex items-center justify-between p-6"
        >
          <span className="text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>
            Question-by-Question Review
          </span>
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${reviewOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--ink-3)" }}
          />
        </button>

        {reviewOpen && (
          <div className="px-6 pb-6">
            {/* Mini palette */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {questions.map((q, idx) => {
                const ua = userAnswers[q.id];
                const isCorrect = ua !== undefined && ua === q.correctIndex;
                const isWrong   = ua !== undefined && ua !== q.correctIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setReviewIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-[11px] font-bold border transition-all ${
                      idx === reviewIdx ? "ring-2 ring-offset-1 ring-blue-400" : ""
                    } ${
                      isCorrect ? "bg-emerald-500 text-white border-emerald-500" :
                      isWrong   ? "bg-red-400 text-white border-red-400" :
                                  "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <QuestionViewer
              question={revealedQuestion}
              questionNumber={reviewIdx + 1}
              totalQuestions={questions.length}
              selectedIndex={userAnswers[reviewQuestion?.id] ?? null}
              revealed={true}
              onSelect={() => {}}
              onPrev={reviewIdx > 0 ? () => setReviewIdx(i => i - 1) : undefined}
              onNext={reviewIdx < questions.length - 1 ? () => setReviewIdx(i => i + 1) : undefined}
              showExplanation
            />
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all"
            style={{ color: "var(--ink-1)", borderColor: "var(--line)" }}
          >
            ← Back
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
            style={{ background: "var(--blue)" }}
          >
            Retry Test
          </button>
        )}
      </div>
    </div>
  );
}
