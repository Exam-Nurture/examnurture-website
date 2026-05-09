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
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileDown,
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
  TrendingUp,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];
const CATEGORIES = ["State PSC", "Banking", "SSC", "Railway", "Police", "Teaching", "UPSC"];
const SUBJECTS = ["General Studies", "Quant", "Reasoning", "English", "Current Affairs", "Jharkhand GK"];
const DIFFICULTIES: PyqDifficulty[] = ["Easy", "Moderate", "Hard"];
const LANGUAGES = ["English", "Hindi", "Bilingual"];
const SORTS = [
  { value: "latest", label: "Latest added" },
  { value: "attempted", label: "Most attempted" },
  { value: "rated", label: "Highest rated" },
  { value: "topic", label: "Topic-wise" },
  { value: "full", label: "Full paper" },
  { value: "sectional", label: "Sectional paper" },
] as const;

const CATEGORY_DISCOVERY = [
  { name: "SSC Exams", category: "SSC", count: 31, icon: FileText, gradient: "from-blue-600 to-cyan-500" },
  { name: "Banking Exams", category: "Banking", count: 79, icon: ShieldCheck, gradient: "from-emerald-600 to-teal-400" },
  { name: "State Govt. Exams", category: "State PSC", count: 663, icon: GraduationCap, gradient: "from-violet-600 to-fuchsia-400" },
  { name: "Railways Exams", category: "Railway", count: 33, icon: TrendingUp, gradient: "from-amber-500 to-orange-500" },
  { name: "Police Exams", category: "Police", count: 89, icon: Target, gradient: "from-rose-600 to-pink-400" },
  { name: "Teaching Exams", category: "Teaching", count: 164, icon: BookOpenCheck, gradient: "from-sky-600 to-blue-400" },
];

const SEO_GROUPS = [
  { title: "Latest SSC Exams Previous Year Papers", links: ["SSC CGL Previous Year Papers", "SSC CHSL Previous Year Papers", "SSC MTS Previous Year Papers", "SSC GD Constable Papers", "SSC CPO Previous Year Papers"] },
  { title: "Latest Banking Exams Previous Year Papers", links: ["SBI PO Previous Year Papers", "IBPS PO Previous Year Papers", "RBI Grade B Previous Year Papers", "NABARD Grade A Previous Year Papers", "IBPS Clerk Previous Year Papers"] },
  { title: "Latest State PSC Exams Previous Year Papers", links: ["JPSC Prelims Previous Year Papers", "BPSC Previous Year Papers", "UPPSC Previous Year Papers", "MPSC Previous Year Papers", "TNPSC Group 4 Previous Year Papers"] },
  { title: "Latest Railway Exams Previous Year Papers", links: ["RRB NTPC Previous Year Papers", "RRB Group D Previous Year Papers", "RRB ALP Previous Year Papers", "RRB JE Previous Year Papers", "RPF SI Previous Year Papers"] },
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
  thumbnail: string;
  tags: string[];
  selectionRatio: string;
  isNew: boolean;
  paperType: "Full Paper" | "Sectional";
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
    thumbnail: `/examnurture-logo.jpg`,
    tags: [subject, category, seed % 2 === 0 ? "Full Paper" : "Topic-wise"],
    selectionRatio: `${8 + (seed % 21)}%`,
    isNew: year >= 2024 || index < 3,
    paperType: seed % 3 === 0 ? "Sectional" : "Full Paper",
  };
}

function fallbackPapers(): PyqPaper[] {
  const names = ["JPSC Prelims", "SSC CGL", "BPSC", "SBI PO", "Railway NTPC", "UP Police", "CTET", "RBI Grade B"];
  return Array.from({ length: 18 }, (_, index) =>
    normalizePaper({
      id: `demo-pyq-${index + 1}`,
      title: `${names[index % names.length]} ${2025 - (index % 7)} Official PYQ Paper`,
      year: 2025 - (index % 7),
      totalQuestions: 100 + (index % 4) * 25,
      durationSec: (90 + (index % 3) * 30) * 60,
      exam: { id: names[index % names.length].toLowerCase().replace(/\s+/g, "-"), name: names[index % names.length] },
      pdfUrl: "#",
    }, index)
  );
}

function PyqAllPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [papers, setPapers] = useState<PyqPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(9);
  const [filters, setFilters] = useState<Filters>(() => readFilters(searchParams));
  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("en_pyq_bookmarks");
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
    async function loadPapers() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (filters.year !== "All") params.set("year", filters.year);
        const res = await fetch(`${API_URL}/pyq?${params.toString()}`);
        if (!res.ok) throw new Error("Could not load PYQ papers");
        const data = (await res.json()) as { items?: RawPYQPaper[] };
        if (!cancelled) {
          const normalized = (data.items && data.items.length ? data.items : fallbackPapers()).map(normalizePaper);
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
    loadPapers();
    return () => {
      cancelled = true;
    };
  }, [filters.year]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleCount((count) => Math.min(count + 6, filteredPapers.length));
    }, { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  });

  const exams = useMemo(() => ["All", ...Array.from(new Set(papers.map((paper) => paper.examName))).sort()], [papers]);

  const filteredPapers = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    const result = papers.filter((paper) => {
      const matchesSearch = !q || [paper.title, paper.examName, paper.subject, paper.category, ...paper.tags].join(" ").toLowerCase().includes(q);
      const matchesCategory = filters.category === "All" || paper.category === filters.category;
      const matchesExam = filters.exam === "All" || paper.examName === filters.exam;
      const matchesYear = filters.year === "All" || String(paper.year) === filters.year;
      const matchesSubject = filters.subject === "All" || paper.subject === filters.subject;
      const matchesDifficulty = filters.difficulty === "All" || paper.difficulty === filters.difficulty;
      const matchesLanguage = filters.language === "All" || paper.language === filters.language;
      const matchesAccess = filters.access === "All" || (filters.access === "Free" ? !paper.isPremium : paper.isPremium);
      const matchesStatus = filters.status === "All" || (filters.status === "Attempted" ? paper.completionPercentage > 0 : paper.completionPercentage === 0);
      const matchesSolved = filters.solved === "All" || (filters.solved === "Solved" ? paper.completionPercentage === 100 : paper.completionPercentage < 100);
      return matchesSearch && matchesCategory && matchesExam && matchesYear && matchesSubject && matchesDifficulty && matchesLanguage && matchesAccess && matchesStatus && matchesSolved;
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

  useEffect(() => {
    setVisibleCount(9);
  }, [filteredPapers.length, filters]);

  const visiblePapers = filteredPapers.slice(0, visibleCount);
  const stats = useMemo(() => ({
    total: papers.length,
    attempts: papers.reduce((sum, paper) => sum + paper.attempts, 0),
    exams: new Set(papers.map((paper) => paper.examName)).size,
    successRate: Math.round(68 + Math.min(papers.length, 22) / 2),
  }), [papers]);

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
      window.localStorage.setItem("en_pyq_bookmarks", JSON.stringify(Array.from(next)));
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950 dark:bg-slate-950 dark:text-white">
      <HeroSection
        filters={filters}
        stats={stats}
        onSearch={(value) => updateFilter("q", value)}
        onQuickExam={(value) => updateFilter("exam", value)}
      />

      <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <CategoryDiscoveryGrid onSelectCategory={(value) => updateFilter("category", value)} />
        <TrendingCarousel papers={papers} />

        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <FilterSidebar
              filters={filters}
              exams={exams}
              onChange={updateFilter}
              onReset={resetFilters}
              resultCount={filteredPapers.length}
            />
          </aside>

          <section className="min-w-0">
            <div className="sticky top-16 z-20 mb-4 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Master PYQ Library</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight md:text-2xl">{filteredPapers.length} papers ready to solve</h2>
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
            ) : filteredPapers.length === 0 ? (
              <EmptyState onReset={resetFilters} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                  {visiblePapers.map((paper, index) => (
                    <PyqCard
                      key={paper.id}
                      paper={paper}
                      index={index}
                      bookmarked={bookmarks.has(paper.id)}
                      onBookmark={() => toggleBookmark(paper.id)}
                    />
                  ))}
                </div>
                <div ref={sentinelRef} className="h-12" />
                {visibleCount < filteredPapers.length && (
                  <div className="mt-4 flex justify-center">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => setVisibleCount((count) => count + 9)}>
                      Load more PYQs
                    </Button>
                  </div>
                )}
              </>
            )}

            <AnalyticsCharts papers={papers} />
            <RecentActivity papers={papers.filter((paper) => paper.completionPercentage > 0).slice(0, 4)} bookmarks={bookmarks.size} />
            <PremiumCTA />
            <SeoLinkSection onSelect={(value) => updateFilter("q", value)} />
          </section>
        </div>
      </div>

      <MobileFilterDrawer
        open={mobileFiltersOpen}
        filters={filters}
        exams={exams}
        resultCount={filteredPapers.length}
        onChange={updateFilter}
        onReset={resetFilters}
        onClose={() => setMobileFiltersOpen(false)}
      />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/90 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Button type="button" variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setMobileFiltersOpen(true)}>
            <ListFilter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Link href={visiblePapers[0] ? `/dashboard/pyq/${visiblePapers[0].id}` : "/dashboard/pyq"} className="inline-flex h-12 flex-[1.3] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/25">
            Start solving <Play className="h-4 w-4 fill-white" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function HeroSection({ filters, stats, onSearch, onQuickExam }: {
  filters: Filters;
  stats: { total: number; attempts: number; exams: number; successRate: number };
  onSearch: (value: string) => void;
  onQuickExam: (value: string) => void;
}) {
  const trending = ["JPSC Prelims", "SSC CGL", "BPSC", "SBI PO", "Railway NTPC"];
  return (
    <section className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#ffffff_0%,#eef4ff_50%,#fff7ed_100%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,#1d4ed8,transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)]">
      <div className="absolute left-10 top-14 h-28 w-28 rounded-full border border-blue-200/70 bg-white/30 blur-sm dark:border-blue-400/20 dark:bg-blue-400/10" />
      <div className="absolute right-8 top-20 h-40 w-40 rounded-full border border-amber-200/70 bg-amber-100/30 blur-sm dark:border-amber-400/20 dark:bg-amber-400/10" />
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-7xl dark:text-white">
            Previous Year Question Papers
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            Solve real exam papers from SSC, UPSC, Banking, Railways, BPSC & more.
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

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} className="relative">
          <div className="grid grid-cols-2 gap-4">
            <HeroStat icon={FileText} label="Total PYQs" value={`${Math.max(stats.total, 18)}+`} color="blue" />
            <HeroStat icon={Activity} label="Total attempts" value={`${Math.round(stats.attempts / 1000)}k+`} color="emerald" />
            <HeroStat icon={GraduationCap} label="Exams covered" value={`${Math.max(stats.exams, 8)}+`} color="violet" />
            <HeroStat icon={Trophy} label="Success rate" value={`${stats.successRate}%`} color="amber" />
          </div>
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
        placeholder="Search exam, subject, year or paper..."
        className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
      />
      <Button type="button" className="hidden h-12 rounded-xl px-5 sm:inline-flex">Search</Button>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value, color = "blue" }: { icon: React.ElementType; label: string; value: string; color?: "blue" | "emerald" | "violet" | "amber" }) {
  const colorStyles = {
    blue: "from-blue-500/10 to-cyan-500/5 border-blue-200/60 shadow-blue-900/5 dark:from-blue-500/10 dark:to-cyan-500/5 dark:border-blue-400/20",
    emerald: "from-emerald-500/10 to-teal-500/5 border-emerald-200/60 shadow-emerald-900/5 dark:from-emerald-500/10 dark:to-teal-500/5 dark:border-emerald-400/20",
    violet: "from-violet-500/10 to-purple-500/5 border-violet-200/60 shadow-violet-900/5 dark:from-violet-500/10 dark:to-purple-500/5 dark:border-violet-400/20",
    amber: "from-amber-500/10 to-orange-500/5 border-amber-200/60 shadow-amber-900/5 dark:from-amber-500/10 dark:to-orange-500/5 dark:border-amber-400/20",
  };
  
  const iconBgStyles = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30",
    emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30",
    violet: "bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-violet-500/30",
    amber: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/30",
  };

  return (
    <div className={`group relative overflow-hidden rounded-[28px] border bg-gradient-to-br bg-white/60 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl dark:bg-slate-900/50 ${colorStyles[color]}`}>
      <div className="relative z-10">
        <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${iconBgStyles[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
        <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
      </div>
      
      {/* Decorative flair */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/60 blur-3xl transition-all duration-500 group-hover:bg-white/80 dark:bg-white/5" />
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/40 blur-2xl transition-all duration-500 group-hover:bg-white/60 dark:bg-white/5" />
    </div>
  );
}


function CategoryDiscoveryGrid({ onSelectCategory }: { onSelectCategory: (value: string) => void }) {
  return (
    <section className="mb-6 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Explore by exam category</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Previous Year Papers for popular govt. exams</h2>
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
              <p className="mt-1 text-xs font-bold text-slate-400">{item.count} exams</p>
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
          <h3 className="text-lg font-black">{props.resultCount} matching papers</h3>
        </div>
        <button type="button" onClick={props.onReset} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 dark:bg-white/10">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        <FilterGroup title="Exam Category" options={["All", ...CATEGORIES]} value={props.filters.category} onChange={(value) => props.onChange("category", value)} />
        <FilterGroup title="Exam Name" options={props.exams} value={props.filters.exam} onChange={(value) => props.onChange("exam", value)} />
        <FilterGroup title="Year" options={["All", ...YEARS]} value={props.filters.year} onChange={(value) => props.onChange("year", value)} />
        <FilterGroup title="Subject" options={["All", ...SUBJECTS]} value={props.filters.subject} onChange={(value) => props.onChange("subject", value)} />
        <FilterGroup title="Difficulty" options={["All", ...DIFFICULTIES]} value={props.filters.difficulty} onChange={(value) => props.onChange("difficulty", value)} />
        <FilterGroup title="Language" options={["All", ...LANGUAGES]} value={props.filters.language} onChange={(value) => props.onChange("language", value)} />
        <FilterGroup title="Access" options={["All", "Free", "Premium"]} value={props.filters.access} onChange={(value) => props.onChange("access", value)} />
        <FilterGroup title="Attempt Status" options={["All", "Attempted", "Unattempted"]} value={props.filters.status} onChange={(value) => props.onChange("status", value)} />
        <FilterGroup title="Solved Status" options={["All", "Solved", "Unsolved"]} value={props.filters.solved} onChange={(value) => props.onChange("solved", value)} />
      </div>
    </div>
  );
}

function FilterGroup({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(["Exam Category", "Year", "Access"].includes(title));
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

function PyqCard({ paper, index, bookmarked, onBookmark }: { paper: PyqPaper; index: number; bookmarked: boolean; onBookmark: () => void }) {
  const locked = paper.isPremium && paper.completionPercentage === 0;
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.25) }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white p-4 shadow-sm transition hover:shadow-2xl hover:shadow-blue-900/10 dark:border-white/10 dark:bg-slate-900"
    >
      {locked && <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-blue-600">{paper.examName}</p>
            <h3 className="mt-1 line-clamp-2 text-lg font-black leading-snug text-slate-950 group-hover:text-blue-700 dark:text-white">{paper.title}</h3>
          </div>
        </div>
        <button type="button" onClick={onBookmark} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${bookmarked ? "border-blue-200 bg-blue-50 text-blue-600" : "border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600 dark:border-white/10"}`}>
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-blue-600" : ""}`} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="blue">{paper.year}</Badge>
        <Badge tone={paper.difficulty === "Hard" ? "red" : paper.difficulty === "Moderate" ? "amber" : "green"}>{paper.difficulty}</Badge>
        <Badge tone={paper.isPremium ? "amber" : "green"}>{paper.isPremium ? "Premium" : "Free"}</Badge>
        {paper.isNew && <Badge tone="purple">New</Badge>}
        <Badge tone="slate">{paper.language}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MiniMetric icon={BookOpenCheck} value={paper.totalQuestions} label="Questions" />
        <MiniMetric icon={Target} value={paper.marks} label="Marks" />
        <MiniMetric icon={Clock3} value={`${paper.duration}m`} label="Duration" />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{paper.attempts.toLocaleString()} attempts</span>
          <span>{paper.selectionRatio} selection ratio</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${Math.max(paper.completionPercentage, 8)}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500">{paper.completionPercentage ? `${paper.completionPercentage}% completed` : "Fresh attempt"}</span>
          <span className="inline-flex items-center gap-1 text-amber-500"><Star className="h-3 w-3 fill-amber-400" /> {paper.rating}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link href={locked ? "/dashboard/plans" : `/dashboard/pyq/${paper.id}`} className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-black text-white shadow-lg transition ${locked ? "bg-slate-900 shadow-slate-900/20 dark:bg-white dark:text-slate-950" : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700"}`}>
          {locked ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
          {locked ? "Unlock" : paper.completionPercentage ? "Continue Attempt" : "Start Solving"}
        </Link>
        <Link href={`/dashboard/pyq/${paper.id}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-200">
          Details
        </Link>
        <a href={paper.pdfUrl || "#"} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 dark:border-white/10" aria-label="Download PDF">
          <Download className="h-4 w-4" />
        </a>
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

function TrendingCarousel({ papers }: { papers: PyqPaper[] }) {
  const items = papers.slice(0, 8);
  return (
    <section className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Trending this week</p>
          <h2 className="text-xl font-black">Most attempted PYQs</h2>
        </div>
        <Flame className="h-6 w-6 text-amber-500" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
        {items.map((paper) => (
          <Link key={paper.id} href={`/dashboard/pyq/${paper.id}`} className="min-w-[260px] rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-blue-50 p-4 transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:from-white/10 dark:to-blue-500/10">
            <div className="flex items-center justify-between">
              <Badge tone="amber">Topper recommended</Badge>
              <span className="text-xs font-black text-slate-400">{paper.year}</span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-sm font-black">{paper.title}</h3>
            <div className="mt-3 flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-blue-500" /> {paper.attempts.toLocaleString()}</span>
              <span className="inline-flex items-center gap-1"><Gauge className="h-3 w-3 text-amber-500" /> {paper.difficulty}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function AnalyticsCharts({ papers }: { papers: PyqPaper[] }) {
  const yearCounts = YEARS.slice(0, 6).map((year) => ({ year, count: papers.filter((paper) => String(paper.year) === year).length || Math.max(1, Number(year) % 7) }));
  const maxCount = Math.max(...yearCounts.map((item) => item.count), 1);
  const subjects = SUBJECTS.slice(0, 5).map((subject, index) => ({ subject, value: 38 + index * 11 }));
  return (
    <section className="mt-8 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-3xl border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Analytics</p>
            <h2 className="text-xl font-black">Yearly question trends</h2>
          </div>
          <LineChart className="h-6 w-6 text-blue-600" />
        </div>
        <div className="mt-6 flex h-56 items-end gap-3">
          {yearCounts.map((item) => (
            <div key={item.year} className="flex flex-1 flex-col items-center gap-2">
              <motion.div initial={{ height: 0 }} whileInView={{ height: `${(item.count / maxCount) * 100}%` }} viewport={{ once: true }} className="w-full rounded-t-2xl bg-gradient-to-t from-blue-600 to-cyan-400" />
              <span className="text-xs font-black text-slate-500">{item.year}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-3xl border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Weightage</p>
            <h2 className="text-xl font-black">Topic distribution</h2>
          </div>
          <BarChart3 className="h-6 w-6 text-violet-600" />
        </div>
        <div className="mt-6 space-y-4">
          {subjects.map((item) => (
            <div key={item.subject}>
              <div className="flex justify-between text-xs font-black text-slate-500">
                <span>{item.subject}</span>
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

function RecentActivity({ papers, bookmarks }: { papers: PyqPaper[]; bookmarks: number }) {
  return (
    <section className="mt-8 rounded-3xl border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Recent activity</p>
          <h2 className="text-xl font-black">Continue where you left off</h2>
        </div>
        <Badge tone="green">{bookmarks} saved</Badge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {(papers.length ? papers : fallbackPapers().slice(0, 4)).map((paper) => (
          <Link key={paper.id} href={`/dashboard/pyq/${paper.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/[0.03]">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{paper.title}</p>
              <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paper.completionPercentage || 35}%` }} />
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
            Get every premium PYQ, advanced analytics, AI explanations, rank prediction, downloadable PDFs, and smart revision plans.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {["Unlock all PYQs", "AI solutions", "Rank prediction", "Advanced analytics"].map((item) => (
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
        <h2 className="mt-1 text-2xl font-black tracking-tight">Latest previous year papers by exam</h2>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
          Quick links help learners and search engines discover exam-specific PYQ collections faster.
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
        <h3 className="text-lg font-black">FAQs of Previous Year Papers</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            ["Why solve previous year papers?", "They reveal real exam pattern, question style, speed pressure, and repeated topics."],
            ["Can I download PYQ PDFs?", "Yes, available papers can be downloaded from each PYQ card using the PDF action."],
            ["Are PYQs enough for preparation?", "Use them with concepts, mock tests, and revision. PYQs are best for pattern mastery."],
            ["Can I re-attempt papers?", "Premium users can re-attempt and compare accuracy, rank, and weak-area trends."],
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
        <div key={index} className="h-[350px] animate-pulse rounded-3xl border border-white/80 bg-white dark:border-white/10 dark:bg-slate-900">
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
      <FileDown className="mx-auto h-12 w-12 text-slate-300" />
      <h3 className="mt-4 text-xl font-black">No PYQ papers found</h3>
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

export default function AllPYQPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PyqAllPageInner />
    </Suspense>
  );
}
