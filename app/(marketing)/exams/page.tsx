"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GraduationCap, ArrowRight, ChevronRight, X, RotateCcw, Filter } from "lucide-react";
import { FilterSidebar, MobileFilterBar, ExamFilterPanel } from "@/components/layout/FilterSidebar";
import { useExamFilter, parseIds, serializeIds } from "@/hooks/useExamFilter";
import type { ApiBoard, ApiBoardExam } from "@/lib/api";

/* ── Emoji map ── */
const STATE_EMOJI: Record<string, string> = {
  "Central Government": "🏛",
  "Jharkhand":          "🌿",
  "Bihar":              "🏺",
  "Uttar Pradesh":      "⚡",
  "Rajasthan":          "🏜",
  "Madhya Pradesh":     "🦁",
  "Maharashtra":        "🌊",
  "Karnataka":          "🌸",
  "Tamil Nadu":         "🏯",
  "Gujarat":            "🦚",
  "West Bengal":        "🎭",
  "Andhra Pradesh":     "🌾",
  "Telangana":          "💎",
  "Kerala":             "🌴",
  "Punjab":             "🌾",
  "Haryana":            "🌻",
  "Himachal Pradesh":   "🏔",
  "Uttarakhand":        "🏔",
  "Odisha":             "🎪",
  "Assam":              "🍵",
  "Chhattisgarh":       "🌿",
  "Goa":                "🏖",
  "Delhi":              "🗼",
};
function emojiFor(name: string) { return STATE_EMOJI[name] ?? "📋"; }

interface StateGroup {
  id: number | null;
  name: string;
  boards: ApiBoard[];
}

function groupByState(boards: ApiBoard[]): StateGroup[] {
  const map = new Map<string, StateGroup>();
  for (const board of boards) {
    const key  = board.state ? String(board.state.id) : "__none__";
    const name = board.state?.name ?? "Other";
    if (!map.has(key)) map.set(key, { id: board.state?.id ?? null, name, boards: [] });
    map.get(key)!.boards.push(board);
  }
  return [...map.values()].sort((a, b) => {
    if (a.id === null) return 1;
    if (b.id === null) return -1;
    return a.name.localeCompare(b.name);
  });
}

/* ─── Main inner component ────────────────────────────── */

function AllExamsPageInner() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch]                     = useState(searchParams.get("q") ?? "");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const examFilter = useExamFilter({
    stateIds: parseIds(searchParams.get("stateIds"), Number),
    boardIds:  parseIds(searchParams.get("boardIds"),  String),
    examIds:   parseIds(searchParams.get("examIds"),   String),
  });

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    const sIds = serializeIds(examFilter.selectedStateIds);
    const bIds = serializeIds(examFilter.selectedBoardIds);
    const eIds = serializeIds(examFilter.selectedExamIds);
    if (sIds) params.set("stateIds", sIds);
    if (bIds) params.set("boardIds", bIds);
    if (eIds) params.set("examIds",  eIds);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [search, examFilter.selectedStateIds, examFilter.selectedBoardIds, examFilter.selectedExamIds, pathname, router]);

  // Group boards from the hook (already fetched)
  const stateGroups = useMemo(() => groupByState(examFilter.allBoards), [examFilter.allBoards]);

  // All exams flat (for search)
  const allExams = useMemo(
    () => examFilter.allBoards.flatMap(b => (b.exams ?? []).map(e => ({ ...e, board: b as ApiBoard }))),
    [examFilter.allBoards]
  );

  // Search results
  const searchResults = search.trim()
    ? allExams.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.shortName.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  // Hierarchical display filtered by sidebar selections
  const visibleGroups = useMemo(() => {
    const { selectedStateIds, selectedBoardIds, selectedExamIds } = examFilter;
    const result: Array<StateGroup & { boards: Array<ApiBoard & { exams: ApiBoardExam[] }> }> = [];

    for (const group of stateGroups) {
      if (selectedStateIds.length > 0 && group.id != null && !selectedStateIds.includes(group.id)) continue;
      const filteredBoards: Array<ApiBoard & { exams: ApiBoardExam[] }> = [];
      for (const board of group.boards) {
        if (selectedBoardIds.length > 0 && !selectedBoardIds.includes(board.id)) continue;
        const exams = selectedExamIds.length > 0
          ? (board.exams ?? []).filter(e => selectedExamIds.includes(e.id))
          : (board.exams ?? []);
        if (exams.length > 0) filteredBoards.push({ ...board, exams });
      }
      if (filteredBoards.length > 0) result.push({ ...group, boards: filteredBoards });
    }
    return result;
  }, [stateGroups, examFilter.selectedStateIds, examFilter.selectedBoardIds, examFilter.selectedExamIds]);

  const activeFilterCount = examFilter.examFilterCount;

  function resetFilters() {
    examFilter.resetExamFilter();
    setSearch("");
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg)" }}>

      {/* ── HERO ── */}
      <section className="border-b pt-16 pb-20 relative overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full opacity-5 blur-[120px] pointer-events-none" style={{ background: "#0D287E" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight" style={{ color: "var(--ink-1)" }}>
            Find Your Target Exam
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--ink-2)" }}>
            Explore our comprehensive catalogue of government and competitive exams. Get access to syllabus, important dates, mock tests, and previous year papers.
          </p>
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5" style={{ color: "var(--ink-4)" }} />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-10 py-4 sm:text-lg border-2 rounded-2xl focus:outline-none transition-all"
              style={{ background: "var(--bg)", borderColor: "var(--line-soft)", color: "var(--ink-1)" }}
              placeholder="Search for an exam (e.g., SSC CGL, IBPS PO)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                style={{ color: "var(--ink-4)" }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {search.trim() && searchResults ? (
          /* ── SEARCH RESULTS ── */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: "var(--ink-1)" }}>
                <span className="font-black" style={{ color: "var(--blue)" }}>{searchResults.length}</span> results for &ldquo;{search}&rdquo;
              </h2>
              <button type="button" onClick={() => setSearch("")} className="text-sm font-semibold" style={{ color: "var(--ink-3)" }}>
                ← Back to browse
              </button>
            </div>
            {searchResults.length === 0 ? (
              <div className="border rounded-3xl p-12 text-center" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "var(--ink-4)" }} />
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--ink-1)" }}>No exams found</h3>
                <p style={{ color: "var(--ink-3)" }}>Try different keywords or browse by state using the filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((exam: ApiBoardExam & { board: ApiBoard }, idx: number) => (
                  <motion.div key={exam.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                    <Link
                      href={`/exams/${exam.id}`}
                      className="block border rounded-3xl p-6 transition-all hover:-translate-y-0.5 group"
                      style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block mb-3"
                        style={{ background: `${exam.board.tint}18`, color: exam.board.tint || "#0D287E" }}>
                        {exam.board.shortName}
                      </span>
                      <h3 className="text-xl font-bold mb-2" style={{ color: "var(--ink-1)" }}>{exam.name}</h3>
                      <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>
                        {[exam.hasTests && "Tests available", exam.hasPYQ && "PYQs available"].filter(Boolean).join(" · ") || "Coming soon"}
                      </p>
                      <div className="flex items-center text-sm font-bold" style={{ color: "#0D287E" }}>
                        View Details <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        ) : (
          /* ── BROWSE WITH SIDEBAR ── */
          <div className="flex gap-6 items-start">

            {/* Left sidebar */}
            <FilterSidebar
              searchQuery={search}
              onSearchChange={setSearch}
              activeFilterCount={activeFilterCount}
              onReset={resetFilters}
            >
              <ExamFilterPanel
                allStates={examFilter.allStates}
                selectedStateIds={examFilter.selectedStateIds}
                onToggleState={examFilter.toggleState}
                availableBoards={examFilter.availableBoards}
                selectedBoardIds={examFilter.selectedBoardIds}
                onToggleBoard={examFilter.toggleBoard}
                availableExams={examFilter.availableExams}
                selectedExamIds={examFilter.selectedExamIds}
                onToggleExam={examFilter.toggleExam}
                isLoading={examFilter.isLoading}
                examsLoading={examFilter.examsLoading}
              />
            </FilterSidebar>

            {/* Right content */}
            <div className="flex-1 min-w-0">

              {/* Mobile filter bar */}
              <div className="lg:hidden mb-4">
                <MobileFilterBar
                  searchQuery={search}
                  onSearchChange={setSearch}
                  activeFilterCount={activeFilterCount}
                  onOpenMobileFilter={() => setMobileFilterOpen(true)}
                />
              </div>

              {examFilter.isLoading ? (
                <SkeletonLoading />
              ) : visibleGroups.length === 0 ? (
                <EmptyState onReset={resetFilters} />
              ) : (
                <div className="space-y-16">
                  {visibleGroups.map(group => (
                    <div key={group.id ?? "__none__"} className="space-y-8">
                      {group.id !== null && (
                        <div className="flex items-center gap-4 border-b pb-4" style={{ borderColor: "var(--line-soft)" }}>
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "var(--card)" }}>
                            {emojiFor(group.name)}
                          </div>
                          <h2 className="text-2xl font-bold" style={{ color: "var(--ink-1)" }}>{group.name}</h2>
                        </div>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {group.boards.map(board => (
                          <div key={board.id} className="border rounded-3xl overflow-hidden flex flex-col"
                            style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
                            <div className="p-5 border-b flex items-center gap-4"
                              style={{ borderColor: "var(--line-soft)", background: `${board.tint}08` }}>
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                                style={{ backgroundColor: board.tint || "#0D287E" }}>
                                {board.shortName.slice(0, 2)}
                              </div>
                              <div>
                                <h3 className="font-bold text-base leading-tight" style={{ color: "var(--ink-1)" }}>{board.name}</h3>
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: board.tint || "#0D287E" }}>
                                  {board.shortName}
                                </span>
                              </div>
                            </div>
                            <div className="p-2 flex-1">
                              {(board.exams ?? []).map(exam => (
                                <Link key={exam.id} href={`/exams/${exam.id}`}
                                  className="flex items-center justify-between p-4 rounded-2xl transition-all group hover:bg-[var(--bg)]">
                                  <div>
                                    <h4 className="font-bold" style={{ color: "var(--ink-1)" }}>{exam.name}</h4>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--ink-4)" }}>
                                      {[exam.hasTests && "Tests", exam.hasPYQ && "PYQs"].filter(Boolean).join(" · ") || "Coming soon"}
                                    </p>
                                  </div>
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:bg-[#0D287E] group-hover:text-white"
                                    style={{ background: "var(--bg)", color: "var(--ink-3)" }}>
                                    <ChevronRight size={16} />
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile filter drawer ── */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex h-[85vh] flex-col rounded-t-[24px] bg-[var(--bg)] lg:hidden"
              style={{ borderTop: "1px solid var(--line-soft)" }}
            >
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--line-soft)" }}>
                <h3 className="font-bold text-[var(--ink-1)]">Filters</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="rounded-full p-2 bg-[var(--card)] border border-[var(--line-soft)] text-[var(--ink-2)]">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 pb-20 [scrollbar-width:none]">
                <ExamFilterPanel
                  allStates={examFilter.allStates}
                  selectedStateIds={examFilter.selectedStateIds}
                  onToggleState={examFilter.toggleState}
                  availableBoards={examFilter.availableBoards}
                  selectedBoardIds={examFilter.selectedBoardIds}
                  onToggleBoard={examFilter.toggleBoard}
                  availableExams={examFilter.availableExams}
                  selectedExamIds={examFilter.selectedExamIds}
                  onToggleExam={examFilter.toggleExam}
                  isLoading={examFilter.isLoading}
                  examsLoading={examFilter.examsLoading}
                />
              </div>
              <div className="flex gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--line-soft)" }}>
                <button type="button" onClick={() => { resetFilters(); setMobileFilterOpen(false); }}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] border text-[13px] font-semibold transition-colors hover:border-[var(--blue)]"
                  style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}>
                  <RotateCcw size={13} /> Clear all
                </button>
                <button type="button" onClick={() => setMobileFilterOpen(false)}
                  className="flex h-11 flex-[1.4] items-center justify-center rounded-[12px] text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
                  style={{ background: "var(--blue)" }}>
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Loading skeleton ── */
function SkeletonLoading() {
  return (
    <div className="space-y-8">
      <div className="flex gap-3">
        {[100, 160, 120, 100, 140].map((w, i) => (
          <div key={i} className="h-11 rounded-xl animate-pulse" style={{ width: w, background: "var(--card)" }} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-48 rounded-3xl animate-pulse" style={{ background: "var(--card)" }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Empty state ── */
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="border-2 border-dashed rounded-3xl p-16 text-center" style={{ borderColor: "var(--line-soft)" }}>
      <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "var(--ink-4)" }} />
      <h3 className="text-lg font-bold mb-2" style={{ color: "var(--ink-1)" }}>No exams match your filters</h3>
      <p className="mb-5" style={{ color: "var(--ink-3)" }}>Try removing some filters or selecting different states and boards.</p>
      <button type="button" onClick={onReset}
        className="inline-flex h-10 items-center gap-2 rounded-[12px] px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
        style={{ background: "var(--blue)" }}>
        <RotateCcw size={14} /> Clear filters
      </button>
    </div>
  );
}

/* ─── Page export ── */
export default function AllExamsPage() {
  return (
    <Suspense fallback={<SkeletonLoading />}>
      <AllExamsPageInner />
    </Suspense>
  );
}
