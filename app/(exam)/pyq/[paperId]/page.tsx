"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import TestPortal from "@/components/exam/TestPortal";
import ResultView, { AttemptResult } from "@/components/exam/ResultView";
import { apiGetPYQPaperById, apiGetPYQQuestions, apiSubmitPYQAttempt, apiGetPYQAttemptResult, apiEmailReport } from "@/lib/api";
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

export default function PYQExamPage() {
  const { paperId } = useParams<{ paperId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [phase, setPhase]             = useState<Phase>("loading");
  const [paperData, setPaperData]     = useState<any>(null);
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [result, setResult]           = useState<AttemptResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [attemptId, setAttemptId]     = useState<string | null>(null);
  const [error, setError]             = useState("");

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/?next=${encodeURIComponent(window.location.href)}`);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user || !paperId) return;

    const qsAttemptId = searchParams.get("attemptId");

    const load = async () => {
      try {
        const [paper, rawQs]: [any, any[]] = await Promise.all([
          apiGetPYQPaperById(paperId) as Promise<any>,
          apiGetPYQQuestions(paperId) as Promise<any[]>,
        ]);
        setPaperData(paper);
        const qs = rawQs.map(mapQ);
        setQuestions(qs);

        if (qsAttemptId) {
          setAttemptId(qsAttemptId);
          const res: any = await apiGetPYQAttemptResult(qsAttemptId);
          setResult({
            totalQuestions: qs.length,
            correct:        res.correct      ?? 0,
            wrong:          res.wrong        ?? 0,
            unattempted:    qs.length - (res.analysis ? res.analysis.filter((a: any) => a.selectedIndex !== null).length : 0),
            totalMarks:     res.totalMarks   ?? qs.length,
            scored:         res.score        ?? 0,
            timeTakenSec:   res.timeTakenSec ?? 0,
            rank:           res.rank,
            subjectStats:   res.subjectStats,
          });
          if (res.analysis) {
            const ans: Record<string, number> = {};
            for (const a of res.analysis) {
              if (a.selectedIndex !== null && a.selectedIndex !== undefined) {
                ans[a.questionId] = a.selectedIndex;
              }
            }
            setUserAnswers(ans);
            const enriched = qs.map((q) => {
              const found = res.analysis.find((a: any) => a.questionId === q.id);
              return found ? { ...q, correctIndex: found.correctIndex } : q;
            });
            setQuestions(enriched);
          }
          setPhase("result");
        } else {
          setPhase("active");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load paper");
        setPhase("error");
      }
    };

    load();
  }, [paperId, user, authLoading, searchParams]);

  const handleSubmit = async (answers: Record<string, number>, timeTakenSec: number) => {
    setUserAnswers(answers);
    try {
      const res: any = await apiSubmitPYQAttempt(paperId!, answers, timeTakenSec);
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
          <div className="w-10 h-10 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium" style={{ color: "var(--ink-3)" }}>Loading paper…</p>
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
            onClick={() => router.push("/dashboard/pyq")}
            className="px-5 py-2.5 rounded-full bg-[var(--blue)] text-white text-sm font-medium"
          >
            Back to PYQ Papers
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
            onClick={() => router.push("/dashboard/pyq")}
            className="text-[13px] font-medium hover:underline"
            style={{ color: "var(--ink-3)" }}
          >
            ← Back to PYQ Papers
          </button>
        </div>
        <ResultView
          result={result}
          questions={questions}
          userAnswers={userAnswers}
          testTitle={paperData ? `${paperData.year} — ${paperData.title}` : undefined}
          onBack={() => router.push("/dashboard/pyq")}
          onEmailReport={attemptId ? () => apiEmailReport({ attemptId, kind: "pyq" }).then(() => {}) : undefined}
        />
      </div>
    );
  }

  return (
    <TestPortal
      testId={paperId!}
      title={paperData ? `${paperData.year} — ${paperData.title}` : "PYQ Paper"}
      durationSec={(paperData?.durationMin ?? 120) * 60}
      questions={questions}
      onSubmit={handleSubmit}
    />
  );
}
