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
  TrendingUp,
  Trophy,
  Users,
  BookOpenCheck,
  X,
  Zap,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const CATEGORIES = ["State PSC", "Banking", "SSC", "Railway", "Police", "Teaching", "UPSC"];
const LANGUAGES = ["English", "Hindi", "Bilingual"];
const DIFFICULTIES: SeriesDifficulty[] = ["Foundation", "Moderate", "Advanced"];
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
  id: string; title: string; description?: string; totalTests?: number;
  tierRequired?: number; isPaid?: boolean; isFeatured?: boolean; isActive?: boolean;
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
  stateName: string; examCategory: string;
  totalTests: number; fullMocks: number; sectionalTests: number; pyqTests: number;
  duration: number; language: string; difficulty: SeriesDifficulty;
  isPaid: boolean; isFeatured: boolean; isNew: boolean; isTrending: boolean;
  price: number; discountedPrice: number; discountPercent: number;
  attempts: number; rating: number; learners: number; tags: string[];
  bannerFrom: string; bannerTo: string; tint: string;
}

interface Filters {
  q: string; category: string; boardId: string; stateName: string;
  exam: string; access: string; status: string; sort: SortValue;
}

const defaultFilters: Filters = {
  q: "", category: "All", boardId: "All", stateName: "All",
  exam: "All", access: "All", status: "All", sort: "popular",
};

function readFilters(params: URLSearchParams): Filters {
  return {
    q:         params.get("q")         ?? "",
    category:  params.get("category")  ?? "All",
    boardId:   params.get("boardId")   ?? "All",
    stateName: params.get("stateName") ?? "All",
    exam:      params.get("exam")      ?? "All",
    access:    params.get("access")    ?? "All",
    status:    params.get("status")    ?? "All",
    sort:      (params.get("sort")     as SortValue) ?? "popular",
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
  const [bannerFrom, bannerTo] = BANNER_GRADIENTS[seed % BANNER_GRADIENTS.length];
  return {
    id: raw.id,
    title: raw.title || `${examName} Complete Test Series`,
    description: raw.description || "Full-length CBT-style mocks, sectional practice, analytics & solutions.",
    examName,
    examShortName: raw.exam?.shortName || examName.split(" ").map((w) => w[0]).join("").slice(0, 6),
    examSlug: raw.exam?.id || examName.toLowerCase().replace(/\s+/g, "-"),
    boardId, boardName, category, stateName, examCategory,
    totalTests,
    fullMocks: Math.max(2, Math.round(totalTests * 0.45)),
    sectionalTests: Math.max(2, Math.round(totalTests * 0.35)),
    pyqTests: Math.max(1, Math.round(totalTests * 0.2)),
    duration: 30 + (seed % 5) * 30,
    language: LANGUAGES[seed % LANGUAGES.length],
    difficulty: DIFFICULTIES[seed % DIFFICULTIES.length],
    isPaid: raw.isPaid ?? seed % 3 !== 0,
    isFeatured: raw.isFeatured ?? index < 4,
    isNew, isTrending, price, discountedPrice, discountPercent,
    attempts: raw.attemptCount ?? 0,
    rating: Number((4.4 + (seed % 6) / 10).toFixed(1)),
    learners: 800 + seed * 11,
    tags: [category, totalTests > 20 ? "Mega Pack" : "Focused Pack"],
    bannerFrom, bannerTo, tint,
  };
}

function fallbackSeries(): TestSeriesItem[] {
  return [
    { id: "demo-1", title: "JPSC Prelims Complete Test Series 2026", isPaid: true,  price: 699, discountedPrice: 399, exam: { id: "jpsc",    name: "JPSC Prelims",    shortName: "JPSC",    board: { id: "state-psc"      } } },
    { id: "demo-2", title: "SSC CGL Tier 1 2026 Mega Test Series",   isPaid: true,  price: 799, discountedPrice: 449, exam: { id: "ssc-cgl", name: "SSC CGL",          shortName: "CGL",     board: { id: "ssc-cgl"        } } },
    { id: "demo-3", title: "SBI PO Prelims 2026 Test Series",        isPaid: false,                                  exam: { id: "sbi-po",  name: "SBI PO",            shortName: "SBI PO",  board: { id: "ibps-po"        } } },
    { id: "demo-4", title: "RRB NTPC CBT-1 2025 Test Series",        isPaid: true,  price: 599, discountedPrice: 299, exam: { id: "rrb-ntpc",name: "Railway NTPC",    shortName: "NTPC",    board: { id: "railway-ntpc"   } } },
    { id: "demo-5", title: "BPSC 70th Prelims Test Series 2026",     isPaid: true,  price: 649, discountedPrice: 349, exam: { id: "bpsc",    name: "BPSC",             shortName: "BPSC",    board: { id: "state-psc"      } } },
    { id: "demo-6", title: "IBPS PO Prelims 2026 Full Series",       isPaid: false,                                  exam: { id: "ibps-po", name: "IBPS PO",           shortName: "IBPS PO", board: { id: "ibps-po"        } } },
  ].map((raw, i) => normalizeSeries(raw as RawTestSeries, i));
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

  const requireAuth = useCallback((href: string, e: React.MouseEvent) => {
    if (!user) { e.preventDefault(); setAuthModal({ open: true, next: href }); }
  }, [user]);

  useEffect(() => {
    try { const s = window.localStorage.getItem("en_series_bookmarks"); if (s) setBookmarks(new Set(JSON.parse(s))); }
    catch { setBookmarks(new Set()); }
  }, []);

  useEffect(() => { const next = readFilters(searchParams); setFilters(next); setDebouncedQ(next.q); }, [searchParams]);
  useEffect(() => { const t = window.setTimeout(() => setDebouncedQ(filters.q), 280); return () => window.clearTimeout(t); }, [filters.q]);
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
      setLoading(true); setError("");
      try {
        const res = await fetch(`${API_URL}/test-series?limit=100`);
        if (!res.ok) throw new Error("Could not load test series");
        const data = (await res.json()) as { items?: RawTestSeries[] };
        if (!cancelled) setSeries((data.items?.length ? data.items : fallbackSeries()).map(normalizeSeries));
      } catch (err) {
        if (!cancelled) { setError(err instanceof Error ? err.message : "Something went wrong"); setSeries(fallbackSeries()); }
      } finally { if (!cancelled) setLoading(false); }
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
    return series.filter((s) => {
      if (q && ![s.title, s.examName, s.description, s.category, s.boardName, s.stateName, ...s.tags].join(" ").toLowerCase().includes(q)) return false;
      if (filters.category !== "All" && s.category !== filters.category) return false;
      if (filters.boardId  !== "All" && s.boardId  !== filters.boardId)  return false;
      if (filters.stateName!== "All" && s.stateName!== filters.stateName)return false;
      if (filters.exam     !== "All" && s.examName !== filters.exam)     return false;
      if (filters.access   !== "All" && (filters.access === "Free" ? s.isPaid : !s.isPaid)) return false;
      if (filters.status === "Trending" && !s.isTrending) return false;
      if (filters.status === "New"      && !s.isNew)      return false;
      if (filters.status === "Featured" && !s.isFeatured) return false;
      return true;
    }).sort((a, b) => {
      if (filters.sort === "latest")    return Number(b.isNew)  - Number(a.isNew);
      if (filters.sort === "tests")     return b.totalTests     - a.totalTests;
      if (filters.sort === "free")      return Number(a.isPaid) - Number(b.isPaid);
      if (filters.sort === "price_asc") return (a.isPaid ? a.discountedPrice : 0) - (b.isPaid ? b.discountedPrice : 0);
      if (b.isFeatured !== a.isFeatured) return Number(b.isFeatured) - Number(a.isFeatured);
      return b.attempts - a.attempts;
    });
  }, [debouncedQ, filters, series]);

  useEffect(() => { setVisibleCount(9); }, [filteredSeries.length, filters]);
  useEffect(() => {
    const node = sentinelRef.current; if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleCount((c) => Math.min(c + 6, filteredSeries.length));
    }, { rootMargin: "400px" });
    obs.observe(node); return () => obs.disconnect();
  }, [filteredSeries.length]);

  const visibleSeries = filteredSeries.slice(0, visibleCount);

  const stats = useMemo(() => ({
    total:    series.length,
    tests:    series.reduce((s, i) => s + i.totalTests, 0),
    learners: series.reduce((s, i) => s + i.learners,   0),
    exams:    new Set(series.map((s) => s.examName)).size,
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

      {/* ── Hero — unchanged ─────────────────────────────── */}
      <HeroSection stats={stats} loading={loading} onRequireAuth={requireAuth} />

      {/* ── Listing section ──────────────────────────────── */}
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
                placeholder="Search series…"
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
              <div className="flex flex-col gap-0.5">
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

            {/* State (if available) */}
            {states.length > 2 && (
              <div className="rounded-[14px] border p-3" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: "var(--ink-3)" }}>State</p>
                <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto [scrollbar-width:thin]">
                  {states.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateFilter("stateName", st)}
                      className="w-full text-left px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all"
                      style={{
                        background: filters.stateName === st ? "var(--blue-soft)" : "transparent",
                        color: filters.stateName === st ? "var(--blue)" : "var(--ink-2)",
                        fontWeight: filters.stateName === st ? 600 : 400,
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
          <div className="flex-1 min-w-0 flex flex-col gap-4">

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
                  placeholder="Search series…"
                  className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[var(--ink-4)]"
                  style={{ color: "var(--ink-1)" }}
                />
                {filters.q && <button type="button" onClick={() => updateFilter("q", "")} style={{ color: "var(--ink-4)" }}><X size={12} /></button>}
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
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
      <MobileFilterDrawer
        open={mobileFilterOpen}
        filters={filters}
        boards={boards}
        states={states}
        resultCount={filteredSeries.length}
        onChange={updateFilter}
        onReset={resetFilters}
        onClose={() => setMobileFilterOpen(false)}
      />

      {authModal.open && (
        <AuthModal onClose={() => setAuthModal({ open: false, next: "/dashboard" })} next={authModal.next} />
      )}
    </main>
  );
}

/* ─── Hero Section ───────────────────────────────────────── */

function HeroSection({ stats, loading, onRequireAuth }: {
  stats: { total: number; tests: number; learners: number; exams: number };
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
          {!loading && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ background: "var(--blue-soft)", borderColor: "transparent", color: "var(--blue)" }}>
                <FileText size={11} /> {Math.max(stats.total, 18)}+ Series
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ background: "rgba(59,170,111,0.1)", borderColor: "transparent", color: "var(--green)" }}>
                <GraduationCap size={11} /> {Math.max(stats.exams, 8)}+ Exams
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ background: "var(--bg-secondary)", borderColor: "var(--line-soft)", color: "var(--ink-3)" }}>
                <Users size={11} /> {Math.max(Math.round(stats.learners / 1000), 240)}k+ Learners
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
            { icon: BookOpen,       label: "Test Series",    value: `${Math.max(stats.total,    18)}+`  },
            { icon: FileText,       label: "Mock Tests",     value: `${Math.max(stats.tests,   220)}+`  },
            { icon: Users,          label: "Learners",       value: `${Math.max(Math.round(stats.learners / 1000), 240)}k+` },
            { icon: GraduationCap,  label: "Exams Covered",  value: `${Math.max(stats.exams,     8)}+`  },
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

/* ─── Mobile filter drawer ───────────────────────────────── */

function MobileFilterDrawer(props: {
  open: boolean;
  filters: Filters;
  boards: { id: string; name: string }[];
  states: string[];
  resultCount: number;
  onChange: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const boardOptions     = props.boards.map((b) => b.name);
  const boardNameToId    = Object.fromEntries(props.boards.map((b) => [b.name, b.id]));
  const activeBoardName  = props.boards.find((b) => b.id === props.filters.boardId)?.name ?? "All";

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
            className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-xs flex-col"
            style={{ background: "var(--card)", borderLeft: "1px solid var(--line-soft)" }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--line-soft)" }}>
              <p className="font-semibold text-[15px]" style={{ color: "var(--ink-1)" }}>Filters · {props.resultCount} results</p>
              <button type="button" onClick={props.onClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[var(--surface-hover)]" style={{ color: "var(--ink-3)" }}>
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
              <SideFilterGroup title="Category" options={["All", ...CATEGORIES]} value={props.filters.category} onChange={(v) => props.onChange("category", v)} />
              <SideFilterGroup title="Exam Board" options={boardOptions} value={activeBoardName} onChange={(v) => props.onChange("boardId", boardNameToId[v] ?? "All")} />
              {props.states.length > 1 && <SideFilterGroup title="State" options={props.states} value={props.filters.stateName} onChange={(v) => props.onChange("stateName", v)} />}
              <SideFilterGroup title="Access" options={["All", "Free", "Premium"]} value={props.filters.access} onChange={(v) => props.onChange("access", v)} />
              <SideFilterGroup title="Status" options={["All", "Trending", "New", "Featured"]} value={props.filters.status} onChange={(v) => props.onChange("status", v)} />
            </div>
            <div className="flex gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--line-soft)" }}>
              <button type="button" onClick={() => { props.onReset(); props.onClose(); }}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] border text-[13px] font-semibold transition-colors hover:border-[var(--blue)]"
                style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}>
                <RotateCcw size={13} /> Clear all
              </button>
              <button type="button" onClick={props.onClose}
                className="flex h-11 flex-[1.4] items-center justify-center rounded-[12px] text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: "var(--blue)" }}>
                Apply
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SideFilterGroup({ title, options, value, onChange }: {
  title: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button type="button" onClick={() => setOpen((p) => !p)} className="flex w-full items-center justify-between mb-2">
        <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--ink-3)" }}>{title}</p>
        <ChevronDown size={14} style={{ color: "var(--ink-4)", transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
      </button>
      {open && (
        <div className="flex flex-col gap-0.5">
          {options.map((opt) => (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              className="w-full text-left px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all"
              style={{
                background: value === opt ? "var(--blue-soft)" : "transparent",
                color: value === opt ? "var(--blue)" : "var(--ink-2)",
                fontWeight: value === opt ? 600 : 400,
              }}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
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
