"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/lib/auth-context";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgePercent,
  BookOpen,
  BookOpenCheck,
  Bookmark,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  Flame,
  GraduationCap,
  LayoutGrid,
  List,
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const CATEGORIES = ["State PSC", "Banking", "SSC", "Railway", "Police", "Teaching", "UPSC"];
const LANGUAGES = ["English", "Hindi", "Bilingual"];
const DIFFICULTIES: SeriesDifficulty[] = ["Foundation", "Moderate", "Advanced"];
const SORTS = [
  { value: "popular", label: "Most Popular" },
  { value: "latest", label: "Newest First" },
  { value: "tests", label: "Most Tests" },
  { value: "rated", label: "Highest Rated" },
  { value: "free", label: "Free First" },
  { value: "price_asc", label: "Lowest Price" },
  { value: "price_desc", label: "Highest Price" },
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

const CATEGORY_DISCOVERY = [
  { name: "SSC", category: "SSC", count: 42, icon: FileText, gradient: "from-blue-600 to-cyan-500" },
  { name: "Banking", category: "Banking", count: 88, icon: ShieldCheck, gradient: "from-emerald-600 to-teal-400" },
  { name: "State PSC", category: "State PSC", count: 126, icon: GraduationCap, gradient: "from-violet-600 to-fuchsia-400" },
  { name: "Railway", category: "Railway", count: 39, icon: TrendingUp, gradient: "from-amber-500 to-orange-500" },
  { name: "Police", category: "Police", count: 57, icon: Target, gradient: "from-rose-600 to-pink-400" },
  { name: "Teaching", category: "Teaching", count: 61, icon: BookOpenCheck, gradient: "from-sky-600 to-blue-400" },
  { name: "UPSC", category: "UPSC", count: 24, icon: Trophy, gradient: "from-indigo-600 to-violet-400" },
];

const SEO_GROUPS = [
  { title: "Popular SSC Test Series", links: ["SSC CGL", "SSC CHSL", "SSC MTS", "SSC GD"] },
  { title: "Popular Banking Series", links: ["SBI PO", "IBPS PO", "IBPS Clerk", "RBI Grade B"] },
  { title: "State PSC Series", links: ["JPSC Prelims", "BPSC", "UPPSC", "MPSC"] },
  { title: "Railway & Police", links: ["RRB NTPC", "RRB Group D", "UP Police", "Railway ALP"] },
];

// Map backend board IDs → display category labels
const BOARD_TO_CATEGORY: Record<string, string> = {
  "ssc-cgl": "SSC", "ssc-chsl": "SSC",
  "ibps-po": "Banking", "ibps-clerk": "Banking",
  "state-psc": "State PSC",
  "railway-ntpc": "Railway", "railway-grpd": "Railway",
  "police-si": "Police", "state-police": "Police",
  "army-gd": "Defence",
  "upsc-cse": "UPSC",
};

type SortValue = (typeof SORTS)[number]["value"];
type SeriesDifficulty = "Foundation" | "Moderate" | "Advanced";

interface RawTestSeries {
  id: string;
  title: string;
  description?: string;
  totalTests?: number;
  tierRequired?: number;
  isPaid?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  bannerUrl?: string;
  price?: number;
  discountedPrice?: number;
  attemptCount?: number;
  isTrending?: boolean;
  exam?: {
    id?: string;
    name?: string;
    shortName?: string;
    tier?: number;
    isFeatured?: boolean;
    board?: {
      id?: string;
      name?: string;
      shortName?: string;
      tint?: string;
      colorSoft?: string;
      state?: { id?: number; name?: string };
    };
    examCategory?: { id?: number; name?: string };
  };
}

interface TestSeriesItem {
  id: string;
  title: string;
  description: string;
  examName: string;
  examShortName: string;
  examSlug: string;
  boardId: string;
  boardName: string;
  category: string;
  stateName: string;
  examCategory: string;
  totalTests: number;
  fullMocks: number;
  sectionalTests: number;
  pyqTests: number;
  duration: number;
  language: string;
  difficulty: SeriesDifficulty;
  isPaid: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isTrending: boolean;
  price: number;
  discountedPrice: number;
  discountPercent: number;
  attempts: number;
  rating: number;
  learners: number;
  tags: string[];
  bannerGradient: string;
  tint: string;
}

interface Filters {
  q: string;
  category: string;
  boardId: string;
  stateName: string;
  exam: string;
  access: string;
  status: string;
  sort: SortValue;
}

const defaultFilters: Filters = {
  q: "",
  category: "All",
  boardId: "All",
  stateName: "All",
  exam: "All",
  access: "All",
  status: "All",
  sort: "popular",
};

function readFilters(params: URLSearchParams): Filters {
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "All",
    boardId: params.get("boardId") ?? "All",
    stateName: params.get("stateName") ?? "All",
    exam: params.get("exam") ?? "All",
    access: params.get("access") ?? "All",
    status: params.get("status") ?? "All",
    sort: (params.get("sort") as SortValue) ?? "popular",
  };
}

function seedFrom(text: string) {
  return text.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function normalizeSeries(raw: RawTestSeries, index: number): TestSeriesItem {
  const seed = seedFrom(raw.id || raw.title || String(index));
  const examName = raw.exam?.name || "ExamNurture Exam";
  const totalTests = raw.totalTests ?? 12 + (seed % 28);
  const boardId = raw.exam?.board?.id || "";
  const boardName = raw.exam?.board?.name || raw.exam?.board?.shortName || "";
  const stateName = raw.exam?.board?.state?.name || "";
  const examCategory = raw.exam?.examCategory?.name || "";
  const category = BOARD_TO_CATEGORY[boardId] || examCategory || CATEGORIES[seed % CATEGORIES.length];
  const tint = raw.exam?.board?.tint || "#2563EB";
  const price = raw.price ?? 499 + (seed % 6) * 100;
  const discountedPrice = raw.discountedPrice ?? Math.max(199, Math.round(price * (0.35 + (seed % 4) * 0.1)));
  const discountPercent = raw.isPaid && price > 0 ? Math.round((1 - discountedPrice / price) * 100) : 0;
  const isTrending = raw.isTrending ?? raw.isFeatured ?? index < 6;
  const isNew = index < 3 || seed % 7 === 0;
  return {
    id: raw.id,
    title: raw.title || `${examName} Complete Test Series`,
    description: raw.description || "Full-length CBT-style mocks, sectional practice, analytics & solutions.",
    examName,
    examShortName: raw.exam?.shortName || examName.split(" ").map((w) => w[0]).join("").slice(0, 6),
    examSlug: raw.exam?.id || examName.toLowerCase().replace(/\s+/g, "-"),
    boardId,
    boardName,
    category,
    stateName,
    examCategory,
    totalTests,
    fullMocks: Math.max(2, Math.round(totalTests * 0.45)),
    sectionalTests: Math.max(2, Math.round(totalTests * 0.35)),
    pyqTests: Math.max(1, Math.round(totalTests * 0.2)),
    duration: 30 + (seed % 5) * 30,
    language: LANGUAGES[seed % LANGUAGES.length],
    difficulty: DIFFICULTIES[seed % DIFFICULTIES.length],
    isPaid: raw.isPaid ?? seed % 3 !== 0,
    isFeatured: raw.isFeatured ?? index < 4,
    isNew,
    isTrending,
    price,
    discountedPrice,
    discountPercent,
    attempts: raw.attemptCount ?? 0,
    rating: Number((4.4 + (seed % 6) / 10).toFixed(1)),
    learners: 800 + seed * 11,
    tags: [category, totalTests > 20 ? "Mega Pack" : "Focused Pack"],
    bannerGradient: BANNER_GRADIENTS[seed % BANNER_GRADIENTS.length],
    tint,
  };
}

function fallbackSeries(): TestSeriesItem[] {
  return [
    { id: "demo-1", title: "JPSC Prelims Complete Test Series 2026", isPaid: true, price: 699, discountedPrice: 399, exam: { id: "jpsc", name: "JPSC Prelims", shortName: "JPSC", board: { id: "state-psc" } } },
    { id: "demo-2", title: "SSC CGL Tier 1 2026 Mega Test Series", isPaid: true, price: 799, discountedPrice: 449, exam: { id: "ssc-cgl", name: "SSC CGL", shortName: "CGL", board: { id: "ssc-cgl" } } },
    { id: "demo-3", title: "SBI PO Prelims 2026 Test Series", isPaid: false, exam: { id: "sbi-po", name: "SBI PO", shortName: "SBI PO", board: { id: "ibps-po" } } },
    { id: "demo-4", title: "RRB NTPC CBT-1 2025 Test Series", isPaid: true, price: 599, discountedPrice: 299, exam: { id: "rrb-ntpc", name: "Railway NTPC", shortName: "NTPC", board: { id: "railway-ntpc" } } },
  ].map((raw, i) => normalizeSeries(raw as RawTestSeries, i));
}

/* ─── Main Page Component ────────────────────────────── */

function SeriesAllPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [series, setSeries] = useState<TestSeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(9);
  const [filters, setFilters] = useState<Filters>(() => readFilters(searchParams));
  const [debouncedQ, setDebouncedQ] = useState(filters.q);
  const [authModal, setAuthModal] = useState<{ open: boolean; next: string }>({ open: false, next: "/dashboard" });

  const requireAuth = useCallback((href: string, e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setAuthModal({ open: true, next: href });
    }
  }, [user]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("en_series_bookmarks");
      if (saved) setBookmarks(new Set(JSON.parse(saved) as string[]));
    } catch { setBookmarks(new Set()); }
  }, []);

  useEffect(() => {
    const next = readFilters(searchParams);
    setFilters(next);
    setDebouncedQ(next.q);
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
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedQ, filters, pathname, router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/test-series?limit=100`);
        if (!res.ok) throw new Error("Could not load test series");
        const data = (await res.json()) as { items?: RawTestSeries[] };
        if (!cancelled) {
          const normalized = (data.items?.length ? data.items : fallbackSeries()).map(normalizeSeries);
          setSeries(normalized);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setSeries(fallbackSeries());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const states = useMemo(() => ["All", ...Array.from(new Set(series.map((s) => s.stateName).filter(Boolean))).sort()], [series]);
  const boards = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    series.forEach((s) => { if (s.boardId) seen.set(s.boardId, { id: s.boardId, name: s.boardName }); });
    return [{ id: "All", name: "All" }, ...Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))];
  }, [series]);

  const filteredSeries = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    const result = series.filter((s) => {
      if (q && ![s.title, s.examName, s.description, s.category, s.boardName, s.stateName, ...s.tags].join(" ").toLowerCase().includes(q)) return false;
      if (filters.category !== "All" && s.category !== filters.category) return false;
      if (filters.boardId !== "All" && s.boardId !== filters.boardId) return false;
      if (filters.stateName !== "All" && s.stateName !== filters.stateName) return false;
      if (filters.exam !== "All" && s.examName !== filters.exam) return false;
      if (filters.access !== "All" && (filters.access === "Free" ? s.isPaid : !s.isPaid)) return false;
      if (filters.status === "Trending" && !s.isTrending) return false;
      if (filters.status === "New" && !s.isNew) return false;
      if (filters.status === "Featured" && !s.isFeatured) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (filters.sort === "latest") return Number(b.isNew) - Number(a.isNew);
      if (filters.sort === "tests") return b.totalTests - a.totalTests;
      if (filters.sort === "rated") return b.rating - a.rating;
      if (filters.sort === "free") return Number(a.isPaid) - Number(b.isPaid);
      if (filters.sort === "price_asc") return (a.isPaid ? a.discountedPrice : 0) - (b.isPaid ? b.discountedPrice : 0);
      if (filters.sort === "price_desc") return (b.isPaid ? b.discountedPrice : 0) - (a.isPaid ? a.discountedPrice : 0);
      if (b.isFeatured !== a.isFeatured) return Number(b.isFeatured) - Number(a.isFeatured);
      return b.attempts - a.attempts;
    });
  }, [debouncedQ, filters, series]);

  useEffect(() => { setVisibleCount(9); }, [filteredSeries.length, filters]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleCount((c) => Math.min(c + 6, filteredSeries.length));
    }, { rootMargin: "400px" });
    obs.observe(node);
    return () => obs.disconnect();
  }, [filteredSeries.length]);

  const visibleSeries = filteredSeries.slice(0, visibleCount);
  const stats = useMemo(() => ({
    total: series.length,
    tests: series.reduce((s, i) => s + i.totalTests, 0),
    learners: series.reduce((s, i) => s + i.learners, 0),
    exams: new Set(series.map((s) => s.examName)).size,
  }), [series]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }
  function resetFilters() { setFilters(defaultFilters); setDebouncedQ(""); }
  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      window.localStorage.setItem("en_series_bookmarks", JSON.stringify(Array.from(next)));
      return next;
    });
  }

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== "sort" && v && v !== defaultFilters[k as keyof Filters]).length;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── Hero ────────────────────────────────────────── */}
      <HeroSection stats={stats} onRequireAuth={requireAuth} />

      {/* ── Trending + Category Discovery ───────────────── */}
      <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-8">
        <TrendingCarousel series={series.filter((s) => s.isTrending).slice(0, 10)} />
        <CategoryDiscoveryGrid
          series={series}
          onSelectCategory={(v) => updateFilter("category", v)}
          activeCategory={filters.category}
        />
      </div>

      {/* ── Unified search + listing section ────────────── */}
      <div className="border-y border-slate-200 bg-slate-50 dark:border-white/8 dark:bg-slate-950">
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">

          {/* Full-width search bar */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-blue-400 focus-within:shadow-md dark:border-white/10 dark:bg-slate-900">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              value={filters.q}
              onChange={(e) => updateFilter("q", e.target.value)}
              placeholder="Search test series by name, exam or category…"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white"
            />
            {filters.q && (
              <button type="button" onClick={() => updateFilter("q", "")} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-400">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sticky toolbar */}
          <div className="sticky top-14 z-20 mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/95 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/95">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950 dark:text-white">
                <span className="text-blue-600">{filteredSeries.length}</span> series found
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value as SortValue)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className="relative inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  <Filter className="h-3.5 w-3.5" /> Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {/* View toggle */}
                <div className="flex h-9 items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    title="Card view"
                    className={`flex h-full w-9 items-center justify-center transition ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"}`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    title="List view"
                    className={`flex h-full w-9 items-center justify-center transition ${viewMode === "list" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"}`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <FilterChips filters={filters} onChange={updateFilter} onReset={resetFilters} />
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              {error} — showing sample data.
            </div>
          )}

          {/* Grid / List */}
          <div className="mt-5">
            {loading ? (
              <LoadingGrid />
            ) : filteredSeries.length === 0 ? (
              <EmptyState onReset={resetFilters} />
            ) : (
              <>
                {viewMode === "grid" ? (
                  <motion.div
                    initial="hidden" animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  >
                    {visibleSeries.map((item) => (
                      <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
                        <SeriesCard series={item} bookmarked={bookmarks.has(item.id)} onBookmark={() => toggleBookmark(item.id)} onRequireAuth={requireAuth} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial="hidden" animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
                    className="flex flex-col gap-2"
                  >
                    {visibleSeries.map((item) => (
                      <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                        <SeriesRow series={item} bookmarked={bookmarks.has(item.id)} onBookmark={() => toggleBookmark(item.id)} onRequireAuth={requireAuth} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                <div ref={sentinelRef} className="h-4" />
                {visibleCount < filteredSeries.length && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + 9)}
                      className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-blue-200 bg-white px-6 text-sm font-black text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
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

      {/* ── SEO Footer Band ──────────────────────────────── */}
      <SeoSection onSelect={(v) => updateFilter("q", v)} />

      {/* ── Right-slide Filter Drawer ────────────────────── */}
      <FilterDrawer
        open={filterOpen}
        filters={filters}
        boards={boards}
        states={states}
        resultCount={filteredSeries.length}
        onChange={updateFilter}
        onReset={resetFilters}
        onClose={() => setFilterOpen(false)}
      />

      {/* ── Auth Modal ───────────────────────────────────── */}
      {authModal.open && (
        <AuthModal
          onClose={() => setAuthModal({ open: false, next: "/dashboard" })}
          next={authModal.next}
        />
      )}

      {/* ── Sticky mobile bottom bar ─────────────────────── */}
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
            href="/series/all"
            className="flex h-12 flex-[1.6] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-black text-white shadow-lg shadow-blue-600/25"
          >
            Browse All <Play className="h-3.5 w-3.5 fill-white" />
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ─── Hero Section ───────────────────────────────────── */

function HeroSection({ stats, onRequireAuth }: {
  stats: { total: number; tests: number; learners: number; exams: number };
  onRequireAuth: (href: string, e: React.MouseEvent) => void;
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-blue-50/40 to-white dark:border-white/10 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-cyan-500/8 blur-3xl" />

      <div className="relative mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
        {/* Left */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
            <BookOpen className="h-3 w-3" /> Test Series Marketplace
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08] dark:text-white">
            Practice Smarter,<br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Rank Higher</span>
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
            Full-length mock tests for SSC, Banking, Railway, State PSC, Police, Teaching & more — with CBT interface, live timer & AI analytics.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard/series"
              onClick={(e) => onRequireAuth("/dashboard/series", e)}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
            >
              My Series <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/plans"
              onClick={(e) => onRequireAuth("/dashboard/plans", e)}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-white/8 dark:text-white"
            >
              View Plans
            </Link>
          </div>
        </motion.div>

        {/* Right — stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="grid grid-cols-2 gap-4"
        >
          <StatCard icon={BookOpen} label="Test Series" value={`${Math.max(stats.total, 18)}+`} gradient="from-blue-500 to-blue-600" />
          <StatCard icon={FileText} label="Mock Tests" value={`${Math.max(stats.tests, 220)}+`} gradient="from-emerald-500 to-emerald-600" />
          <StatCard icon={Users} label="Learners" value={`${Math.max(Math.round(stats.learners / 1000), 240)}k+`} gradient="from-violet-500 to-violet-600" />
          <StatCard icon={GraduationCap} label="Exams Covered" value={`${Math.max(stats.exams, 8)}+`} gradient="from-amber-500 to-amber-600" />
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value, gradient }: { icon: React.ElementType; label: string; value: string; gradient: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/70 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

/* ─── Trending Carousel ──────────────────────────────── */

function TrendingCarousel({ series }: { series: TestSeriesItem[] }) {
  const BADGE_CONFIG = [
    { label: "Best Seller", color: "bg-amber-500 text-white" },
    { label: "Trending", color: "bg-rose-500 text-white" },
    { label: "Topper Pick", color: "bg-blue-600 text-white" },
    { label: "Recommended", color: "bg-emerald-600 text-white" },
  ];

  return (
    <section className="mb-6 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-amber-600">Hot This Week</p>
          <h2 className="mt-0.5 text-xl font-black text-slate-950 dark:text-white">Trending & Most Attempted</h2>
        </div>
        <Flame className="h-6 w-6 text-amber-500" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
        {(series.length ? series : fallbackSeries().slice(0, 4)).map((item, i) => {
          const badge = BADGE_CONFIG[i % BADGE_CONFIG.length];
          return (
            <div
              key={item.id}
              className="flex min-w-[240px] max-w-[260px] shrink-0 flex-col gap-2 rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg dark:border-white/8 dark:from-slate-800/50 dark:to-slate-900/50"
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${badge.color}`}>
                  <Flame className="h-2.5 w-2.5" /> {badge.label}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{item.totalTests} tests</span>
              </div>
              <h3 className="line-clamp-2 text-sm font-black leading-snug text-slate-950 dark:text-white">{item.title}</h3>
              <div className="mt-auto flex items-center gap-3 text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1"><Users className="h-3 w-3 text-blue-500" />{(item.learners / 1000).toFixed(0)}k</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{item.rating}</span>
                <span className="ml-auto">{item.isPaid ? `₹${item.discountedPrice}` : "Free"}</span>
              </div>
              <Link
                href={`/series/${item.id}`}
                className="mt-1 inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-blue-700"
              >
                View <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Category Discovery Grid (dynamic counts) ───────── */

function CategoryDiscoveryGrid({ series, onSelectCategory, activeCategory }: {
  series: TestSeriesItem[];
  onSelectCategory: (v: string) => void;
  activeCategory: string;
}) {
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    series.forEach((s) => {
      if (s.category) counts.set(s.category, (counts.get(s.category) || 0) + 1);
    });
    return counts;
  }, [series]);

  const items = CATEGORY_DISCOVERY.map((item) => ({
    ...item,
    count: categoryCounts.get(item.category) ?? item.count,
    hasData: categoryCounts.has(item.category),
  }));

  return (
    <section className="mb-6 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">Browse by Category</p>
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Popular Competitive Exam Categories</h2>
        </div>
        <Link href="/exams" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">
          View all exams <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeCategory === item.category;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelectCategory(isActive ? "All" : item.category)}
              className={`group flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-1 ${
                isActive
                  ? "border-blue-300 bg-blue-50 shadow-lg shadow-blue-900/10 dark:border-blue-500/40 dark:bg-blue-500/15"
                  : "border-slate-100 bg-slate-50/50 hover:border-blue-200 hover:bg-white hover:shadow-lg dark:border-white/8 dark:bg-white/4"
              }`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-md`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-xs font-black ${isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-white"}`}>{item.name}</p>
                <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                  {item.hasData ? `${item.count} series` : `${item.count}+ series`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Series Card (grid view) ────────────────────────── */

function SeriesCard({ series: s, bookmarked, onBookmark, onRequireAuth }: { series: TestSeriesItem; bookmarked: boolean; onBookmark: () => void; onRequireAuth?: (href: string, e: React.MouseEvent) => void }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:border-white/8 dark:bg-slate-900">
      {/* Gradient banner */}
      <div className={`relative h-[72px] bg-gradient-to-br ${s.bannerGradient} overflow-hidden`}>
        <div className="absolute bottom-2 left-3 flex gap-1.5">
          {s.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-sm">
              <Trophy className="h-2.5 w-2.5" /> Best Seller
            </span>
          )}
          {s.isTrending && !s.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-sm">
              <Flame className="h-2.5 w-2.5" /> Trending
            </span>
          )}
          {s.isNew && (
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-sm">New</span>
          )}
        </div>
        <div className="absolute right-3 top-2.5">
          <span className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-black tracking-wider text-white backdrop-blur-sm">
            {s.examShortName}
          </span>
        </div>
        <button
          type="button"
          onClick={onBookmark}
          className={`absolute left-3 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur-sm transition ${bookmarked ? "bg-white/40 text-white" : "bg-white/20 text-white/80 hover:bg-white/35"}`}
        >
          <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-white" : ""}`} />
        </button>
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[15px] font-black leading-snug text-slate-950 group-hover:text-blue-700 dark:text-white">
          {s.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
          {s.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Tag>{s.fullMocks} Full Mocks</Tag>
          <Tag>{s.sectionalTests} Sectionals</Tag>
          <Tag>{s.pyqTests} PYQs</Tag>
          <Tag tone={s.difficulty === "Advanced" ? "red" : s.difficulty === "Moderate" ? "amber" : "green"}>{s.difficulty}</Tag>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/4">
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <Users className="h-3 w-3 text-blue-500" />{(s.learners / 1000).toFixed(0)}k learners
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{s.rating}
          </span>
          <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <Clock3 className="h-3 w-3" />{s.duration}m
          </span>
        </div>

        <div className="mt-auto pt-4">
          <div className="mb-3 flex items-end gap-2">
            {s.isPaid ? (
              <>
                <span className="text-xl font-black text-slate-950 dark:text-white">₹{s.discountedPrice}</span>
                <span className="mb-0.5 text-sm font-bold text-slate-400 line-through">₹{s.price}</span>
                <span className="mb-0.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <BadgePercent className="h-2.5 w-2.5" />{s.discountPercent}% OFF
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Zap className="h-3.5 w-3.5" /> Free
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {s.isPaid ? (
              <>
                <Link
                  href={`/dashboard/checkout/TEST_SERIES:${s.id}?title=${encodeURIComponent(s.title)}&days=365`}
                  onClick={(e) => onRequireAuth?.(`/dashboard/checkout/TEST_SERIES:${s.id}?title=${encodeURIComponent(s.title)}&days=365`, e)}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-sm font-black text-white shadow-md shadow-blue-600/20 transition hover:brightness-105 active:scale-[0.98]"
                >
                  Buy Now
                </Link>
                <Link
                  href={`/series/${s.id}`}
                  className="flex h-11 items-center justify-center rounded-xl border-2 border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-200"
                >
                  Details
                </Link>
              </>
            ) : (
              <Link
                href={`/series/${s.id}`}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-sm font-black text-white shadow-md shadow-emerald-600/20 transition hover:brightness-105"
              >
                <Play className="h-3.5 w-3.5 fill-white" /> Start Free
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── Series Row (list view) ─────────────────────────── */

function SeriesRow({ series: s, bookmarked, onBookmark, onRequireAuth }: { series: TestSeriesItem; bookmarked: boolean; onBookmark: () => void; onRequireAuth?: (href: string, e: React.MouseEvent) => void }) {
  return (
    <article className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-white/8 dark:bg-slate-900">
      <div className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${s.bannerGradient} flex items-center justify-center`}>
        <span className="text-[9px] font-black tracking-wide text-white">{s.examShortName}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="truncate text-sm font-black text-slate-950 group-hover:text-blue-700 dark:text-white">{s.title}</h3>
          {s.isFeatured && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">Best Seller</span>}
          {s.isTrending && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-black text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">Trending</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
          <span>{s.totalTests} tests</span>
          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{s.rating}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3 text-blue-500" />{(s.learners / 1000).toFixed(0)}k learners</span>
          <span>{s.difficulty}</span>
          <span>{s.language}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {s.isPaid ? (
          <div className="hidden text-right sm:block">
            <p className="text-base font-black text-slate-950 dark:text-white">₹{s.discountedPrice}</p>
            <p className="text-xs font-bold text-slate-400 line-through">₹{s.price}</p>
          </div>
        ) : (
          <span className="hidden text-sm font-black text-emerald-600 sm:block">Free</span>
        )}
        <button type="button" onClick={onBookmark} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${bookmarked ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-500/40 dark:bg-blue-500/15" : "border-slate-200 text-slate-400 hover:border-blue-200 hover:text-blue-600 dark:border-white/10"}`}>
          <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-blue-600" : ""}`} />
        </button>
        {s.isPaid ? (
          <Link
            href={`/dashboard/checkout/TEST_SERIES:${s.id}?title=${encodeURIComponent(s.title)}&days=365`}
            onClick={(e) => onRequireAuth?.(`/dashboard/checkout/TEST_SERIES:${s.id}?title=${encodeURIComponent(s.title)}&days=365`, e)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-black text-white transition hover:bg-blue-700"
          >
            Buy Now
          </Link>
        ) : (
          <Link href={`/series/${s.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white transition hover:bg-emerald-700">
            <Play className="h-3 w-3 fill-white" /> Start Free
          </Link>
        )}
        <Link href={`/series/${s.id}`} className="hidden h-9 items-center rounded-xl border-2 border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-200 sm:inline-flex">
          Details
        </Link>
      </div>
    </article>
  );
}

function Tag({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "red" }) {
  const styles = {
    slate: "bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-400",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    red: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${styles[tone]}`}>{children}</span>;
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

function FilterGroup({ title, options, value, onChange, defaultOpen = false }: {
  title: string; options: string[]; value: string;
  onChange: (v: string) => void; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 dark:border-white/8">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-black text-slate-800 dark:text-white"
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 px-4 pb-4">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(opt)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                    value === opt
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:bg-white/8 dark:text-slate-400"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Right-slide Filter Drawer ──────────────────────── */

function FilterDrawer(props: {
  open: boolean;
  filters: Filters;
  boards: { id: string; name: string }[];
  states: string[];
  resultCount: number;
  onChange: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const activeCount = Object.entries(props.filters).filter(([k, v]) => k !== "sort" && v && v !== defaultFilters[k as keyof Filters]).length;
  const boardOptions = props.boards.map((b) => b.name);
  const boardNameToId = Object.fromEntries(props.boards.map((b) => [b.name, b.id]));
  const activeBoardName = props.boards.find((b) => b.id === props.filters.boardId)?.name ?? "All";

  return (
    <AnimatePresence>
      {props.open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={props.onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-sm flex-col bg-white shadow-2xl dark:bg-gray-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">Filters</p>
                <p className="font-black text-slate-950 dark:text-white">{props.resultCount} results</p>
              </div>
              <button
                type="button"
                onClick={props.onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <FilterGroup title="Exam Category" options={["All", ...CATEGORIES]} value={props.filters.category} onChange={(v) => props.onChange("category", v)} defaultOpen />
              <FilterGroup
                title="Exam Board"
                options={boardOptions}
                value={activeBoardName}
                onChange={(v) => props.onChange("boardId", boardNameToId[v] ?? "All")}
              />
              {props.states.length > 1 && (
                <FilterGroup title="State" options={props.states} value={props.filters.stateName} onChange={(v) => props.onChange("stateName", v)} />
              )}
              <FilterGroup title="Access Type" options={["All", "Free", "Premium"]} value={props.filters.access} onChange={(v) => props.onChange("access", v)} defaultOpen />
              <FilterGroup title="Status" options={["All", "Trending", "New", "Featured"]} value={props.filters.status} onChange={(v) => props.onChange("status", v)} />
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-100 px-5 py-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => { props.onReset(); props.onClose(); }}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear All
                {activeCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white">{activeCount}</span>
                )}
              </button>
              <button
                type="button"
                onClick={props.onClose}
                className="flex h-11 flex-[1.4] items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── SEO Footer Band ────────────────────────────────── */

function SeoSection({ onSelect }: { onSelect: (v: string) => void }) {
  return (
    <section className="border-t border-slate-200 bg-slate-100 pb-28 pt-10 dark:border-white/8 dark:bg-slate-950 sm:pb-10">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-widest text-blue-600">Popular Searches</p>
        <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Latest Test Series by Exam</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SEO_GROUPS.map((group) => (
            <div key={group.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-slate-900">
              <h3 className="text-sm font-black text-slate-950 dark:text-white">{group.title}</h3>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {group.links.map((link) => (
                  <button
                    key={link}
                    type="button"
                    onClick={() => onSelect(link)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-600 hover:text-white dark:border-white/8 dark:bg-white/4 dark:text-slate-400"
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-slate-900">
          <h3 className="text-base font-black text-slate-950 dark:text-white">Frequently Asked Questions</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {[
              ["Why attempt mock tests?", "Mocks build speed, accuracy, exam-day stamina, and decision-making under pressure."],
              ["Are free tests available?", "Yes — free series have a Free badge and can be started instantly without payment."],
              ["How do I track performance?", "Dashboard analytics show weak areas, attempts, rank insights, and score trends."],
              ["What does Premium include?", "All series, AI analytics, detailed solutions, re-attempt mode, and rank prediction."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-xl bg-slate-50 p-3 dark:bg-white/4">
                <p className="text-sm font-black text-slate-950 dark:text-white">{q}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{a}</p>
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/8 dark:bg-slate-900">
          <div className="h-[72px] animate-pulse bg-slate-100 dark:bg-white/8" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-100 dark:bg-white/8" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-100 dark:bg-white/8" />
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => <div key={j} className="h-5 w-16 animate-pulse rounded-full bg-slate-100 dark:bg-white/8" />)}
            </div>
            <div className="h-8 animate-pulse rounded-xl bg-slate-100 dark:bg-white/8" />
            <div className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-white/8" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-white/10 dark:bg-slate-900">
      <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">No series found</h3>
      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Try removing some filters or broadening your search.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white transition hover:bg-blue-700"
      >
        <RotateCcw className="h-4 w-4" /> Reset filters
      </button>
    </div>
  );
}

/* ─── Page Export ────────────────────────────────────── */

export default function AllSeriesPage() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <SeriesAllPageInner />
    </Suspense>
  );
}
