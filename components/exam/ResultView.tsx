"use client";

import { useState } from "react";
import {
  CheckCircle2, XCircle, MinusCircle, Trophy, BarChart3,
  ChevronDown, Mail, Loader2, CheckCheck, AlertCircle,
  Clock, Target, TrendingUp, Award, BookOpen,
} from "lucide-react";
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
  userAnswers: Record<string, number>;
  testTitle?: string;
  onBack?: () => void;
  onEmailReport?: () => Promise<void>;
}

type EmailStatus = "idle" | "sending" | "sent" | "error";

/* ─── Helpers ────────────────────────────────── */
function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function getGrade(p: number) {
  if (p >= 90) return { label: "A+", bg: "rgba(16,185,129,0.18)" };
  if (p >= 75) return { label: "A",  bg: "rgba(16,185,129,0.15)" };
  if (p >= 60) return { label: "B+", bg: "rgba(59,130,246,0.18)" };
  if (p >= 50) return { label: "B",  bg: "rgba(99,102,241,0.18)" };
  if (p >= 40) return { label: "C",  bg: "rgba(245,158,11,0.20)" };
  return           { label: "D",  bg: "rgba(239,68,68,0.18)"  };
}

function getPerformance(p: number) {
  if (p >= 90) return { title: "Outstanding! 🎉",         sub: "Top scorer — excellent preparation!" };
  if (p >= 75) return { title: "Excellent Work! 🌟",       sub: "Great score. Keep refining weak areas." };
  if (p >= 60) return { title: "Good Job! 👍",             sub: "Solid result. Focus on low-scoring topics." };
  if (p >= 50) return { title: "Average Performance",      sub: "You passed — consistent practice will improve this." };
  if (p >= 40) return { title: "Keep Practicing",          sub: "Review your weak subjects and attempt more mocks." };
  return             { title: "Needs More Preparation",    sub: "Start from fundamentals and build section by section." };
}

/* ─── Score Ring ─────────────────────────────── */
function ScoreRing({ p, size = 136 }: { p: number; size?: number }) {
  const r    = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (p / 100) * circ;
  const color = p >= 60 ? "#10b981" : p >= 40 ? "#f59e0b" : "#ef4444";
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={10} stroke="rgba(255,255,255,0.15)" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" strokeWidth={10} stroke={color}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s ease" }}
      />
    </svg>
  );
}

/* ─── Component ──────────────────────────────── */
export default function ResultView({
  result, questions, userAnswers,
  testTitle, onBack, onEmailReport,
}: ResultViewProps) {
  const [reviewOpen, setReviewOpen]   = useState(false);
  const [reviewIdx, setReviewIdx]     = useState(0);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");

  const scorePct   = pct(result.scored, result.totalMarks);
  const accuracy   = pct(result.correct, result.correct + result.wrong);
  const grade      = getGrade(scorePct);
  const { title: perfTitle, sub: perfSub } = getPerformance(scorePct);
  const avgTimeSec = result.timeTakenSec && result.totalQuestions
    ? Math.round(result.timeTakenSec / result.totalQuestions) : null;

  const reviewQuestion = questions[reviewIdx];

  const handleEmail = async () => {
    setEmailStatus("sending");
    try {
      if (onEmailReport) {
        await onEmailReport();
      } else {
        // Placeholder — wire up real API when backend endpoint is ready
        await new Promise(r => setTimeout(r, 1500));
      }
      setEmailStatus("sent");
    } catch {
      setEmailStatus("error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5 fade-up">

      {/* ── Hero Score Card ── */}
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{ background: "linear-gradient(135deg, #0D287E 0%, #091E60 100%)" }}
      >
        {/* Ambient circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
             style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none"
             style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="absolute top-1/2 right-1/4 w-28 h-28 rounded-full pointer-events-none"
             style={{ background: "rgba(29,78,216,0.20)" }} />

        <div className="relative z-10 p-6 md:p-8">
          {testTitle && (
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-4">{testTitle}</p>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score ring */}
            <div className="relative shrink-0">
              <ScoreRing p={scorePct} size={136} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-4xl font-black leading-none">{result.scored}</span>
                <span className="text-[11px] text-white/55 mt-0.5">/ {result.totalMarks}</span>
                <span className="text-[10px] font-bold text-white/45 mt-1">{scorePct}%</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <span
                  className="text-xl font-black px-3 py-0.5 rounded-xl"
                  style={{ background: grade.bg, color: "#fff" }}
                >
                  {grade.label}
                </span>
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-[19px] font-extrabold text-white mb-1">{perfTitle}</h2>
              <p className="text-sm text-white/60 mb-4 leading-relaxed">{perfSub}</p>

              {(result.rank || result.percentile) && (
                <div className="flex gap-5 justify-center sm:justify-start">
                  {result.rank && (
                    <div>
                      <div className="text-2xl font-black text-white">#{result.rank}</div>
                      <div className="text-[10px] text-white/45 font-semibold uppercase tracking-wider">Rank</div>
                    </div>
                  )}
                  {result.percentile && (
                    <div>
                      <div className="text-2xl font-black text-white">{result.percentile}%ile</div>
                      <div className="text-[10px] text-white/45 font-semibold uppercase tracking-wider">Percentile</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Correct",      value: result.correct,     icon: CheckCircle2, iconColor: "#10b981", accentBg: "#d1fae5", valColor: "#10b981" },
          { label: "Wrong",        value: result.wrong,       icon: XCircle,      iconColor: "#ef4444", accentBg: "#fee2e2", valColor: "#ef4444" },
          { label: "Unattempted",  value: result.unattempted, icon: MinusCircle,  iconColor: "#94a3b8", accentBg: "var(--bg-secondary)", valColor: "var(--ink-2)" },
          { label: "Accuracy",     value: `${accuracy}%`,     icon: Target,       iconColor: "#3b82f6", accentBg: "#dbeafe", valColor: "#3b82f6" },
        ].map(({ label, value, icon: Icon, iconColor, accentBg, valColor }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: accentBg }}>
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            <div className="text-2xl font-black" style={{ color: valColor }}>{value}</div>
            <div className="text-[11px] font-semibold" style={{ color: "var(--ink-4)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Time & Marks strip ── */}
      {(result.timeTakenSec || avgTimeSec || result.negMarks !== undefined) && (
        <div
          className="rounded-2xl p-5 flex flex-wrap gap-5"
          style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
        >
          {result.timeTakenSec && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fef3c7" }}>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: "var(--ink-1)" }}>{formatTime(result.timeTakenSec)}</div>
                <div className="text-[10px] font-medium" style={{ color: "var(--ink-4)" }}>Time Taken</div>
              </div>
            </div>
          )}
          {avgTimeSec && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#e0e7ff" }}>
                <TrendingUp className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: "var(--ink-1)" }}>
                  {avgTimeSec < 60 ? `${avgTimeSec}s` : `${Math.round(avgTimeSec / 60)}m`}
                </div>
                <div className="text-[10px] font-medium" style={{ color: "var(--ink-4)" }}>Avg / Question</div>
              </div>
            </div>
          )}
          {result.negMarks !== undefined && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fee2e2" }}>
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: "var(--ink-1)" }}>-{result.negMarks}</div>
                <div className="text-[10px] font-medium" style={{ color: "var(--ink-4)" }}>Negative Marks</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Subject-wise Analysis ── */}
      {result.subjectStats && result.subjectStats.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5" style={{ color: "var(--blue)" }} />
            <h2 className="text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>Subject-wise Analysis</h2>
          </div>
          <div className="flex flex-col gap-5">
            {result.subjectStats.map(({ subject, correct, total }) => {
              const p = pct(correct, total);
              const barColor = p >= 60 ? "#10b981" : p >= 40 ? "#f59e0b" : "#ef4444";
              const badgeBg  = p >= 60 ? "#d1fae5" : p >= 40 ? "#fef3c7" : "#fee2e2";
              const badgeClr = p >= 60 ? "#059669" : p >= 40 ? "#d97706" : "#ef4444";
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: "var(--ink-2)" }}>
                      <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--blue)" }} />
                      {subject}
                    </span>
                    <div className="flex items-center gap-2 text-[12px]">
                      <span style={{ color: "var(--ink-4)" }}>{correct}/{total}</span>
                      <span className="font-bold px-2 py-0.5 rounded-lg text-[11px]"
                            style={{ background: badgeBg, color: badgeClr }}>
                        {p}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
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

      {/* ── Question-by-Question Review ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
      >
        <button
          onClick={() => setReviewOpen(v => !v)}
          className="w-full flex items-center justify-between p-5 hover:bg-[var(--surface-hover)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: "var(--blue)" }} />
            <span className="text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>
              Question Review
            </span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--bg-secondary)", color: "var(--ink-3)" }}
            >
              {questions.length}
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${reviewOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--ink-3)" }}
          />
        </button>

        {reviewOpen && (
          <div className="px-5 pb-5 border-t" style={{ borderColor: "var(--line-soft)" }}>
            {/* Legend */}
            <div className="flex items-center gap-5 py-4 text-[11px] font-semibold" style={{ color: "var(--ink-4)" }}>
              {[
                { bg: "#10b981", color: "#fff", label: "Correct" },
                { bg: "#ef4444", color: "#fff", label: "Wrong"   },
                { bg: "var(--bg-secondary)", color: "var(--ink-3)", label: "Skipped" },
              ].map(({ bg, color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full shrink-0" style={{ background: bg }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Circular question bubbles */}
            <div className="flex flex-wrap gap-2 mb-5">
              {questions.map((q, idx) => {
                const ua        = userAnswers[q.id];
                const isCorrect = ua !== undefined && ua === q.correctIndex;
                const isWrong   = ua !== undefined && ua !== q.correctIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setReviewIdx(idx)}
                    className="w-9 h-9 rounded-full text-[12px] font-bold transition-all flex items-center justify-center"
                    style={{
                      background: isCorrect ? "#10b981" : isWrong ? "#ef4444" : "var(--bg-secondary)",
                      color: (isCorrect || isWrong) ? "#fff" : "var(--ink-3)",
                      outline: idx === reviewIdx ? "2.5px solid var(--blue)" : "none",
                      outlineOffset: "2px",
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <QuestionViewer
              question={reviewQuestion}
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

      {/* ── Email status feedback ── */}
      {emailStatus === "sent" && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl"
          style={{ background: "#d1fae5", border: "1.5px solid #6ee7b7" }}
        >
          <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">
            Report sent! Check your registered email inbox within a few minutes.
          </p>
        </div>
      )}
      {emailStatus === "error" && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl"
          style={{ background: "#fee2e2", border: "1.5px solid #fca5a5" }}
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            Could not send the report. Please try again later.
          </p>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="flex flex-col sm:flex-row gap-3 pb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold border transition-all hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--ink-1)", borderColor: "var(--line)" }}
          >
            ← Back to Dashboard
          </button>
        )}
        <button
          onClick={handleEmail}
          disabled={emailStatus === "sending" || emailStatus === "sent"}
          className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: "var(--blue)" }}
        >
          {emailStatus === "sending" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending Report…</>
          ) : emailStatus === "sent" ? (
            <><CheckCheck className="w-4 h-4" /> Report Sent!</>
          ) : (
            <><Mail className="w-4 h-4" /> Email My Report</>
          )}
        </button>
      </div>
    </div>
  );
}
