"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TestPortal from "@/components/exam/TestPortal";
import ResultView, { AttemptResult } from "@/components/exam/ResultView";
import { apiGetTest, apiStartAttempt, apiSubmitAttempt, apiGetAttemptResult } from "@/lib/api";
import type { Question } from "@/components/exam/QuestionViewer";

type Phase = "loading" | "active" | "result" | "error";

function mapQ(raw: any): Question {
  let opts: string[] = [];
  try {
    opts = typeof raw.options === "string" ? JSON.parse(raw.options) : raw.options;
  } catch { opts = []; }
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

export default function TestPortalPage() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [testData, setTestData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [result, setResult]   = useState<AttemptResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!testId) return;

    const searchParams = new URLSearchParams(window.location.search);
    const attemptId = searchParams.get("attemptId");

    const loadData = async () => {
      try {
        const test: any = await apiGetTest(testId);
        setTestData(test);
        const mappedQs = (test.questions || []).map(mapQ);
        setQuestions(mappedQs);

        if (attemptId) {
          const res: any = await apiGetAttemptResult(attemptId);
          setResult({
            totalQuestions: mappedQs.length,
            correct: res.correct ?? 0,
            wrong: res.wrong ?? 0,
            unattempted: mappedQs.length - (res.answers ? Object.keys(JSON.parse(res.answers)).length : 0),
            totalMarks: res.totalMarks ?? test.totalMarks ?? mappedQs.length,
            scored: res.score ?? 0,
            timeTakenSec: res.timeTakenSec ?? 0,
            percentile: res.percentile,
            subjectStats: res.subjectStats,
          });
          if (res.answers) {
            try { setUserAnswers(JSON.parse(res.answers)); } catch { /* ignore */ }
          }
          if (res.questions) setQuestions(res.questions.map(mapQ));
          setPhase("result");
        } else {
          setPhase("active");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load test");
        setPhase("error");
      }
    };

    loadData();
  }, [testId]);

  const handleSubmit = async (answers: Record<string, number>, timeTakenSec: number) => {
    setUserAnswers(answers);
    try {
      const res: any = await apiSubmitAttempt(testId!, answers, timeTakenSec);
      // Map result into AttemptResult shape
      setResult({
        totalQuestions: questions.length,
        correct: res.correct ?? 0,
        wrong: res.wrong ?? 0,
        unattempted: res.unattempted ?? (questions.length - Object.keys(answers).length),
        totalMarks: res.totalMarks ?? testData?.totalMarks ?? questions.length,
        scored: res.scored ?? res.score ?? 0,
        negMarks: res.negMarks,
        timeTakenSec,
        percentile: res.percentile,
        subjectStats: res.subjectStats,
      });
      // Enrich questions with correct answers from result
      if (res.questions) {
        setQuestions(res.questions.map(mapQ));
      }
      setPhase("result");
    } catch (e: any) {
      console.error("Submit error", e);
    }
  };

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "var(--card)" }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium" style={{ color: "var(--ink-3)" }}>Loading test…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <ResultView
        result={result}
        questions={questions}
        userAnswers={userAnswers}
        onBack={() => router.back()}
        onRetry={() => { setPhase("loading"); setResult(null); setUserAnswers({}); }}
      />
    );
  }

  return (
    <TestPortal
      testId={testId!}
      title={testData?.title || "Test"}
      durationSec={testData?.durationSec || 3600}
      questions={questions}
      onSubmit={handleSubmit}
    />
  );
}
