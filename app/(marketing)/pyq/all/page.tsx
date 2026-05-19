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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];
const CATEGORIES = ["State PSC", "Banking", "SSC", "Railway", "Police", "Teaching", "UPSC"];
const SUBJECTS = ["General Studies", "Quant", "Reasoning", "English", "Current Affairs", "Jharkhand GK"];
const DIFFICULTIES: PyqDifficulty[] = ["Easy", "Moderate", "Hard"];
const LANGUAGES = ["English", "Hindi", "Bilingual"];
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

const CATEGORY_DISCOVERY = [
  { name: "SSC Exams", category: "SSC", count: 31, icon: FileText, gradient: "from-blue-600 to-cyan-500" },
  { name: "Banking Exams", category: "Banking", count: 79, icon: ShieldCheck, gradient: "from-emerald-600 to-teal-400" },
  { name: "State Govt.", category: "State PSC", count: 663, icon: GraduationCap, gradient: "from-violet-600 to-fuchsia-400" },
  { name: "Railways", category: "Railway", count: 33, icon: TrendingUp, gradient: "from-amber-500 to-orange-500" },
  { name: "Police Exams", category: "Police", count: 89, icon: Target, gradient: "from-rose-600 to-pink-400" },
  { name: "Teaching", category: "Teaching", count: 164, icon: BookOpenCheck, gradient: "from-sky-600 to-blue-400" },
  { name: "UPSC CSE", category: "UPSC", count: 24, icon: Trophy, gradient: "from-indigo-600 to-violet-400" },
];

const SEO_GROUPS = [
  { title: "Latest SSC PYQs", links: ["SSC CGL PYQ Papers", "SSC CHSL PYQ Papers", "SSC MTS PYQ Papers", "SSC GD Constable PYQ"] },
  { title: "Banking PYQs", links: ["SBI PO PYQ Papers", "IBPS PO PYQ Papers", "RBI Grade B PYQ", "IBPS Clerk PYQ"] },
  { title: "State PSC PYQs", links: ["JPSC Prelims PYQ", "BPSC PYQ Papers", "UPPSC PYQ", "MPSC PYQ Papers"] },
  { title: "Railway & Police PYQs", links: ["RRB NTPC PYQ", "RRB Group D PYQ", "UP Police PYQ", "Railway ALP PYQ"] },
];

type SortValue = (typeof SORTS)[number]["value"];
type PyqDifficulty = "Easy" | "Moderate" | "Hard";

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
  examSlug: string;
  examName: string;
  title: string;
  year: number;
  subject: string;
  category: string;
  difficulty: PyqDifficulty;
  totalQuestions: number;
  duration: number;
  marks: number;
  language: string;
  isPremium: boolean;
  attempts: number;
  rating: number;
  bookmarkCount: number;
  completionPercentage: number;
  pdfUrl?: string;
  tags: string[];
  selectionRatio: string;
  isNew: boolean;
  paperType: "Full Paper" | "Sectional";
  bannerGradient: string;
}

interface Filters {
  q: string;
  category: string;
  exam: string;
  year: string;
  subject: string;
  difficulty: string;
  language: string;
  access: string;
  status: string;
  solved: string;
  sort: SortValue;
}

const defaultFilters: Filters = {
  q: "",
  category: "All",
  exam: "All",
  year: "All",
  subject: "All",
  difficulty: "All",
  language: "All",
  access: "All",
  status: "All",
  solved: "All",
  sort: "latest",
};

function readFilters(params: URLSearchParams): Filters {
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "All",
    exam: params.get("exam") ?? "All",
    year: params.get("year") ?? "All",
    subject: params.get("subject") ?? "All",
    difficulty: params.get("difficulty") ?? "All",
    language: params.get("language") ?? "All",
    access: params.get("access") ?? "All",
    status: params.get("status") ?? "All",
    solved: params.get("solved") ?? "All",
    sort: (params.get("sort") as SortValue) ?? "latest",
  };
}

function seedFrom(text: string) {
  return text.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function normalizePaper(raw: RawPYQPaper, index: number): PyqPaper {
  const seed = seedFrom(raw.id || raw.title || String(index));
  const examName = raw.exam?.name || "ExamNurture Exam";
  const category = CATEGORIES[seed % CATEGORIES.length];
  const subject = SUBJECTS[seed % SUBJECTS.length];
  const difficulty = DIFFICULTIES[seed % DIFFICULTIES.length];
  const language = LANGUAGES[seed % LANGUAGES.length];
  const completionPercentage = seed % 5 === 0 ? 72 : seed % 4 === 0 ? 38 : 0;
  const year = raw.year ?? Number(YEARS[seed % YEARS.length]);
  return {
    id: raw.id,
    examSlug: raw.exam?.slug || raw.exam?.id || examName.toLowerCase().replace(/\s+/g, "-"),
    examName,
    title: raw.title || `${examName} Previous Year Paper`,
    year,
    subject,
    category,
    difficulty,
    totalQuestions: raw.totalQuestions ?? 100 + (seed % 50),
    duration: raw.durationSec ? Math.round(raw.durationSec / 60) : 90 + (seed % 4) * 30,
    marks: raw.marks ?? 100 + (seed % 5) * 50,
    language,
    isPremium: raw.isPremium ?? seed % 4 === 0,
    attempts: 1200 + seed * 17,
    rating: Number((4.3 + (seed % 7) / 10).toFixed(1)),
    bookmarkCount: 200 + seed * 3,
    completionPercentage,
    pdfUrl: raw.pdfUrl,
    tags: [subject, category, seed % 2 === 0 ? "Full Paper" : "Topic-wise"],
    selectionRatio: `${8 + (seed % 21)}%`,
    isNew: year >= 2024 || index < 3,
    paperType: seed % 3 === 0 ? "Sectional" : "Full Paper",
    bannerGradient: BANNER_GRADIENTS[seed % BANNER_GRADIENTS.length],
  };
}

function fallbackPapers(): PyqPaper[] {
  const names = ["JPSC Prelims", "SSC CGL", "BPSC", "SBI PO", "Railway NTPC", "UP Police", "CTET", "RBI Grade B"];
  return Array.from({ length: 18 }, (_, i) =>
    normalizePaper({
      id: `demo-pyq-${i + 1}`,
      title: `${names[i % names.length]} ${2025 - (i % 7)} Official PYQ Paper`,
      year: 2025 - (i % 7),
      totalQuestions: 100 + (i % 4) * 25,
      durationSec: (90 + (i % 3) * 30) * 60,
      exam: { id: names[i % names.length].toLowerCase().replace(/\s+/g, "-"), name: names[i % names.length] },
      pdfUrl: "#",
    }, i)
  );
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
        const res = await fetch(`${API_URL}/pyq?limit=100`);
        if (!res.ok) throw new Error("Could not load PYQ papers");
        const data = (await res.json()) as { items?: RawPYQPaper[] };
        if (!cancelled) {
          const normalized = (data.items?.length ? data.items : fallbackPapers()).map(normalizePaper);
          setPapers(normalized);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setPapers(fallbackPapers());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const exams = useMemo(() => ["All", ...Array.from(new Set(papers.map((p) => p.examName))).sort()], [papers]);

  const filteredPapers = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    const result = papers.filter((p) => {
      if (q && ![p.title, p.examName, p.subject, p.category, ...p.tags].join(" ").toLowerCase().includes(q)) return false;
      if (filters.category !== "All" && p.category !== filters.category) return false;
      if (filters.exam !== "All" && p.examName !== filters.exam) return false;
      if (filters.year !== "All" && String(p.year) !== filters.year) return false;
      if (filters.subject !== "All" && p.subject !== filters.subject) return false;
      if (filters.difficulty !== "All" && p.difficulty !== filters.difficulty) return false;
      if (filters.language !== "All" && p.language !== filters.language) return false;
      if (filters.access !== "All" && (filters.access === "Free" ? p.isPremium : !p.isPremium)) return false;
      if (filters.status !== "All" && (filters.status === "Attempted" ? p.completionPercentage === 0 : p.completionPercentage > 0)) return false;
      if (filters.solved !== "All" && (filters.solved === "Solved" ? p.completionPercentage < 100 : p.completionPercentage === 100)) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (filters.sort === "attempted") return b.attempts - a.attempts;
      if (filters.sort === "rated") return b.rating - a.rating;
      if (filters.sort === "topic") return a.subject.localeCompare(b.subject);
      if (filters.sort === "sectional") return a.paperType.localeCompare(b.paperType);
      if (filters.sort === "full") return b.totalQuestions - a.totalQuestions;
      return b.year - a.year;
    });
  }, [debouncedQ, filters, papers]);

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
    attempts: papers.reduce((s, p) => s + p.attempts, 0),
    exams: new Set(papers.map((p) => p.examName)).size,
    years: new Set(papers.map((p) => p.year)).size,
  }), [papers]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }
  function resetFilters() { setFilters(defaultFilters); setDebouncedQ(""); }
  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      window.localStorage.setItem("en_pyq_bookmarks", JSON.stringify(Array.from(next)));
      return next;
    });
  }

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== "sort" && v && v !== defaultFilters[k as keyof Filters]).length;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <HeroSection stats={stats} onRequireAuth={requireAuth} />

      <div className="mx-auto max-w-[1440px] px-4 pb-0 pt-6 sm:px-6 lg:px-8">
        {/* Trending carousel */}
        <TrendingCarousel papers={papers.slice(0, 8)} />

        {/* Category discovery grid */}
        <CategoryDiscoveryGrid
          papers={papers}
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
              placeholder="Search by exam name, year, subject or topic…"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white"
            />
            {filters.q && (
              <button type="button" onClick={() => updateFilter("q", "")} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-400">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort + Filter toolbar */}
          <div className="sticky top-14 z-20 mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/95 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/95">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950 dark:text-white">
                <span className="text-blue-600">{filteredPapers.length}</span> papers found
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
                {/* View mode toggle */}
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

          {/* Papers grid / list */}
          <div className="mt-5">
            {loading ? (
              <LoadingGrid />
            ) : filteredPapers.length === 0 ? (
              <EmptyState onReset={resetFilters} />
            ) : (
              <>
                {viewMode === "grid" ? (
                  <motion.div
                    initial="hidden" animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  >
                    {visiblePapers.map((paper) => (
                      <motion.div key={paper.id} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
                        <PyqCard paper={paper} bookmarked={bookmarks.has(paper.id)} onBookmark={() => toggleBookmark(paper.id)} onRequireAuth={requireAuth} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial="hidden" animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
                    className="flex flex-col gap-2"
                  >
                    {visiblePapers.map((paper) => (
                      <motion.div key={paper.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                        <PyqRow paper={paper} bookmarked={bookmarks.has(paper.id)} onBookmark={() => toggleBookmark(paper.id)} onRequireAuth={requireAuth} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                <div ref={sentinelRef} className="h-4" />
                {visibleCount < filteredPapers.length && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + 9)}
                      className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-blue-200 bg-white px-6 text-sm font-black text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
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

      {/* ── Below-grid extras ───────────────────────────── */}
      <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <AnalyticsCharts papers={papers} />
        <RecentActivity papers={papers.filter((p) => p.completionPercentage > 0).slice(0, 4)} bookmarks={bookmarks.size} />
        <PremiumCTA />
      </div>

      {/* Footer SEO band */}
      <SeoSection onSelect={(v) => updateFilter("q", v)} />

      {/* Right-slide filter drawer */}
      <FilterDrawer
        open={filterOpen}
        filters={filters}
        exams={exams}
        resultCount={filteredPapers.length}
        onChange={updateFilter}
        onReset={resetFilters}
        onClose={() => setFilterOpen(false)}
      />

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
  stats: { total: number; attempts: number; exams: number; years: number };
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
            <FileText className="h-3 w-3" /> PYQ Library
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08] dark:text-white">
            Previous Year<br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Question Papers</span>
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
            Solve real exam papers for SSC, Banking, Railway, State PSC, Police, UPSC & more — with live timer, detailed solutions and AI analytics.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard/pyq?tab=attempts"
              onClick={(e) => onRequireAuth("/dashboard/pyq?tab=attempts", e)}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
            >
              My PYQ Attempts <ArrowRight className="h-4 w-4" />
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

        {/* Right — Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="grid grid-cols-2 gap-4"
        >
          <StatCard icon={FileText} label="PYQ Papers" value={`${Math.max(stats.total, 18)}+`} gradient="from-blue-500 to-blue-600" />
          <StatCard icon={Users} label="Total Attempts" value={`${Math.max(Math.round(stats.attempts / 1000), 120)}k+`} gradient="from-emerald-500 to-emerald-600" />
          <StatCard icon={GraduationCap} label="Exams Covered" value={`${Math.max(stats.exams, 8)}+`} gradient="from-violet-500 to-violet-600" />
          <StatCard icon={Trophy} label="Years Covered" value={`${Math.max(stats.years, 8)}+`} gradient="from-amber-500 to-amber-600" />
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

function TrendingCarousel({ papers }: { papers: PyqPaper[] }) {
  const BADGE_CONFIG = [
    { label: "Topper Pick", color: "bg-amber-500 text-white" },
    { label: "Trending", color: "bg-rose-500 text-white" },
    { label: "Most Solved", color: "bg-blue-600 text-white" },
    { label: "Must Attempt", color: "bg-emerald-600 text-white" },
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
        {(papers.length ? papers : fallbackPapers().slice(0, 4)).map((paper, i) => {
          const badge = BADGE_CONFIG[i % BADGE_CONFIG.length];
          return (
            <Link
              key={paper.id}
              href={`/dashboard/pyq/${paper.id}`}
              className="flex min-w-[240px] max-w-[260px] shrink-0 flex-col gap-2 rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg dark:border-white/8 dark:from-slate-800/50 dark:to-slate-900/50"
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${badge.color}`}>
                  <Flame className="h-2.5 w-2.5" /> {badge.label}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{paper.year}</span>
              </div>
              <h3 className="line-clamp-2 text-sm font-black leading-snug text-slate-950 dark:text-white">{paper.title}</h3>
              <div className="mt-auto flex items-center gap-3 text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-blue-500" />{paper.attempts.toLocaleString()}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{paper.rating}</span>
                <span className="ml-auto">{paper.totalQuestions}Q</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Category Discovery Grid (dynamic) ─────────────── */

function CategoryDiscoveryGrid({ papers, onSelectCategory, activeCategory }: {
  papers: PyqPaper[];
  onSelectCategory: (v: string) => void;
  activeCategory: string;
}) {
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    papers.forEach((p) => {
      if (p.category) counts.set(p.category, (counts.get(p.category) || 0) + 1);
    });
    return counts;
  }, [papers]);

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
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Previous Year Papers by Exam</h2>
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
                  {item.hasData ? `${item.count} papers` : `${item.count}+ papers`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ─── PYQ Card (grid view) ───────────────────────────── */

function PyqCard({ paper, bookmarked, onBookmark, onRequireAuth }: { paper: PyqPaper; bookmarked: boolean; onBookmark: () => void; onRequireAuth?: (href: string, e: React.MouseEvent) => void }) {
  const locked = paper.isPremium && paper.completionPercentage === 0;
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:border-white/8 dark:bg-slate-900">
      {/* Gradient banner */}
      <div className={`relative h-[72px] bg-gradient-to-br ${paper.bannerGradient} overflow-hidden`}>
        {locked && <div className="absolute inset-x-0 top-0 h-1 bg-amber-400" />}
        <div className="absolute bottom-2 left-3 flex gap-1.5">
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-sm">{paper.year}</span>
          {paper.isNew && <span className="rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-sm">New</span>}
          {paper.isPremium && <span className="rounded-full bg-amber-400/80 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-sm">Premium</span>}
        </div>
        <div className="absolute right-3 top-2.5">
          <span className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-black tracking-wider text-white backdrop-blur-sm">
            {paper.paperType}
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
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{paper.examName}</p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-black leading-snug text-slate-950 group-hover:text-blue-700 dark:text-white">
          {paper.title}
        </h3>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Tag tone={paper.difficulty === "Hard" ? "red" : paper.difficulty === "Moderate" ? "amber" : "green"}>{paper.difficulty}</Tag>
          <Tag>{paper.subject}</Tag>
          <Tag>{paper.language}</Tag>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <MetricChip icon={BookOpenCheck} value={paper.totalQuestions} label="Questions" />
          <MetricChip icon={Target} value={paper.marks} label="Marks" />
          <MetricChip icon={Clock3} value={`${paper.duration}m`} label="Duration" />
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>{paper.attempts.toLocaleString()} attempts</span>
            <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{paper.rating}</span>
          </div>
          {paper.completionPercentage > 0 && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${paper.completionPercentage}%` }} />
              </div>
              <p className="mt-1 text-[10px] font-bold text-blue-600">{paper.completionPercentage}% completed</p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 flex gap-2">
          {locked ? (
            <Link
              href="/dashboard/plans"
              onClick={(e) => onRequireAuth?.("/dashboard/plans", e)}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-xs font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
            >
              <Zap className="h-3.5 w-3.5" /> Unlock
            </Link>
          ) : (
            <Link
              href={`/dashboard/pyq/${paper.id}`}
              onClick={(e) => onRequireAuth?.(`/dashboard/pyq/${paper.id}`, e)}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-xs font-black text-white shadow-md shadow-blue-600/20 transition hover:brightness-105"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              {paper.completionPercentage ? "Continue" : "Start Solving"}
            </Link>
          )}
          <Link
            href={`/dashboard/pyq/${paper.id}`}
            onClick={(e) => onRequireAuth?.(`/dashboard/pyq/${paper.id}`, e)}
            className="flex h-10 items-center justify-center rounded-xl border-2 border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-200"
          >
            Details
          </Link>
          {paper.pdfUrl && paper.pdfUrl !== "#" && (
            <a
              href={paper.pdfUrl}
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10"
              aria-label="Download PDF"
            >
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
  const locked = paper.isPremium && paper.completionPercentage === 0;
  return (
    <article className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-white/8 dark:bg-slate-900">
      <div className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${paper.bannerGradient} flex items-center justify-center`}>
        <FileText className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="truncate text-sm font-black text-slate-950 group-hover:text-blue-700 dark:text-white">{paper.title}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">{paper.year}</span>
          {paper.isNew && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">New</span>}
          {paper.isPremium && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">Premium</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
          <span>{paper.examName}</span>
          <span>{paper.totalQuestions}Q · {paper.duration}m · {paper.marks}M</span>
          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{paper.rating}</span>
          <span>{paper.difficulty}</span>
          <span>{paper.language}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onBookmark} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${bookmarked ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-500/40 dark:bg-blue-500/15" : "border-slate-200 text-slate-400 hover:border-blue-200 hover:text-blue-600 dark:border-white/10"}`}>
          <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-blue-600" : ""}`} />
        </button>
        {locked ? (
          <Link
            href="/dashboard/plans"
            onClick={(e) => onRequireAuth?.("/dashboard/plans", e)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-black text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950"
          >
            <Zap className="h-3 w-3" /> Unlock
          </Link>
        ) : (
          <Link
            href={`/dashboard/pyq/${paper.id}`}
            onClick={(e) => onRequireAuth?.(`/dashboard/pyq/${paper.id}`, e)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-black text-white transition hover:bg-blue-700"
          >
            <Play className="h-3 w-3 fill-white" /> {paper.completionPercentage ? "Continue" : "Solve"}
          </Link>
        )}
        <Link
          href={`/dashboard/pyq/${paper.id}`}
          onClick={(e) => onRequireAuth?.(`/dashboard/pyq/${paper.id}`, e)}
          className="hidden h-9 items-center rounded-xl border-2 border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-200 sm:inline-flex"
        >
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

function MetricChip({ icon: Icon, value, label }: { icon: React.ElementType; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-2 text-center dark:border-white/8 dark:bg-white/4">
      <Icon className="mx-auto h-3.5 w-3.5 text-blue-600" />
      <p className="mt-0.5 text-xs font-black text-slate-950 dark:text-white">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
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
  exams: string[];
  resultCount: number;
  onChange: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const activeCount = Object.entries(props.filters).filter(([k, v]) => k !== "sort" && v && v !== defaultFilters[k as keyof Filters]).length;

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

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <FilterGroup title="Exam Category" options={["All", ...CATEGORIES]} value={props.filters.category} onChange={(v) => props.onChange("category", v)} defaultOpen />
              <FilterGroup title="Exam Name" options={props.exams.slice(0, 15)} value={props.filters.exam} onChange={(v) => props.onChange("exam", v)} />
              <FilterGroup title="Year" options={["All", ...YEARS]} value={props.filters.year} onChange={(v) => props.onChange("year", v)} defaultOpen />
              <FilterGroup title="Subject" options={["All", ...SUBJECTS]} value={props.filters.subject} onChange={(v) => props.onChange("subject", v)} />
              <FilterGroup title="Difficulty" options={["All", ...DIFFICULTIES]} value={props.filters.difficulty} onChange={(v) => props.onChange("difficulty", v)} />
              <FilterGroup title="Language" options={["All", ...LANGUAGES]} value={props.filters.language} onChange={(v) => props.onChange("language", v)} />
              <FilterGroup title="Access Type" options={["All", "Free", "Premium"]} value={props.filters.access} onChange={(v) => props.onChange("access", v)} defaultOpen />
              <FilterGroup title="Attempt Status" options={["All", "Attempted", "Unattempted"]} value={props.filters.status} onChange={(v) => props.onChange("status", v)} />
              <FilterGroup title="Solved Status" options={["All", "Solved", "Unsolved"]} value={props.filters.solved} onChange={(v) => props.onChange("solved", v)} />
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

/* ─── Analytics Charts ───────────────────────────────── */

function AnalyticsCharts({ papers }: { papers: PyqPaper[] }) {
  const yearCounts = YEARS.slice(0, 6).map((year) => ({
    year,
    count: papers.filter((p) => String(p.year) === year).length || Math.max(1, Number(year) % 7),
  }));
  const maxCount = Math.max(...yearCounts.map((i) => i.count), 1);
  const subjects = SUBJECTS.slice(0, 5).map((subject, i) => ({ subject, value: 38 + i * 11 }));

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">Analytics</p>
            <h2 className="mt-0.5 text-xl font-black text-slate-950 dark:text-white">Yearly question trends</h2>
          </div>
          <LineChart className="h-6 w-6 text-blue-600" />
        </div>
        <div className="mt-6 flex h-48 items-end gap-3">
          {yearCounts.map((item) => (
            <div key={item.year} className="flex flex-1 flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }} whileInView={{ height: `${(item.count / maxCount) * 100}%` }}
                viewport={{ once: true }}
                className="w-full rounded-t-2xl bg-gradient-to-t from-blue-600 to-cyan-400"
              />
              <span className="text-xs font-black text-slate-500">{item.year}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-600">Weightage</p>
            <h2 className="mt-0.5 text-xl font-black text-slate-950 dark:text-white">Topic distribution</h2>
          </div>
          <BarChart3 className="h-6 w-6 text-violet-600" />
        </div>
        <div className="mt-6 space-y-4">
          {subjects.map((item) => (
            <div key={item.subject}>
              <div className="flex justify-between text-xs font-black text-slate-500">
                <span>{item.subject}</span><span>{item.value}%</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-white/10">
                <motion.div
                  initial={{ width: 0 }} whileInView={{ width: `${item.value}%` }}
                  viewport={{ once: true }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Recent Activity ────────────────────────────────── */

function RecentActivity({ papers, bookmarks }: { papers: PyqPaper[]; bookmarks: number }) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Recent Activity</p>
          <h2 className="mt-0.5 text-xl font-black text-slate-950 dark:text-white">Continue where you left off</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">{bookmarks} saved</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(papers.length ? papers : fallbackPapers().slice(0, 4)).map((p) => (
          <Link key={p.id} href={`/dashboard/pyq/${p.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-white/8 dark:bg-white/4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-950 dark:text-white">{p.title}</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${p.completionPercentage || 35}%` }} />
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── Premium CTA ────────────────────────────────────── */

function PremiumCTA() {
  return (
    <section className="mt-6 overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-2xl shadow-blue-950/20 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black text-amber-300">
            <Zap className="h-3 w-3" /> Premium Pass
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Unlock Complete ExamNurture Pass</h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-300">
            Every premium PYQ, AI explanations, rank prediction, downloadable PDFs, advanced analytics, and smart revision plans.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {["Unlock all PYQs", "AI solutions & explanations", "Rank prediction", "Advanced analytics"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <BookOpenCheck className="h-4 w-4 text-emerald-400" /> {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
          <p className="text-sm font-bold text-slate-300">Everything included</p>
          <p className="mt-2 text-4xl font-black">One plan</p>
          <Link
            href="/dashboard/plans"
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-slate-950 transition hover:bg-blue-50"
          >
            Unlock Complete Pass <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── SEO Footer Section ─────────────────────────────── */

function SeoSection({ onSelect }: { onSelect: (v: string) => void }) {
  return (
    <section className="border-t border-slate-200 bg-slate-100 pb-28 pt-10 dark:border-white/8 dark:bg-slate-950 sm:pb-10">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-widest text-blue-600">Popular Searches</p>
        <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Previous Year Papers by Exam</h2>
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
              ["Why solve previous year papers?", "They reveal real exam pattern, question style, speed pressure, and repeated topics — the fastest way to prepare."],
              ["Can I download PYQ PDFs?", "Yes — available papers show a download button. Premium papers require an active subscription."],
              ["Are PYQs enough for preparation?", "Use them with concepts, mock tests, and revision. PYQs are best for pattern mastery and identifying weak areas."],
              ["Can I re-attempt papers?", "Yes! Premium users can re-attempt, compare scores across attempts, and track accuracy trends over time."],
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
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100 dark:bg-white/8" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-100 dark:bg-white/8" />
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => <div key={j} className="h-5 w-14 animate-pulse rounded-full bg-slate-100 dark:bg-white/8" />)}
            </div>
            <div className="h-8 animate-pulse rounded-xl bg-slate-100 dark:bg-white/8" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-white/8" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-white/10 dark:bg-slate-900">
      <FileDown className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">No papers found</h3>
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

export default function AllPYQPage() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <PyqAllPageInner />
    </Suspense>
  );
}
