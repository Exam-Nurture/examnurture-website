"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/lib/auth-context";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileDown,
  FileText,
  Filter,
  Flame,
  GraduationCap,
  LayoutGrid,
  LineChart,
  List,
  Lock,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { FilterSidebar, FilterSection, MobileFilterBar, ActiveFilterChips, ExamFilterPanel } from "@/components/layout/FilterSidebar";
import { useExamFilter, parseIds, serializeIds } from "@/hooks/useExamFilter";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const SORTS = [
  { value: "latest", label: "Latest first" },
  { value: "attempted", label: "Most attempted" },
  { value: "rated", label: "Highest rated" },
  { value: "topic", label: "Topic-wise" },
  { value: "full", label: "Full paper" },
  { value: "sectional", label: "Sectional" },
] as const;

const BANNER_GRADIENTS = [
  "from-blue-600 to-cyan-500",
  "from-violet-600 to-purple-500",
  "from-emerald-600 to-teal-500",
  "from-amber-600 to-orange-500",
  "from-rose-600 to-pink-500",
  "from-indigo-600 to-blue-500",
  "from-sky-600 to-cyan-500",
  "from-fuchsia-600 to-violet-500",
];

const SEO_GROUPS = [
  { title: "Latest SSC PYQs", links: ["SSC CGL PYQ Papers", "SSC CHSL PYQ Papers", "SSC MTS PYQ Papers", "SSC GD Constable PYQ"] },
  { title: "Banking PYQs", links: ["SBI PO PYQ Papers", "IBPS PO PYQ Papers", "RBI Grade B PYQ", "IBPS Clerk PYQ"] },
  { title: "State PSC PYQs", links: ["JPSC Prelims PYQ", "BPSC PYQ Papers", "UPPSC PYQ", "MPSC PYQ Papers"] },
  { title: "Railway & Police PYQs", links: ["RRB NTPC PYQ", "RRB Group D PYQ", "UP Police PYQ", "Railway ALP PYQ"] },
];

type SortValue = (typeof SORTS)[number]["value"];

interface RawPYQPaper {
  id: string;
  title: string;
  year?: number;
  totalQuestions?: number;
  durationSec?: number;
  marks?: number;
  pdfUrl?: string;
  isPremium?: boolean;
  isActive?: boolean;
  exam?: { id?: string; name?: string; slug?: string };
}

interface PyqPaper {
  id: string;
  examId: string;
  examName: string;
  title: string;
  year: number;
  totalQuestions: number;
  duration: number;
  marks: number;
  isPremium: boolean;
  pdfUrl?: string;
  isNew: boolean;
  bannerGradient: string;
}

interface Filters {
  q: string;
  exam: string;
  year: string;
  access: string;
  sort: SortValue;
}

const defaultFilters: Filters = {
  q: "",
  exam: "All",
  year: "All",
  access: "All",
  sort: "latest",
};

function readFilters(params: URLSearchParams): Filters {
  return {
    q: params.get("q") ?? "",
    exam: params.get("exam") ?? "All",
    year: params.get("year") ?? "All",
    access: params.get("access") ?? "All",
    sort: (params.get("sort") as SortValue) ?? "latest",
  };
}

function mapPaper(raw: RawPYQPaper, index: number): PyqPaper {
  return {
    id: raw.id,
    examId: raw.exam?.id ?? "",
    examName: raw.exam?.name ?? "Unknown Exam",
    title: raw.title ?? "PYQ Paper",
    year: raw.year ?? 0,
    totalQuestions: raw.totalQuestions ?? 0,
    duration: raw.durationSec ? Math.round(raw.durationSec / 60) : 0,
    marks: raw.marks ?? 0,
    isPremium: raw.isPremium ?? false,
    pdfUrl: raw.pdfUrl,
    isNew: raw.year ? raw.year >= 2024 : false,
    bannerGradient: BANNER_GRADIENTS[index % BANNER_GRADIENTS.length],
  };
}

/* ─── Main Page Component ────────────────────────────── */

function PyqAllPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [papers, setPapers] = useState<PyqPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(9);
  const [filters, setFilters] = useState<Filters>(() => readFilters(searchParams));
  const [debouncedQ, setDebouncedQ] = useState(filters.q);
  const [authModal, setAuthModal] = useState<{ open: boolean; next: string }>({ open: false, next: "/dashboard" });

  const examFilter = useExamFilter({
    stateIds: parseIds(searchParams.get("stateIds"), Number),
    boardIds:  parseIds(searchParams.get("boardIds"),  String),
    examIds:   parseIds(searchParams.get("examIds"),   String),
  });

  const requireAuth = useCallback((href: string, e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setAuthModal({ open: true, next: href });
    }
  }, [user]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("en_pyq_bookmarks");
      if (saved) setBookmarks(new Set(JSON.parse(saved) as string[]));
    } catch { setBookmarks(new Set()); }
  }, []);

  useEffect(() => {
    const next = readFilters(searchParams);
    setFilters((prev) => {
      const equal = Object.keys(next).every(k => prev[k as keyof Filters] === next[k as keyof Filters]);
      return equal ? prev : next;
    });
    setDebouncedQ((prev) => prev === next.q ? prev : next.q);
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(filters.q), 280);
    return () => window.clearTimeout(t);
  }, [filters.q]);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries({ ...filters, q: debouncedQ }).forEach(([key, value]) => {
      if (value && value !== defaultFilters[key as keyof Filters]) params.set(key, value);
    });
    const sIds = serializeIds(examFilter.selectedStateIds);
    const bIds = serializeIds(examFilter.selectedBoardIds);
    const eIds = serializeIds(examFilter.selectedExamIds);
    if (sIds) params.set("stateIds", sIds);
    if (bIds) params.set("boardIds", bIds);
    if (eIds) params.set("examIds",  eIds);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedQ, filters, examFilter.selectedStateIds, examFilter.selectedBoardIds, examFilter.selectedExamIds, pathname, router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/pyq?limit=100`);
        if (!res.ok) throw new Error("Could not load PYQ papers");
        const data = (await res.json()) as { items?: RawPYQPaper[] };
        if (!cancelled) setPapers((data.items ?? []).map(mapPaper));
      } catch {
        if (!cancelled) {
          setError("Unable to load PYQ papers. Please check your connection and try again.");
          setPapers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const exams = useMemo(() => ["All", ...Array.from(new Set(papers.map((p) => p.examName))).sort()], [papers]);
  const availableYears = useMemo(
    () => Array.from(new Set(papers.map(p => String(p.year)).filter(y => y !== "0"))).sort((a, b) => Number(b) - Number(a)),
    [papers]
  );

  // Build a set of exam IDs for papers belonging to selected boards (for board-level filtering)
  const boardExamIdSet = useMemo(() => {
    if (examFilter.selectedBoardIds.length === 0) return null;
    return new Set(examFilter.availableExams.map((e) => e.id));
  }, [examFilter.selectedBoardIds, examFilter.availableExams]);

  const filteredPapers = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    const { selectedExamIds, selectedBoardIds } = examFilter;
    const result = papers.filter((p) => {
      if (q && ![p.title, p.examName].join(" ").toLowerCase().includes(q)) return false;
      if (filters.exam !== "All" && p.examName !== filters.exam) return false;
      if (filters.year !== "All" && String(p.year) !== filters.year) return false;
      if (filters.access !== "All" && (filters.access === "Free" ? p.isPremium : !p.isPremium)) return false;
      // Cascading exam filter: specific exam IDs take precedence over board-level filter
      if (selectedExamIds.length > 0) {
        if (!selectedExamIds.includes(p.examId)) return false;
      } else if (selectedBoardIds.length > 0) {
        if (!boardExamIdSet?.has(p.examId)) return false;
      }
      return true;
    });
    return result.sort((a, b) => {
      if (filters.sort === "full") return b.totalQuestions - a.totalQuestions;
      return b.year - a.year;
    });
  }, [debouncedQ, filters, papers, examFilter.selectedExamIds, examFilter.selectedBoardIds, boardExamIdSet]);

  useEffect(() => { setVisibleCount(9); }, [filteredPapers.length, filters]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleCount((c) => Math.min(c + 6, filteredPapers.length));
    }, { rootMargin: "400px" });
    obs.observe(node);
    return () => obs.disconnect();
  }, [filteredPapers.length]);

  const visiblePapers = filteredPapers.slice(0, visibleCount);
  const stats = useMemo(() => ({
    total: papers.length,
    exams: new Set(papers.map((p) => p.examName)).size,
    years: new Set(papers.map((p) => p.year).filter(Boolean)).size,
  }), [papers]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }
  function resetFilters() { setFilters(defaultFilters); setDebouncedQ(""); examFilter.resetExamFilter(); }
  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      window.localStorage.setItem("en_pyq_bookmarks", JSON.stringify(Array.from(next)));
      return next;
    });
  }

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== "sort" && v && v !== defaultFilters[k as keyof Filters]).length + examFilter.examFilterCount;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <HeroSection stats={stats} onRequireAuth={requireAuth} />

      {/* ── Unified layout: Left sidebar + Right Content ────────────── */}
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-6 items-start">

          {/* ── Left sidebar filters (desktop) ───────────── */}
          <FilterSidebar
            searchQuery={filters.q}
            onSearchChange={(v) => updateFilter("q", v)}
            activeFilterCount={activeFilterCount}
            onReset={resetFilters}
          >
            <ExamFilterPanel
              allCategories={examFilter.allCategories}
              selectedCategoryIds={examFilter.selectedCategoryIds}
              onToggleCategory={examFilter.toggleCategory}
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
            {availableYears.length > 0 && <FilterSection title="Year" selectedValue={filters.year} onSelect={(v) => updateFilter("year", String(v))} options={["All", ...availableYears].map(y => ({ value: y, label: y }))} />}
            <FilterSection title="Access" selectedValue={filters.access} onSelect={(v) => updateFilter("access", String(v))} options={["All", "Free", "Premium"].map(a => ({ value: a, label: a }))} />
          </FilterSidebar>

          {/* ── Right content ─────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Mobile search + filter row */}
            <div className="lg:hidden">
              <MobileFilterBar
                searchQuery={filters.q}
                onSearchChange={(v) => updateFilter("q", v)}
                activeFilterCount={activeFilterCount}
                onOpenMobileFilter={() => setFilterOpen(true)}
              />
            </div>



            {/* Toolbar: count + sort */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                  <span className="font-bold" style={{ color: "var(--ink-1)" }}>{filteredPapers.length}</span> papers found
                </p>
                {!loading && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--blue-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--blue)]">
                    <FileText size={10} /> {stats.total} total
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value as SortValue)}
                  className="h-9 rounded-[10px] border px-3 text-[12px] font-semibold outline-none transition"
                  style={{ background: "var(--card)", borderColor: "var(--line-soft)", color: "var(--ink-2)" }}
                >
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {/* View mode toggle */}
                <div className="flex h-9 items-center overflow-hidden rounded-[10px] border" style={{ borderColor: "var(--line-soft)", background: "var(--card)" }}>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    title="Card view"
                    className={`flex h-full w-9 items-center justify-center transition`}
                    style={{ background: viewMode === "grid" ? "var(--blue)" : "transparent", color: viewMode === "grid" ? "#fff" : "var(--ink-4)" }}
                  >
                    <LayoutGrid size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    title="List view"
                    className={`flex h-full w-9 items-center justify-center transition`}
                    style={{ background: viewMode === "list" ? "var(--blue)" : "transparent", color: viewMode === "list" ? "#fff" : "var(--ink-4)" }}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>
            {/* Active filter chips */}
            <ActiveFilterChips
              filters={Object.entries(filters).filter(([k, v]) => k !== "sort" && v && v !== defaultFilters[k as keyof Filters]).map(([k, v]) => ({ key: k, value: String(v) }))}
              onRemove={(key) => updateFilter(key as keyof Filters, defaultFilters[key as keyof Filters])}
              onReset={resetFilters}
            />

            
            
            {error && (
              <div className="rounded-[14px] border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-[13px] font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                {error}
              </div>
            )}

            {/* Papers grid / list */}
            <div>
              {loading ? (
                <LoadingGrid />
              ) : filteredPapers.length === 0 ? (
                <EmptyState onReset={resetFilters} />
              ) : (
                <>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {visiblePapers.map((paper) => (
                        <PyqCard key={paper.id} paper={paper} bookmarked={bookmarks.has(paper.id)} onBookmark={() => toggleBookmark(paper.id)} onRequireAuth={requireAuth} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {visiblePapers.map((paper) => (
                        <PyqRow key={paper.id} paper={paper} bookmarked={bookmarks.has(paper.id)} onBookmark={() => toggleBookmark(paper.id)} onRequireAuth={requireAuth} />
                      ))}
                    </div>
                  )}
                  <div ref={sentinelRef} className="h-4" />
                  {visibleCount < filteredPapers.length && (
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((c) => c + 9)}
                        className="inline-flex h-11 items-center gap-2 rounded-[14px] border-2 px-6 text-[13px] font-semibold transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
                        style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}
                      >
                        Load {Math.min(9, filteredPapers.length - visibleCount)} more papers
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Below-grid extras ───────────────────────────── */}
      <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-8 sm:px-6 lg:px-8">
      </div>

      {/* Footer SEO band */}
      <SeoSection onSelect={(v) => updateFilter("q", v)} />
      {/* ── Mobile filter drawer ─────────────────────────── */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilterOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex h-[85vh] flex-col rounded-t-[24px] bg-[var(--bg)] lg:hidden"
              style={{ borderTop: "1px solid var(--line-soft)" }}
            >
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--line-soft)" }}>
                <h3 className="font-bold text-[var(--ink-1)]">Filters</h3>
                <button onClick={() => setFilterOpen(false)} className="rounded-full p-2 bg-[var(--card)] border border-[var(--line-soft)] text-[var(--ink-2)]">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 pb-20 [scrollbar-width:none]">
                <div className="flex flex-col gap-6">
                  <ExamFilterPanel
              allCategories={examFilter.allCategories}
              selectedCategoryIds={examFilter.selectedCategoryIds}
              onToggleCategory={examFilter.toggleCategory}
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
                  {availableYears.length > 0 && <FilterSection title="Year" selectedValue={filters.year} onSelect={(v) => updateFilter("year", String(v))} options={["All", ...availableYears].map(y => ({ value: y, label: y }))} />}
                  <FilterSection title="Access" selectedValue={filters.access} onSelect={(v) => updateFilter("access", String(v))} options={["All", "Free", "Premium"].map(a => ({ value: a, label: a }))} />
                </div>
              </div>
              <div className="flex gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--line-soft)" }}>
                <button type="button" onClick={() => { resetFilters(); setFilterOpen(false); }}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] border text-[13px] font-semibold transition-colors hover:border-[var(--blue)]"
                  style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}>
                  <RotateCcw size={13} /> Clear all
                </button>
                <button type="button" onClick={() => setFilterOpen(false)}
                  className="flex h-11 flex-[1.4] items-center justify-center rounded-[12px] text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
                  style={{ background: "var(--blue)" }}>
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      {authModal.open && (
        <AuthModal
          onClose={() => setAuthModal({ open: false, next: "/dashboard" })}
          next={authModal.next}
        />
      )}

      {/* Sticky mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 sm:hidden">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="relative flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-700 transition dark:border-white/10 dark:text-white"
          >
            <Filter className="h-4 w-4" /> Filter
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <Link
            href={visiblePapers[0] ? `/dashboard/pyq/${visiblePapers[0].id}` : "/dashboard/pyq"}
            onClick={(e) => requireAuth(visiblePapers[0] ? `/dashboard/pyq/${visiblePapers[0].id}` : "/dashboard/pyq", e)}
            className="flex h-12 flex-[1.6] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-black text-white shadow-lg shadow-blue-600/25"
          >
            Start Solving <Play className="h-3.5 w-3.5 fill-white" />
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ─── Hero Section ───────────────────────────────────── */
function HeroSection({ stats, onRequireAuth }: {
  stats: { total: number; exams: number; years: number };
  onRequireAuth: (href: string, e: React.MouseEvent) => void;
}) {
  return (
    <section style={{ background: "var(--card)", borderBottom: "1px solid var(--line-soft)" }}>
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
        {/* Left */}
        <div>
          <p className="text-[11px] font-normal uppercase mb-5"
             style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px", color: "var(--ink-3)" }}>
            PYQ Library
          </p>
          <h1 className="max-w-2xl text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.10]"
              style={{ fontWeight: 300, letterSpacing: "-0.96px", color: "var(--ink-1)" }}>
            Previous Year<br />Question Papers
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-[1.45]"
             style={{ fontWeight: 300, letterSpacing: "-0.26px", color: "var(--ink-3)" }}>
            Solve real exam papers for SSC, Banking, Railway, State PSC, Police, UPSC &amp; more — with live timer, detailed solutions and AI analytics.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard/pyq?tab=attempts"
              onClick={(e) => onRequireAuth("/dashboard/pyq?tab=attempts", e)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-[15px] font-medium transition-colors hover:opacity-85"
              style={{ background: "var(--ink-1)", fontWeight: 480, letterSpacing: "-0.10px" }}
            >
              My PYQ Attempts <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/plans"
              onClick={(e) => onRequireAuth("/dashboard/plans", e)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border text-[15px] font-medium transition-colors hover:bg-[var(--surface-hover)]"
              style={{ background: "var(--bg)", borderColor: "var(--line)", color: "var(--ink-1)", fontWeight: 480, letterSpacing: "-0.10px" }}
            >
              View Plans
            </Link>
          </div>
        </div>

        {/* Right — Stats cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={FileText} label="PYQ Papers" value={stats.total > 0 ? `${stats.total}+` : "—"} />
          <StatCard icon={GraduationCap} label="Exams Covered" value={stats.exams > 0 ? `${stats.exams}+` : "—"} />
          <StatCard icon={Trophy} label="Years Covered" value={stats.years > 0 ? `${stats.years}+` : "—"} />
          <StatCard icon={Star} label="With Solutions" value="All" />
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-[16px] border p-5 transition-colors hover:border-[var(--ink-1)]" style={{ background: "var(--bg-secondary)", borderColor: "var(--line-soft)" }}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[8px] text-white" style={{ background: "var(--ink-1)" }}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[28px] font-black tracking-tight tabular-nums leading-none" style={{ color: "var(--ink-1)" }}>{value}</p>
      <p className="mt-1.5 text-[11px] font-normal uppercase"
         style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px", color: "var(--ink-3)" }}>{label}</p>
    </div>
  );
}

/* ─── PYQ Card (grid view) ───────────────────────────── */
function PyqCard({ paper, bookmarked, onBookmark, onRequireAuth }: { paper: PyqPaper; bookmarked: boolean; onBookmark: () => void; onRequireAuth?: (href: string, e: React.MouseEvent) => void }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[16px] border transition-colors duration-200 hover:-translate-y-0.5 hover:border-[var(--blue)]"
             style={{ background: "var(--card)", borderColor: "var(--line-soft)", boxShadow: "var(--shadow-xs, 0 1px 4px rgba(0,0,0,.05))" }}>
      {/* Neutral banner */}
      <div className="relative h-[64px] overflow-hidden flex items-center justify-center border-b"
           style={{ background: "var(--bg-secondary)", borderColor: "var(--line-soft)" }}>
        <span className="text-2xl font-black select-none" style={{ color: "var(--line)" }}>PYQ</span>
        <div className="absolute bottom-2 left-3 flex gap-1.5">
          {paper.year > 0 && <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: "var(--ink-1)", color: "var(--bg)" }}>{paper.year}</span>}
          {paper.isNew && <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: "var(--line)", color: "var(--ink-2)" }}>New</span>}
          {paper.isPremium && <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: "var(--line)", color: "var(--ink-2)" }}>Premium</span>}
        </div>
        <div className="absolute right-2.5 top-2.5">
          <button
            type="button"
            onClick={onBookmark}
            className={`flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors ${bookmarked ? "hover:opacity-90" : ""}`}
            style={{ background: bookmarked ? "var(--ink-1)" : "var(--card)", borderColor: bookmarked ? "var(--ink-1)" : "var(--line-soft)", color: bookmarked ? "var(--bg)" : "var(--ink-3)" }}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-normal uppercase mb-1"
           style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px", color: "var(--ink-3)" }}>{paper.examName}</p>
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug" style={{ color: "var(--ink-1)" }}>
          {paper.title}
        </h3>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {paper.totalQuestions > 0 && <MetricChip icon={BookOpenCheck} value={paper.totalQuestions} label="Questions" />}
          {paper.marks > 0 && <MetricChip icon={Target} value={paper.marks} label="Marks" />}
          {paper.duration > 0 && <MetricChip icon={Clock3} value={`${paper.duration}m`} label="Duration" />}
        </div>

        <div className="mt-auto pt-4 flex gap-2">
          {paper.isPremium ? (
            <Link
              href="/dashboard/plans"
              onClick={(e) => onRequireAuth?.("/dashboard/plans", e)}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-opacity hover:opacity-85"
              style={{ background: "var(--ink-1)", color: "var(--bg)", fontWeight: 480 }}
            >
              <Zap className="h-3.5 w-3.5" /> Unlock
            </Link>
          ) : (
            <Link
              href={`/dashboard/pyq/${paper.id}`}
              onClick={(e) => onRequireAuth?.(`/dashboard/pyq/${paper.id}`, e)}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-opacity hover:opacity-85"
              style={{ background: "var(--ink-1)", color: "var(--bg)", fontWeight: 480 }}
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Start
            </Link>
          )}
          <Link
            href={`/dashboard/pyq/${paper.id}`}
            onClick={(e) => onRequireAuth?.(`/dashboard/pyq/${paper.id}`, e)}
            className="flex h-10 items-center justify-center rounded-full border px-3 text-[13px] font-medium transition-colors hover:bg-[var(--surface-hover)]"
            style={{ borderColor: "var(--line)", color: "var(--ink-1)", fontWeight: 480 }}
          >
            Details
          </Link>
          {paper.pdfUrl && paper.pdfUrl !== "#" && (
            <a href={paper.pdfUrl} className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-[var(--surface-hover)]"
               style={{ borderColor: "var(--line)", color: "var(--ink-3)" }} aria-label="Download PDF">
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─── PYQ Row (list view) ────────────────────────────── */
function PyqRow({ paper, bookmarked, onBookmark, onRequireAuth }: { paper: PyqPaper; bookmarked: boolean; onBookmark: () => void; onRequireAuth?: (href: string, e: React.MouseEvent) => void }) {
  return (
    <article className="group flex items-center gap-4 rounded-[16px] border px-4 py-3 transition hover:border-[var(--blue)]"
             style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
      <div className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${paper.bannerGradient} flex items-center justify-center`}>
        <FileText className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-[var(--blue)]" style={{ color: "var(--ink-1)" }}>{paper.title}</h3>
          {paper.year > 0 && <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: "var(--bg-secondary)", color: "var(--ink-3)" }}>{paper.year}</span>}
          {paper.isNew && <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>New</span>}
          {paper.isPremium && <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>Premium</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-semibold" style={{ color: "var(--ink-4)" }}>
          <span>{paper.examName}</span>
          {paper.totalQuestions > 0 && <span>{paper.totalQuestions}Q</span>}
          {paper.duration > 0 && <span>{paper.duration}m</span>}
          {paper.marks > 0 && <span>{paper.marks}M</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onBookmark} className="flex h-8 w-8 items-center justify-center rounded-lg transition"
                style={{ background: bookmarked ? "var(--ink-1)" : "transparent", color: bookmarked ? "var(--bg)" : "var(--ink-3)" }}>
          <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
        </button>
        {paper.isPremium ? (
          <Link href="/dashboard/plans" onClick={(e) => onRequireAuth?.("/dashboard/plans", e)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold transition-opacity hover:opacity-85"
            style={{ background: "var(--ink-1)", color: "var(--bg)" }}>
            <Zap className="h-3 w-3" /> Unlock
          </Link>
        ) : (
          <Link href={`/dashboard/pyq/${paper.id}`} onClick={(e) => onRequireAuth?.(`/dashboard/pyq/${paper.id}`, e)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold transition-opacity hover:opacity-85"
            style={{ background: "var(--blue)", color: "#fff" }}>
            <Play className="h-3 w-3 fill-current" /> Solve
          </Link>
        )}
      </div>
    </article>
  );
}

function Tag({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "red" }) {
  const isSlate = tone === "slate";
  const styles = isSlate ? { background: "var(--bg-secondary)", color: "var(--ink-3)" } : {};
  const tailwind = isSlate ? "" : tone === "green" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : tone === "amber" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tailwind}`} style={styles}>{children}</span>;
}

function MetricChip({ icon: Icon, value, label }: { icon: React.ElementType; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border p-2 text-center" style={{ background: "var(--bg-secondary)", borderColor: "var(--line-soft)" }}>
      <Icon className="mx-auto h-3.5 w-3.5" style={{ color: "var(--blue)" }} />
      <p className="mt-0.5 text-xs font-bold" style={{ color: "var(--ink-1)" }}>{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>{label}</p>
    </div>
  );
}

/* ─── Filter Chips ───────────────────────────────────── */

function FilterChips({ filters, onChange, onReset }: {
  filters: Filters;
  onChange: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  onReset: () => void;
}) {
  const chips = Object.entries(filters).filter(([k, v]) => k !== "sort" && v && v !== defaultFilters[k as keyof Filters]);
  if (!chips.length) return null;
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      {chips.map(([key, value]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key as keyof Filters, defaultFilters[key as keyof Filters])}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300"
        >
          {value} <X className="h-2.5 w-2.5" />
        </button>
      ))}
      <button type="button" onClick={onReset} className="text-[11px] font-black text-slate-400 hover:text-blue-600">
        Clear all
      </button>
    </div>
  );
}

/* ─── Filter Group ───────────────────────────────────── */

/* ─── SEO Footer Section ─────────────────────────────── */
function SeoSection({ onSelect }: { onSelect: (v: string) => void }) {
  return (
    <section className="border-t pb-28 pt-10 sm:pb-10" style={{ background: "var(--bg-secondary)", borderColor: "var(--line-soft)" }}>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--blue)" }}>Popular Searches</p>
        <h2 className="mt-1 text-xl font-black" style={{ color: "var(--ink-1)" }}>Previous Year Papers by Exam</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SEO_GROUPS.map((group) => (
            <div key={group.title} className="rounded-2xl border p-4 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
              <h3 className="text-sm font-black" style={{ color: "var(--ink-1)" }}>{group.title}</h3>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {group.links.map((link) => (
                  <button
                    key={link}
                    type="button"
                    onClick={() => onSelect(link)}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-bold transition hover:opacity-85"
                    style={{ background: "var(--bg-secondary)", borderColor: "var(--line-soft)", color: "var(--ink-2)" }}
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border p-5 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
          <h3 className="text-base font-black" style={{ color: "var(--ink-1)" }}>Frequently Asked Questions</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {[
              ["Why solve previous year papers?", "They reveal real exam pattern, question style, speed pressure, and repeated topics — the fastest way to prepare."],
              ["Can I download PYQ PDFs?", "Yes — available papers show a download button. Premium papers require an active subscription."],
              ["Are PYQs enough for preparation?", "Use them with concepts, mock tests, and revision. PYQs are best for pattern mastery and identifying weak areas."],
              ["Can I re-attempt papers?", "Yes! Premium users can re-attempt, compare scores across attempts, and track accuracy trends over time."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-xl p-3" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-sm font-black" style={{ color: "var(--ink-1)" }}>{q}</p>
                <p className="mt-1 text-xs font-medium leading-5" style={{ color: "var(--ink-3)" }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Loading & Empty States ─────────────────────────── */
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-[16px] border" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
          <div className="h-[64px] animate-pulse" style={{ background: "var(--bg-secondary)" }} />
          <div className="space-y-3 p-4">
            <div className="h-3 w-2/3 animate-pulse rounded-full" style={{ background: "var(--bg-secondary)" }} />
            <div className="h-4 w-3/4 animate-pulse rounded-full" style={{ background: "var(--bg-secondary)" }} />
            <div className="flex gap-2 pt-2">
              {[1, 2, 3].map((j) => <div key={j} className="h-5 w-14 animate-pulse rounded-full" style={{ background: "var(--bg-secondary)" }} />)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-[24px] border border-dashed p-12 text-center" style={{ background: "var(--card)", borderColor: "var(--line)" }}>
      <FileDown className="mx-auto h-12 w-12" style={{ color: "var(--ink-4)" }} />
      <h3 className="mt-4 text-xl font-black" style={{ color: "var(--ink-1)" }}>No papers found</h3>
      <p className="mt-2 text-sm font-medium" style={{ color: "var(--ink-3)" }}>Try removing some filters or broadening your search.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl px-6 text-[13px] font-semibold transition hover:opacity-90"
        style={{ background: "var(--blue)", color: "#fff" }}
      >
        <RotateCcw className="h-4 w-4" /> Reset filters
      </button>
    </div>
  );
}

/* ─── Page Export ────────────────────────────────────── */

export default function AllPYQPage() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <PyqAllPageInner />
    </Suspense>
  );
}
