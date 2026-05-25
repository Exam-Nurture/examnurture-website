"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Clock, BookOpen, Download, Play, CheckCircle2, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { apiGetPYQPapers, apiGetPYQAttempts } from "@/lib/api";

type FilterOpt = { id: string; label: string };

function FilterSection({
  title, options, selectedId, onChange,
}: {
  title: string;
  options: FilterOpt[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <p
        className="text-[10px] font-bold tracking-widest uppercase mb-2.5"
        style={{ color: "var(--ink-4)" }}
      >
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className="px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-150"
            style={{
              background: selectedId === opt.id ? "var(--blue-soft)" : "var(--bg)",
              color: selectedId === opt.id ? "var(--blue)" : "var(--ink-3)",
              border: `1px solid ${selectedId === opt.id ? "var(--blue)" : "var(--line)"}`,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: "var(--blue-soft)", color: "var(--blue)", border: "1px solid var(--blue)" }}
    >
      {label}
      <button type="button" onClick={onRemove} className="hover:opacity-70 transition-opacity leading-none">
        <X size={10} />
      </button>
    </span>
  );
}

/* ─────────────────────────────────────────────
   Page inner (needs useSearchParams)
───────────────────────────────────────────── */
function PYQPageInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"All" | "My Attempts">(
    tabParam === "attempts" ? "My Attempts" : "All"
  );

  const [papersData, setPapersData] = useState<any>(null);
  const [papersLoading, setPapersLoading] = useState(false);
  const [attemptsData, setAttemptsData] = useState<any>(null);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  // Filter drawer state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStateId, setFilterStateId] = useState("__all__");
  const [filterBoardId, setFilterBoardId] = useState("__all__");
  const [filterExamId, setFilterExamId] = useState("__all__");
  const [filterYear, setFilterYear] = useState("__all__");

  useEffect(() => {
    if (activeTab === "All") {
      setPapersLoading(true);
      apiGetPYQPapers({ limit: 100 })
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
  }, [activeTab]);

  const allPapers: any[] = papersData?.items || [];
  const attempts = attemptsData || [];

  // ── Hierarchy options ────────────────────────────────────────────────────

  const stateOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    allPapers.forEach((p) => {
      const stId = String(p.exam?.board?.state?.id ?? "__national__");
      const stName = p.exam?.board?.state?.name || "National";
      map.set(stId, stName);
    });
    const sorted = Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) =>
        a.label === "National" ? 1 : b.label === "National" ? -1 : a.label.localeCompare(b.label)
      );
    return [{ id: "__all__", label: "All" }, ...sorted];
  }, [allPapers]);

  const boardOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    allPapers.forEach((p) => {
      const stId = String(p.exam?.board?.state?.id ?? "__national__");
      if (filterStateId !== "__all__" && stId !== filterStateId) return;
      if (p.exam?.board?.id) map.set(p.exam.board.id, p.exam.board.shortName || p.exam.board.name);
    });
    const sorted = Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ id: "__all__", label: "All" }, ...sorted];
  }, [allPapers, filterStateId]);

  const examOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    allPapers.forEach((p) => {
      const stId = String(p.exam?.board?.state?.id ?? "__national__");
      if (filterStateId !== "__all__" && stId !== filterStateId) return;
      if (filterBoardId !== "__all__" && p.exam?.board?.id !== filterBoardId) return;
      if (p.exam?.id) map.set(p.exam.id, p.exam.shortName || p.exam.name);
    });
    const sorted = Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ id: "__all__", label: "All" }, ...sorted];
  }, [allPapers, filterStateId, filterBoardId]);

  const yearOptions = useMemo<FilterOpt[]>(() => {
    const years = new Set<number>();
    allPapers.forEach((p) => { if (p.year) years.add(Number(p.year)); });
    const sorted = Array.from(years).sort((a, b) => b - a);
    return [
      { id: "__all__", label: "All Years" },
      ...sorted.map((y) => ({ id: String(y), label: String(y) })),
    ];
  }, [allPapers]);

  // ── Cascade handlers ─────────────────────────────────────────────────────

  function handleStateChange(stId: string) {
    setFilterStateId(stId);
    setFilterBoardId("__all__");
    setFilterExamId("__all__");
  }

  function handleBoardChange(boardId: string) {
    setFilterBoardId(boardId);
    setFilterExamId("__all__");
  }

  function clearAllFilters() {
    setFilterStateId("__all__");
    setFilterBoardId("__all__");
    setFilterExamId("__all__");
    setFilterYear("__all__");
  }

  const activeFilterCount = [filterStateId, filterBoardId, filterExamId, filterYear].filter(
    (f) => f !== "__all__"
  ).length;

  // ── Filtered papers ───────────────────────────────────────────────────────

  const papers = useMemo(() => {
    return allPapers.filter((p) => {
      const stId = String(p.exam?.board?.state?.id ?? "__national__");
      const stateOk = filterStateId === "__all__" || stId === filterStateId;
      const boardOk = filterBoardId === "__all__" || p.exam?.board?.id === filterBoardId;
      const examOk = filterExamId === "__all__" || p.exam?.id === filterExamId;
      const yearOk = filterYear === "__all__" || String(p.year) === filterYear;
      return stateOk && boardOk && examOk && yearOk;
    });
  }, [allPapers, filterStateId, filterBoardId, filterExamId, filterYear]);

  const stateLabel = stateOptions.find((o) => o.id === filterStateId)?.label;
  const boardLabel = boardOptions.find((o) => o.id === filterBoardId)?.label;
  const examLabel = examOptions.find((o) => o.id === filterExamId)?.label;

  return (
    <div className="fade-up" style={{ maxWidth: 1200 }}>

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <h1
            className="text-[28px] leading-none"
            style={{ fontWeight: 300, letterSpacing: "-0.96px", color: "var(--ink-1)" }}
          >
            My PYQ Papers
          </h1>
          <p className="text-[13px] mt-2" style={{ color: "var(--ink-4)" }}>
            Your attempted papers with detailed solutions and analytics.
          </p>
        </div>
        <Link
          href="/pyq/all"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold border transition-all hover:bg-[var(--blue)] hover:text-white hover:border-[var(--blue)]"
          style={{ color: "var(--ink-2)", borderColor: "var(--line)" }}
        >
          Browse All PYQs <ArrowRight size={14} />
        </Link>
      </div>

      {/* Filter bar & Tabs */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5"
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
                type="button"
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

        {/* Filter controls (All tab only) */}
        {activeTab === "All" && (
          <div className="flex items-center gap-2">
            <span
              className="text-[12px] pl-3"
              style={{ color: "var(--ink-4)", borderLeft: "1px solid var(--line)" }}
            >
              {papers.length} {papers.length === 1 ? "paper" : "papers"}
            </span>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="relative flex items-center justify-center rounded-[10px] border transition-all duration-150"
              style={{
                width: 36, height: 36,
                background: activeFilterCount > 0 ? "var(--blue-soft)" : "var(--card)",
                borderColor: activeFilterCount > 0 ? "var(--blue)" : "var(--line)",
                color: activeFilterCount > 0 ? "var(--blue)" : "var(--ink-3)",
              }}
              title="Filter by state, board, exam or year"
            >
              <SlidersHorizontal size={14} />
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white"
                  style={{ background: "var(--blue)" }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && activeTab === "All" && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {filterStateId !== "__all__" && stateLabel && (
            <FilterChip label={stateLabel} onRemove={() => handleStateChange("__all__")} />
          )}
          {filterBoardId !== "__all__" && boardLabel && (
            <FilterChip label={boardLabel} onRemove={() => handleBoardChange("__all__")} />
          )}
          {filterExamId !== "__all__" && examLabel && (
            <FilterChip label={examLabel} onRemove={() => setFilterExamId("__all__")} />
          )}
          {filterYear !== "__all__" && (
            <FilterChip label={filterYear} onRemove={() => setFilterYear("__all__")} />
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[11px] font-medium underline"
            style={{ color: "var(--ink-4)" }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Content Area */}
      {activeTab === "All" ? (
        papersLoading ? (
          <div className="py-20 text-center text-[14px]" style={{ color: "var(--ink-4)" }}>
            Loading papers...
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-20 text-[14px]" style={{ color: "var(--ink-4)" }}>
            No papers match the selected filters.
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="block mx-auto mt-2 text-[12px] font-semibold underline"
                style={{ color: "var(--blue)" }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger">
            {papers.map((p: any) => (
              <PaperCard key={p.id} paper={p} />
            ))}
          </div>
        )
      ) : attemptsLoading ? (
        <div className="py-20 text-center text-[14px]" style={{ color: "var(--ink-4)" }}>
          Loading attempts...
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-20 text-[14px]" style={{ color: "var(--ink-4)" }}>
          You haven&apos;t attempted any PYQ papers yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger">
          {attempts.map((a: any) => (
            <AttemptCard key={a.id} attempt={a} />
          ))}
        </div>
      )}

      {/* ── Filter Drawer ── */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end"
          >
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex flex-col w-80 max-w-[85vw] h-full overflow-hidden"
              style={{
                background: "var(--card)",
                borderLeft: "1px solid var(--line)",
                boxShadow: "-8px 0 32px rgba(0,0,0,.12)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4 shrink-0"
                style={{ borderBottom: "1px solid var(--line)" }}
              >
                <span className="text-[15px] font-semibold" style={{ color: "var(--ink-1)" }}>
                  Filters
                </span>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-[12px] font-medium"
                      style={{ color: "var(--blue)" }}
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--bg)]"
                    style={{ color: "var(--ink-3)" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
                {stateOptions.length > 2 && (
                  <FilterSection
                    title="State"
                    options={stateOptions}
                    selectedId={filterStateId}
                    onChange={handleStateChange}
                  />
                )}
                {boardOptions.length > 1 && (
                  <FilterSection
                    title="Board"
                    options={boardOptions}
                    selectedId={filterBoardId}
                    onChange={handleBoardChange}
                  />
                )}
                {examOptions.length > 1 && (
                  <FilterSection
                    title="Exam"
                    options={examOptions}
                    selectedId={filterExamId}
                    onChange={setFilterExamId}
                  />
                )}
                {yearOptions.length > 1 && (
                  <FilterSection
                    title="Year"
                    options={yearOptions}
                    selectedId={filterYear}
                    onChange={setFilterYear}
                  />
                )}
              </div>

              {/* Footer */}
              <div
                className="px-5 py-4 shrink-0"
                style={{ borderTop: "1px solid var(--line)" }}
              >
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="w-full py-2.5 rounded-full text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
                  style={{ background: "var(--ink-1)" }}
                >
                  Show {papers.length} results
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  return (
    <div
      className="card card-lift flex flex-col"
      style={{ padding: "22px 24px 20px", borderRadius: 16 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-semibold tracking-widest uppercase truncate max-w-[150px]"
          style={{ color: "var(--ink-4)" }}
        >
          {p.exam?.name ?? "PYQ"}
        </span>
      </div>

      <div
        className="text-[17px] font-semibold leading-tight"
        style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
      >
        {p.year} — {p.title}
      </div>

      <div className="text-[12px] mt-1 h-[18px]" style={{ color: "var(--ink-4)" }}>
        {p.shift ? `Shift: ${p.shift}` : ""}
      </div>

      <div className="flex items-center gap-0 mt-4">
        <span
          className="inline-flex items-center gap-1.5 text-[12px]"
          style={{ color: "var(--ink-3)" }}
        >
          <BookOpen size={12} strokeWidth={1.75} />
          {p.totalQs} Questions
        </span>
        <span className="mx-2.5 text-[11px]" style={{ color: "var(--line)" }}>·</span>
        <span
          className="inline-flex items-center gap-1.5 text-[12px]"
          style={{ color: "var(--ink-3)" }}
        >
          <Clock size={12} strokeWidth={1.75} />
          {p.durationMin} min
        </span>
      </div>

      <div className="mt-4" />
      <div className="mt-auto mb-4" style={{ borderTop: "1px solid var(--line-soft)" }} />

      <div className="flex items-center gap-2">
        <Link
          href={`/pyq/${p.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full text-[13px] font-medium text-white bg-[var(--blue)] hover:bg-[var(--blue-ink)] transition-colors"
          style={{ height: 38, fontWeight: 480 }}
        >
          <Play size={11} fill="white" stroke="none" />
          Attempt
        </Link>
        {p.pdfUrl && (
          <a
            href={p.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full transition-colors hover:border-black"
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

      <div
        className="mt-5 p-4 rounded-[10px] flex items-center justify-between"
        style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
      >
        <div>
          <div
            className="text-[10px] font-medium uppercase tracking-wider mb-1"
            style={{ color: "var(--ink-4)" }}
          >
            Score
          </div>
          <div className="text-[20px] font-bold font-mono" style={{ color: "var(--ink-1)" }}>
            {a.score}{" "}
            <span className="text-[13px] text-[var(--ink-4)]">/ {a.totalMarks}</span>
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-[10px] font-medium uppercase tracking-wider mb-1"
            style={{ color: "var(--ink-4)" }}
          >
            Time Taken
          </div>
          <div className="text-[14px] font-bold font-mono" style={{ color: "var(--ink-2)" }}>
            {a.timeTakenSec != null
              ? `${Math.floor(a.timeTakenSec / 60)}m ${a.timeTakenSec % 60}s`
              : "—"}
          </div>
        </div>
      </div>

      <div className="mt-5 mb-4" style={{ borderTop: "1px solid var(--line-soft)" }} />

      <Link
        href={`/pyq/${a.paperId}?attemptId=${a.id}`}
        className="inline-flex items-center justify-center rounded-full text-[13px] font-medium border border-[var(--line)] hover:border-black transition-colors w-full"
        style={{ color: "var(--ink-1)", height: 38, fontWeight: 480 }}
      >
        View Detailed Report
      </Link>
    </div>
  );
}
