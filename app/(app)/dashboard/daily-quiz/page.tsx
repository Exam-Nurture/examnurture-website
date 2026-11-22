"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RichText } from "@/components/exam/QuestionViewer";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AppPage, { AppSpinner } from "@/components/app/AppPage";
import { apiGetDailyPractice, apiSubmitDailyPractice, apiEmailReport } from "@/lib/api";
import type { Question } from "@/components/exam/QuestionViewer";

type Phase = "loading" | "active" | "result" | "error";

const DURATION_SEC = 900;
const display = { fontFamily: "var(--font-sora)" } as const;

const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)] disabled:opacity-60";
const btnSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-5 text-sm font-semibold text-[var(--ink-1)] hover:bg-[var(--brand-soft)] disabled:opacity-50";

interface RawQuestion {
  id: string;
  text: string;
  options?: string | string[];
  correctIndex?: number | null;
  explanation?: string | null;
  subject?: string | null;
  topic?: string | null;
  difficulty?: string | null;
}

interface SubmitResponse {
  attemptId?: string;
  id?: string;
  correct?: number;
  wrong?: number;
  unattempted?: number;
  totalMarks?: number;
  scored?: number;
  score?: number;
}

interface Summary {
  total: number;
  correct: number;
  wrong: number;
  unattempted: number;
  timeTakenSec: number;
}

function mapQ(raw: RawQuestion): Question {
  let opts: string[] = [];
  try {
    opts = typeof raw.options === "string" ? JSON.parse(raw.options) : raw.options || [];
  } catch {
    opts = [];
  }
  return {
    id: raw.id,
    text: raw.text,
    options: opts,
    correctIndex: raw.correctIndex ?? undefined,
    explanation: raw.explanation ?? null,
    subject: raw.subject ?? null,
    topic: raw.topic ?? null,
    difficulty: raw.difficulty ?? null,
  };
}


function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function DailyQuizPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(DURATION_SEC);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const submittedRef = useRef(false);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace(`/?next=${encodeURIComponent(window.location.href)}`);
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      try {
        const res = (await apiGetDailyPractice()) as { questions?: RawQuestion[] };
        setQuestions((res.questions || []).map(mapQ));
        setPhase("active");
      } catch (e) {
        setError(e instanceof Error && e.message ? e.message : "Couldn't load today's quiz.");
        setPhase("error");
      }
    })();
  }, [authLoading, user]);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    const given = answers;
    const timeTakenSec = Math.min(DURATION_SEC, Math.max(0, DURATION_SEC - remaining));
    try {
      const res = (await apiSubmitDailyPractice(given)) as SubmitResponse;
      const aid = res.attemptId ?? res.id;
      if (aid) setAttemptId(aid);
      const total = questions.length;
      setSummary({
        total,
        correct: res.correct ?? 0,
        wrong: res.wrong ?? 0,
        unattempted: res.unattempted ?? total - Object.keys(given).length,
        timeTakenSec,
      });
      setPhase("result");
    } catch {
      submittedRef.current = false;
      setSubmitError("Couldn't submit. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, questions.length, remaining]);

  // Countdown; auto-submit at zero.
  useEffect(() => {
    if (phase !== "active" || questions.length === 0) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, questions.length]);

  useEffect(() => {
    // Time is up: submit what we have (submit() is guarded against double runs).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (phase === "active" && remaining === 0) submit();
  }, [remaining, phase, submit]);

  const sendReport = async () => {
    if (!attemptId) return;
    setEmailState("sending");
    try {
      await apiEmailReport({ attemptId, kind: "daily-quiz" });
      setEmailState("sent");
    } catch {
      setEmailState("error");
    }
  };

  if (authLoading || phase === "loading") return <AppSpinner label="Loading today's quiz" />;

  if (phase === "error") {
    return (
      <AppPage title="Practice" width="narrow">
        <div className="en-card flex flex-col items-start gap-4 p-6" role="alert">
          <p className="text-[var(--ink-2)]">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className={btnPrimary}>
            Try again
          </button>
        </div>
      </AppPage>
    );
  }

  if (phase === "active" && questions.length === 0) {
    return (
      <AppPage title="Practice" subtitle="Today's quiz." width="narrow">
        <div className="en-card p-6">
          <p className="text-[var(--ink-2)]">No quiz is ready yet. Check back a little later.</p>
        </div>
      </AppPage>
    );
  }

  /* ───────── Result ───────── */
  if (phase === "result" && summary) {
    const pct = summary.total ? Math.round((summary.correct / summary.total) * 100) : 0;
    return (
      <AppPage title="Practice" subtitle="Your result for today's quiz." width="narrow" back={{ href: "/dashboard", label: "Today" }}>
        <section aria-labelledby="score-title" className="en-card en-rise p-6 sm:p-8">
          <h2 id="score-title" className="text-sm font-semibold text-[var(--ink-3)]">Your score</h2>
          <div role="status" aria-live="polite">
            <p className="mt-1 text-5xl font-bold tabular-nums text-[var(--ink-1)]" style={display}>
              {pct}%
            </p>
            <p className="mt-1 text-[var(--ink-2)]">
              {summary.correct} of {summary.total} correct
            </p>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-[12px] bg-[var(--green-soft)] p-3">
              <dd className="text-xl font-bold tabular-nums text-[var(--ink-1)]" style={display}>{summary.correct}</dd>
              <dt className="text-xs text-[var(--ink-2)]">Correct</dt>
            </div>
            <div className="rounded-[12px] bg-[var(--red-soft)] p-3">
              <dd className="text-xl font-bold tabular-nums text-[var(--ink-1)]" style={display}>{summary.wrong}</dd>
              <dt className="text-xs text-[var(--ink-2)]">Wrong</dt>
            </div>
            <div className="rounded-[12px] bg-[var(--bg-secondary)] p-3">
              <dd className="text-xl font-bold tabular-nums text-[var(--ink-1)]" style={display}>{summary.unattempted}</dd>
              <dt className="text-xs text-[var(--ink-2)]">Skipped</dt>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {attemptId && (
              <button type="button" onClick={sendReport} disabled={emailState === "sending" || emailState === "sent"} className={btnSecondary}>
                {emailState === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
                Email me this report
              </button>
            )}
            <button type="button" onClick={() => router.push("/dashboard")} className={btnSecondary}>
              Back to Today
            </button>
            <span role="status" aria-live="polite" className="text-sm text-[var(--ink-3)]">
              {emailState === "sent" && "Report sent to your email."}
              {emailState === "error" && "Couldn't send the report. Try again."}
            </span>
          </div>
        </section>

        <section aria-labelledby="review-title" className="flex flex-col gap-4">
          <h2 id="review-title" className="text-lg font-semibold text-[var(--ink-1)]" style={display}>Review</h2>
          {questions.map((q, i) => {
            const picked = answers[q.id];
            return (
              <article key={q.id} className="reveal en-card p-5 sm:p-6" style={{ transitionDelay: `${Math.min(i, 5) * 40}ms` }}>
                <p className="text-sm text-[var(--ink-3)]">Question {i + 1}</p>
                <RichText html={q.text} className="mt-1 text-[17px] leading-relaxed text-[var(--ink-1)]" />
                <ul className="mt-4 flex flex-col gap-2">
                  {q.options.map((o, oi) => {
                    const isCorrect = q.correctIndex === oi;
                    const isWrongPick = picked === oi && !isCorrect;
                    return (
                      <li
                        key={oi}
                        className={`flex items-center justify-between gap-3 rounded-[12px] px-4 py-3 text-[15px] text-[var(--ink-1)] ${
                          isCorrect ? "bg-[var(--green-soft)]" : isWrongPick ? "bg-[var(--red-soft)]" : "bg-[var(--bg-secondary)]"
                        }`}
                      >
                        <RichText html={o} className="min-w-0" />
                        {isCorrect && (
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--green)]">
                            <Check className="h-4 w-4" aria-hidden="true" /> Correct
                          </span>
                        )}
                        {isWrongPick && <span className="shrink-0 text-xs font-semibold text-[var(--red)]">Your answer</span>}
                      </li>
                    );
                  })}
                </ul>
                {picked === undefined && <p className="mt-3 text-sm text-[var(--ink-3)]">You skipped this one.</p>}
                {q.explanation && (
                  <RichText html={q.explanation} className="mt-4 rounded-[12px] bg-[var(--brand-soft)] p-4 text-sm leading-relaxed text-[var(--ink-2)]" />
                )}
              </article>
            );
          })}
        </section>
      </AppPage>
    );
  }

  /* ───────── Active quiz ───────── */
  const q = questions[current];
  const answered = Object.keys(answers).length;
  const isLast = current === questions.length - 1;
  const low = remaining <= 60;

  return (
    <AppPage
      title="Practice"
      subtitle="Today's quiz."
      width="narrow"
      actions={
        <span
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 text-sm font-semibold tabular-nums text-[var(--accent-ink)]"
          role="timer"
          aria-label={`Time left ${fmtTime(remaining)}`}
        >
          <Clock className="h-4 w-4" aria-hidden="true" /> {fmtTime(remaining)}
          {low && <span className="sr-only"> (under a minute)</span>}
        </span>
      }
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-[var(--ink-3)]">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{answered} answered</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]"
          role="progressbar"
          aria-label="Questions answered"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={answered}
        >
          <div className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-300" style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
      </div>

      <section key={q.id} aria-labelledby="q-text" className="en-card en-rise p-5 sm:p-8">
        {(q.subject || q.topic) && (
          <p className="mb-2 text-sm text-[var(--ink-3)]">{[q.subject, q.topic].filter(Boolean).join(" · ")}</p>
        )}
        <h2 id="q-text" className="sr-only">Question {current + 1}</h2>
        <RichText html={q.text} className="text-[17px] font-semibold leading-relaxed text-[var(--ink-1)]" />
        <div role="radiogroup" aria-labelledby="q-text" className="mt-5 flex flex-col gap-3">
          {q.options.map((o, oi) => {
            const selected = answers[q.id] === oi;
            return (
              <button
                key={oi}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                className={`flex min-h-12 items-center gap-3 rounded-[12px] px-4 py-3 text-left text-[15px] text-[var(--ink-1)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
                  selected ? "bg-[var(--brand-soft)] ring-2 ring-[var(--brand)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--brand-soft)]"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    selected ? "bg-[var(--brand)] text-[var(--brand-ink)]" : "bg-[var(--card)] text-[var(--ink-2)]"
                  }`}
                  aria-hidden="true"
                >
                  {String.fromCharCode(65 + oi)}
                </span>
                <RichText html={o} className="min-w-0 leading-relaxed" />
              </button>
            );
          })}
        </div>
      </section>

      {submitError && (
        <p role="alert" className="rounded-[12px] bg-[var(--red-soft)] px-4 py-3 text-sm text-[var(--ink-1)]">{submitError}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className={btnSecondary}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Previous
        </button>
        <div className="flex items-center gap-3">
          {!isLast && (
            <button type="button" onClick={() => setCurrent((c) => c + 1)} className={btnSecondary}>
              Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={submit} disabled={submitting || answered === 0} className={btnPrimary}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Submit quiz
          </button>
        </div>
      </div>
    </AppPage>
  );
}
