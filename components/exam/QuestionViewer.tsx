"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import {
  CheckCircle2, XCircle, ChevronRight, ChevronLeft, Bookmark, Info,
} from "lucide-react";
import {
  resolveContent, isRTL, languageOf,
  type LangContent, type TranslatableQuestion,
} from "./languages";

/* ─── Canonical MCQ Question type ───────────── */
export interface Question extends TranslatableQuestion {
  id: string;
  text: string;                     // may contain HTML + $LaTeX$
  options: string[];
  correctIndex?: number;            // 0-based (0=A…3=D); undefined = masked
  explanation?: string | null;

  /* Legacy Hindi columns — still honoured via the language registry */
  textHindi?: string | null;
  optionsHindi?: string[] | null;
  explanationHindi?: string | null;
  passage?: string | null;
  passageHindi?: string | null;

  /* Images */
  questionImages?: string[] | null;
  questionHindiImages?: string[] | null;
  optionImages?: string[][] | null;
  optionHindiImages?: string[][] | null;

  /* Any additional language, keyed by ISO code */
  translations?: Record<string, LangContent> | null;

  /* Metadata */
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
  /** ISO 639-1 code. Defaults to English. */
  lang?: string;
}

/* ─── KaTeX ──────────────────────────────────── */
function renderLatex(text: string): string {
  return text
    .replace(/\$\$([^$]+)\$\$/g, `<span class="katex-block" data-expr="$1"></span>`)
    .replace(/\$([^$\n]+)\$/g, `<span class="katex-inline" data-expr="$1"></span>`);
}

function RichText({
  html,
  className = "",
  dir,
}: {
  html: string;
  className?: string;
  dir?: "ltr" | "rtl";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    (async () => {
      try {
        const katex = (await import("katex")).default;
        if (cancelled || !ref.current) return;
        ref.current.querySelectorAll<HTMLElement>(".katex-block").forEach((el) => {
          const expr = el.getAttribute("data-expr") || "";
          try {
            el.innerHTML = katex.renderToString(expr, { displayMode: true, throwOnError: false });
          } catch {
            el.textContent = expr;
          }
        });
        ref.current.querySelectorAll<HTMLElement>(".katex-inline").forEach((el) => {
          const expr = el.getAttribute("data-expr") || "";
          try {
            el.innerHTML = katex.renderToString(expr, { displayMode: false, throwOnError: false });
          } catch {
            el.textContent = expr;
          }
        });
      } catch {
        /* katex unavailable — raw text still renders */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [html]);

  return (
    <div
      ref={ref}
      dir={dir}
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: renderLatex(html) }}
    />
  );
}

/* ─── Images ─────────────────────────────────── */
function ImageStrip({ urls }: { urls: string[] }) {
  const valid = urls.filter(Boolean);
  if (!valid.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {valid.map((url, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={i}
          src={url}
          alt=""
          loading="lazy"
          className="max-h-44 rounded-[10px] object-contain"
          style={{ border: "1px solid var(--x-line-soft)", background: "var(--x-inset)" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ))}
    </div>
  );
}

/* ─── Option state ───────────────────────────── */
const LABELS = ["A", "B", "C", "D", "E", "F"];

type OptionState = "default" | "selected" | "correct" | "wrong";

function optionState(
  idx: number,
  selected: number | null,
  correct: number | undefined,
  revealed: boolean,
): OptionState {
  if (!revealed) return idx === selected ? "selected" : "default";
  if (idx === correct) return "correct";
  if (idx === selected && idx !== correct) return "wrong";
  return "default";
}

function optionStyle(state: OptionState): CSSProperties {
  switch (state) {
    case "selected":
      return {
        borderColor: "var(--blue-ink)",
        background: "var(--blue-soft)",
        boxShadow: "0 0 0 1px var(--blue-ink)",
      };
    case "correct":
      return {
        borderColor: "var(--x-answered)",
        background: "var(--green-soft)",
        boxShadow: "0 0 0 1px var(--x-answered)",
      };
    case "wrong":
      return {
        borderColor: "var(--x-unanswered)",
        background: "var(--red-soft)",
        boxShadow: "0 0 0 1px var(--x-unanswered)",
      };
    default:
      return { borderColor: "var(--x-line)", background: "var(--x-surface)" };
  }
}

function labelStyle(state: OptionState): CSSProperties {
  switch (state) {
    case "selected":
      return { borderColor: "var(--blue-ink)", background: "var(--blue-ink)", color: "#fff" };
    case "correct":
      return { borderColor: "var(--x-answered)", background: "var(--x-answered)", color: "var(--x-answered-ink)" };
    case "wrong":
      return { borderColor: "var(--x-unanswered)", background: "var(--x-unanswered)", color: "var(--x-unanswered-ink)" };
    default:
      return { borderColor: "var(--x-line)", background: "var(--x-inset)", color: "var(--x-ink-3)" };
  }
}

const DIFFICULTY: Record<string, { bg: string; fg: string }> = {
  EASY:   { bg: "var(--green-soft)", fg: "var(--green)" },
  MEDIUM: { bg: "var(--amber-soft)", fg: "var(--amber)" },
  HARD:   { bg: "var(--red-soft)",   fg: "var(--red)" },
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
  lang = "en",
}: QuestionViewerProps) {
  const c = resolveContent(question, lang);
  const dir = isRTL(lang) ? "rtl" : "ltr";
  const diff = question.difficulty
    ? DIFFICULTY[question.difficulty.toUpperCase()] ?? DIFFICULTY.MEDIUM
    : null;

  return (
    <div className="flex h-full flex-col gap-5">
      {/* ── Meta row ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2.5 py-[5px] text-[11px] font-bold leading-none tabular-nums"
          style={{
            background: "var(--blue-soft)",
            color: "var(--blue-ink)",
            border: "1px solid rgba(29,78,216,0.24)",
          }}
        >
          Q{questionNumber}
          <span style={{ opacity: 0.6 }}> / {totalQuestions}</span>
        </span>

        {question.subject && (
          <span
            className="rounded-full px-2.5 py-[5px] text-[10.5px] font-semibold uppercase leading-none tracking-[0.06em]"
            style={{
              background: "var(--x-inset)",
              color: "var(--x-ink-3)",
              border: "1px solid var(--x-line-soft)",
            }}
          >
            {question.subject}
          </span>
        )}

        {diff && question.difficulty && (
          <span
            className="rounded-full px-2.5 py-[5px] text-[10.5px] font-bold uppercase leading-none tracking-[0.06em]"
            style={{ background: diff.bg, color: diff.fg }}
          >
            {question.difficulty.toLowerCase()}
          </span>
        )}

        {onBookmark && (
          <button
            type="button"
            onClick={onBookmark}
            title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
            aria-pressed={isBookmarked}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-[6px] text-[11.5px] font-semibold transition-colors duration-200 d-focus"
            style={
              isBookmarked
                ? {
                    background: "var(--amber-soft)",
                    color: "var(--amber)",
                    border: "1px solid rgba(232,169,60,0.32)",
                  }
                : {
                    background: "var(--x-inset)",
                    color: "var(--x-ink-3)",
                    border: "1px solid var(--x-line-soft)",
                  }
            }
          >
            <Bookmark size={13} fill={isBookmarked ? "currentColor" : "none"} />
            {isBookmarked ? "Saved" : "Save"}
          </button>
        )}
      </div>

      {/* ── Translation fallback notice ── */}
      {c.fellBack && (
        <div
          className="flex items-start gap-2.5 rounded-[12px] px-3.5 py-2.5 text-[12px]"
          style={{
            background: "var(--amber-soft)",
            color: "var(--amber)",
            border: "1px solid rgba(232,169,60,0.28)",
          }}
        >
          <Info size={14} className="mt-px shrink-0" />
          <span>
            This question isn&apos;t available in {languageOf(lang).native} yet — showing English.
          </span>
        </div>
      )}

      {/* ── Passage ── */}
      {c.passage && (
        <details
          open
          className="x-well overflow-hidden"
          style={{ borderLeft: "3px solid var(--blue-ink)" }}
        >
          <summary
            className="x-eyebrow cursor-pointer list-none px-4 py-3 select-none"
            style={{ color: "var(--blue-ink)" }}
          >
            Read the passage
          </summary>
          <div className="px-4 pb-4">
            <RichText
              html={c.passage}
              dir={dir}
              className="text-[13.5px] leading-[1.75]"
            />
          </div>
        </details>
      )}

      {/* ── Question ── */}
      <div>
        <RichText
          html={c.text}
          dir={dir}
          className="text-[16px] font-medium leading-[1.7] sm:text-[17px]"
        />
        <ImageStrip urls={c.questionImages} />
      </div>

      {/* ── Options ── */}
      <fieldset className="flex flex-col gap-2.5" dir={dir}>
        <legend className="sr-only">Answer options for question {questionNumber}</legend>
        {c.options.map((opt, idx) => {
          const state = optionState(idx, selectedIndex, question.correctIndex, revealed);
          const imgs = Array.isArray(c.optionImages) ? c.optionImages[idx] ?? [] : [];
          return (
            <button
              key={idx}
              type="button"
              onClick={() => !revealed && onSelect(idx)}
              disabled={revealed}
              aria-pressed={idx === selectedIndex}
              className="x-option group flex w-full items-start gap-3.5 rounded-[14px] px-4 py-3.5 text-left disabled:cursor-default d-focus"
              style={{ ...optionStyle(state), borderWidth: 1.5, borderStyle: "solid" }}
            >
              <span
                className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] text-[12px] font-bold"
                style={{ ...labelStyle(state), borderWidth: 1.5, borderStyle: "solid" }}
              >
                {LABELS[idx]}
              </span>

              <span className="min-w-0 flex-1" style={{ color: "var(--x-ink)" }}>
                <RichText html={opt} dir={dir} className="text-[14.5px] leading-[1.65]" />
                <ImageStrip urls={imgs} />
              </span>

              {revealed && state === "correct" && (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: "var(--x-answered)" }} />
              )}
              {revealed && state === "wrong" && (
                <XCircle size={18} className="mt-0.5 shrink-0" style={{ color: "var(--x-unanswered)" }} />
              )}
            </button>
          );
        })}
      </fieldset>

      {/* ── Explanation ── */}
      {showExplanation && revealed && c.explanation && (
        <div
          className="rounded-[14px] px-4 py-4"
          style={{
            background: "var(--green-soft)",
            border: "1px solid rgba(59,170,111,0.3)",
            borderLeftWidth: 3,
            borderLeftColor: "var(--x-answered)",
          }}
        >
          <p className="x-eyebrow mb-2.5" style={{ color: "var(--x-answered)" }}>
            Explanation
          </p>
          <RichText
            html={c.explanation}
            dir={dir}
            className="text-[13.5px] leading-[1.75]"
          />
        </div>
      )}

      {/* ── Inline navigation (review mode) ── */}
      {(onPrev || onNext) && (
        <div className="mt-auto flex items-center justify-between pt-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all disabled:opacity-30 d-focus"
            style={{
              color: "var(--x-ink-2)",
              background: "var(--x-surface)",
              border: "1px solid var(--x-line)",
            }}
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-all disabled:opacity-30 d-focus"
            style={{ background: "var(--blue-ink)" }}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
