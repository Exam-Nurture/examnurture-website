"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TestPortal from "@/components/exam/TestPortal";
import ResultView, { AttemptResult } from "@/components/exam/ResultView";
import { apiStartPYQAttempt, apiSubmitPYQAttempt, apiGetPYQPaperById, apiGetPYQAttemptResult } from "@/lib/api";
import type { Question } from "@/components/exam/QuestionViewer";

type Phase = "loading" | "active" | "result" | "error";

function mapQ(raw: any): Question {
  let opts: string[] = [];
  try {
    opts = typeof raw.options === "string" ? JSON.parse(raw.options) : (raw.options || []);
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

export default function PYQAttemptPage() {
  const { paperId } = useParams<{ paperId: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [paperData, setPaperData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!paperId) return;

    const searchParams = new URLSearchParams(window.location.search);
    const attemptId = searchParams.get("attemptId");

    const loadData = async () => {
      try {
        const paper: any = await apiGetPYQPaperById(paperId);
        setPaperData(paper);
        const mappedQs = (paper.questions || []).map(mapQ);
        setQuestions(mappedQs);

        if (attemptId) {
          const res: any = await apiGetPYQAttemptResult(attemptId);
          setResult({
            totalQuestions: mappedQs.length,
            correct: res.correct ?? 0,
            wrong: res.wrong ?? 0,
            unattempted: mappedQs.length - (res.answers ? Object.keys(JSON.parse(res.answers)).length : 0),
            totalMarks: res.totalMarks ?? mappedQs.length,
            scored: res.score ?? 0,
            timeTakenSec: res.timeTakenSec ?? 0,
            percentile: res.percentile,
            subjectStats: res.subjectStats,
          });
          if (res.answers) {
            try { setUserAnswers(JSON.parse(res.answers)); } catch { /* ignore */ }
          }
          // If questions are returned with result (with solutions), update them
          if (res.questions) setQuestions(res.questions.map(mapQ));
          setPhase("result");
        } else {
          setPhase("active");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load paper");
        setPhase("error");
      }
    };

    loadData();
  }, [paperId]);

  const handleSubmit = async (answers: Record<string, number>, timeTakenSec: number) => {
    setUserAnswers(answers);
    try {
      const res: any = await apiSubmitPYQAttempt(paperId!, answers, timeTakenSec);
      setResult({
        totalQuestions: questions.length,
        correct: res.correct ?? 0,
        wrong: res.wrong ?? 0,
        unattempted: questions.length - Object.keys(answers).length,
        totalMarks: res.totalMarks ?? questions.length,
        scored: res.scored ?? res.score ?? 0,
        timeTakenSec,
        percentile: res.percentile,
        subjectStats: res.subjectStats,
      });
      if (res.questions) setQuestions(res.questions.map(mapQ));
      setPhase("result");
    } catch (e: any) {
      console.error("Submit error", e);
    }
  };

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "var(--card)" }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium" style={{ color: "var(--ink-3)" }}>Loading paper…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold">Go Back</button>
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
      />
    );
  }

  return (
    <TestPortal
      testId={paperId!}
      title={paperData?.title || "PYQ Paper"}
      durationSec={paperData?.durationSec || 7200}
      questions={questions}
      onSubmit={handleSubmit}
    />
  );
}
