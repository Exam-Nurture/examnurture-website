"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, BookmarkPlus } from "lucide-react";
import type { CSSProperties } from "react";

/* ─── Canonical MCQ Question type ───────────── */
export interface Question {
  id: string;
  // English content
  text: string;                     // may contain HTML + $LaTeX$
  options: string[];                // exactly 4 plain strings
  correctIndex?: number;            // 0-based (0=A…3=D); undefined = masked
  explanation?: string | null;
  // Hindi content
  textHindi?: string | null;
  optionsHindi?: string[] | null;
  explanationHindi?: string | null;
  // Passage (comprehension-based)
  passage?: string | null;
  passageHindi?: string | null;
  // Images — arrays of URLs
  questionImages?: string[] | null;           // images for question text
  questionHindiImages?: string[] | null;
  optionImages?: string[][] | null;           // 4 arrays, one per option
  optionHindiImages?: string[][] | null;
  // Metadata
  subject?: string | null;
  topic?: string | null;
  difficulty?: string | null;
}

export interface QuestionViewerProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedIndex: number | null;
  revealed: boolean;
  onSelect: (index: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  showExplanation?: boolean;
  lang?: "EN" | "HI";
}

/* ─── KaTeX renderer ─────────────────────────── */
function renderLatex(text: string): string {
  return text
    .replace(/\$\$([^$]+)\$\$/g, `<span class="katex-block" data-expr="$1"></span>`)
    .replace(/\$([^$\n]+)\$/g, `<span class="katex-inline" data-expr="$1"></span>`);
}

/* ─── RichText: HTML + KaTeX ─────────────────── */
function RichText({ html, className = "" }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const process = async () => {
      try {
        const katex = (await import("katex")).default;
        ref.current!.querySelectorAll<HTMLElement>(".katex-block").forEach((el) => {
          const expr = el.getAttribute("data-expr") || "";
          try { el.innerHTML = katex.renderToString(expr, { displayMode: true, throwOnError: false }); }
          catch { el.textContent = expr; }
        });
        ref.current!.querySelectorAll<HTMLElement>(".katex-inline").forEach((el) => {
          const expr = el.getAttribute("data-expr") || "";
          try { el.innerHTML = katex.renderToString(expr, { displayMode: false, throwOnError: false }); }
          catch { el.textContent = expr; }
        });
      } catch { /* katex unavailable */ }
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

/* ─── Image strip ────────────────────────────── */
function ImageStrip({ urls }: { urls: string[] }) {
  const valid = urls.filter(Boolean);
  if (!valid.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {valid.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={url}
          alt=""
          className="max-h-36 rounded-lg border object-contain"
          style={{ borderColor: "var(--line-soft)", background: "var(--bg)" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ))}
    </div>
  );
}

/* ─── Option helpers ─────────────────────────── */
const LABELS = ["A", "B", "C", "D", "E"];

type OptionState = "default" | "selected" | "correct" | "wrong" | "correct-unselected";

function optionState(idx: number, selected: number | null, correct: number | undefined, revealed: boolean): OptionState {
  if (!revealed) return idx === selected ? "selected" : "default";
  if (idx === correct) return "correct";
  if (idx === selected && idx !== correct) return "wrong";
  return "default";
}

function getOptionStyle(state: OptionState): CSSProperties {
  switch (state) {
    case "selected":          return { borderColor: "var(--blue)",  background: "var(--blue-soft)",  boxShadow: "0 0 0 1px var(--blue)" };
    case "correct":           return { borderColor: "var(--green)", background: "var(--green-soft)", boxShadow: "0 0 0 1px var(--green)" };
    case "wrong":             return { borderColor: "var(--red)",   background: "var(--red-soft)",   boxShadow: "0 0 0 1px var(--red)" };
    case "correct-unselected":return { borderColor: "var(--green)", background: "var(--green-soft)", opacity: 0.7 };
    default:                  return { borderColor: "var(--line)",  background: "var(--card)" };
  }
}

function getLabelStyle(state: OptionState): CSSProperties {
  switch (state) {
    case "selected":          return { borderColor: "var(--blue)",  background: "var(--blue)",  color: "#fff" };
    case "correct":           return { borderColor: "var(--green)", background: "var(--green)", color: "#fff" };
    case "wrong":             return { borderColor: "var(--red)",   background: "var(--red)",   color: "#fff" };
    case "correct-unselected":return { borderColor: "var(--green)", background: "var(--green-soft)", color: "var(--green)" };
    default:                  return { borderColor: "var(--line-soft)", background: "var(--bg)", color: "var(--ink-3)" };
  }
}

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
  lang = "EN",
}: QuestionViewerProps) {
  const isHindi = lang === "HI";

  // Resolve bilingual content — fall back to English if Hindi missing
  const displayText    = (isHindi && question.textHindi)    ? question.textHindi    : question.text;
  const displayOptions = (isHindi && question.optionsHindi?.length) ? question.optionsHindi : question.options;
  const displayPassage = (isHindi && question.passageHindi) ? question.passageHindi : question.passage;
  const displayExpl    = (isHindi && question.explanationHindi) ? question.explanationHindi : question.explanation;

  const qImages  = (isHindi ? question.questionHindiImages : question.questionImages) ?? question.questionImages ?? [];
  const optImgs  = (isHindi ? question.optionHindiImages   : question.optionImages)   ?? question.optionImages  ?? [];

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* ── Header chips ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
          style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>
          Q {questionNumber} / {totalQuestions}
        </span>
        {question.subject && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ background: "var(--bg)", color: "var(--ink-3)", border: "1px solid var(--line-soft)" }}>
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
        {onBookmark && (
          <button onClick={onBookmark} className={`ml-auto p-2 rounded-lg transition-colors ${
            isBookmarked ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
          }`} title="Bookmark">
            <BookmarkPlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Passage (comprehension) ── */}
      {displayPassage && (
        <div className="rounded-xl p-4 text-[13px] leading-relaxed border-l-4"
          style={{ background: "var(--bg)", borderColor: "var(--blue)", color: "var(--ink-2)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--blue)" }}>
            Read the passage
          </p>
          <RichText html={displayPassage} />
        </div>
      )}

      {/* ── Question Text ── */}
      <div className="rounded-2xl p-5 text-[15px] leading-relaxed font-medium"
        style={{ background: "var(--bg)", color: "var(--ink-1)", border: "1px solid var(--line-soft)" }}>
        <RichText html={displayText} className="question-text" />
        <ImageStrip urls={qImages as string[]} />
      </div>

      {/* ── Options ── */}
      <div className="flex flex-col gap-2.5">
        {displayOptions.map((opt, idx) => {
          const state = optionState(idx, selectedIndex, question.correctIndex, revealed);
          const imgs = Array.isArray(optImgs) ? ((optImgs as string[][])[idx] ?? []) : [];
          return (
            <button
              key={idx}
              onClick={() => !revealed && onSelect(idx)}
              disabled={revealed}
              className="group flex items-start gap-3 w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150 disabled:cursor-default"
              style={{ ...getOptionStyle(state), borderWidth: "1.5px", borderStyle: "solid" }}
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-[12px] font-bold transition-colors"
                style={{ ...getLabelStyle(state), borderWidth: "1.5px", borderStyle: "solid" }}>
                {LABELS[idx]}
              </span>
              <div className="flex-1 pt-0.5 text-[14px] leading-relaxed" style={{ color: "var(--ink-1)" }}>
                <RichText html={opt} />
                <ImageStrip urls={imgs} />
              </div>
              {revealed && state === "correct" && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--green)" }} />}
              {revealed && state === "wrong"   && <XCircle      className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--red)"   }} />}
            </button>
          );
        })}
      </div>

      {/* ── Explanation (post-submit) ── */}
      {showExplanation && revealed && displayExpl && (
        <div className="rounded-2xl p-5 border" style={{ background: "var(--green-soft)", borderColor: "var(--green)", borderLeftWidth: 3 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--green)" }}>Explanation</p>
          <RichText html={displayExpl} className="text-[13px] leading-relaxed" />
        </div>
      )}

      {/* ── Navigation ── */}
      {(onPrev || onNext) && (
        <div className="flex items-center justify-between mt-auto pt-2">
          <button onClick={onPrev} disabled={!onPrev}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg)]"
            style={{ color: "var(--ink-2)", border: "1px solid var(--line)" }}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button onClick={onNext} disabled={!onNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white"
            style={{ background: "var(--blue)" }}>
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
