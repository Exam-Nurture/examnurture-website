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
  { key: "All",      label: "All",       icon: <Sparkles  size={13} />, gradient: "linear-gradient(135deg,#1E40AF,#0891B2)" },
  { key: "Concept",  label: "Concepts",  icon: <BookOpen  size={13} />, gradient: "linear-gradient(135deg,#1E40AF,#0891B2)" },
  { key: "Formula",  label: "Formulas",  icon: <Zap       size={13} />, gradient: "linear-gradient(135deg,#6D28D9,#BE185D)" },
  { key: "Revision", label: "Revision",  icon: <RefreshCw size={13} />, gradient: "linear-gradient(135deg,#92400E,#D97706)" },
  { key: "Strategy", label: "Strategy",  icon: <Target    size={13} />, gradient: "linear-gradient(135deg,#065F46,#059669)" },
];

const COVER_GRADIENTS: Record<Article["type"], string> = {
  Concept:  "linear-gradient(135deg,#1E40AF 0%,#0891B2 100%)",
  Formula:  "linear-gradient(135deg,#6D28D9 0%,#BE185D 100%)",
  Revision: "linear-gradient(135deg,#92400E 0%,#D97706 100%)",
  Strategy: "linear-gradient(135deg,#065F46 0%,#059669 100%)",
};

/* ─── Exam colour coding ─── */
const BOARD_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  "state-psc":       { bg: "rgba(5,150,105,0.1)",    text: "#059669", label: "State PSC"  },
  "banking-po":      { bg: "rgba(37,99,235,0.1)",    text: "#2563EB", label: "Banking PO" },
  "banking-clerk":   { bg: "rgba(14,165,233,0.12)",  text: "#0284C7", label: "Banking"    },
  "ssc-upper":       { bg: "rgba(124,58,237,0.1)",   text: "#7C3AED", label: "SSC"        },
  "railway-ntpc":    { bg: "rgba(217,119,6,0.1)",    text: "#D97706", label: "Railway"    },
  "railway-group-d": { bg: "rgba(234,88,12,0.1)",    text: "#EA580C", label: "Railway"    },
  "police-si":       { bg: "rgba(225,29,72,0.1)",    text: "#E11D48", label: "Police"     },
  "upsc":            { bg: "rgba(79,70,229,0.1)",    text: "#4F46E5", label: "UPSC"       },
};

function getPrimaryBoardColor(boardIds: string[]) {
  for (const id of boardIds) {
    if (BOARD_COLORS[id]) return BOARD_COLORS[id];
  }
  return null;
}

/* ─── Highlight search matches ─── */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return (
    <>{parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-transparent font-bold" style={{ color: "var(--blue)" }}>{p}</mark>
        : <span key={i}>{p}</span>
    )}</>
  );
}

/* ─── Blog card ─── */
function BlogCard({
  article, readSlugs, savedIds, onBookmark, query = "",
}: {
  article: Article;
  readSlugs: Set<string>;
  savedIds: Set<string>;
  onBookmark: (id: string) => void;
  query?: string;
}) {
  const meta      = TYPE_META[article.type];
  const isRead    = readSlugs.has(article.slug);
  const isSaved   = savedIds.has(article.id);
  const boardColor = getPrimaryBoardColor(article.boardIds);

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--card)",
        border: "1px solid var(--line-soft)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Type colour strip */}
      <div className="h-1 w-full shrink-0" style={{ background: COVER_GRADIENTS[article.type] }} />

      {/* Bookmark button (absolute, top-right) */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(article.id); }}
        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
        style={{
          background: isSaved ? "var(--blue-soft)" : "var(--bg)",
          color: isSaved ? "var(--blue)" : "var(--ink-4)",
          border: "1px solid var(--line-soft)",
        }}
        title={isSaved ? "Remove bookmark" : "Save for later"}
      >
        {isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
      </button>

      {/* Read check badge */}
      {isRead && (
        <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(34,197,94,0.15)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.25)" }}>
          <Check size={9} /> Read
        </span>
      )}

      {/* Card body */}
      <Link href={`/blog/${article.slug}`} className="flex flex-col flex-1 p-4 pt-3.5 gap-2">

        {/* Type badge */}
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit self-start"
          style={{ background: meta.bg, color: meta.color }}>
          {CATEGORIES.find(c => c.key === article.type)?.icon} {meta.label}
        </span>

        {/* Title — most prominent element */}
        <h3 className="text-[15px] font-bold leading-snug line-clamp-2 group-hover:text-[var(--blue)] transition-colors pr-6"
          style={{ color: "var(--ink-1)", fontFamily: "var(--font-sora)" }}>
          {query ? <Highlight text={article.title} query={query} /> : article.title}
        </h3>

        {/* Description */}
        <p className="text-[12px] leading-relaxed line-clamp-2 flex-1" style={{ color: "var(--ink-3)" }}>
          {article.description}
        </p>

        {/* Bottom metadata: ONLY time + difficulty + exam tag */}
        <div className="flex items-center gap-2 pt-3 mt-auto"
          style={{ borderTop: "1px solid var(--line-soft)" }}>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ink-4)" }}>
            <Clock size={10} /> {article.readTime}
          </span>
          <span className="text-[var(--line)]">·</span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ink-4)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: DIFF_COLOR[article.difficulty] }} />
            {article.difficulty}
          </span>
          {boardColor && (
            <>
              <span className="text-[var(--line)]">·</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: boardColor.bg, color: boardColor.text }}>
                {boardColor.label}
              </span>
            </>
          )}
          <ArrowRight size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--blue)" }} />
        </div>
      </Link>
    </div>
  );
}

/* ─── Mini card for learning paths (horizontal scroll) ─── */
function PathCard({ article }: { article: Article }) {
  const meta = TYPE_META[article.type];
  const boardColor = getPrimaryBoardColor(article.boardIds);
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group shrink-0 flex flex-col w-[200px] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--card)",
        border: "1px solid var(--line-soft)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div className="h-1 w-full" style={{ background: COVER_GRADIENTS[article.type] }} />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full w-fit"
          style={{ background: meta.bg, color: meta.color }}>
          {CATEGORIES.find(c => c.key === article.type)?.icon} {meta.label}
        </span>
        <p className="text-[13px] font-bold leading-snug line-clamp-2 group-hover:text-[var(--blue)] transition-colors"
          style={{ color: "var(--ink-1)", fontFamily: "var(--font-sora)" }}>
          {article.title}
        </p>
        <div className="flex items-center gap-2 mt-auto pt-2 text-[10.5px]" style={{ color: "var(--ink-4)", borderTop: "1px solid var(--line-soft)" }}>
          <Clock size={9} /> {article.readTime}
          {boardColor && (
            <span className="ml-auto text-[9.5px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: boardColor.bg, color: boardColor.text }}>
              {boardColor.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Learning path section ─── */
function LearningPath({
  icon, title, subtitle, articles, accentColor,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  articles: Article[];
  accentColor: string;
}) {
  if (articles.length === 0) return null;
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: accentColor, color: "#fff" }}>
          {icon}
        </span>
        <div>
          <p className="text-[13px] font-bold leading-none" style={{ color: "var(--ink-1)" }}>{title}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-4)" }}>{subtitle}</p>
        </div>
        <Link href="/blog/all" className="ml-auto text-[11px] font-semibold flex items-center gap-1 shrink-0"
          style={{ color: "var(--blue)" }}>
          See all <ChevronRight size={11} />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {articles.map(a => <PathCard key={a.id} article={a} />)}
      </div>
    </div>
  );
}

/* ─── Featured hero card ─── */
function FeaturedCard({ article, readSlugs, savedIds, onBookmark }: {
  article: Article; readSlugs: Set<string>; savedIds: Set<string>; onBookmark: (id: string) => void;
}) {
  const meta    = TYPE_META[article.type];
  const isRead  = readSlugs.has(article.slug);
  const isSaved = savedIds.has(article.id);
  const exams   = getExamTags(article.boardIds);
  const reads   = ARTICLE_POPULARITY[article.slug] ?? 0;

  return (
    <div className="group relative rounded-2xl overflow-hidden mb-7 transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: "var(--card)", border: "1px solid var(--line-soft)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      {/* Bookmark */}
      <button
        onClick={() => onBookmark(article.id)}
        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: isSaved ? "rgba(59,130,246,0.9)" : "rgba(255,255,255,0.2)",
          color: "#fff",
          backdropFilter: "blur(8px)",
        }}
      >
        {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
      </button>

      {/* Cover */}
      <Link href={`/blog/${article.slug}`} className="block">
        <div className="relative h-[140px] sm:h-[160px] flex items-center justify-center overflow-hidden"
          style={{ background: COVER_GRADIENTS[article.type] }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 30% 40%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="opacity-[0.12] absolute" style={{ transform: "scale(5) translateX(28%) translateY(-8%)" }}>
            {article.type === "Concept"  && <BookOpen  size={28} />}
            {article.type === "Formula"  && <Zap       size={28} />}
            {article.type === "Revision" && <RefreshCw size={28} />}
            {article.type === "Strategy" && <Target    size={28} />}
          </div>
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
            <Flame size={10} /> Featured · {reads.toLocaleString("en-IN")} reads
          </div>
          {isRead && (
            <div className="absolute bottom-3 left-4 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold text-white"
              style={{ background: "rgba(34,197,94,0.4)", backdropFilter: "blur(8px)" }}>
              <Check size={9} /> Completed
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: meta.bg, color: meta.color }}>
              {CATEGORIES.find(c => c.key === article.type)?.icon} {meta.label}
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ink-4)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: DIFF_COLOR[article.difficulty] }} />
              {article.difficulty}
            </span>
            {exams.slice(0, 2).map(e => {
              const bc = Object.values(BOARD_COLORS).find(b => b.label.includes(e.split(" ")[0]));
              return (
                <span key={e} className="text-[10px] font-semibold px-2 py-0.5 rounded"
                  style={{ background: bc?.bg ?? "rgba(139,92,246,0.1)", color: bc?.text ?? "var(--violet)" }}>
                  {e}
                </span>
              );
            })}
          </div>

          <h2 className="text-[19px] sm:text-[21px] font-extrabold leading-tight mb-1.5 group-hover:text-[var(--blue)] transition-colors"
            style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
            {article.title}
          </h2>
          <p className="text-[13px] leading-relaxed line-clamp-2 mb-4" style={{ color: "var(--ink-3)" }}>
            {article.description}
          </p>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-4)" }}>
              <Clock size={11} /> {article.readTime}
            </span>
            <span style={{ color: "var(--line)" }}>·</span>
            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-4)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: DIFF_COLOR[article.difficulty] }} />
              {article.difficulty}
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold transition-colors group-hover:text-[var(--blue)]"
              style={{ color: "var(--ink-3)" }}>
              Read <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ─── Trending item ─── */
function TrendingItem({ rank, article }: { rank: number; article: Article }) {
  const meta = TYPE_META[article.type];
  return (
    <Link href={`/blog/${article.slug}`}
      className="flex items-start gap-3 py-2.5 group transition-colors"
      style={{ borderBottom: rank < 5 ? "1px solid var(--line-soft)" : "none" }}>
      <span className="text-[18px] font-black leading-none shrink-0 w-5 text-right tabular-nums"
        style={{ color: rank <= 2 ? "var(--amber)" : "var(--line)" }}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold leading-snug line-clamp-2 group-hover:text-[var(--blue)] transition-colors"
          style={{ color: "var(--ink-1)" }}>
          {article.title}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: meta.color }}>{meta.label} · {article.readTime}</p>
      </div>
    </Link>
  );
}

/* ─── Bookmark helpers ─── */
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

/* ──────────────────────────────────────────────
   Page
────────────────────────────────────────────── */
export default function BlogPage() {
  const router = useRouter();

  const [query,          setQuery]          = useState("");
  const [focused,        setFocused]        = useState(false);
  const [activeIdx,      setActiveIdx]      = useState(0);
  const [activeCategory, setActiveCategory] = useState<Article["type"] | "All">("All");
  const [readSlugs,      setReadSlugs]      = useState<Set<string>>(new Set());
  const [savedIds,       setSavedIds]       = useState<Set<string>>(new Set());
  const [visibleCount,   setVisibleCount]   = useState(9);

  const inputRef    = useRef<HTMLInputElement>(null);
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

  /* Search matches */
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

  /* Category filtered list */
  const filtered = useMemo(() => {
    const list = activeCategory === "All" ? [...ARTICLES] : ARTICLES.filter(a => a.type === activeCategory);
    return list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [activeCategory]);

  /* Featured = most popular */
  const featured = useMemo(() =>
    [...ARTICLES].sort((a, b) => (ARTICLE_POPULARITY[b.slug] ?? 0) - (ARTICLE_POPULARITY[a.slug] ?? 0))[0],
  []);

  /* Trending sidebar */
  const trending = useMemo(() =>
    [...ARTICLES].sort((a, b) => (ARTICLE_POPULARITY[b.slug] ?? 0) - (ARTICLE_POPULARITY[a.slug] ?? 0)).slice(0, 5),
  []);

  /* Learning paths */
  const pathBanking  = useMemo(() => ARTICLES.filter(a => a.boardIds.includes("banking-po")).slice(0, 6), []);
  const pathPSC      = useMemo(() => ARTICLES.filter(a => a.boardIds.includes("state-psc")).slice(0, 6), []);
  const pathRevision = useMemo(() => ARTICLES.filter(a => a.type === "Revision").sort((a,b) => parseInt(a.readTime)-parseInt(b.readTime)).slice(0, 6), []);

  /* Grid articles (exclude featured when "All") */
  const gridArticles = useMemo(() => {
    const list = activeCategory === "All" ? filtered.filter(a => a.slug !== featured?.slug) : filtered;
    return list.slice(0, visibleCount);
  }, [filtered, featured, activeCategory, visibleCount]);

  const hasMore = gridArticles.length < (activeCategory === "All" ? filtered.length - 1 : filtered.length);

  /* Keyboard nav */
  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (!matches.length) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx(i => (i+1) % matches.length); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => (i-1+matches.length) % matches.length); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const t = matches[activeIdx];
      if (t) router.push(`/blog/${t.slug}`);
    }
    else if (e.key === "Escape") { inputRef.current?.blur(); setFocused(false); }
  }, [matches, activeIdx, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setActiveIdx(0); }, [query]);
  useEffect(() => { setVisibleCount(9); }, [activeCategory]);

  const showDropdown = focused && (matches.length > 0 || query.length > 0);
  const isSearching  = query.trim().length > 0;

  return (
    <div className="fade-up" style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* ── COMPACT HERO ── */}
      <div className="pt-1 pb-5 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
            ExamNurture Blog
          </h1>
          <p className="text-[12.5px] mt-1" style={{ color: "var(--ink-4)" }}>
            Concepts · Formulas · Revision · Strategy — free for every aspirant
          </p>
        </div>
        <Link href="/dashboard/my-blog"
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all hover:bg-[var(--bg)]"
          style={{ color: "var(--ink-3)", border: "1px solid var(--line-soft)", background: "var(--card)" }}>
          <Bookmark size={13} /> My Reading List
        </Link>
      </div>

      {/* ── SEARCH ── */}
      <div className="relative mb-5" ref={dropdownRef} style={{ maxWidth: 580 }}>
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] cursor-text transition-all"
          style={{
            background: "var(--card)",
            border: `1.5px solid ${focused ? "var(--blue)" : "var(--line-soft)"}`,
            boxShadow: focused ? "0 0 0 3px rgba(59,130,246,0.1)" : "0 1px 3px rgba(0,0,0,0.04)",
          }}
          onClick={() => inputRef.current?.focus()}
        >
          <Search size={15} style={{ color: focused ? "var(--blue)" : "var(--ink-4)" }} className="shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search articles, topics, exams…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent border-none outline-none text-[13.5px]"
            style={{ color: "var(--ink-1)" }}
          />
          {query ? (
            <button onClick={e => { e.stopPropagation(); setQuery(""); inputRef.current?.focus(); }}
              className="p-1 rounded hover:bg-[var(--bg)] transition-colors">
              <X size={12} style={{ color: "var(--ink-4)" }} />
            </button>
          ) : (
            <kbd className="hidden sm:inline text-[9.5px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-4)" }}>
              ⌘K
            </kbd>
          )}
        </div>

        {/* Search dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.13 }}
              className="absolute top-full left-0 right-0 mt-1.5 rounded-[12px] overflow-hidden z-30"
              style={{ background: "var(--card)", border: "1px solid var(--line-soft)", boxShadow: "0 16px 40px -8px rgba(0,0,0,0.18)" }}
            >
              {matches.length > 0 ? (
                <>
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--ink-4)", borderBottom: "1px solid var(--line-soft)" }}>
                    {matches.length} result{matches.length !== 1 ? "s" : ""}
                  </div>
                  {matches.map((a, i) => {
                    const meta = TYPE_META[a.type];
                    const isActive = i === activeIdx;
                    return (
                      <Link key={a.id} href={`/blog/${a.slug}`}
                        onMouseEnter={() => setActiveIdx(i)}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                        style={{
                          background: isActive ? "var(--bg)" : "transparent",
                          borderBottom: i < matches.length - 1 ? "1px solid var(--line-soft)" : "none",
                        }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: meta.bg, color: meta.color }}>
                          {CATEGORIES.find(c => c.key === a.type)?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold leading-snug truncate" style={{ color: "var(--ink-1)" }}>
                            <Highlight text={a.title} query={query} />
                          </p>
                          <p className="text-[10.5px] mt-0.5" style={{ color: "var(--ink-4)" }}>
                            {a.subject_tags[0]} · {a.type} · {a.readTime}
                          </p>
                        </div>
                        <ArrowRight size={12} className="shrink-0" style={{ color: isActive ? "var(--blue)" : "var(--ink-4)" }} />
                      </Link>
                    );
                  })}
                  <div className="px-4 py-2" style={{ borderTop: "1px solid var(--line-soft)" }}>
                    <Link href="/blog/all"
                      className="text-[11px] font-semibold flex items-center gap-1"
                      style={{ color: "var(--blue)" }}>
                      Browse all {ARTICLES.length} posts <ChevronRight size={11} />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                    No results for &quot;<span className="font-semibold">{query}</span>&quot;
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--ink-4)" }}>Try a topic, exam name, or subject</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SEGMENTED CATEGORY CONTROL ── */}
      {!isSearching && (
        <div className="flex items-center gap-3 mb-6">
          {/* Segmented pill container */}
          <div className="relative flex items-center gap-0.5 p-1 rounded-[14px]"
            style={{ background: "var(--bg)", border: "1px solid var(--line-soft)" }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.key;
              const count = cat.key === "All" ? ARTICLES.length : ARTICLES.filter(a => a.type === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key as Article["type"] | "All")}
                  className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[12px] font-semibold shrink-0 transition-colors duration-150 z-10"
                  style={{ color: isActive ? "#fff" : "var(--ink-3)" }}
                >
                  {/* Animated active background */}
                  {isActive && (
                    <motion.span
                      layoutId="seg-bg"
                      className="absolute inset-0 rounded-[10px] z-0"
                      style={{ background: cat.gradient }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {cat.icon}
                    {cat.label}
                    <span className={`text-[10px] font-medium ${isActive ? "opacity-70" : "opacity-50"}`}>
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <Link href="/blog/all"
            className="ml-auto shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all hover:bg-[var(--bg)]"
            style={{ color: "var(--blue)" }}>
            All posts <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* ── MAIN CONTENT + SIDEBAR ── */}
      <div className="flex gap-8 items-start">

        {/* Main column */}
        <div className="flex-1 min-w-0">

          {/* SEARCH RESULTS */}
          {isSearching && (
            <div className="mb-2">
              <p className="text-[12px] mb-4" style={{ color: "var(--ink-4)" }}>
                {matches.length} result{matches.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </p>
              {matches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map(a => (
                    <BlogCard key={a.id} article={a} readSlugs={readSlugs} savedIds={savedIds} onBookmark={handleBookmark} query={query} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Lightbulb size={32} style={{ color: "var(--ink-4)" }} />
                  <p className="text-[14px] font-semibold" style={{ color: "var(--ink-2)" }}>No articles found</p>
                  <button onClick={() => setQuery("")} className="text-[13px] font-semibold" style={{ color: "var(--blue)" }}>
                    Clear search
                  </button>
                </div>
              )}
            </div>
          )}

          {/* HOME VIEW */}
          {!isSearching && (
            <>
              <AnimatePresence mode="wait">
                {activeCategory === "All" && (
                  <motion.div key="home-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Featured post */}
                    {featured && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 flex items-center gap-1.5"
                          style={{ color: "var(--ink-4)" }}>
                          <Flame size={10} style={{ color: "var(--amber)" }} /> Most popular this month
                        </p>
                        <FeaturedCard article={featured} readSlugs={readSlugs} savedIds={savedIds} onBookmark={handleBookmark} />
                      </>
                    )}

                    {/* ── Learning Paths ── */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-[14px] font-extrabold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
                          Learning Paths
                        </h2>
                        <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
                      </div>

                      <LearningPath
                        icon={<Banknote size={13} />}
                        title="New to Banking? Start here."
                        subtitle="Essential concepts & shortcuts for IBPS / SBI exams"
                        articles={pathBanking}
                        accentColor="linear-gradient(135deg,#1E40AF,#0891B2)"
                      />
                      <LearningPath
                        icon={<GraduationCap size={13} />}
                        title="JPSC & State PSC Essentials"
                        subtitle="History, polity, and current affairs for State PSC"
                        articles={pathPSC}
                        accentColor="linear-gradient(135deg,#065F46,#059669)"
                      />
                      <LearningPath
                        icon={<RefreshCw size={13} />}
                        title="Quick Revision for Tomorrow's Exam"
                        subtitle="Short, high-yield revision notes — under 10 min each"
                        articles={pathRevision}
                        accentColor="linear-gradient(135deg,#92400E,#D97706)"
                      />
                    </div>

                    {/* All articles heading */}
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-[14px] font-extrabold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
                        Latest Posts
                      </h2>
                      <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
                    </div>
                  </motion.div>
                )}

                {activeCategory !== "All" && (
                  <motion.div key="cat-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
                    <h2 className="text-[17px] font-bold flex items-center gap-2" style={{ color: "var(--ink-1)" }}>
                      {CATEGORIES.find(c => c.key === activeCategory)?.icon}
                      {CATEGORIES.find(c => c.key === activeCategory)?.label}
                      <span className="text-[12px] font-normal" style={{ color: "var(--ink-4)" }}>
                        {filtered.length} post{filtered.length !== 1 ? "s" : ""}
                      </span>
                    </h2>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Article grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {gridArticles.map(a => (
                    <BlogCard key={a.id} article={a} readSlugs={readSlugs} savedIds={savedIds} onBookmark={handleBookmark} />
                  ))}
                </motion.div>
              </AnimatePresence>

              {hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setVisibleCount(n => n + 9)}
                    className="px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:brightness-105"
                    style={{ background: "var(--card)", color: "var(--ink-2)", border: "1px solid var(--line-soft)" }}>
                    Load more posts
                  </button>
                </div>
              )}

              {!hasMore && gridArticles.length > 0 && (
                <div className="flex justify-center mt-5">
                  <Link href="/blog/all"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:brightness-105"
                    style={{ background: "var(--card)", color: "var(--ink-2)", border: "1px solid var(--line-soft)" }}>
                    Browse all {ARTICLES.length} posts <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <aside className="hidden lg:flex flex-col gap-5 w-[224px] shrink-0 sticky top-20">

          {/* Trending */}
          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}>
            <p className="text-[10.5px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1.5"
              style={{ color: "var(--ink-4)" }}>
              <Flame size={10} style={{ color: "var(--amber)" }} /> Trending this week
            </p>
            {trending.map((a, i) => <TrendingItem key={a.id} rank={i+1} article={a} />)}
          </div>

          {/* Exam colour legend */}
          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}>
            <p className="text-[10.5px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
              Exam Tags
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { color: BOARD_COLORS["banking-po"],      icon: <Banknote    size={10} /> },
                { color: BOARD_COLORS["state-psc"],       icon: <GraduationCap size={10} /> },
                { color: BOARD_COLORS["ssc-upper"],       icon: <Layout      size={10} /> },
                { color: BOARD_COLORS["railway-ntpc"],    icon: <Train       size={10} /> },
                { color: BOARD_COLORS["police-si"],       icon: <Shield      size={10} /> },
              ].map(({ color, icon }) => (
                <div key={color.label} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                    style={{ background: color.bg, color: color.text }}>
                    {icon}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: "var(--ink-3)" }}>{color.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}>
            <p className="text-[10.5px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--ink-4)" }}>
              Quick links
            </p>
            {[
              { label: "All posts",       href: "/blog/all",  icon: <Sparkles  size={12} /> },
              { label: "My reading list", href: "/dashboard/my-blog",   icon: <BookOpen  size={12} /> },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[12px] font-medium transition-all hover:bg-[var(--bg)] mb-0.5"
                style={{ color: "var(--ink-2)" }}>
                <span style={{ color: "var(--blue)" }}>{link.icon}</span>
                {link.label}
                <ChevronRight size={10} className="ml-auto" style={{ color: "var(--ink-4)" }} />
              </Link>
            ))}
          </div>

          {/* Stats */}
          <div className="rounded-2xl p-4 text-center"
            style={{ background: "linear-gradient(135deg,var(--blue-soft),rgba(139,92,246,0.08))", border: "1px solid rgba(59,130,246,0.15)" }}>
            <p className="text-[26px] font-black tabular-nums" style={{ color: "var(--blue)" }}>{ARTICLES.length}</p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--ink-3)" }}>articles published</p>
            <p className="text-[10.5px] mt-2.5" style={{ color: "var(--ink-4)" }}>Concepts, formulas, strategies & revision notes — all free.</p>
          </div>
        </aside>
      </div>

      <div className="h-16" />
    </div>
  );
}
