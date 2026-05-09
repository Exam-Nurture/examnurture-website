"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Clock, X, ArrowRight, BookOpen, Zap,
  RotateCcw, TrendingUp, Sparkles, Flame, Check,
  ChevronRight, Lightbulb, Target, RefreshCw,
  Bookmark, BookmarkCheck, GraduationCap, Banknote,
  Train, Shield, Layout,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ARTICLES, TYPE_META, DIFF_COLOR, ARTICLE_POPULARITY, getExamTags,
  type Article,
} from "./data";

/* ─── Type config ─── */
const CATEGORIES: { key: Article["type"] | "All"; label: string; icon: React.ReactNode; gradient: string }[] = [
  { key: "All",      label: "All",       icon: <Sparkles  size={14} />, gradient: "linear-gradient(135deg,#1E40AF,#0891B2)" },
  { key: "Concept",  label: "Concepts",  icon: <BookOpen  size={14} />, gradient: "linear-gradient(135deg,#1E40AF,#0891B2)" },
  { key: "Formula",  label: "Formulas",  icon: <Zap       size={14} />, gradient: "linear-gradient(135deg,#6D28D9,#BE185D)" },
  { key: "Revision", label: "Revision",  icon: <RefreshCw size={14} />, gradient: "linear-gradient(135deg,#92400E,#D97706)" },
  { key: "Strategy", label: "Strategy",  icon: <Target    size={14} />, gradient: "linear-gradient(135deg,#065F46,#059669)" },
];

const COVER_GRADIENTS: Record<Article["type"], string> = {
  Concept:  "linear-gradient(135deg,#3B82F6 0%,#06B6D4 100%)",
  Formula:  "linear-gradient(135deg,#8B5CF6 0%,#EC4899 100%)",
  Revision: "linear-gradient(135deg,#F59E0B 0%,#F97316 100%)",
  Strategy: "linear-gradient(135deg,#10B981 0%,#059669 100%)",
};

/* ─── Exam colour coding ─── */
const BOARD_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  "state-psc":       { bg: "rgba(16,185,129,0.1)",    text: "#10B981", label: "State PSC"  },
  "banking-po":      { bg: "rgba(59,130,246,0.1)",    text: "#3B82F6", label: "Banking PO" },
  "banking-clerk":   { bg: "rgba(6,182,212,0.12)",    text: "#06B6D4", label: "Banking"    },
  "ssc-upper":       { bg: "rgba(139,92,246,0.1)",    text: "#8B5CF6", label: "SSC"        },
  "railway-ntpc":    { bg: "rgba(245,158,11,0.1)",    text: "#F59E0B", label: "Railway"    },
  "railway-group-d": { bg: "rgba(249,115,22,0.1)",    text: "#F97316", label: "Railway"    },
  "police-si":       { bg: "rgba(239,68,68,0.1)",     text: "#EF4444", label: "Police"     },
  "upsc":            { bg: "rgba(99,102,241,0.1)",    text: "#6366F1", label: "UPSC"       },
};

function getPrimaryBoardColor(boardIds: string[]) {
  for (const id of boardIds) {
    if (BOARD_COLORS[id]) return BOARD_COLORS[id];
  }
  return null;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return (
    <>{parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-transparent font-bold text-blue-600 dark:text-blue-400">{p}</mark>
        : <span key={i}>{p}</span>
    )}</>
  );
}

function BlogCard({
  article, readSlugs, savedIds, onBookmark, query = "",
}: {
  article: Article; readSlugs: Set<string>; savedIds: Set<string>; onBookmark: (id: string) => void; query?: string;
}) {
  const meta      = TYPE_META[article.type];
  const isRead    = readSlugs.has(article.slug);
  const isSaved   = savedIds.has(article.id);
  const boardColor = getPrimaryBoardColor(article.boardIds);

  return (
    <div className="group relative flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <div className="h-1.5 w-full shrink-0" style={{ background: COVER_GRADIENTS[article.type] }} />

      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(article.id); }}
        className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isSaved ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
        title={isSaved ? "Remove bookmark" : "Save for later"}
      >
        {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
      </button>

      {isRead && (
        <span className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/50">
          <Check size={10} /> Read
        </span>
      )}

      <Link href={`/blog/${article.slug}`} className="flex flex-col flex-1 p-5 gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full w-fit mt-1" style={{ background: meta.bg, color: meta.color }}>
          {CATEGORIES.find(c => c.key === article.type)?.icon} {meta.label}
        </span>

        <h3 className="text-lg font-bold leading-snug line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pr-8">
          {query ? <Highlight text={article.title} query={query} /> : article.title}
        </h3>

        <p className="text-sm leading-relaxed line-clamp-2 flex-1 text-gray-500 dark:text-gray-400">
          {article.description}
        </p>

        <div className="flex items-center gap-2 pt-4 mt-auto border-t border-gray-100 dark:border-gray-800">
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock size={12} /> {article.readTime}
          </span>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full" style={{ background: DIFF_COLOR[article.difficulty] }} />
            {article.difficulty}
          </span>
          {boardColor && (
            <>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: boardColor.bg, color: boardColor.text }}>
                {boardColor.label}
              </span>
            </>
          )}
          <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400" />
        </div>
      </Link>
    </div>
  );
}

function PathCard({ article }: { article: Article }) {
  const meta = TYPE_META[article.type];
  const boardColor = getPrimaryBoardColor(article.boardIds);
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group shrink-0 flex flex-col w-[260px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700"
    >
      <div className="h-1.5 w-full" style={{ background: COVER_GRADIENTS[article.type] }} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit" style={{ background: meta.bg, color: meta.color }}>
          {CATEGORIES.find(c => c.key === article.type)?.icon} {meta.label}
        </span>
        <p className="text-base font-bold leading-snug line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {article.title}
        </p>
        <div className="flex items-center gap-2 mt-auto pt-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
          <Clock size={12} /> {article.readTime}
          {boardColor && (
            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: boardColor.bg, color: boardColor.text }}>
              {boardColor.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function LearningPath({ icon, title, subtitle, articles, accentColor }: { icon: React.ReactNode; title: string; subtitle: string; articles: Article[]; accentColor: string; }) {
  if (articles.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: accentColor }}>
          {icon}
        </span>
        <div>
          <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <Link href="/blog/all" className="ml-auto text-sm font-bold flex items-center gap-1 shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-700">
          See all <ChevronRight size={14} />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {articles.map(a => <PathCard key={a.id} article={a} />)}
      </div>
    </div>
  );
}

function FeaturedCard({ article, readSlugs, savedIds, onBookmark }: { article: Article; readSlugs: Set<string>; savedIds: Set<string>; onBookmark: (id: string) => void; }) {
  const meta    = TYPE_META[article.type];
  const isRead  = readSlugs.has(article.slug);
  const isSaved = savedIds.has(article.id);
  const exams   = getExamTags(article.boardIds);
  const reads   = ARTICLE_POPULARITY[article.slug] ?? 0;

  return (
    <div className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden mb-10 transition-all duration-300 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700">
      <button
        onClick={() => onBookmark(article.id)}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white/20 backdrop-blur-md text-white hover:bg-white/40"
      >
        {isSaved ? <BookmarkCheck size={18} className="text-blue-400" /> : <Bookmark size={18} />}
      </button>

      <Link href={`/blog/${article.slug}`} className="block md:flex">
        <div className="relative h-48 md:h-auto md:w-2/5 flex items-center justify-center overflow-hidden shrink-0" style={{ background: COVER_GRADIENTS[article.type] }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="opacity-[0.15] absolute" style={{ transform: "scale(5) translateX(28%) translateY(-8%)" }}>
            {article.type === "Concept"  && <BookOpen  size={32} className="text-white" />}
            {article.type === "Formula"  && <Zap       size={32} className="text-white" />}
            {article.type === "Revision" && <RefreshCw size={32} className="text-white" />}
            {article.type === "Strategy" && <Target    size={32} className="text-white" />}
          </div>
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-white/20 backdrop-blur-md">
            <Flame size={14} className="text-orange-400" /> Featured · {reads.toLocaleString("en-IN")} reads
          </div>
          {isRead && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-green-500/40 backdrop-blur-md">
              <Check size={12} /> Completed
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full" style={{ background: meta.bg, color: meta.color }}>
              {CATEGORIES.find(c => c.key === article.type)?.icon} {meta.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full" style={{ background: DIFF_COLOR[article.difficulty] }} />
              {article.difficulty}
            </span>
            {exams.slice(0, 2).map(e => {
              const bc = Object.values(BOARD_COLORS).find(b => b.label.includes(e.split(" ")[0]));
              return (
                <span key={e} className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider" style={{ background: bc?.bg ?? "rgba(139,92,246,0.1)", color: bc?.text ?? "var(--violet)" }}>
                  {e}
                </span>
              );
            })}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {article.title}
          </h2>
          <p className="text-base leading-relaxed line-clamp-2 mb-6 text-gray-600 dark:text-gray-400">
            {article.description}
          </p>

          <div className="flex items-center gap-4 mt-auto border-t border-gray-100 dark:border-gray-800 pt-4">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400">
              <Clock size={16} /> {article.readTime}
            </span>
            <span className="ml-auto flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              Read Article <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function TrendingItem({ rank, article }: { rank: number; article: Article }) {
  const meta = TYPE_META[article.type];
  return (
    <Link href={`/blog/${article.slug}`} className="flex items-start gap-3 py-3 group transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className={`text-xl font-black leading-none shrink-0 w-6 text-right tabular-nums ${rank <= 2 ? 'text-orange-500' : 'text-gray-300 dark:text-gray-600'}`}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-snug line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {article.title}
        </p>
        <p className="text-[11px] font-semibold mt-1" style={{ color: meta.color }}>{meta.label} · {article.readTime}</p>
      </div>
    </Link>
  );
}

const BM_KEY = "library-bookmarks";
function loadSaved(): Set<string> {
  try { return new Set<string>(JSON.parse(localStorage.getItem(BM_KEY) ?? "[]")); } catch { return new Set(); }
}
function toggleSaved(id: string, prev: Set<string>): Set<string> {
  const next = new Set(prev);
  next.has(id) ? next.delete(id) : next.add(id);
  try { localStorage.setItem(BM_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
  return next;
}

export default function BlogPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState<Article["type"] | "All">("All");
  const [readSlugs, setReadSlugs] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(9);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("en_lib_read");
      if (raw) setReadSlugs(new Set<string>(JSON.parse(raw)));
    } catch { /* ignore */ }
    setSavedIds(loadSaved());
  }, []);

  const handleBookmark = useCallback((id: string) => {
    setSavedIds(prev => toggleSaved(id, prev));
  }, []);

  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return ARTICLES.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.topic_tags.some(t => t.toLowerCase().includes(q)) ||
      a.subject_tags.some(s => s.toLowerCase().includes(q)) ||
      getExamTags(a.boardIds).some(e => e.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query]);

  const filtered = useMemo(() => {
    const list = activeCategory === "All" ? [...ARTICLES] : ARTICLES.filter(a => a.type === activeCategory);
    return list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [activeCategory]);

  const featured = useMemo(() => [...ARTICLES].sort((a, b) => (ARTICLE_POPULARITY[b.slug] ?? 0) - (ARTICLE_POPULARITY[a.slug] ?? 0))[0], []);
  const trending = useMemo(() => [...ARTICLES].sort((a, b) => (ARTICLE_POPULARITY[b.slug] ?? 0) - (ARTICLE_POPULARITY[a.slug] ?? 0)).slice(0, 5), []);
  const pathBanking = useMemo(() => ARTICLES.filter(a => a.boardIds.includes("banking-po")).slice(0, 6), []);
  const pathPSC = useMemo(() => ARTICLES.filter(a => a.boardIds.includes("state-psc")).slice(0, 6), []);
  const pathRevision = useMemo(() => ARTICLES.filter(a => a.type === "Revision").sort((a,b) => parseInt(a.readTime)-parseInt(b.readTime)).slice(0, 6), []);

  const gridArticles = useMemo(() => {
    const list = activeCategory === "All" ? filtered.filter(a => a.slug !== featured?.slug) : filtered;
    return list.slice(0, visibleCount);
  }, [filtered, featured, activeCategory, visibleCount]);

  const hasMore = gridArticles.length < (activeCategory === "All" ? filtered.length - 1 : filtered.length);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (!matches.length) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx(i => (i+1) % matches.length); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => (i-1+matches.length) % matches.length); }
    else if (e.key === "Enter") { e.preventDefault(); const t = matches[activeIdx]; if (t) router.push(`/blog/${t.slug}`); }
    else if (e.key === "Escape") { inputRef.current?.blur(); setFocused(false); }
  }, [matches, activeIdx, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setFocused(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setActiveIdx(0); }, [query]);
  useEffect(() => { setVisibleCount(9); }, [activeCategory]);

  const showDropdown = focused && (matches.length > 0 || query.length > 0);
  const isSearching  = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      
      {/* ── HERO SECTION ── */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-16 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
            <BookOpen className="w-4 h-4" /> Study Materials & Guides
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
            ExamNurture Blog
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Concepts, formulas, revision notes, and exam strategies — fully curated and free for every aspirant.
          </p>

          <div className="max-w-2xl mx-auto relative group" ref={dropdownRef}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 transition-colors ${focused ? "text-indigo-500" : "text-gray-400"}`} />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search articles, topics, exams..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKey}
              className="block w-full pl-12 pr-12 py-4 sm:text-lg border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 focus:border-indigo-500 transition-all shadow-sm"
            />
            {query && (
              <button onClick={e => { e.stopPropagation(); setQuery(""); inputRef.current?.focus(); }} className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
              </button>
            )}

            {/* Dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                >
                  {matches.length > 0 ? (
                    <>
                      <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        {matches.length} result{matches.length !== 1 ? "s" : ""}
                      </div>
                      {matches.map((a, i) => {
                        const meta = TYPE_META[a.type];
                        const isActive = i === activeIdx;
                        return (
                          <Link key={a.id} href={`/blog/${a.slug}`} onMouseEnter={() => setActiveIdx(i)} className={`flex items-center gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors ${isActive ? "bg-gray-50 dark:bg-gray-700/50" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: meta.bg }}>
                              {CATEGORIES.find(c => c.key === a.type)?.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                <Highlight text={a.title} query={query} />
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {a.subject_tags[0]} · {a.type} · {a.readTime}
                              </p>
                            </div>
                            <ArrowRight size={16} className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"} />
                          </Link>
                        );
                      })}
                      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                        <Link href="/blog/all" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 hover:text-indigo-700">
                          Browse all posts <ChevronRight size={16} />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-900 dark:text-white font-bold">No results for "{query}"</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Try searching for exams, topics, or subjects.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        
        {/* ── FILTERS ── */}
        {!isSearching && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
            <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2 w-full sm:w-auto">
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key as Article["type"] | "All")}
                    className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      isActive 
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md" 
                        : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className={isActive ? "opacity-90" : "text-indigo-500"}>{cat.icon}</span>
                    {cat.label}
                  </button>
                );
              })}
            </div>
            <Link href="/dashboard/my-blog" className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm">
              <Bookmark size={16} className="text-indigo-500" /> My Reading List
            </Link>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0 w-full">
            
            {isSearching ? (
              <div className="mb-8">
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">
                  {matches.length} result{matches.length !== 1 ? "s" : ""} found for "{query}"
                </p>
                {matches.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {matches.map(a => <BlogCard key={a.id} article={a} readSlugs={readSlugs} savedIds={savedIds} onBookmark={handleBookmark} query={query} />)}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-16 text-center">
                    <Lightbulb size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">No articles found</p>
                    <button onClick={() => setQuery("")} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={activeCategory} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  
                  {/* HOME VIEW */}
                  {activeCategory === "All" && (
                    <>
                      {featured && (
                        <div className="mb-12">
                          <FeaturedCard article={featured} readSlugs={readSlugs} savedIds={savedIds} onBookmark={handleBookmark} />
                        </div>
                      )}

                      <LearningPath icon={<Banknote size={20} />} title="Banking Essentials" subtitle="Top concepts & shortcuts for IBPS / SBI exams" articles={pathBanking} accentColor="linear-gradient(135deg,#3B82F6,#06B6D4)" />
                      <LearningPath icon={<GraduationCap size={20} />} title="State PSC Mastery" subtitle="History, polity, and current affairs" articles={pathPSC} accentColor="linear-gradient(135deg,#10B981,#059669)" />
                      
                      <div className="flex items-center gap-4 mb-8 mt-12">
                        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Latest Posts</h2>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {gridArticles.map(a => (
                      <BlogCard key={a.id} article={a} readSlugs={readSlugs} savedIds={savedIds} onBookmark={handleBookmark} />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="flex justify-center mt-12">
                      <button onClick={() => setVisibleCount(n => n + 8)} className="px-8 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm">
                        Load more posts
                      </button>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="hidden lg:flex flex-col gap-8 w-[320px] shrink-0 sticky top-24">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                <Flame size={16} className="text-orange-500" /> Trending Weekly
              </h3>
              <div className="flex flex-col">
                {trending.map((a, i) => <TrendingItem key={a.id} rank={i+1} article={a} />)}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">
                Explore by Exam
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { color: BOARD_COLORS["banking-po"],      icon: <Banknote    size={14} /> },
                  { color: BOARD_COLORS["state-psc"],       icon: <GraduationCap size={14} /> },
                  { color: BOARD_COLORS["ssc-upper"],       icon: <Layout      size={14} /> },
                  { color: BOARD_COLORS["railway-ntpc"],    icon: <Train       size={14} /> },
                  { color: BOARD_COLORS["police-si"],       icon: <Shield      size={14} /> },
                ].map(({ color, icon }) => (
                  <div key={color.label} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color.bg, color: color.text }}>
                      {icon}
                    </span>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{color.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl p-6 text-center shadow-sm">
              <p className="text-5xl font-black tabular-nums text-indigo-600 dark:text-indigo-400 mb-2">{ARTICLES.length}</p>
              <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Articles Published</p>
              <p className="text-xs mt-3 text-indigo-600/70 dark:text-indigo-400/70">High quality notes & strategies carefully curated for aspirants.</p>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
