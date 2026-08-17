"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import TestPortal from "@/components/exam/TestPortal";
import ResultView, { AttemptResult } from "@/components/exam/ResultView";
import { apiGetPYQPaperById, apiGetPYQQuestions, apiSubmitPYQAttempt, apiGetPYQAttemptResult, apiEmailReport } from "@/lib/api";
import type { Question } from "@/components/exam/QuestionViewer";
import { ExamLoading, ExamError } from "@/components/exam/ExamStates";

type Phase = "loading" | "active" | "result" | "error";

function parseOpts(raw: any): string[] {
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : (raw || []);
    return Array.isArray(arr) ? arr.map((o: any) => (typeof o === "string" ? o : (o?.text ?? ""))) : [];
  } catch { return []; }
}

function parseImageArray(raw: any): string[] {
  if (!raw) return [];
  try { return Array.isArray(raw) ? raw.filter(Boolean) : []; } catch { return []; }
}

function parseOptionImages(raw: any): string[][] {
  if (!raw) return [[], [], [], []];
  try {
    const arr = Array.isArray(raw) ? raw : [];
    return [0, 1, 2, 3].map((i) => (Array.isArray(arr[i]) ? arr[i].filter(Boolean) : []));
  } catch { return [[], [], [], []]; }
}

function mapQ(raw: any): Question {
  return {
    id: raw.id,
    text: raw.text ?? "",
    options: parseOpts(raw.options),
    correctIndex: raw.correctIndex ?? undefined,
    explanation: raw.explanation ?? null,
    textHindi: raw.textHindi ?? null,
    optionsHindi: raw.optionsHindi ? parseOpts(raw.optionsHindi) : null,
    explanationHindi: raw.explanationHindi ?? null,
    passage: raw.passage ?? null,
    passageHindi: raw.passageHindi ?? null,
    questionImages: parseImageArray(raw.questionImages),
    questionHindiImages: parseImageArray(raw.questionHindiImages),
    optionImages: parseOptionImages(raw.optionImages),
    optionHindiImages: parseOptionImages(raw.optionHindiImages),
    // Any additional language published under an ISO code (bn, ta, te, …)
    translations: raw.translations ?? null,
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
      setError(e?.message || "Failed to submit your paper. Please try again.");
      setPhase("error");
    }
  };

  if (authLoading || phase === "loading") {
    return <ExamLoading label="Loading paper…" />;
  }

  if (phase === "error") {
    return (
      <ExamError
        message={error}
        onBack={() => router.push("/dashboard/pyq")}
        backLabel="Back to PYQ papers"
      />
    );
  }

  if (phase === "result" && result) {
    // ResultView carries its own back action, so no duplicate top bar here.
    return (
      <ResultView
        result={result}
        questions={questions}
        userAnswers={userAnswers}
        testTitle={paperData ? `${paperData.year} — ${paperData.title}` : undefined}
        onBack={() => router.push("/dashboard/pyq")}
        onEmailReport={attemptId ? () => apiEmailReport({ attemptId, kind: "pyq" }).then(() => {}) : undefined}
      />
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
