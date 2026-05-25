"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/lib/auth-context";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  FileText,
  Filter,
  GraduationCap,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Target,
  Trophy,
  Users,
  BookOpenCheck,
  X,
  Zap,
} from "lucide-react";
import { FilterSidebar, FilterSection, MobileFilterBar, ActiveFilterChips, ExamFilterPanel } from "@/components/layout/FilterSidebar";
import { useExamFilter, parseIds, serializeIds } from "@/hooks/useExamFilter";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const SORTS = [
  { value: "popular",    label: "Most Popular"  },
  { value: "latest",     label: "Newest First"  },
  { value: "tests",      label: "Most Tests"    },
  { value: "free",       label: "Free First"    },
  { value: "price_asc",  label: "Lowest Price"  },
] as const;

const BANNER_GRADIENTS: [string, string][] = [
  ["#1d4ed8", "#06b6d4"],
  ["#7c3aed", "#a855f7"],
  ["#059669", "#14b8a6"],
  ["#d97706", "#f97316"],
  ["#e11d48", "#ec4899"],
  ["#4338ca", "#6366f1"],
  ["#0284c7", "#22d3ee"],
  ["#be185d", "#ec4899"],
];

const SEO_GROUPS = [
  { title: "Popular SSC Test Series",  links: [["SSC CGL", "SSC CGL test series"], ["SSC CHSL", "SSC CHSL test series"], ["SSC MTS", "SSC MTS test series"], ["SSC GD", "SSC GD test series"]] },
  { title: "Banking Test Series",      links: [["SBI PO", "SBI PO test series"],   ["IBPS PO", "IBPS PO test series"],   ["IBPS Clerk", "IBPS Clerk test series"], ["RBI Grade B", "RBI Grade B test series"]] },
  { title: "State PSC Test Series",    links: [["JPSC", "JPSC test series"],        ["BPSC", "BPSC test series"],          ["UPPSC", "UPPSC test series"],           ["MPSC", "MPSC test series"]] },
  { title: "Railway & Police Series",  links: [["RRB NTPC", "RRB NTPC test series"], ["RRB Group D", "RRB Group D series"], ["UP Police", "UP Police test series"], ["ALP", "Railway ALP test series"]] },
];

type SortValue = (typeof SORTS)[number]["value"];

interface RawTestSeries {
  id: string; title: string; description?: string; totalTests?: number;
  isPaid?: boolean; isFeatured?: boolean; isActive?: boolean;
  bannerUrl?: string; price?: number; discountedPrice?: number; attemptCount?: number;
  isTrending?: boolean;
  exam?: {
    id?: string; name?: string; shortName?: string; tier?: number; isFeatured?: boolean;
    board?: { id?: string; name?: string; shortName?: string; tint?: string; colorSoft?: string; state?: { id?: number; name?: string } };
    examCategory?: { id?: number; name?: string };
  };
}

interface TestSeriesItem {
  id: string; title: string; description: string;
  examName: string; examShortName: string; examSlug: string;
  boardId: string; boardName: string; category: string;
  stateName: string; stateId: number | null; examCategory: string;
  totalTests: number;
  isPaid: boolean; isFeatured: boolean; isTrending: boolean;
  price: number; discountedPrice: number; discountPercent: number;
  attempts: number; tags: string[];
  bannerFrom: string; bannerTo: string; tint: string;
}

interface Filters {
  q: string; category: string; access: string; status: string; sort: SortValue;
}

const defaultFilters: Filters = {
  q: "", category: "All", access: "All", status: "All", sort: "popular",
};

function readFilters(params: URLSearchParams): Filters {
  return {
    q:        params.get("q")        ?? "",
    category: params.get("category") ?? "All",
    access:   params.get("access")   ?? "All",
    status:   params.get("status")   ?? "All",
    sort:     (params.get("sort")    as SortValue) ?? "popular",
  };
}

function areFiltersEqual(a: Filters, b: Filters): boolean {
  return (
    a.q === b.q &&
    a.category === b.category &&
    a.access === b.access &&
    a.status === b.status &&
    a.sort === b.sort
  );
}

function mapSeries(raw: RawTestSeries, index: number): TestSeriesItem {
  const [bannerFrom, bannerTo] = BANNER_GRADIENTS[index % BANNER_GRADIENTS.length];
  const price = raw.price ?? 0;
  const discountedPrice = raw.discountedPrice ?? price;
  const discountPercent = raw.isPaid && price > 0 ? Math.round((1 - discountedPrice / price) * 100) : 0;
  const category = raw.exam?.examCategory?.name ?? "";
  return {
    id: raw.id,
    title: raw.title ?? "",
    description: raw.description ?? "",
    examName: raw.exam?.name ?? "",
    examShortName: raw.exam?.shortName ?? "",
    examSlug: raw.exam?.id ?? "",
    boardId: raw.exam?.board?.id ?? "",
    boardName: raw.exam?.board?.name ?? raw.exam?.board?.shortName ?? "",
    stateName: raw.exam?.board?.state?.name ?? "",
    stateId: raw.exam?.board?.state?.id ?? null,
    examCategory: category,
    category,
    totalTests: raw.totalTests ?? 0,
    isPaid: raw.isPaid ?? false,
    isFeatured: raw.isFeatured ?? false,
    isTrending: raw.isTrending ?? false,
    price, discountedPrice, discountPercent,
    attempts: raw.attemptCount ?? 0,
    tags: [category].filter(Boolean),
    bannerFrom, bannerTo,
    tint: raw.exam?.board?.tint ?? "#2563EB",
  };
}

/* ─── Main Page ────────────────────────────────────────── */

function SeriesAllPageInner() {
  const router        = useRouter();
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const { user }      = useAuth();
  const sentinelRef   = useRef<HTMLDivElement | null>(null);

  const [series,       setSeries]       = useState<TestSeriesItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [bookmarks,    setBookmarks]    = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(9);
  const [filters,      setFilters]      = useState<Filters>(() => readFilters(searchParams));
  const [debouncedQ,   setDebouncedQ]   = useState(filters.q);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [authModal,    setAuthModal]    = useState<{ open: boolean; next: string }>({ open: false, next: "/dashboard" });

  const examFilter = useExamFilter({
    stateIds: parseIds(searchParams.get("stateIds"), Number),
    boardIds:  parseIds(searchParams.get("boardIds"),  String),
    examIds:   parseIds(searchParams.get("examIds"),   String),
  });

  const requireAuth = useCallback((href: string, e: React.MouseEvent) => {
    if (!user) { e.preventDefault(); setAuthModal({ open: true, next: href }); }
  }, [user]);

  useEffect(() => {
    try { const s = window.localStorage.getItem("en_series_bookmarks"); if (s) setBookmarks(new Set(JSON.parse(s))); }
    catch { setBookmarks(new Set()); }
  }, []);

  useEffect(() => {
    const next = readFilters(searchParams);
    setFilters((prev) => {
      if (areFiltersEqual(prev, next)) return prev;
      return next;
    });
    setDebouncedQ(next.q);
  }, [searchParams]);

  useEffect(() => { const t = window.setTimeout(() => setDebouncedQ(filters.q), 280); return () => window.clearTimeout(t); }, [filters.q]);
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
      setLoading(true); setError("");
      try {
        const res = await fetch(`${API_URL}/test-series?limit=100`);
        if (!res.ok) throw new Error("Could not load test series");
        const data = (await res.json()) as { items?: RawTestSeries[] };
        if (!cancelled) setSeries((data.items ?? []).map(mapSeries));
      } catch {
        if (!cancelled) {
          setError("Unable to load test series. Please check your connection and try again.");
          setSeries([]);
        }
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredSeries = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    const { selectedStateIds, selectedBoardIds, selectedExamIds } = examFilter;
    return series.filter((s) => {
      if (q && ![s.title, s.examName, s.description, s.category, s.boardName, s.stateName, ...s.tags].join(" ").toLowerCase().includes(q)) return false;
      if (filters.category !== "All" && s.category !== filters.category) return false;
      if (filters.access   !== "All" && (filters.access === "Free" ? s.isPaid : !s.isPaid)) return false;
      if (filters.status === "Trending" && !s.isTrending) return false;
      if (filters.status === "Featured" && !s.isFeatured) return false;
      // Cascading exam filter (multi-select)
      if (selectedExamIds.length  > 0 && !selectedExamIds.includes(s.examSlug))  return false;
      if (selectedBoardIds.length > 0 && !selectedBoardIds.includes(s.boardId))  return false;
      if (selectedStateIds.length > 0) {
        // Match by stateName via board → state lookup
        const board = examFilter.availableBoards.find(b => b.id === s.boardId);
        if (!board || !board.state || !selectedStateIds.includes(board.state.id)) {
          // Fallback: match by stateName string if API board lookup fails
          const stateNames = examFilter.allStates
            .filter(st => selectedStateIds.includes(st.id))
            .map(st => st.name);
          if (!stateNames.includes(s.stateName)) return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (filters.sort === "latest")    return 0;
      if (filters.sort === "tests")     return b.totalTests     - a.totalTests;
      if (filters.sort === "free")      return Number(a.isPaid) - Number(b.isPaid);
      if (filters.sort === "price_asc") return (a.isPaid ? a.discountedPrice : 0) - (b.isPaid ? b.discountedPrice : 0);
      if (b.isFeatured !== a.isFeatured) return Number(b.isFeatured) - Number(a.isFeatured);
      return b.attempts - a.attempts;
    });
  }, [debouncedQ, filters, series, examFilter]);

  useEffect(() => { setVisibleCount(9); }, [filteredSeries.length, filters]);
  useEffect(() => {
    const node = sentinelRef.current; if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleCount((c) => Math.min(c + 6, filteredSeries.length));
    }, { rootMargin: "400px" });
    obs.observe(node); return () => obs.disconnect();
  }, [filteredSeries.length]);

  const visibleSeries = filteredSeries.slice(0, visibleCount);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(series.map(s => s.category).filter(Boolean))).sort()],
    [series]
  );

  const stats = useMemo(() => ({
    total: series.length,
    tests: series.reduce((s, i) => s + i.totalTests, 0),
    exams: new Set(series.map((s) => s.examName)).size,
  }), [series]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }
  function resetFilters() {
    setFilters(defaultFilters);
    setDebouncedQ("");
    examFilter.resetExamFilter();
  }
  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      window.localStorage.setItem("en_series_bookmarks", JSON.stringify(Array.from(next)));
      return next;
    });
  }

  const activeFilterCount =
    Object.entries(filters).filter(([k, v]) => k !== "sort" && v && v !== defaultFilters[k as keyof Filters]).length +
    examFilter.examFilterCount;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── Hero — unchanged ─────────────────────────────── */}
      <HeroSection stats={stats} loading={loading} onRequireAuth={requireAuth} />

      {/* ── Listing section ──────────────────────────────── */}
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-6 items-start">

          {/* ── Left sidebar filters (desktop) ───────────── */}
          <FilterSidebar
            searchQuery={filters.q}
            onSearchChange={(v) => updateFilter("q", v)}
            activeFilterCount={activeFilterCount}
            onReset={resetFilters}
          >
            <FilterSection
              title="Category"
              selectedValue={filters.category}
              onSelect={(v) => updateFilter("category", String(v))}
              options={categories.map(c => ({ value: c, label: c }))}
            />
            <FilterSection
              title="Access"
              selectedValue={filters.access}
              onSelect={(v) => updateFilter("access", String(v))}
              options={["All", "Free", "Premium"].map(a => ({ value: a, label: a }))}
            />
            {/* ── Cascading State → Board → Exam filter ── */}
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

          {/* ── Right content ─────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Mobile search + filter row */}
            <div className="lg:hidden">
              <MobileFilterBar
                searchQuery={filters.q}
                onSearchChange={(v) => updateFilter("q", v)}
                activeFilterCount={activeFilterCount}
                onOpenMobileFilter={() => setMobileFilterOpen(true)}
              />
            </div>

            {/* Toolbar: count + sort */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                  <span className="font-bold" style={{ color: "var(--ink-1)" }}>{filteredSeries.length}</span> series found
                </p>
                {!loading && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--blue-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--blue)]">
                    <FileText size={10} /> {stats.total} total
                  </span>
                )}
              </div>
              <select
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value as SortValue)}
                className="h-9 rounded-[10px] border px-3 text-[12px] font-semibold outline-none transition"
                style={{ background: "var(--card)", borderColor: "var(--line-soft)", color: "var(--ink-2)" }}
              >
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Active filter chips */}
            <ActiveFilterChips
              filters={[
                ...Object.entries(filters)
                  .filter(([k, v]) => k !== "sort" && v && v !== defaultFilters[k as keyof Filters])
                  .map(([k, v]) => ({ key: k, value: String(v) })),
                ...examFilter.selectedStateIds.map(id => ({
                  key: `state:${id}`,
                  value: examFilter.allStates.find(s => s.id === id)?.name ?? String(id),
                })),
                ...examFilter.selectedBoardIds.map(id => ({
                  key: `board:${id}`,
                  value: examFilter.availableBoards.find(b => b.id === id)?.shortName ?? id,
                })),
                ...examFilter.selectedExamIds.map(id => ({
                  key: `exam:${id}`,
                  value: examFilter.availableExams.find(e => e.id === id)?.shortName ?? id,
                })),
              ]}
              onRemove={(key) => {
                if (key.startsWith("state:")) examFilter.toggleState(Number(key.slice(6)));
                else if (key.startsWith("board:")) examFilter.toggleBoard(key.slice(6));
                else if (key.startsWith("exam:"))  examFilter.toggleExam(key.slice(5));
                else updateFilter(key as keyof Filters, defaultFilters[key as keyof Filters]);
              }}
              onReset={resetFilters}
            />

            {error && (
              <div className="rounded-[14px] border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-[13px] font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                {error}
              </div>
            )}

            {/* Cards grid */}
            {loading ? (
              <LoadingGrid />
            ) : filteredSeries.length === 0 ? (
              <EmptyState onReset={resetFilters} />
            ) : (
              <>
                <motion.div
                  initial="hidden" animate="show"
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {visibleSeries.map((item) => (
                    <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                      <SeriesCard
                        series={item}
                        bookmarked={bookmarks.has(item.id)}
                        onBookmark={() => toggleBookmark(item.id)}
                        onRequireAuth={requireAuth}
                      />
                    </motion.div>
                  ))}
                </motion.div>
                <div ref={sentinelRef} className="h-4" />
                {visibleCount < filteredSeries.length && (
                  <div className="flex justify-center mt-2">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + 9)}
                      className="inline-flex h-11 items-center gap-2 rounded-[14px] border-2 px-6 text-[13px] font-semibold transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
                      style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}
                    >
                      Load {Math.min(9, filteredSeries.length - visibleCount)} more series
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── SEO section — real links for crawlability ────── */}
      <SeoSection />

      {/* ── Mobile filter drawer ─────────────────────────── */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
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
                <button onClick={() => setMobileFilterOpen(false)} className="rounded-full p-2 bg-[var(--card)] border border-[var(--line-soft)] text-[var(--ink-2)]">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 pb-20 [scrollbar-width:none]">
                <div className="flex flex-col gap-4">
                  <FilterSection
                    title="Category"
                    selectedValue={filters.category}
                    onSelect={(v) => updateFilter("category", String(v))}
                    options={categories.map(c => ({ value: c, label: c }))}
                  />
                  <FilterSection
                    title="Access"
                    selectedValue={filters.access}
                    onSelect={(v) => updateFilter("access", String(v))}
                    options={["All", "Free", "Premium"].map(a => ({ value: a, label: a }))}
                  />
                  {/* ── Cascading State → Board → Exam filter ── */}
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

      {authModal.open && (
        <AuthModal onClose={() => setAuthModal({ open: false, next: "/dashboard" })} next={authModal.next} />
      )}
    </main>
  );
}

/* ─── Hero Section ───────────────────────────────────────── */

function HeroSection({ stats, loading, onRequireAuth }: {
  stats: { total: number; tests: number; exams: number };
  loading: boolean;
  onRequireAuth: (href: string, e: React.MouseEvent) => void;
}) {
  return (
    <section style={{ background: "var(--card)", borderBottom: "1px solid var(--line-soft)" }}>
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-[11px] font-normal uppercase mb-5" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px", color: "var(--ink-3)" }}>
            Test Series Marketplace
          </p>
          <h1 className="max-w-2xl text-[36px] sm:text-[48px] lg:text-[52px] leading-[1.10]" style={{ fontWeight: 300, letterSpacing: "-0.96px", color: "var(--ink-1)" }}>
            Practice Smarter,<br />Rank Higher
          </h1>

          {/* Count badges */}
          {!loading && stats.total > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ background: "var(--blue-soft)", borderColor: "transparent", color: "var(--blue)" }}>
                <FileText size={11} /> {stats.total} Series
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ background: "rgba(59,170,111,0.1)", borderColor: "transparent", color: "var(--green)" }}>
                <GraduationCap size={11} /> {stats.exams} Exams
              </span>
            </div>
          )}

          <p className="mt-5 max-w-xl text-[17px] leading-[1.45]" style={{ fontWeight: 300, letterSpacing: "-0.26px", color: "var(--ink-3)" }}>
            Full-length mock tests for SSC, Banking, Railway, State PSC, Police, Teaching &amp; more — with CBT interface, live timer &amp; AI analytics.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard/series"
              onClick={(e) => onRequireAuth("/dashboard/series", e)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-[15px] transition-opacity hover:opacity-85"
              style={{ background: "var(--ink-1)", fontWeight: 480, letterSpacing: "-0.10px" }}
            >
              My Series <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard/plans"
              onClick={(e) => onRequireAuth("/dashboard/plans", e)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] transition-colors hover:bg-[var(--surface-hover)]"
              style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-1)", fontWeight: 480, letterSpacing: "-0.10px" }}
            >
              View Plans
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: BookOpen,      label: "Test Series",   value: loading ? "—" : `${stats.total}`      },
            { icon: FileText,      label: "Mock Tests",    value: loading ? "—" : `${stats.tests}`      },
            { icon: GraduationCap, label: "Exams Covered", value: loading ? "—" : `${stats.exams}`     },
            { icon: Users,         label: "Students",      value: "Growing"                             },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-[16px] border p-5 transition-colors hover:border-[var(--ink-1)]" style={{ background: "var(--bg-secondary)", borderColor: "var(--line-soft)" }}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[8px] text-white" style={{ background: "var(--ink-1)" }}>
                <Icon size={18} />
              </div>
              <p className="text-[28px] font-black tracking-tight leading-none tabular-nums" style={{ color: "var(--ink-1)" }}>{value}</p>
              <p className="mt-1.5 text-[11px] font-normal uppercase" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px", color: "var(--ink-3)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Series Card ────────────────────────────────────────── */

function SeriesCard({ series: s, bookmarked, onBookmark, onRequireAuth }: {
  series: TestSeriesItem;
  bookmarked: boolean;
  onBookmark: () => void;
  onRequireAuth?: (href: string, e: React.MouseEvent) => void;
}) {
  return (
    <article
      className="flex flex-col overflow-hidden rounded-[16px] border transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--blue)]"
      style={{ background: "var(--card)", borderColor: "var(--line-soft)", boxShadow: "var(--shadow-xs, 0 1px 4px rgba(0,0,0,.05))" }}
    >
      {/* Gradient banner */}
      <div
        className="relative h-[140px] flex items-end p-4"
        style={{ background: `linear-gradient(135deg, ${s.bannerFrom}, ${s.bannerTo})` }}
      >
        <p className="text-white font-bold text-[22px] leading-tight opacity-95 drop-shadow-sm line-clamp-2 pr-8">
          {s.examShortName || s.examName?.split(" ").slice(0, 2).join(" ")}
        </p>

        {/* FREE badge — top-left */}
        {!s.isPaid && (
          <span className="absolute top-3 left-3 rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5">
            FREE
          </span>
        )}

        {/* Status badge — top-right */}
        {(s.isFeatured || s.isTrending) && (
          <span className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[10px] font-semibold px-2.5 py-0.5">
            {s.isFeatured ? "Best Seller" : "Trending"}
          </span>
        )}

        {/* Tests count — bottom-right */}
        <span className="absolute bottom-3 right-3 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5">
          {s.totalTests} tests
        </span>

        {/* Bookmark — bottom-right alt */}
        <button
          type="button"
          onClick={onBookmark}
          className="absolute top-3 right-3 hidden"
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark series"}
        />
      </div>

      {/* Card content */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <p className="text-[11px] font-medium" style={{ color: "var(--ink-3)" }}>
          {s.category} · {s.examName}
        </p>
        <h3 className="text-[13px] font-semibold leading-snug line-clamp-2" style={{ color: "var(--ink-1)" }}>
          {s.title}
        </h3>
        <p className="text-[12px] leading-relaxed line-clamp-2 mt-0.5" style={{ color: "var(--ink-4)" }}>
          {s.description}
        </p>

        <div className="flex-1" />

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-1.5">
          {s.isPaid ? (
            <>
              <span className="text-[16px] font-black leading-none" style={{ color: "var(--ink-1)" }}>₹{s.discountedPrice}</span>
              <span className="text-[12px] line-through" style={{ color: "var(--ink-4)" }}>₹{s.price}</span>
              <span className="text-[10px] font-semibold" style={{ color: "var(--green)" }}>{s.discountPercent}% off</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-[13px] font-bold" style={{ color: "var(--green)" }}>
              <Zap size={12} /> FREE
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {s.isPaid ? (
            <Link
              href={`/dashboard/checkout/TEST_SERIES:${s.id}?title=${encodeURIComponent(s.title)}&days=365`}
              onClick={(e) => onRequireAuth?.(`/dashboard/checkout/TEST_SERIES:${s.id}?title=${encodeURIComponent(s.title)}&days=365`, e)}
              className="flex flex-1 items-center justify-center py-2 rounded-full border text-[12px] font-semibold transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
              style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}
            >
              Buy Now
            </Link>
          ) : (
            <span
              className="flex flex-1 items-center justify-center py-2 rounded-full border text-[12px] font-medium"
              style={{ borderColor: "var(--line)", color: "var(--ink-4)" }}
            >
              Free Access
            </span>
          )}
          <Link
            href={`/series/${s.id}`}
            className="flex flex-1 items-center justify-center gap-1 py-2 rounded-full text-[12px] font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: "var(--ink-1)" }}
          >
            Explore <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ─── SEO section — all links are real <a>/<Link> ───────── */

function SeoSection() {
  return (
    <section
      className="border-t py-12"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--line-soft)" }}
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: "var(--blue)" }}>Popular Searches</p>
        <h2 className="text-xl font-black mb-6" style={{ color: "var(--ink-1)" }}>Latest test series by exam</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SEO_GROUPS.map((group) => (
            <div key={group.title} className="rounded-[14px] border p-4" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: "var(--ink-1)" }}>{group.title}</h3>
              <div className="flex flex-wrap gap-1.5">
                {group.links.map(([label, query]) => (
                  <Link
                    key={label}
                    href={`/series/all?q=${encodeURIComponent(query)}`}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
                    style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-6 rounded-[14px] border p-5" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
          <h3 className="text-[14px] font-bold mb-4" style={{ color: "var(--ink-1)" }}>Frequently asked questions</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Why attempt mock tests?", "Mocks build speed, accuracy, exam-day stamina, and decision-making under pressure."],
              ["Are free tests available?", "Yes — free series have a FREE badge and can be started instantly without payment."],
              ["How do I track performance?", "Dashboard analytics show weak areas, attempts, rank insights, and score trends."],
              ["What does Premium include?", "All series, AI analytics, detailed solutions, re-attempt mode, and rank prediction."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-[10px] p-3" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>{q}</p>
                <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--ink-4)" }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



/* ─── Loading & Empty ────────────────────────────────────── */

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-[16px] border" style={{ borderColor: "var(--line-soft)" }}>
          <div className="h-[140px] animate-pulse" style={{ background: "var(--bg-secondary)" }} />
          <div className="p-4 flex flex-col gap-2.5">
            <div className="h-3 w-24 rounded-full animate-pulse" style={{ background: "var(--bg-secondary)" }} />
            <div className="h-4 w-full rounded-full animate-pulse" style={{ background: "var(--bg-secondary)" }} />
            <div className="h-3 w-3/4 rounded-full animate-pulse" style={{ background: "var(--bg-secondary)" }} />
            <div className="h-8 w-20 rounded-full animate-pulse mt-2" style={{ background: "var(--bg-secondary)" }} />
            <div className="flex gap-2 mt-1">
              <div className="h-9 flex-1 rounded-full animate-pulse" style={{ background: "var(--bg-secondary)" }} />
              <div className="h-9 flex-1 rounded-full animate-pulse" style={{ background: "var(--bg-secondary)" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed py-16 text-center"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}>
      <FileText size={40} className="mb-4 opacity-25" style={{ color: "var(--ink-3)" }} />
      <h3 className="text-[16px] font-semibold" style={{ color: "var(--ink-1)" }}>No series found</h3>
      <p className="mt-1.5 text-[13px] max-w-xs" style={{ color: "var(--ink-4)" }}>Try removing some filters or broadening your search.</p>
      <button type="button" onClick={onReset}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-[12px] px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
        style={{ background: "var(--blue)" }}>
        <RotateCcw size={14} /> Reset filters
      </button>
    </div>
  );
}

/* ─── Page export ────────────────────────────────────────── */

export default function AllSeriesPage() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <SeriesAllPageInner />
    </Suspense>
  );
}
