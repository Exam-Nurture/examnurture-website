"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, BookOpen, Download, Play, CheckCircle2, ChevronDown, Zap } from "lucide-react";
import { apiGetPYQPapers, apiGetPYQAttempts } from "@/lib/api";

const YEARS = ["All Years", "2024", "2023", "2022", "2021", "2020", "2019"];

/* ─────────────────────────────────────────────
   Page (inner — needs useSearchParams)
───────────────────────────────────────────── */
function PYQPageInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"All" | "My Attempts">(
    tabParam === "attempts" ? "My Attempts" : "All"
  );
  const [year, setYear] = useState("All Years");

  const [papersData, setPapersData] = useState<any>(null);
  const [papersLoading, setPapersLoading] = useState(false);
  const [attemptsData, setAttemptsData] = useState<any>(null);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "All") {
      setPapersLoading(true);
      apiGetPYQPapers({ year: year === "All Years" ? undefined : parseInt(year) })
        .then(setPapersData)
        .catch(console.error)
        .finally(() => setPapersLoading(false));
    } else {
      setAttemptsLoading(true);
      apiGetPYQAttempts()
        .then(setAttemptsData)
        .catch(console.error)
        .finally(() => setAttemptsLoading(false));
    }
  }, [activeTab, year]);

  const papers = papersData?.items || [];
  const attempts = attemptsData || [];

  return (
    <div className="fade-up" style={{ maxWidth: 1200 }}>

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight leading-none"
            style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
          >
            PYQ Papers
          </h1>
          <p className="text-[12px] mt-2" style={{ color: "var(--ink-4)", letterSpacing: "0.01em" }}>
            Past year question papers with detailed solutions and analytics.
          </p>
        </div>
        <Link
          href="/pyq/all"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-[var(--bg)]"
          style={{ color: "var(--blue)", borderColor: "var(--blue)", borderWidth: 1.5 }}
        >
          Browse All PYQs
        </Link>
      </div>

      {/* Filter bar & Tabs */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-7"
        style={{ borderBottom: "1px solid var(--line-soft)" }}
      >
        {/* Main Tabs */}
        <div
          className="flex items-center gap-0.5 p-1 rounded-[10px]"
          style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
        >
          {["All", "My Attempts"].map((t) => {
            const isTabActive = activeTab === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className="px-4 py-1.5 rounded-[7px] text-[13px] font-semibold transition-all duration-150"
                style={{
                  background: isTabActive ? "var(--card)" : "transparent",
                  color: isTabActive ? "var(--ink-1)" : "var(--ink-4)",
                  boxShadow: isTabActive ? "var(--shadow-xs)" : "none",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Filters (only for All Papers) */}
        {activeTab === "All" && (
          <div className="flex items-center gap-2">
            <Dropdown options={YEARS} value={year} onChange={setYear} />
            <span
              className="text-[12px] pl-3"
              style={{ color: "var(--ink-4)", borderLeft: "1px solid var(--line)" }}
            >
              {papers.length} {papers.length === 1 ? "paper" : "papers"}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      {activeTab === "All" ? (
        papersLoading ? (
          <div className="py-20 text-center text-[14px]" style={{ color: "var(--ink-4)" }}>Loading papers...</div>
        ) : papers.length === 0 ? (
          <div className="text-center py-20 text-[14px]" style={{ color: "var(--ink-4)" }}>
            No papers match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger">
            {papers.map((p: any) => <PaperCard key={p.id} paper={p} />)}
          </div>
        )
      ) : (
        attemptsLoading ? (
          <div className="py-20 text-center text-[14px]" style={{ color: "var(--ink-4)" }}>Loading attempts...</div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-20 text-[14px]" style={{ color: "var(--ink-4)" }}>
            You haven't attempted any PYQ papers yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger">
            {attempts.map((a: any) => <AttemptCard key={a.id} attempt={a} />)}
          </div>
        )
      )}
    </div>
  );
}

export default function PYQPage() {
  return (
    <Suspense fallback={<div className="fade-up" style={{ maxWidth: 1200 }} />}>
      <PYQPageInner />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────
   Paper Card
───────────────────────────────────────────── */
function PaperCard({ paper: p }: { paper: any }) {
  const cta = "Attempt";
  const diffColor = "var(--ink-4)"; // Can add difficulty back if API adds it

  return (
    <div
      className="card card-lift flex flex-col"
      style={{ padding: "22px 24px 20px", borderRadius: 16 }}
    >
      {/* Row 1: exam label */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-semibold tracking-widest uppercase truncate max-w-[150px]"
          style={{ color: "var(--ink-4)" }}
        >
          {p.exam?.name ?? "PYQ"}
        </span>
        {p.tierRequired > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>
            PRO
          </span>
        )}
      </div>

      {/* Row 2: title */}
      <div
        className="text-[17px] font-semibold leading-tight"
        style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
      >
        {p.year} — {p.title}
      </div>

      {/* Row 3: shift */}
      <div className="text-[12px] mt-1 h-[18px]" style={{ color: "var(--ink-4)" }}>
        {p.shift ? `Shift: ${p.shift}` : ""}
      </div>

      {/* Row 4: meta */}
      <div className="flex items-center gap-0 mt-4">
        <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
          <BookOpen size={12} strokeWidth={1.75} />
          {p.totalQs} Questions
        </span>
        <span className="mx-2.5 text-[11px]" style={{ color: "var(--line)" }}>·</span>
        <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
          <Clock size={12} strokeWidth={1.75} />
          {p.durationMin} min
        </span>
      </div>

      <div className="mt-4" />
      <div className="mt-auto mb-4" style={{ borderTop: "1px solid var(--line-soft)" }} />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/pyq/${p.id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-[10px] text-[13px] font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
          style={{ background: "var(--blue)", height: 38 }}
        >
          <Play size={11} fill="white" stroke="none" />
          {cta}
        </Link>
        {p.pdfUrl && (
          <a
            href={p.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-[10px] transition-all duration-150 hover:bg-[var(--bg)] active:scale-[0.96]"
            style={{ width: 38, height: 38, border: "1px solid var(--line)", color: "var(--ink-4)" }}
            title="Download paper PDF"
          >
            <Download size={14} strokeWidth={1.75} />
          </a>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Attempt Card
───────────────────────────────────────────── */
function AttemptCard({ attempt: a }: { attempt: any }) {
  return (
    <div
      className="card flex flex-col"
      style={{ padding: "22px 24px 20px", borderRadius: 16 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: "var(--ink-4)" }}
        >
          Completed
        </span>
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium leading-none"
          style={{ color: "var(--green)" }}
        >
          <CheckCircle2 size={11} strokeWidth={2.5} />
          Done
        </span>
      </div>

      <div
        className="text-[17px] font-semibold leading-tight"
        style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
      >
        {a.paper?.year} — {a.paper?.title}
      </div>

      <div className="text-[12px] mt-1" style={{ color: "var(--ink-4)" }}>
        {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : "—"}
      </div>

      <div className="mt-5 p-4 rounded-[10px] flex items-center justify-between" style={{ background: "var(--bg)", border: "1px solid var(--line)" }}>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--ink-4)" }}>Score</div>
          <div className="text-[20px] font-bold font-mono" style={{ color: "var(--ink-1)" }}>
            {a.score} <span className="text-[13px] text-[var(--ink-4)]">/ {a.totalMarks}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--ink-4)" }}>Time Taken</div>
          <div className="text-[14px] font-bold font-mono" style={{ color: "var(--ink-2)" }}>
            {a.timeTakenSec != null
              ? `${Math.floor(a.timeTakenSec / 60)}m ${a.timeTakenSec % 60}s`
              : "—"}
          </div>
        </div>
      </div>

      <div className="mt-5 mb-4" style={{ borderTop: "1px solid var(--line-soft)" }} />

      <Link
        href={`/dashboard/pyq/${a.paperId}?attemptId=${a.id}`}
        className="inline-flex items-center justify-center rounded-[10px] text-[13px] font-semibold transition-all duration-150 hover:brightness-95 w-full"
        style={{ background: "var(--line-soft)", color: "var(--ink-1)", height: 38 }}
      >
        View Detailed Report
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dropdown
───────────────────────────────────────────── */
function Dropdown({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  const isDefault = value === options[0];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none cursor-pointer outline-none rounded-[8px] text-[12px] font-medium transition-all duration-150"
        style={{
          paddingLeft: 12, paddingRight: 28, paddingTop: 7, paddingBottom: 7,
          background: "var(--card)",
          border: "1px solid var(--line)",
          color: isDefault ? "var(--ink-3)" : "var(--ink-1)",
        }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown
        size={12}
        strokeWidth={2}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--ink-4)" }}
      />
    </div>
  );
}
