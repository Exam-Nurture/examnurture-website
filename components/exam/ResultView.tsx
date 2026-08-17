"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, MinusCircle, BarChart3, ChevronDown, Mail,
  Loader2, CheckCheck, AlertCircle, Clock, Target, TrendingUp, Award,
  BookOpen, ArrowLeft, Trophy,
} from "lucide-react";
import QuestionViewer, { Question } from "./QuestionViewer";
import LanguageSelect from "./LanguageSelect";
import { availableLanguages } from "./languages";

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
  userAnswers: Record<string, number>;
  testTitle?: string;
  onBack?: () => void;
  onEmailReport?: () => Promise<void>;
}

type EmailStatus = "idle" | "sending" | "sent" | "error";
type ReviewFilter = "all" | "correct" | "wrong" | "skipped";

/* ─── Helpers ───────────────────────────────── */
function pct(n: number, d: number) {
  return d ? Math.round((n / d) * 100) : 0;
}

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function grading(p: number) {
  if (p >= 90) return { grade: "A+", tone: "var(--x-answered)", title: "Outstanding", sub: "Top-tier preparation. Hold this standard." };
  if (p >= 75) return { grade: "A",  tone: "var(--x-answered)", title: "Excellent work", sub: "Strong score — refine the weaker sections." };
  if (p >= 60) return { grade: "B+", tone: "var(--blue-ink)",   title: "Good job", sub: "Solid result. Target your low-scoring topics next." };
  if (p >= 50) return { grade: "B",  tone: "var(--blue-ink)",   title: "On track", sub: "You cleared the bar. Consistency will lift this." };
  if (p >= 40) return { grade: "C",  tone: "var(--amber)",      title: "Keep practising", sub: "Review weak subjects and attempt more mocks." };
  return { grade: "D", tone: "var(--x-unanswered)", title: "Build the base", sub: "Start from fundamentals, one section at a time." };
}

/* ─── Score ring ────────────────────────────── */
function ScoreRing({ p, tone, size = 148 }: { p: number; tone: string; size?: number }) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="var(--x-inset-2)" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        stroke={tone}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (p / 100) * circ }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      />
    </svg>
  );
}

/* ─── Component ─────────────────────────────── */
export default function ResultView({
  result,
  questions,
  userAnswers,
  testTitle,
  onBack,
  onEmailReport,
}: ResultViewProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [lang, setLang] = useState("en");

  const languages = useMemo(() => availableLanguages(questions), [questions]);

  const scorePct = pct(result.scored, result.totalMarks);
  const accuracy = pct(result.correct, result.correct + result.wrong);
  const g = grading(scorePct);
  const avgTimeSec =
    result.timeTakenSec && result.totalQuestions
      ? Math.round(result.timeTakenSec / result.totalQuestions)
      : null;

  const statusOf = (q: Question): ReviewFilter => {
    const ua = userAnswers[q.id];
    if (ua === undefined) return "skipped";
    return ua === q.correctIndex ? "correct" : "wrong";
  };

  const visible = useMemo(
    () =>
      questions
        .map((q, idx) => ({ q, idx }))
        .filter(({ q }) => filter === "all" || statusOf(q) === filter),
    // statusOf closes over userAnswers, which is stable for a submitted attempt
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, filter, userAnswers],
  );

  const reviewQuestion = questions[reviewIdx];

  const handleEmail = async () => {
    if (!onEmailReport) return;
    setEmailStatus("sending");
    try {
      await onEmailReport();
      setEmailStatus("sent");
    } catch {
      setEmailStatus("error");
    }
  };

  const STATS = [
    { label: "Correct",     value: result.correct,     icon: CheckCircle2, tone: "var(--x-answered)",   bg: "var(--green-soft)" },
    { label: "Wrong",       value: result.wrong,       icon: XCircle,      tone: "var(--x-unanswered)", bg: "var(--red-soft)" },
    { label: "Unattempted", value: result.unattempted, icon: MinusCircle,  tone: "var(--x-ink-3)",      bg: "var(--x-inset)" },
    { label: "Accuracy",    value: `${accuracy}%`,     icon: Target,       tone: "var(--blue-ink)",     bg: "var(--blue-soft)" },
  ];

  const FILTERS: { id: ReviewFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: questions.length },
    { id: "correct", label: "Correct", count: result.correct },
    { id: "wrong", label: "Wrong", count: result.wrong },
    { id: "skipped", label: "Skipped", count: result.unattempted },
  ];

  return (
    <div className="exam-shell min-h-screen">
      <div className="mx-auto flex max-w-[860px] flex-col gap-4 px-4 py-6 sm:py-9">
        {/* ══ Hero ══ */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="x-paper relative overflow-hidden p-5 sm:p-7"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 55% 130% at 88% 0%, ${g.tone}1F 0%, transparent 62%)`,
            }}
          />

          <div className="relative">
            {testTitle && <p className="x-eyebrow mb-5">{testTitle}</p>}

            <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
              {/* Ring */}
              <div className="relative shrink-0" style={{ width: 148, height: 148 }}>
                <ScoreRing p={scorePct} tone={g.tone} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-[40px] font-semibold leading-none tabular-nums"
                    style={{
                      fontFamily: "var(--font-sora)",
                      color: "var(--x-ink)",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {result.scored}
                  </span>
                  <span className="mt-1 text-[12px]" style={{ color: "var(--x-ink-4)" }}>
                    of {result.totalMarks}
                  </span>
                  <span
                    className="mt-1.5 rounded-full px-2 py-[2px] text-[10.5px] font-bold tabular-nums"
                    style={{ background: `${g.tone}1F`, color: g.tone }}
                  >
                    {scorePct}%
                  </span>
                </div>
              </div>

              {/* Verdict */}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="mb-3 flex items-center justify-center gap-2 sm:justify-start">
                  <span
                    className="rounded-[10px] px-2.5 py-1 text-[15px] font-bold leading-none"
                    style={{ background: `${g.tone}22`, color: g.tone }}
                  >
                    {g.grade}
                  </span>
                  <Award size={17} style={{ color: "var(--amber)" }} />
                </div>

                <h1
                  className="text-[23px] font-semibold sm:text-[26px]"
                  style={{
                    fontFamily: "var(--font-sora)",
                    color: "var(--x-ink)",
                    letterSpacing: "-0.028em",
                  }}
                >
                  {g.title}
                </h1>
                <p
                  className="mt-2 text-[13.5px] leading-relaxed"
                  style={{ color: "var(--x-ink-3)", maxWidth: "46ch" }}
                >
                  {g.sub}
                </p>

                {(result.rank || result.percentile) && (
                  <div className="mt-5 flex justify-center gap-2.5 sm:justify-start">
                    {result.rank && (
                      <div className="x-well px-4 py-2.5">
                        <div className="x-eyebrow flex items-center gap-1.5">
                          <Trophy size={10} /> Rank
                        </div>
                        <div
                          className="mt-1.5 text-[18px] font-semibold leading-none tabular-nums"
                          style={{ fontFamily: "var(--font-sora)", color: "var(--x-ink)" }}
                        >
                          #{result.rank}
                        </div>
                      </div>
                    )}
                    {result.percentile !== undefined && (
                      <div className="x-well px-4 py-2.5">
                        <div className="x-eyebrow">Percentile</div>
                        <div
                          className="mt-1.5 text-[18px] font-semibold leading-none tabular-nums"
                          style={{ fontFamily: "var(--font-sora)", color: "var(--x-ink)" }}
                        >
                          {result.percentile}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══ Stat row ══ */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map(({ label, value, icon: Icon, tone, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="x-paper flex flex-col gap-3 p-4"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-[11px]"
                style={{ background: bg, color: tone }}
              >
                <Icon size={17} />
              </span>
              <div>
                <div
                  className="text-[25px] font-semibold leading-none tabular-nums"
                  style={{ fontFamily: "var(--font-sora)", color: tone, letterSpacing: "-0.03em" }}
                >
                  {value}
                </div>
                <div className="x-eyebrow mt-2.5">{label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ══ Timing strip ══ */}
        {(result.timeTakenSec || avgTimeSec || result.negMarks !== undefined) && (
          <div className="x-paper flex flex-wrap gap-x-8 gap-y-4 p-5">
            {result.timeTakenSec != null && (
              <TimeFact
                icon={<Clock size={17} />}
                tone="var(--amber)"
                bg="var(--amber-soft)"
                value={formatTime(result.timeTakenSec)}
                label="Time taken"
              />
            )}
            {avgTimeSec != null && (
              <TimeFact
                icon={<TrendingUp size={17} />}
                tone="var(--violet)"
                bg="var(--violet-soft)"
                value={avgTimeSec < 60 ? `${avgTimeSec}s` : `${Math.round(avgTimeSec / 60)}m`}
                label="Avg / question"
              />
            )}
            {result.negMarks !== undefined && result.negMarks > 0 && (
              <TimeFact
                icon={<XCircle size={17} />}
                tone="var(--x-unanswered)"
                bg="var(--red-soft)"
                value={`−${result.negMarks}`}
                label="Negative marks"
              />
            )}
          </div>
        )}

        {/* ══ Subject analysis ══ */}
        {result.subjectStats && result.subjectStats.length > 0 && (
          <section className="x-paper p-5">
            <div className="mb-5 flex items-center gap-2.5">
              <BarChart3 size={17} style={{ color: "var(--blue-ink)" }} />
              <h2
                className="text-[15.5px] font-semibold"
                style={{ color: "var(--x-ink)", letterSpacing: "-0.02em" }}
              >
                Subject-wise analysis
              </h2>
            </div>

            <div className="flex flex-col gap-5">
              {result.subjectStats.map(({ subject, correct, total }) => {
                const p = pct(correct, total);
                const tone =
                  p >= 60 ? "var(--x-answered)" : p >= 40 ? "var(--amber)" : "var(--x-unanswered)";
                return (
                  <div key={subject}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span
                        className="flex min-w-0 items-center gap-1.5 truncate text-[13px] font-medium"
                        style={{ color: "var(--x-ink)" }}
                      >
                        <BookOpen size={13} style={{ color: "var(--x-ink-4)" }} />
                        {subject}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-[12px]">
                        <span className="tabular-nums" style={{ color: "var(--x-ink-4)" }}>
                          {correct}/{total}
                        </span>
                        <span
                          className="rounded-full px-2 py-[3px] text-[11px] font-bold tabular-nums"
                          style={{ background: `${tone}1F`, color: tone }}
                        >
                          {p}%
                        </span>
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full"
                      style={{ background: "var(--x-inset-2)" }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: tone }}
                        initial={{ width: 0 }}
                        animate={{ width: `${p}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══ Question review ══ */}
        <section className="x-paper overflow-hidden">
          <button
            type="button"
            onClick={() => setReviewOpen((v) => !v)}
            aria-expanded={reviewOpen}
            className="flex w-full items-center justify-between p-5 transition-colors d-focus"
          >
            <span className="flex items-center gap-2.5">
              <BookOpen size={17} style={{ color: "var(--blue-ink)" }} />
              <span
                className="text-[15.5px] font-semibold"
                style={{ color: "var(--x-ink)", letterSpacing: "-0.02em" }}
              >
                Question review
              </span>
              <span
                className="rounded-full px-2 py-[3px] text-[11px] font-bold tabular-nums"
                style={{ background: "var(--x-inset)", color: "var(--x-ink-3)" }}
              >
                {questions.length}
              </span>
            </span>
            <ChevronDown
              size={18}
              className="transition-transform duration-300"
              style={{
                color: "var(--x-ink-3)",
                transform: reviewOpen ? "rotate(180deg)" : "none",
              }}
            />
          </button>

          {reviewOpen && (
            <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--x-line-soft)" }}>
              {/* Filter + language */}
              <div className="flex flex-wrap items-center gap-2.5 py-4">
                <div
                  className="flex items-center gap-0.5 rounded-full p-1"
                  style={{ background: "var(--x-inset)", border: "1px solid var(--x-line-soft)" }}
                >
                  {FILTERS.map((f) => {
                    const on = filter === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilter(f.id)}
                        aria-pressed={on}
                        className="rounded-full px-3 py-[6px] text-[12px] font-semibold transition-all duration-200 d-focus"
                        style={
                          on
                            ? {
                                background: "var(--x-surface)",
                                color: "var(--x-ink)",
                                boxShadow: "0 1px 3px rgba(0,0,0,.12)",
                              }
                            : { color: "var(--x-ink-3)" }
                        }
                      >
                        {f.label}
                        <span className="ml-1.5 opacity-60 tabular-nums">{f.count}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="ml-auto">
                  <LanguageSelect options={languages} value={lang} onChange={setLang} />
                </div>
              </div>

              {/* Bubbles */}
              {visible.length === 0 ? (
                <p
                  className="py-8 text-center text-[13px]"
                  style={{ color: "var(--x-ink-4)" }}
                >
                  No questions in this category.
                </p>
              ) : (
                <div className="mb-5 flex flex-wrap gap-2">
                  {visible.map(({ q, idx }) => {
                    const st = statusOf(q);
                    const bg =
                      st === "correct"
                        ? "var(--x-answered)"
                        : st === "wrong"
                          ? "var(--x-unanswered)"
                          : "var(--x-inset)";
                    const fg =
                      st === "correct"
                        ? "var(--x-answered-ink)"
                        : st === "wrong"
                          ? "var(--x-unanswered-ink)"
                          : "var(--x-ink-3)";
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setReviewIdx(idx)}
                        aria-label={`Question ${idx + 1}, ${st}`}
                        aria-current={idx === reviewIdx}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold tabular-nums transition-transform duration-150 hover:scale-105 d-focus"
                        style={{
                          background: bg,
                          color: fg,
                          border: st === "skipped" ? "1px solid var(--x-line)" : "none",
                          outline: idx === reviewIdx ? "2.5px solid var(--blue-ink)" : "none",
                          outlineOffset: 2,
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              )}

              {reviewQuestion && (
                <div className="x-well p-4 sm:p-5">
                  <QuestionViewer
                    question={reviewQuestion}
                    questionNumber={reviewIdx + 1}
                    totalQuestions={questions.length}
                    selectedIndex={userAnswers[reviewQuestion.id] ?? null}
                    revealed
                    onSelect={() => {}}
                    onPrev={reviewIdx > 0 ? () => setReviewIdx((i) => i - 1) : undefined}
                    onNext={
                      reviewIdx < questions.length - 1
                        ? () => setReviewIdx((i) => i + 1)
                        : undefined
                    }
                    showExplanation
                    lang={lang}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* ══ Email feedback ══ */}
        {emailStatus === "sent" && (
          <Banner
            tone="var(--x-answered)"
            bg="var(--green-soft)"
            icon={<CheckCheck size={17} />}
            text="Report sent. Check your registered email inbox in a few minutes."
          />
        )}
        {emailStatus === "error" && (
          <Banner
            tone="var(--x-unanswered)"
            bg="var(--red-soft)"
            icon={<AlertCircle size={17} />}
            text="Could not send the report. Please try again in a moment."
          />
        )}

        {/* ══ Actions ══ */}
        <div className="flex flex-col gap-2.5 pb-8 sm:flex-row">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-[13.5px] font-semibold transition-transform duration-200 hover:-translate-y-[1px] d-focus"
              style={{
                color: "var(--x-ink)",
                background: "var(--x-surface)",
                border: "1px solid var(--x-line)",
              }}
            >
              <ArrowLeft size={15} />
              Back to dashboard
            </button>
          )}
          {onEmailReport && (
            <button
              type="button"
              onClick={handleEmail}
              disabled={emailStatus === "sending" || emailStatus === "sent"}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-[13.5px] font-semibold text-white transition-transform duration-200 hover:-translate-y-[1px] disabled:opacity-60 d-focus"
              style={{
                background: "var(--blue-ink)",
                boxShadow: "0 10px 26px -12px rgba(13,40,126,.7)",
              }}
            >
              {emailStatus === "sending" ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Sending report…
                </>
              ) : emailStatus === "sent" ? (
                <>
                  <CheckCheck size={15} /> Report sent
                </>
              ) : (
                <>
                  <Mail size={15} /> Email my report
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Small parts ───────────────────────────── */

function TimeFact({
  icon,
  tone,
  bg,
  value,
  label,
}: {
  icon: React.ReactNode;
  tone: string;
  bg: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
        style={{ background: bg, color: tone }}
      >
        {icon}
      </span>
      <span>
        <span
          className="block text-[15px] font-semibold leading-none tabular-nums"
          style={{ color: "var(--x-ink)" }}
        >
          {value}
        </span>
        <span className="x-eyebrow mt-2 block">{label}</span>
      </span>
    </div>
  );
}

function Banner({
  tone,
  bg,
  icon,
  text,
}: {
  tone: string;
  bg: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-[14px] px-4 py-3.5"
      style={{ background: bg, border: `1px solid ${tone}44` }}
    >
      <span className="shrink-0" style={{ color: tone }}>
        {icon}
      </span>
      <p className="text-[13px] font-medium" style={{ color: tone }}>
        {text}
      </p>
    </div>
  );
}
