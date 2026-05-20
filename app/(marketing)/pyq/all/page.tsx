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
  collection: string;
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
  collection: "All",
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
    collection: params.get("collection") ?? "All",
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
      if (filters.collection === "Trending" && p.attempts < 1500) return false;
      if (filters.collection === "Popular" && p.rating < 4.5) return false;
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

      {/* ── Unified layout: Left sidebar + Right Content ────────────── */}
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-6 items-start">

          {/* ── Left sidebar filters (desktop) ───────────── */}
          <aside className="hidden lg:flex flex-col gap-5 w-[210px] shrink-0 sticky top-20">
            {/* Search */}
            <div
              className="flex items-center gap-2 rounded-[14px] border px-3 py-2.5"
              style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
            >
              <Search size={14} style={{ color: "var(--ink-4)" }} className="shrink-0" />
              <input
                value={filters.q}
                onChange={(e) => updateFilter("q", e.target.value)}
                placeholder="Search PYQs…"
                className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[var(--ink-4)]"
                style={{ color: "var(--ink-1)" }}
              />
              {filters.q && (
                <button type="button" onClick={() => updateFilter("q", "")} style={{ color: "var(--ink-4)" }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category */}
            <div className="rounded-[14px] border p-3" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: "var(--ink-3)" }}>Category</p>
              <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto [scrollbar-width:thin]">
                {["All", ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateFilter("category", cat)}
                    className="w-full text-left px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all"
                    style={{
                      background: filters.category === cat ? "var(--blue-soft)" : "transparent",
                      color: filters.category === cat ? "var(--blue)" : "var(--ink-2)",
                      fontWeight: filters.category === cat ? 600 : 400,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Collection */}
            <div className="rounded-[14px] border p-3" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: "var(--ink-3)" }}>Collection</p>
              <div className="flex flex-col gap-0.5">
                {["All", "Trending", "Popular"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateFilter("collection", opt)}
                    className="w-full text-left px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all"
                    style={{
                      background: filters.collection === opt ? "var(--blue-soft)" : "transparent",
                      color: filters.collection === opt ? "var(--blue)" : "var(--ink-2)",
                      fontWeight: filters.collection === opt ? 600 : 400,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Access */}
            <div className="rounded-[14px] border p-3" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: "var(--ink-3)" }}>Access</p>
              <div className="flex flex-col gap-0.5">
                {["All", "Free", "Premium"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateFilter("access", opt)}
                    className="w-full text-left px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all"
                    style={{
                      background: filters.access === opt ? "var(--blue-soft)" : "transparent",
                      color: filters.access === opt ? "var(--blue)" : "var(--ink-2)",
                      fontWeight: filters.access === opt ? 600 : 400,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Exams */}
            {exams.length > 2 && (
              <div className="rounded-[14px] border p-3" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: "var(--ink-3)" }}>Exam</p>
                <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto [scrollbar-width:thin]">
                  {exams.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => updateFilter("exam", ex)}
                      className="w-full text-left px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all"
                      style={{
                        background: filters.exam === ex ? "var(--blue-soft)" : "transparent",
                        color: filters.exam === ex ? "var(--blue)" : "var(--ink-2)",
                        fontWeight: filters.exam === ex ? 600 : 400,
                      }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Year */}
            <div className="rounded-[14px] border p-3" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: "var(--ink-3)" }}>Year</p>
              <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto [scrollbar-width:thin]">
                {["All", ...YEARS].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => updateFilter("year", yr)}
                    className="w-full text-left px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all"
                    style={{
                      background: filters.year === yr ? "var(--blue-soft)" : "transparent",
                      color: filters.year === yr ? "var(--blue)" : "var(--ink-2)",
                      fontWeight: filters.year === yr ? 600 : 400,
                    }}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center justify-center gap-1.5 rounded-[12px] border py-2 text-[12px] font-semibold transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
                style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}
              >
                <RotateCcw size={12} /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
              </button>
            )}
          </aside>

          {/* ── Right content ─────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Mobile search + filter row */}
            <div className="flex gap-2 lg:hidden">
              <div
                className="flex flex-1 items-center gap-2 rounded-[14px] border px-3 py-2.5"
                style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
              >
                <Search size={14} style={{ color: "var(--ink-4)" }} />
                <input
                  value={filters.q}
                  onChange={(e) => updateFilter("q", e.target.value)}
                  placeholder="Search PYQs…"
                  className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[var(--ink-4)]"
                  style={{ color: "var(--ink-1)" }}
                />
                {filters.q && <button type="button" onClick={() => updateFilter("q", "")} style={{ color: "var(--ink-4)" }}><X size={12} /></button>}
              </div>
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="relative flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border transition-colors hover:border-[var(--blue)]"
                style={{ background: "var(--card)", borderColor: "var(--line-soft)", color: "var(--ink-2)" }}
              >
                <Filter size={15} />
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--blue)] text-[9px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
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
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {Object.entries(filters).filter(([k, v]) => k !== "sort" && v && v !== defaultFilters[k as keyof Filters]).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateFilter(key as keyof Filters, defaultFilters[key as keyof Filters])}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:opacity-80"
                    style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
                  >
                    {value} <X size={10} />
                  </button>
                ))}
                <button type="button" onClick={resetFilters} className="text-[11px] font-semibold hover:underline" style={{ color: "var(--ink-4)" }}>
                  Clear all
                </button>
              </div>
            )}
            
            {error && (
              <div className="rounded-[14px] border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-[13px] font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                {error} — showing sample data.
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

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
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
          <StatCard icon={FileText} label="PYQ Papers" value={`${Math.max(stats.total, 18)}+`} />
          <StatCard icon={Users} label="Total Attempts" value={`${Math.max(Math.round(stats.attempts / 1000), 120)}k+`} />
          <StatCard icon={GraduationCap} label="Exams Covered" value={`${Math.max(stats.exams, 8)}+`} />
          <StatCard icon={Trophy} label="Years Covered" value={`${Math.max(stats.years, 8)}+`} />
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
  const locked = paper.isPremium && paper.completionPercentage === 0;
  return (
    <article className="group flex flex-col overflow-hidden rounded-[16px] border transition-colors duration-200 hover:-translate-y-0.5 hover:border-[var(--blue)]"
             style={{ background: "var(--card)", borderColor: "var(--line-soft)", boxShadow: "var(--shadow-xs, 0 1px 4px rgba(0,0,0,.05))" }}>
      {/* Neutral banner */}
      <div className="relative h-[64px] overflow-hidden flex items-center justify-center border-b"
           style={{ background: "var(--bg-secondary)", borderColor: "var(--line-soft)" }}>
        <span className="text-2xl font-black select-none" style={{ color: "var(--line)" }}>PYQ</span>
        <div className="absolute bottom-2 left-3 flex gap-1.5">
          <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: "var(--ink-1)", color: "var(--bg)" }}>{paper.year}</span>
          {paper.isNew && <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: "var(--line)", color: "var(--ink-2)" }}>New</span>}
          {paper.isPremium && <span className="rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: "var(--line)", color: "var(--ink-2)" }}>Premium</span>}
        </div>
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
          <span className="rounded-[6px] border px-2 py-0.5 text-[9px] font-medium" style={{ background: "var(--card)", borderColor: "var(--line-soft)", color: "var(--ink-3)" }}>
            {paper.paperType}
          </span>
          <button
            type="button"
            onClick={onBookmark}
            className={`flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors ${bookmarked ? "hover:opacity-90" : ""}`}
            style={{ 
              background: bookmarked ? "var(--ink-1)" : "var(--card)", 
              borderColor: bookmarked ? "var(--ink-1)" : "var(--line-soft)", 
              color: bookmarked ? "var(--bg)" : "var(--ink-3)" 
            }}
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

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Tag tone={paper.difficulty === "Hard" ? "red" : paper.difficulty === "Moderate" ? "amber" : "slate"}>{paper.difficulty}</Tag>
          <Tag>{paper.subject}</Tag>
          <Tag>{paper.language}</Tag>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <MetricChip icon={BookOpenCheck} value={paper.totalQuestions} label="Questions" />
          <MetricChip icon={Target} value={paper.marks} label="Marks" />
          <MetricChip icon={Clock3} value={`${paper.duration}m`} label="Duration" />
        </div>

        <div className="mt-3 rounded-[8px] border px-3 py-2" style={{ background: "var(--bg-secondary)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--ink-3)" }}>
            <span>{paper.attempts.toLocaleString()} attempts</span>
            <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-current" />{paper.rating}</span>
          </div>
          {paper.completionPercentage > 0 && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--line-soft)" }}>
                <div className="h-full rounded-full" style={{ width: `${paper.completionPercentage}%`, background: "var(--ink-1)" }} />
              </div>
              <p className="mt-1 text-[10px] font-medium" style={{ color: "var(--ink-3)" }}>{paper.completionPercentage}% completed</p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 flex gap-2">
          {locked ? (
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
              <Play className="h-3.5 w-3.5 fill-current" />
              {paper.completionPercentage ? "Continue" : "Start"}
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
            <a
              href={paper.pdfUrl}
              className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-[var(--surface-hover)]"
              style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}
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
    <article className="group flex items-center gap-4 rounded-[16px] border px-4 py-3 transition hover:border-[var(--blue)]"
             style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
      <div className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${paper.bannerGradient} flex items-center justify-center`}>
        <FileText className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-[var(--blue)]" style={{ color: "var(--ink-1)" }}>{paper.title}</h3>
          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: "var(--bg-secondary)", color: "var(--ink-3)" }}>{paper.year}</span>
          {paper.isNew && <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>New</span>}
          {paper.isPremium && <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>Premium</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-semibold" style={{ color: "var(--ink-4)" }}>
          <span>{paper.examName}</span>
          <span>{paper.totalQuestions}Q · {paper.duration}m · {paper.marks}M</span>
          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{paper.rating}</span>
          <span>{paper.difficulty}</span>
          <span>{paper.language}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onBookmark} className={`flex h-8 w-8 items-center justify-center rounded-lg transition`}
                style={{
                  background: bookmarked ? "var(--ink-1)" : "transparent",
                  color: bookmarked ? "var(--bg)" : "var(--ink-3)",
                }}>
          <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
        </button>
        {locked ? (
          <Link
            href="/dashboard/plans"
            onClick={(e) => onRequireAuth?.("/dashboard/plans", e)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold transition-opacity hover:opacity-85"
            style={{ background: "var(--ink-1)", color: "var(--bg)" }}
          >
            <Zap className="h-3 w-3" /> Unlock
          </Link>
        ) : (
          <Link
            href={`/dashboard/pyq/${paper.id}`}
            onClick={(e) => onRequireAuth?.(`/dashboard/pyq/${paper.id}`, e)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold transition-opacity hover:opacity-85"
            style={{ background: "var(--blue)", color: "#fff" }}
          >
            <Play className="h-3 w-3 fill-current" /> {paper.completionPercentage ? "Continue" : "Solve"}
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

/* ─── Mobile Filter Drawer ──────────────────────── */
function MobileFilterDrawer(props: {
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
              <FilterGroup title="Collection" options={["All", "Trending", "Popular"]} value={props.filters.collection} onChange={(v) => props.onChange("collection", v)} defaultOpen />
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
