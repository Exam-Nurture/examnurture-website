"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import TestPortal from "@/components/exam/TestPortal";
import ResultView, { AttemptResult } from "@/components/exam/ResultView";
import { apiGetDailyPractice, apiSubmitDailyPractice, apiEmailReport } from "@/lib/api";
import type { Question } from "@/components/exam/QuestionViewer";

type Phase = "loading" | "active" | "result" | "error";

function mapQ(raw: any): Question {
  let opts: string[] = [];
  try { opts = typeof raw.options === "string" ? JSON.parse(raw.options) : (raw.options || []); }
  catch { opts = []; }
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

export default function DailyQuizPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [phase, setPhase]           = useState<Phase>("loading");
  const [quizData, setQuizData]     = useState<any>(null);
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [result, setResult]         = useState<AttemptResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [attemptId, setAttemptId]   = useState<string | null>(null);
  const [error, setError]           = useState("");

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/?next=${encodeURIComponent(window.location.href)}`);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;

    const load = async () => {
      try {
        const res: any = await apiGetDailyPractice();
        setQuizData(res);
        const qs = (res.questions || []).map(mapQ);
        setQuestions(qs);
        setPhase("active");
      } catch (e: any) {
        setError(e?.message || "Failed to load daily quiz");
        setPhase("error");
      }
    };

    load();
  }, [authLoading, user]);

  const handleSubmit = async (answers: Record<string, number>, timeTakenSec: number) => {
    setUserAnswers(answers);
    try {
      const res: any = await apiSubmitDailyPractice(answers);
      if (res.attemptId || res.id) setAttemptId(res.attemptId ?? res.id);
      setResult({
        totalQuestions: questions.length,
        correct:        res.correct     ?? 0,
        wrong:          res.wrong       ?? 0,
        unattempted:    res.unattempted ?? (questions.length - Object.keys(answers).length),
        totalMarks:     res.totalMarks  ?? questions.length,
        scored:         res.scored      ?? res.score ?? 0,
        timeTakenSec,
        rank:           res.rank,
      });
      setPhase("result");
    } catch (e: any) {
      console.error("Submit error", e);
    }
  };

  if (authLoading || phase === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "var(--card)" }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium" style={{ color: "var(--ink-3)" }}>Loading daily quiz…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="text-center px-4">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-full bg-[var(--blue)] text-white text-sm font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="sticky top-0 z-10 flex items-center px-5 h-14 border-b" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-[13px] font-medium hover:underline"
            style={{ color: "var(--ink-3)" }}
          >
            ← Back to Dashboard
          </button>
        </div>
        <ResultView
          result={result}
          questions={questions}
          userAnswers={userAnswers}
          testTitle="Daily Quiz"
          onBack={() => router.push("/dashboard")}
          onEmailReport={attemptId ? () => apiEmailReport({ attemptId, kind: "daily-quiz" }).then(() => {}) : undefined}
        />
      </div>
    );
  }

  return (
    <TestPortal
      testId="daily-quiz"
      title="Daily Quiz"
      durationSec={900}
      questions={questions}
      onSubmit={handleSubmit}
    />
  );
}
