"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bookmark,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  Flame,
  Gauge,
  GraduationCap,
  LineChart,
  ListFilter,
  Lock,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TimerReset,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const CATEGORIES = ["State PSC", "Banking", "SSC", "Railway", "Police", "Teaching", "UPSC"];
const LANGUAGES = ["English", "Hindi", "Bilingual"];
const DIFFICULTIES: SeriesDifficulty[] = ["Foundation", "Moderate", "Advanced"];
const DURATIONS = ["All", "Under 30 min", "30-60 min", "60-120 min", "120+ min"];
const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "latest", label: "Latest added" },
  { value: "tests", label: "Most tests" },
  { value: "rated", label: "Highest rated" },
  { value: "free", label: "Free first" },
] as const;

const CATEGORY_DISCOVERY = [
  { name: "SSC Test Series", category: "SSC", count: 42, icon: FileText, gradient: "from-blue-600 to-cyan-500" },
  { name: "Banking Test Series", category: "Banking", count: 88, icon: ShieldCheck, gradient: "from-emerald-600 to-teal-400" },
  { name: "State PSC Test Series", category: "State PSC", count: 126, icon: GraduationCap, gradient: "from-violet-600 to-fuchsia-400" },
  { name: "Railway Test Series", category: "Railway", count: 39, icon: TrendingUp, gradient: "from-amber-500 to-orange-500" },
  { name: "Police Test Series", category: "Police", count: 57, icon: Target, gradient: "from-rose-600 to-pink-400" },
  { name: "Teaching Test Series", category: "Teaching", count: 61, icon: BookOpenCheck, gradient: "from-sky-600 to-blue-400" },
];

const SEO_GROUPS = [
  { title: "Popular SSC Test Series", links: ["SSC CGL Mock Test Series", "SSC CHSL Test Series", "SSC MTS Test Series", "SSC GD Constable Mock Tests", "SSC CPO Test Series"] },
  { title: "Popular Banking Test Series", links: ["SBI PO Test Series", "IBPS PO Mock Tests", "IBPS Clerk Test Series", "RBI Grade B Test Series", "NABARD Grade A Mock Tests"] },
  { title: "Popular State PSC Test Series", links: ["JPSC Prelims Test Series", "BPSC Mock Tests", "UPPSC Test Series", "MPSC Test Series", "JPSC Mains Practice Tests"] },
  { title: "Popular Railway & Police Test Series", links: ["RRB NTPC Test Series", "RRB Group D Mock Tests", "Railway ALP Test Series", "UP Police Constable Tests", "Daroga SI Mock Tests"] },
];

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
  bannerUrl?: string;
  price?: number;
  discountedPrice?: number;
  exam?: { id?: string; name?: string; shortName?: string; tier?: number };
}

interface TestSeriesItem {
  id: string;
  title: string;
  description: string;
  examName: string;
  examShortName: string;
  examSlug: string;
  category: string;
  totalTests: number;
  fullMocks: number;
  sectionalTests: number;
  duration: number;
  language: string;
  difficulty: SeriesDifficulty;
  isPaid: boolean;
  isFeatured: boolean;
  isNew: boolean;
  price: number;
  discountedPrice: number;
  attempts: number;
  rating: number;
  learners: number;
  completionPercentage: number;
  passRequired: number;
  tags: string[];
}

interface Filters {
  q: string;
  category: string;
  exam: string;
  difficulty: string;
  language: string;
  access: string;
  status: string;
  duration: string;
  featured: string;
  sort: SortValue;
}

const defaultFilters: Filters = {
  q: "",
  category: "All",
  exam: "All",
  difficulty: "All",
  language: "All",
  access: "All",
  status: "All",
  duration: "All",
  featured: "All",
  sort: "popular",
};

function readFilters(params: URLSearchParams): Filters {
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "All",
    exam: params.get("exam") ?? "All",
    difficulty: params.get("difficulty") ?? "All",
    language: params.get("language") ?? "All",
    access: params.get("access") ?? "All",
    status: params.get("status") ?? "All",
    duration: params.get("duration") ?? "All",
    featured: params.get("featured") ?? "All",
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
  const category = CATEGORIES[seed % CATEGORIES.length];
  const completionPercentage = seed % 5 === 0 ? 64 : seed % 4 === 0 ? 28 : 0;
  const price = raw.price ?? 499 + (seed % 6) * 100;
  const discountedPrice = raw.discountedPrice ?? Math.max(0, price - 200);
  return {
    id: raw.id,
    title: raw.title || `${examName} Complete Mock Test Series`,
    description: raw.description || "Full-length CBT-style mock tests, sectional practice, analytics, and detailed solutions.",
    examName,
    examShortName: raw.exam?.shortName || examName.split(" ").map((word) => word[0]).join("").slice(0, 6),
    examSlug: raw.exam?.id || examName.toLowerCase().replace(/\s+/g, "-"),
    category,
    totalTests,
    fullMocks: Math.max(4, Math.round(totalTests * 0.45)),
    sectionalTests: Math.max(6, totalTests - Math.round(totalTests * 0.45)),
    duration: 30 + (seed % 5) * 30,
    language: LANGUAGES[seed % LANGUAGES.length],
    difficulty: DIFFICULTIES[seed % DIFFICULTIES.length],
    isPaid: raw.isPaid ?? seed % 3 !== 0,
    isFeatured: raw.isFeatured ?? index < 4,
    isNew: index < 3 || seed % 7 === 0,
    price,
    discountedPrice,
    attempts: 2300 + seed * 13,
    rating: Number((4.4 + (seed % 6) / 10).toFixed(1)),
    learners: 18000 + seed * 19,
    completionPercentage,
    passRequired: raw.tierRequired ?? 0,
    tags: [category, totalTests > 20 ? "Mega Pack" : "Focused Pack", seed % 2 === 0 ? "CBT Mode" : "Chapter Tests"],
  };
}

function fallbackSeries(): TestSeriesItem[] {
  const names = ["JPSC Prelims", "SSC CGL", "BPSC", "SBI PO", "Railway NTPC", "UP Police", "CTET", "RBI Grade B"];
  return Array.from({ length: 18 }, (_, index) =>
    normalizeSeries({
      id: `demo-series-${index + 1}`,
      title: `${names[index % names.length]} Complete Test Series ${index < 4 ? "2026" : "2025"}`,
      totalTests: 12 + (index % 5) * 6,
      isPaid: index % 4 !== 0,
      isFeatured: index < 5,
      price: 699,
      discountedPrice: 399,
      exam: { id: names[index % names.length].toLowerCase().replace(/\s+/g, "-"), name: names[index % names.length], shortName: names[index % names.length].split(" ")[0] },
    }, index)
  );
}

function SeriesAllPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [series, setSeries] = useState<TestSeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(9);
  const [filters, setFilters] = useState<Filters>(() => readFilters(searchParams));
  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("en_series_bookmarks");
      if (saved) setBookmarks(new Set(JSON.parse(saved) as string[]));
    } catch {
      setBookmarks(new Set());
    }
  }, []);

  useEffect(() => {
    const next = readFilters(searchParams);
    setFilters(next);
    setDebouncedQ(next.q);
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(filters.q), 280);
    return () => window.clearTimeout(timer);
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
    async function loadSeries() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/test-series?limit=100`);
        if (!res.ok) throw new Error("Could not load test series");
        const data = (await res.json()) as { items?: RawTestSeries[] };
        if (!cancelled) {
          const normalized = (data.items && data.items.length ? data.items : fallbackSeries()).map(normalizeSeries);
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
    loadSeries();
    return () => {
      cancelled = true;
    };
  }, []);

  const exams = useMemo(() => ["All", ...Array.from(new Set(series.map((item) => item.examName))).sort()], [series]);

  const filteredSeries = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    const result = series.filter((item) => {
      const matchesSearch = !q || [item.title, item.examName, item.description, item.category, ...item.tags].join(" ").toLowerCase().includes(q);
      const matchesCategory = filters.category === "All" || item.category === filters.category;
      const matchesExam = filters.exam === "All" || item.examName === filters.exam;
      const matchesDifficulty = filters.difficulty === "All" || item.difficulty === filters.difficulty;
      const matchesLanguage = filters.language === "All" || item.language === filters.language;
      const matchesAccess = filters.access === "All" || (filters.access === "Free" ? !item.isPaid : item.isPaid);
      const matchesStatus = filters.status === "All" || (filters.status === "Started" ? item.completionPercentage > 0 : item.completionPercentage === 0);
      const matchesFeatured = filters.featured === "All" || (filters.featured === "Featured" ? item.isFeatured : item.isNew);
      const matchesDuration = filters.duration === "All"
        || (filters.duration === "Under 30 min" && item.duration < 30)
        || (filters.duration === "30-60 min" && item.duration >= 30 && item.duration <= 60)
        || (filters.duration === "60-120 min" && item.duration > 60 && item.duration <= 120)
        || (filters.duration === "120+ min" && item.duration > 120);
      return matchesSearch && matchesCategory && matchesExam && matchesDifficulty && matchesLanguage && matchesAccess && matchesStatus && matchesFeatured && matchesDuration;
    });

    return result.sort((a, b) => {
      if (filters.sort === "latest") return Number(b.isNew) - Number(a.isNew);
      if (filters.sort === "tests") return b.totalTests - a.totalTests;
      if (filters.sort === "rated") return b.rating - a.rating;
      if (filters.sort === "free") return Number(a.isPaid) - Number(b.isPaid);
      return b.attempts - a.attempts;
    });
  }, [debouncedQ, filters, series]);

  useEffect(() => {
    setVisibleCount(9);
  }, [filteredSeries.length, filters]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleCount((count) => Math.min(count + 6, filteredSeries.length));
    }, { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredSeries.length]);

  const visibleSeries = filteredSeries.slice(0, visibleCount);
  const stats = useMemo(() => ({
    total: series.length,
    tests: series.reduce((sum, item) => sum + item.totalTests, 0),
    learners: series.reduce((sum, item) => sum + item.learners, 0),
    exams: new Set(series.map((item) => item.examName)).size,
  }), [series]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(defaultFilters);
    setDebouncedQ("");
  }

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      window.localStorage.setItem("en_series_bookmarks", JSON.stringify(Array.from(next)));
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950 dark:bg-slate-950 dark:text-white">
      <HeroSection filters={filters} stats={stats} onSearch={(value) => updateFilter("q", value)} onQuickExam={(value) => updateFilter("exam", value)} />

      <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <PassUnlockStrip />
        <CategoryDiscoveryGrid onSelectCategory={(value) => updateFilter("category", value)} />
        <TrendingCarousel series={series} />

        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <FilterSidebar filters={filters} exams={exams} onChange={updateFilter} onReset={resetFilters} resultCount={filteredSeries.length} />
          </aside>

          <section className="min-w-0">
            <div className="sticky top-16 z-20 mb-4 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Master Test Series Library</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight md:text-2xl">{filteredSeries.length} series ready to start</h2>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={filters.sort}
                    onChange={(e) => updateFilter("sort", e.target.value as SortValue)}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  >
                    {SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
                  </select>
                  <Button type="button" variant="outline" className="h-11 rounded-xl lg:hidden" onClick={() => setMobileFiltersOpen(true)}>
                    <Filter className="mr-2 h-4 w-4" /> Filters
                  </Button>
                </div>
              </div>
              <FilterChips filters={filters} onChange={updateFilter} onReset={resetFilters} />
            </div>

            {error && <ErrorState message={error} />}

            {loading ? (
              <LoadingState />
            ) : filteredSeries.length === 0 ? (
              <EmptyState onReset={resetFilters} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                  {visibleSeries.map((item, index) => (
                    <SeriesCard
                      key={item.id}
                      series={item}
                      index={index}
                      bookmarked={bookmarks.has(item.id)}
                      onBookmark={() => toggleBookmark(item.id)}
                    />
                  ))}
                </div>
                <div ref={sentinelRef} className="h-12" />
                {visibleCount < filteredSeries.length && (
                  <div className="mt-4 flex justify-center">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => setVisibleCount((count) => count + 9)}>
                      Load more test series
                    </Button>
                  </div>
                )}
              </>
            )}

            <AnalyticsCharts series={series} />
            <RecentActivity series={series.filter((item) => item.completionPercentage > 0).slice(0, 4)} bookmarks={bookmarks.size} />
            <PremiumCTA />
            <SeoLinkSection onSelect={(value) => updateFilter("q", value)} />
          </section>
        </div>
      </div>

      <MobileFilterDrawer
        open={mobileFiltersOpen}
        filters={filters}
        exams={exams}
        resultCount={filteredSeries.length}
        onChange={updateFilter}
        onReset={resetFilters}
        onClose={() => setMobileFiltersOpen(false)}
      />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/90 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Button type="button" variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setMobileFiltersOpen(true)}>
            <ListFilter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Link href={visibleSeries[0] ? `/dashboard/series/${visibleSeries[0].id}` : "/dashboard/series"} className="inline-flex h-12 flex-[1.3] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/25">
            Start mock <Play className="h-4 w-4 fill-white" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function HeroSection({ filters, stats, onSearch, onQuickExam }: {
  filters: Filters;
  stats: { total: number; tests: number; learners: number; exams: number };
  onSearch: (value: string) => void;
  onQuickExam: (value: string) => void;
}) {
  const trending = ["JPSC Prelims", "SSC CGL", "BPSC", "SBI PO", "Railway NTPC"];
  return (
    <section className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#ffffff_0%,#eef4ff_50%,#f0fdf4_100%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,#1d4ed8,transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)]">
      <div className="absolute left-10 top-14 h-28 w-28 rounded-full border border-blue-200/70 bg-white/30 blur-sm dark:border-blue-400/20 dark:bg-blue-400/10" />
      <div className="absolute right-8 top-20 h-40 w-40 rounded-full border border-emerald-200/70 bg-emerald-100/30 blur-sm dark:border-emerald-400/20 dark:bg-emerald-400/10" />
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/75 px-3 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-blue-700 shadow-sm backdrop-blur dark:border-blue-400/20 dark:bg-white/10 dark:text-blue-200">
            <Sparkles className="h-3.5 w-3.5" /> Master Test Series Discovery
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-7xl dark:text-white">
            All Test Series
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            Practice full-length mock tests for SSC, Banking, Railways, State PSC, Police, Teaching & more.
          </p>
          <SearchBar value={filters.q} onChange={onSearch} />
          <div className="mt-5 flex flex-wrap gap-2">
            {trending.map((exam) => (
              <button key={exam} type="button" onClick={() => onQuickExam(exam)} className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                {exam}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
          <Card glass className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-2xl shadow-blue-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
            <div className="grid grid-cols-2 gap-3">
              <HeroStat icon={BookOpen} label="Test series" value={`${Math.max(stats.total, 18)}+`} />
              <HeroStat icon={FileText} label="Mock tests" value={`${Math.max(stats.tests, 220)}+`} />
              <HeroStat icon={Users} label="Learners" value={`${Math.round(stats.learners / 1000)}k+`} />
              <HeroStat icon={GraduationCap} label="Exams covered" value={`${Math.max(stats.exams, 8)}+`} />
            </div>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-600 p-4 text-white shadow-xl shadow-blue-600/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Live trend</p>
                  <p className="mt-1 text-lg font-black">JPSC & SSC mocks are trending today</p>
                </div>
                <TrendingUp className="h-9 w-9" />
              </div>
              <div className="mt-4 grid grid-cols-12 items-end gap-1.5">
                {[48, 58, 45, 62, 72, 84, 68, 92, 80, 96, 88, 104].map((height, idx) => (
                  <div key={idx} className="rounded-t bg-white/75" style={{ height }} />
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="mt-7 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-2 shadow-2xl shadow-blue-900/10 backdrop-blur-xl transition focus-within:border-blue-300 dark:border-white/10 dark:bg-white/10">
      <Search className="ml-3 h-5 w-5 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search exam, series, mock test or category..."
        className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
      />
      <Button type="button" className="hidden h-12 rounded-xl px-5 sm:inline-flex">Search</Button>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function PassUnlockStrip() {
  return (
    <section className="mb-6 overflow-hidden rounded-[28px] border border-emerald-200/70 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 p-5 text-white shadow-2xl shadow-blue-950/20">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">ExamNurture Pass</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Unlock all mock tests and premium series</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-blue-100">
              {["Full-length mocks", "Sectional tests", "Rank prediction", "AI analytics", "Re-attempt mode", "Detailed solutions"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/10 px-3 py-1">{item}</span>
              ))}
            </div>
          </div>
        </div>
        <Link href="/dashboard/plans" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-emerald-50">
          Get Pass <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function CategoryDiscoveryGrid({ onSelectCategory }: { onSelectCategory: (value: string) => void }) {
  return (
    <section className="mb-6 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Explore by exam category</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Mock tests for popular competitive exams</h2>
        </div>
        <Link href="/exams" className="inline-flex items-center gap-1 text-sm font-black text-blue-600 hover:text-blue-700">
          Browse all exams <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {CATEGORY_DISCOVERY.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelectCategory(item.category)}
              className="group rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/10 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-black leading-tight text-slate-950 group-hover:text-blue-700 dark:text-white">{item.name}</h3>
              <p className="mt-1 text-xs font-bold text-slate-400">{item.count} series</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FilterSidebar(props: {
  filters: Filters;
  exams: string[];
  resultCount: number;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onReset: () => void;
}) {
  return (
    <div className="sticky top-20 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Filters</p>
          <h3 className="text-lg font-black">{props.resultCount} matching series</h3>
        </div>
        <button type="button" onClick={props.onReset} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 dark:bg-white/10">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        <FilterGroup title="Exam Category" options={["All", ...CATEGORIES]} value={props.filters.category} onChange={(value) => props.onChange("category", value)} />
        <FilterGroup title="Exam Name" options={props.exams} value={props.filters.exam} onChange={(value) => props.onChange("exam", value)} />
        <FilterGroup title="Difficulty" options={["All", ...DIFFICULTIES]} value={props.filters.difficulty} onChange={(value) => props.onChange("difficulty", value)} />
        <FilterGroup title="Language" options={["All", ...LANGUAGES]} value={props.filters.language} onChange={(value) => props.onChange("language", value)} />
        <FilterGroup title="Access" options={["All", "Free", "Premium"]} value={props.filters.access} onChange={(value) => props.onChange("access", value)} />
        <FilterGroup title="Progress" options={["All", "Started", "Not Started"]} value={props.filters.status} onChange={(value) => props.onChange("status", value)} />
        <FilterGroup title="Duration" options={DURATIONS} value={props.filters.duration} onChange={(value) => props.onChange("duration", value)} />
        <FilterGroup title="Highlights" options={["All", "Featured", "New"]} value={props.filters.featured} onChange={(value) => props.onChange("featured", value)} />
      </div>
    </div>
  );
}

function FilterGroup({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(["Exam Category", "Access", "Progress"].includes(title));
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.03]">
      <button type="button" onClick={() => setOpen((state) => !state)} className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-black">
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    value === option
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:bg-white/10 dark:text-slate-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterChips({ filters, onChange, onReset }: {
  filters: Filters;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onReset: () => void;
}) {
  const chips = Object.entries(filters).filter(([key, value]) => key !== "sort" && value && value !== defaultFilters[key as keyof Filters]);
  if (!chips.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map(([key, value]) => (
        <button key={key} type="button" onClick={() => onChange(key as keyof Filters, defaultFilters[key as keyof Filters])} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
          {value}<X className="h-3 w-3" />
        </button>
      ))}
      <button type="button" onClick={onReset} className="text-xs font-black text-slate-500 hover:text-blue-600">Reset all</button>
    </div>
  );
}

function SeriesCard({ series, index, bookmarked, onBookmark }: { series: TestSeriesItem; index: number; bookmarked: boolean; onBookmark: () => void }) {
  const locked = series.isPaid && series.completionPercentage === 0;
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.25) }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white p-4 shadow-sm transition hover:shadow-2xl hover:shadow-blue-900/10 dark:border-white/10 dark:bg-slate-900"
    >
      {series.isFeatured && <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-400" />}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-blue-600">{series.examShortName}</p>
            <h3 className="mt-1 line-clamp-2 text-lg font-black leading-snug text-slate-950 group-hover:text-blue-700 dark:text-white">{series.title}</h3>
          </div>
        </div>
        <button type="button" onClick={onBookmark} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${bookmarked ? "border-blue-200 bg-blue-50 text-blue-600" : "border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600 dark:border-white/10"}`}>
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-blue-600" : ""}`} />
        </button>
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">{series.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="blue">{series.totalTests} tests</Badge>
        <Badge tone={series.difficulty === "Advanced" ? "red" : series.difficulty === "Moderate" ? "amber" : "green"}>{series.difficulty}</Badge>
        <Badge tone={series.isPaid ? "amber" : "green"}>{series.isPaid ? "Premium" : "Free"}</Badge>
        {series.isNew && <Badge tone="purple">New</Badge>}
        {series.isFeatured && <Badge tone="slate">Featured</Badge>}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MiniMetric icon={FileText} value={series.fullMocks} label="Full mocks" />
        <MiniMetric icon={Target} value={series.sectionalTests} label="Sectional" />
        <MiniMetric icon={Clock3} value={`${series.duration}m`} label="Avg time" />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{series.learners.toLocaleString()} learners</span>
          <span>{series.attempts.toLocaleString()} attempts</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${Math.max(series.completionPercentage, 8)}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500">{series.completionPercentage ? `${series.completionPercentage}% completed` : "Not started"}</span>
          <span className="inline-flex items-center gap-1 text-amber-500"><Star className="h-3 w-3 fill-amber-400" /> {series.rating}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-[74px]">
          {series.isPaid ? (
            <>
              <p className="text-xs font-bold text-slate-400 line-through">Rs {series.price}</p>
              <p className="text-xl font-black text-slate-950 dark:text-white">Rs {series.discountedPrice}</p>
            </>
          ) : (
            <Badge tone="green">Free</Badge>
          )}
        </div>
        <Link href={locked ? "/dashboard/plans" : `/dashboard/series/${series.id}`} className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-black text-white shadow-lg transition ${locked ? "bg-slate-900 shadow-slate-900/20 dark:bg-white dark:text-slate-950" : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700"}`}>
          {locked ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
          {locked ? "Unlock" : series.completionPercentage ? "Continue" : "Start Series"}
        </Link>
        <Link href={`/dashboard/series/${series.id}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-200">
          Details
        </Link>
      </div>
    </motion.article>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "blue" | "green" | "amber" | "red" | "purple" | "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    red: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
    purple: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200",
    slate: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>;
}

function MiniMetric({ icon: Icon, value, label }: { icon: React.ElementType; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-2 dark:border-white/10 dark:bg-white/[0.03]">
      <Icon className="mx-auto h-4 w-4 text-blue-600" />
      <p className="mt-1 text-sm font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
    </div>
  );
}

function TrendingCarousel({ series }: { series: TestSeriesItem[] }) {
  const items = series.slice(0, 8);
  return (
    <section className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Trending this week</p>
          <h2 className="text-xl font-black">Most attempted mock series</h2>
        </div>
        <Flame className="h-6 w-6 text-amber-500" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
        {items.map((item) => (
          <Link key={item.id} href={`/dashboard/series/${item.id}`} className="min-w-[260px] rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-blue-50 p-4 transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:from-white/10 dark:to-blue-500/10">
            <div className="flex items-center justify-between">
              <Badge tone="amber">Topper recommended</Badge>
              <span className="text-xs font-black text-slate-400">{item.totalTests} tests</span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-sm font-black">{item.title}</h3>
            <div className="mt-3 flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-blue-500" /> {item.attempts.toLocaleString()}</span>
              <span className="inline-flex items-center gap-1"><Gauge className="h-3 w-3 text-amber-500" /> {item.difficulty}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function AnalyticsCharts({ series }: { series: TestSeriesItem[] }) {
  const categoryCounts = CATEGORIES.slice(0, 6).map((category) => ({ category, count: series.filter((item) => item.category === category).length || Math.max(1, category.length % 7) }));
  const maxCount = Math.max(...categoryCounts.map((item) => item.count), 1);
  const focus = ["Accuracy", "Speed", "Revision", "Rank Boost", "Coverage"].map((label, index) => ({ label, value: 46 + index * 10 }));
  return (
    <section className="mt-8 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-3xl border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Analytics</p>
            <h2 className="text-xl font-black">Series coverage by category</h2>
          </div>
          <LineChart className="h-6 w-6 text-blue-600" />
        </div>
        <div className="mt-6 flex h-56 items-end gap-3">
          {categoryCounts.map((item) => (
            <div key={item.category} className="flex flex-1 flex-col items-center gap-2">
              <motion.div initial={{ height: 0 }} whileInView={{ height: `${(item.count / maxCount) * 100}%` }} viewport={{ once: true }} className="w-full rounded-t-2xl bg-gradient-to-t from-blue-600 to-cyan-400" />
              <span className="max-w-[60px] truncate text-xs font-black text-slate-500">{item.category}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-3xl border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Prep impact</p>
            <h2 className="text-xl font-black">What mocks improve</h2>
          </div>
          <BarChart3 className="h-6 w-6 text-violet-600" />
        </div>
        <div className="mt-6 space-y-4">
          {focus.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs font-black text-slate-500">
                <span>{item.label}</span>
                <span>{item.value}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-white/10">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.value}%` }} viewport={{ once: true }} className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function RecentActivity({ series, bookmarks }: { series: TestSeriesItem[]; bookmarks: number }) {
  return (
    <section className="mt-8 rounded-3xl border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Recent activity</p>
          <h2 className="text-xl font-black">Continue your mock streak</h2>
        </div>
        <Badge tone="green">{bookmarks} saved</Badge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {(series.length ? series : fallbackSeries().slice(0, 4)).map((item) => (
          <Link key={item.id} href={`/dashboard/series/${item.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/[0.03]">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{item.title}</p>
              <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.completionPercentage || 35}%` }} />
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function PremiumCTA() {
  return (
    <section className="mt-8 overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-2xl shadow-blue-950/20 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <Badge tone="amber">Premium Pass</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Unlock Complete ExamNurture Pass</h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-300">
            Get every premium test series, rank prediction, AI analytics, detailed solutions, re-attempt mode, and personalized revision plans.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {["All premium mocks", "AI analytics", "Rank prediction", "Detailed solutions"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
          <p className="text-sm font-bold text-slate-300">Everything pass</p>
          <p className="mt-2 text-4xl font-black">One plan</p>
          <Link href="/dashboard/plans" className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-slate-950 transition hover:bg-blue-50">
            Unlock Complete ExamNurture Pass <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function SeoLinkSection({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <section className="mt-8 rounded-3xl border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Popular searches</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">Latest test series by exam</h2>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
          Quick links help learners discover exam-specific mock test collections faster.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {SEO_GROUPS.map((group) => (
          <div key={group.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <h3 className="text-sm font-black text-slate-950 dark:text-white">{group.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.links.map((link) => (
                <button
                  key={link}
                  type="button"
                  onClick={() => onSelect(link)}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-blue-600 hover:text-white dark:bg-white/10 dark:text-slate-300"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-blue-50 p-5 dark:bg-blue-500/10">
        <h3 className="text-lg font-black">FAQs of Test Series</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            ["Why attempt mock test series?", "Mocks build speed, accuracy, stamina, and exam-day decision making."],
            ["Are free tests available?", "Yes, free series are visible with a Free badge and can be started instantly."],
            ["Can I track performance?", "Dashboard analytics show progress, weak areas, attempts, and rank-style insights."],
            ["What does Premium unlock?", "Premium unlocks all test series, AI analytics, detailed solutions, and re-attempt mode."],
          ].map(([q, a]) => (
            <div key={q}>
              <p className="text-sm font-black">{q}</p>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 9 }, (_, index) => (
        <div key={index} className="h-[370px] animate-pulse rounded-3xl border border-white/80 bg-white dark:border-white/10 dark:bg-slate-900">
          <div className="m-4 h-12 rounded-2xl bg-slate-100 dark:bg-white/10" />
          <div className="mx-4 mt-6 h-24 rounded-2xl bg-slate-100 dark:bg-white/10" />
          <div className="mx-4 mt-6 h-12 rounded-2xl bg-slate-100 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-white/10 dark:bg-slate-900">
      <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
      <h3 className="mt-4 text-xl font-black">No test series found</h3>
      <p className="mt-2 text-sm font-medium text-slate-500">Try removing filters or searching a broader exam name.</p>
      <Button type="button" className="mt-5 rounded-xl" onClick={onReset}>Reset filters</Button>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
      {message}. Showing cached discovery layout.
    </div>
  );
}

function MobileFilterDrawer(props: {
  open: boolean;
  filters: Filters;
  exams: string[];
  resultCount: number;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {props.open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={props.onClose} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }} className="fixed inset-x-0 bottom-0 z-50 max-h-[86vh] overflow-y-auto rounded-t-[32px] bg-white p-4 pb-24 shadow-2xl dark:bg-slate-950 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Filters</p>
                <h3 className="text-lg font-black">{props.resultCount} results</h3>
              </div>
              <button type="button" onClick={props.onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterSidebar {...props} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AllTestSeriesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SeriesAllPageInner />
    </Suspense>
  );
}
