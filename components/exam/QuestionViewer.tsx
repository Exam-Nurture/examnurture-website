"use client";

/**
 * QuestionViewer — Universal MCQ question renderer
 * Supports:
 *   - HTML in question/option text (bold, italic, sup, sub, br, etc.)
 *   - Inline images (<img> tags in text)
 *   - LaTeX/math via KaTeX: wrap expressions in $...$ or $$...$$
 *   - Selected / correct / incorrect state styling
 *   - Explanation panel (shown after submission)
 */

import { useEffect, useRef } from "react";
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, BookmarkPlus } from "lucide-react";

/* ─── Types ─────────────────────────────────── */
export interface Question {
  id: string;
  text: string;                  // may contain HTML + $LaTeX$
  options: string[];             // may contain HTML + LaTeX
  correctIndex?: number;         // undefined = not revealed yet
  explanation?: string | null;
  subject?: string | null;
  topic?: string | null;
  difficulty?: string | null;
}

export interface QuestionViewerProps {
  question: Question;
  questionNumber: number;        // 1-based display number
  totalQuestions: number;
  selectedIndex: number | null;  // user's selected answer
  revealed: boolean;             // true = show correct/wrong colours
  onSelect: (index: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  showExplanation?: boolean;     // show explanation panel (post-submission)
}

/* ─── KaTeX renderer (lazy-loaded) ──────────── */
function renderLatex(text: string): string {
  // Replace $$...$$ (block) first, then $...$ (inline)
  // We swap them to data-katex attributes for the effect to process
  return text
    .replace(/\$\$([^$]+)\$\$/g, `<span class="katex-block" data-expr="$1"></span>`)
    .replace(/\$([^$\n]+)\$/g, `<span class="katex-inline" data-expr="$1"></span>`);
}

/* ─── RichText: renders HTML + KaTeX ─────────── */
function RichText({ html, className = "" }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const process = async () => {
      try {
        const katex = (await import("katex")).default;
        // Render block katex
        ref.current!.querySelectorAll<HTMLElement>(".katex-block").forEach((el) => {
          const expr = el.getAttribute("data-expr") || "";
          try {
            el.innerHTML = katex.renderToString(expr, { displayMode: true, throwOnError: false });
          } catch { el.textContent = expr; }
        });
        // Render inline katex
        ref.current!.querySelectorAll<HTMLElement>(".katex-inline").forEach((el) => {
          const expr = el.getAttribute("data-expr") || "";
          try {
            el.innerHTML = katex.renderToString(expr, { displayMode: false, throwOnError: false });
          } catch { el.textContent = expr; }
        });
      } catch { /* katex not available */ }
    };
    process();
  }, [html]);

  return (
    <div
      ref={ref}
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: renderLatex(html) }}
    />
  );
}

/* ─── Option labels ─────────────────────────── */
const LABELS = ["A", "B", "C", "D", "E"];

function optionState(
  idx: number,
  selected: number | null,
  correct: number | undefined,
  revealed: boolean
): "default" | "selected" | "correct" | "wrong" | "correct-unselected" {
  if (!revealed) return idx === selected ? "selected" : "default";
  if (idx === correct) return "correct";
  if (idx === selected && idx !== correct) return "wrong";
  return "default";
}

const STATE_CLASSES: Record<string, string> = {
  default:            "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40",
  selected:           "border-blue-500 bg-blue-50 ring-1 ring-blue-300",
  correct:            "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-300",
  wrong:              "border-red-400 bg-red-50 ring-1 ring-red-300",
  "correct-unselected": "border-emerald-400 bg-emerald-50/40",
};

const LABEL_CLASSES: Record<string, string> = {
  default:            "border-gray-200 bg-gray-50 text-gray-500",
  selected:           "border-blue-500 bg-blue-500 text-white",
  correct:            "border-emerald-500 bg-emerald-500 text-white",
  wrong:              "border-red-400 bg-red-400 text-white",
  "correct-unselected": "border-emerald-400 bg-emerald-100 text-emerald-700",
};

/* ─── Component ──────────────────────────────── */
export default function QuestionViewer({
  question,
  questionNumber,
  totalQuestions,
  selectedIndex,
  revealed,
  onSelect,
  onPrev,
  onNext,
  onBookmark,
  isBookmarked,
  showExplanation = false,
}: QuestionViewerProps) {
  return (
    <div className="flex flex-col gap-6 h-full">

      {/* ── Question Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
            style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
          >
            Q {questionNumber} / {totalQuestions}
          </span>
          {question.subject && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ background: "var(--bg)", color: "var(--ink-3)", border: "1px solid var(--line-soft)" }}
            >
              {question.subject}
            </span>
          )}
          {question.difficulty && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
              question.difficulty === "EASY"   ? "bg-emerald-50 text-emerald-600" :
              question.difficulty === "MEDIUM" ? "bg-amber-50 text-amber-600" :
                                                  "bg-red-50 text-red-600"
            }`}>
              {question.difficulty.toLowerCase()}
            </span>
          )}
        </div>
        {onBookmark && (
          <button
            onClick={onBookmark}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
            }`}
            title="Bookmark question"
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Question Text ── */}
      <div
        className="rounded-2xl p-5 text-[15px] leading-relaxed font-medium"
        style={{ background: "var(--bg)", color: "var(--ink-1)", border: "1px solid var(--line-soft)" }}
      >
        <RichText html={question.text} className="question-text" />
      </div>

      {/* ── Options ── */}
      <div className="flex flex-col gap-2.5">
        {question.options.map((opt, idx) => {
          const state = optionState(idx, selectedIndex, question.correctIndex, revealed);
          return (
            <button
              key={idx}
              onClick={() => !revealed && onSelect(idx)}
              disabled={revealed}
              className={`group flex items-start gap-3 w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150 cursor-pointer disabled:cursor-default ${STATE_CLASSES[state]}`}
            >
              {/* Label bubble */}
              <span className={`flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-[12px] font-bold transition-colors ${LABEL_CLASSES[state]}`}>
                {LABELS[idx]}
              </span>
              {/* Option text */}
              <div className="flex-1 pt-0.5 text-[14px] leading-relaxed" style={{ color: "var(--ink-1)" }}>
                <RichText html={opt} />
              </div>
              {/* Result icon */}
              {revealed && state === "correct" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              )}
              {revealed && state === "wrong" && (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Explanation (post-submit) ── */}
      {showExplanation && revealed && question.explanation && (
        <div
          className="rounded-2xl p-5 border"
          style={{ background: "var(--green-soft)", borderColor: "var(--green)", borderLeftWidth: 3 }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--green)" }}>
            Explanation
          </p>
          <RichText html={question.explanation} className="text-[13px] leading-relaxed" />
        </div>
      )}

      {/* ── Navigation ── */}
      {(onPrev || onNext) && (
        <div className="flex items-center justify-between mt-auto pt-2">
          <button
            onClick={onPrev}
            disabled={!onPrev}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg)]"
            style={{ color: "var(--ink-2)", border: "1px solid var(--line)" }}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={onNext}
            disabled={!onNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white"
            style={{ background: "var(--blue)" }}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
