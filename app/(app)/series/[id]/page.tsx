"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, Clock, FileText, Lock, Play, 
  CheckCircle2, AlertCircle, Info, Calendar
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch(`/test-series/${id}`)
      .then(setSeries)
      .catch(e => setError(e.message || "Failed to load series"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600/20 border-t-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-sm text-[var(--ink-4)]">Loading series details…</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="py-20 text-center max-w-sm mx-auto">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <p className="text-red-500 font-bold mb-4">{error || "Series not found"}</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 fade-up max-w-4xl">
      
      {/* Breadcrumb / Back */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-blue-600 w-fit"
        style={{ color: "var(--ink-3)" }}
      >
        <ChevronLeft size={16} /> Back to Test Series
      </button>

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-50 text-blue-600">
              {series.exam?.shortName}
            </span>
            {series.isPaid ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-amber-50 text-amber-600">
                Premium
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-50 text-emerald-600">
                Free Series
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold mb-3" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
            {series.title}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--ink-3)" }}>
            {series.description || "Comprehensive mock test series designed by experts to help you excel in your exams."}
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="w-full md:w-64 p-5 rounded-2xl border bg-gray-50/50" style={{ borderColor: "var(--line-soft)" }}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--ink-4)]">Total Tests</span>
              <span className="text-sm font-bold text-[var(--ink-1)]">{series.totalTests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--ink-4)]">Valid Till</span>
              <span className="text-sm font-bold text-[var(--ink-1)]">31 Dec 2025</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--ink-4)]">Language</span>
              <span className="text-sm font-bold text-[var(--ink-1)]">English, Hindi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tests List */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: "var(--ink-1)" }}>
            Included Tests
          </h2>
          <div className="text-xs font-medium text-[var(--ink-4)]">
            {series.tests?.length || 0} tests available
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {series.tests?.map((test: any, idx: number) => (
            <div 
              key={test.id}
              className="card group flex items-center justify-between p-4 transition-all hover:border-blue-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-blue-50 transition-colors">
                  <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold mb-1" style={{ color: "var(--ink-1)" }}>
                    {test.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--ink-4)" }}>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {Math.floor(test.durationSec / 60)} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Info size={11} /> {test.totalMarks} Marks
                    </span>
                    {test.scheduledAt && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Calendar size={11} /> {new Date(test.scheduledAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {test.isLocked ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-[11px] font-bold text-gray-400 border border-gray-200">
                    <Lock size={12} /> LOCKED
                  </div>
                ) : (
                  <Link
                    href={`/tests/${test.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Play size={12} fill="white" stroke="none" /> Start Test
                  </Link>
                )}
              </div>
            </div>
          ))}

          {(!series.tests || series.tests.length === 0) && (
            <div className="py-12 text-center border-2 border-dashed rounded-3xl" style={{ borderColor: "var(--line-soft)" }}>
              <p className="text-sm text-[var(--ink-4)]">No tests have been added to this series yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
