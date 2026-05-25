"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import TestPortal from "@/components/exam/TestPortal";
import ResultView, { AttemptResult } from "@/components/exam/ResultView";
import { apiGetTest, apiSubmitAttempt, apiGetAttemptResult, apiEmailReport } from "@/lib/api";
import type { Question } from "@/components/exam/QuestionViewer";

type Phase = "loading" | "auth" | "active" | "result" | "error";

function mapQ(raw: any): Question {
  let opts: string[] = [];
  try {
    const rawOpts = typeof raw.options === "string" ? JSON.parse(raw.options) : (raw.options || []);
    // Backend may return [{text: string}] objects or plain strings
    opts = rawOpts.map((o: any) => (typeof o === "string" ? o : (o?.text ?? "")));
  }
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

export default function ExamPage() {
  const { testId } = useParams<{ testId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [phase, setPhase]           = useState<Phase>("loading");
  const [testData, setTestData]     = useState<any>(null);
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [result, setResult]         = useState<AttemptResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [attemptId, setAttemptId]   = useState<string | null>(null);
  const [error, setError]           = useState("");

  // Auth guard — redirect to login if not signed in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/?next=${encodeURIComponent(window.location.href)}`);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user || !testId) return;

    const qsAttemptId = searchParams.get("attemptId");

    const load = async () => {
      try {
        const test: any = await apiGetTest(testId);
        setTestData(test);
        // Backend returns questions nested in sections[0].questions
        const rawQs = test.questions || test.sections?.[0]?.questions || [];
        const qs = rawQs.map(mapQ);
        setQuestions(qs);

        if (qsAttemptId) {
          setAttemptId(qsAttemptId);
          // Viewing a past result
          const res: any = await apiGetAttemptResult(qsAttemptId);
          setResult({
            totalQuestions: qs.length,
            correct:        res.correct     ?? 0,
            wrong:          res.wrong       ?? 0,
            unattempted:    res.unattempted ?? (res.analysis ? res.analysis.filter((a: any) => a.selectedIndex === null).length : 0),
            totalMarks:     res.totalMarks  ?? test.totalMarks ?? qs.length,
            scored:         res.score       ?? 0,
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
            // Enrich questions with correctIndex for review
            const enriched = qs.map((q: Question) => {
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
        setError(e?.message || "Failed to load test");
        setPhase("error");
      }
    };

    load();
  }, [testId, user, authLoading, searchParams]);

  const handleSubmit = async (answers: Record<string, number>, timeTakenSec: number) => {
    setUserAnswers(answers);
    try {
      const res: any = await apiSubmitAttempt(testId!, answers, timeTakenSec);
      if (res.attemptId || res.id) setAttemptId(res.attemptId ?? res.id);
      setResult({
        totalQuestions: questions.length,
        correct:        res.correct     ?? 0,
        wrong:          res.wrong       ?? 0,
        unattempted:    res.unattempted ?? (questions.length - Object.keys(answers).length),
        totalMarks:     res.totalMarks  ?? testData?.totalMarks ?? questions.length,
        scored:         res.scored      ?? res.score ?? 0,
        timeTakenSec,
        rank:           res.rank,
      });
      setPhase("result");
    } catch (e: any) {
      console.error("Submit error", e);
      setError(e?.message || "Failed to submit your test. Please try again.");
      setPhase("error");
    }
  };

  // Loading / auth pending
  if (authLoading || phase === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "var(--card)" }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium" style={{ color: "var(--ink-3)" }}>Loading test…</p>
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
            onClick={() => router.push("/dashboard/series")}
            className="px-5 py-2.5 rounded-full bg-[var(--blue)] text-white text-sm font-medium"
          >
            Back to Test Series
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Minimal top bar */}
        <div className="sticky top-0 z-10 flex items-center px-5 h-14 border-b" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
          <button
            onClick={() => router.push("/dashboard/series")}
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
          testTitle={testData?.title}
          onBack={() => router.push("/dashboard/series")}
          onEmailReport={attemptId ? () => apiEmailReport({ attemptId, kind: "test" }).then(() => {}) : undefined}
        />
      </div>
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
