"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Clock, X, ArrowRight, BookOpen, Zap,
  RotateCcw, TrendingUp, Sparkles, Flame, Check,
  ChevronRight, Filter, SortDesc,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ARTICLES, SUBJECT_OPTIONS, EXAM_OPTIONS, TYPE_META, DIFF_COLOR,
  ARTICLE_POPULARITY, getExamTags,
  type Article,
} from "./data";

/* ── Icons ── */
const TYPE_ICONS: Record<Article["type"], React.ReactNode> = {
  Concept:  <BookOpen size={13} />,
  Formula:  <Zap size={13} />,
  Revision: <RotateCcw size={13} />,
  Strategy: <TrendingUp size={13} />,
};

/* ── Highlight matched text ── */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return (
    <>{parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-transparent" style={{ color: "var(--blue)", fontWeight: 700 }}>{p}</mark>
        : <span key={i}>{p}</span>
    )}</>
  );
}

/* ── Filter pill button ── */
function FilterPill({
  label, active, color, bg, onClick, count,
}: {
  label: React.ReactNode; active: boolean; color: string; bg: string;
  onClick: () => void; count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all shrink-0"
      style={{
        background: active ? color : "var(--card)",
        color: active ? "#fff" : "var(--ink-3)",
        border: `1.5px solid ${active ? color : "var(--line-soft)"}`,
        boxShadow: active ? `0 2px 10px -3px ${color}66` : "none",
      }}
    >
      {label}
      {count !== undefined && (
        <span className="text-[10px] font-normal opacity-75">{count}</span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function LibraryPage() {
  const router = useRouter();

  /* Search state */
  const [query, setQuery]         = useState("");
  const [focused, setFocused]     = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  /* Browse filters */
  const [activeType,    setActiveType]    = useState<Article["type"] | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeExam,    setActiveExam]    = useState<string | null>(null);

  /* Read tracking */
  const [readSlugs, setReadSlugs] = useState<Set<string>>(new Set());

  const inputRef   = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Load read slugs from localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("en_lib_read");
      if (raw) setReadSlugs(new Set<string>(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  /* Live search matches */
  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return ARTICLES.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.topic_tags.some((t) => t.toLowerCase().includes(q)) ||
      a.subject_tags.some((s) => s.toLowerCase().includes(q)) ||
      getExamTags(a.boardIds).some((e) => e.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query]);

  /* Browse filter results */
  const browsed = useMemo(() => {
    if (!activeType && !activeSubject && !activeExam) return [];
    return ARTICLES.filter((a) => {
      if (activeType    && a.type !== activeType)                         return false;
      if (activeSubject && !a.subject_tags.includes(activeSubject))       return false;
      if (activeExam    && !getExamTags(a.boardIds).includes(activeExam)) return false;
      return true;
    }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [activeType, activeSubject, activeExam]);

  /* Popular = top 6 by monthly reads */
  const popular = useMemo(() =>
    [...ARTICLES]
      .filter((a) => (ARTICLE_POPULARITY[a.slug] ?? 0) > 0)
      .sort((a, b) => (ARTICLE_POPULARITY[b.slug] ?? 0) - (ARTICLE_POPULARITY[a.slug] ?? 0))
      .slice(0, 6),
  []);

  /* Latest = newest 8 */
  const latest = useMemo(() =>
    [...ARTICLES]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 8),
  []);

  /* Keyboard nav in dropdown */
  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (matches.length === 0) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx((i) => (i + 1) % matches.length); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => (i - 1 + matches.length) % matches.length); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const target = matches[activeIdx];
      if (target) router.push(`/library/${target.slug}`);
    }
    else if (e.key === "Escape") { inputRef.current?.blur(); setFocused(false); }
  }, [matches, activeIdx, router]);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const showDropdown = focused && (matches.length > 0 || query.length > 0);
  const isBrowsing   = !!(activeType || activeSubject || activeExam);
  const clearFilters = () => { setActiveType(null); setActiveSubject(null); setActiveExam(null); };

  return (
    <div className="flex flex-col fade-up" style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* ── HERO ── */}
      <div className="pt-4 pb-8 text-center" ref={dropdownRef}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
          style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>
          <Sparkles size={11} /> Nurture Library
        </div>

        <h1 className="text-[32px] sm:text-[38px] font-bold tracking-tight leading-tight"
          style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
          The knowledge base for govt exams
        </h1>
        <p className="mt-2.5 text-[14px]" style={{ color: "var(--ink-3)" }}>
          Concepts · Strategies · Formulas · Revision notes — searchable, free for everyone.
        </p>

        {/* Big search */}
        <div className="relative mt-7 max-w-[620px] mx-auto">
          <div
            className="flex items-center gap-3 px-5 py-3.5 rounded-[14px] transition-all cursor-text"
            style={{
              background: "var(--card)",
              border: focused ? "1.5px solid var(--blue)" : "1.5px solid var(--line-soft)",
              boxShadow: focused ? "0 6px 20px -6px rgba(59,130,246,0.3)" : "var(--shadow-xs)",
            }}
            onClick={() => inputRef.current?.focus()}
          >
            <Search size={17} style={{ color: focused ? "var(--blue)" : "var(--ink-4)" }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search any topic, exam, concept…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKey}
              className="flex-1 bg-transparent border-none outline-none text-[14.5px]"
              style={{ color: "var(--ink-1)" }}
            />
            {query && (
              <button onClick={(e) => { e.stopPropagation(); setQuery(""); inputRef.current?.focus(); }}
                className="p-1 rounded-md hover:bg-[var(--bg)]">
                <X size={13} style={{ color: "var(--ink-4)" }} />
              </button>
            )}
            <kbd className="hidden sm:inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]"
              style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-4)" }}>
              ⌘K
            </kbd>
          </div>

          {/* Search dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-[14px] overflow-hidden z-30 text-left"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--line-soft)",
                  boxShadow: "0 12px 32px -8px rgba(0,0,0,0.18)",
                }}
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
                      const isRead   = readSlugs.has(a.slug);
                      return (
                        <Link key={a.id} href={`/library/${a.slug}`}
                          onMouseEnter={() => setActiveIdx(i)}
                          className="flex items-start gap-3 px-4 py-3 transition-colors"
                          style={{
                            background: isActive ? "var(--bg)" : "transparent",
                            borderBottom: i < matches.length - 1 ? "1px solid var(--line-soft)" : "none",
                          }}>
                          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: meta.bg, color: meta.color }}>
                            {TYPE_ICONS[a.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold leading-snug truncate" style={{ color: "var(--ink-1)" }}>
                              <Highlight text={a.title} query={query} />
                            </p>
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--ink-4)" }}>
                              {a.subject_tags[0]} · {a.type} · {a.readTime}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 mt-1">
                            {isRead && (
                              <span className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: "var(--green)" }}>
                                <Check size={9} className="text-white" />
                              </span>
                            )}
                            <ArrowRight size={13} style={{ color: isActive ? "var(--blue)" : "var(--ink-4)" }} />
                          </div>
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                      No results for &quot;<span className="font-semibold">{query}</span>&quot;
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "var(--ink-4)" }}>
                      Try a different topic or browse by filters below
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── FILTER BAR (only when not searching) ── */}
      {!query && (
        <div className="mb-8 space-y-3">
          {/* Type pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {(Object.keys(TYPE_META) as Article["type"][]).map((t) => {
              const meta  = TYPE_META[t];
              const count = ARTICLES.filter((a) => a.type === t).length;
              return (
                <FilterPill key={t}
                  label={<>{TYPE_ICONS[t]}{t}</>}
                  active={activeType === t}
                  color={meta.color} bg={meta.bg}
                  count={count}
                  onClick={() => { setActiveType(activeType === t ? null : t); setActiveSubject(null); setActiveExam(null); }}
                />
              );
            })}
          </div>

          {/* Subject + Exam in one row */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: "var(--ink-5, var(--ink-4))" }}>
              Subject:
            </span>
            {SUBJECT_OPTIONS.map((s) => {
              const count = ARTICLES.filter((a) => a.subject_tags.includes(s)).length;
              if (!count) return null;
              return (
                <FilterPill key={s}
                  label={s}
                  active={activeSubject === s}
                  color="var(--ink-1)" bg="var(--bg)"
                  count={count}
                  onClick={() => { setActiveSubject(activeSubject === s ? null : s); setActiveType(null); setActiveExam(null); }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: "var(--ink-5, var(--ink-4))" }}>
              Exam:
            </span>
            {EXAM_OPTIONS.slice(0, 8).map((e) => {
              const count = ARTICLES.filter((a) => getExamTags(a.boardIds).includes(e)).length;
              if (!count) return null;
              return (
                <FilterPill key={e}
                  label={e}
                  active={activeExam === e}
                  color="var(--violet)" bg="rgba(139,92,246,0.08)"
                  count={count}
                  onClick={() => { setActiveExam(activeExam === e ? null : e); setActiveType(null); setActiveSubject(null); }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACTIVE FILTER RESULT ── */}
      <AnimatePresence>
        {!query && isBrowsing && (
          <motion.section
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter size={13} style={{ color: "var(--ink-4)" }} />
                <span className="text-[13px] font-bold" style={{ color: "var(--ink-1)" }}>
                  {browsed.length} article{browsed.length !== 1 ? "s" : ""}
                </span>
                {activeType && (
                  <span className="text-[12px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: TYPE_META[activeType].bg, color: TYPE_META[activeType].color }}>
                    {activeType}
                  </span>
                )}
                {activeSubject && (
                  <span className="text-[12px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "var(--bg)", color: "var(--ink-3)", border: "1px solid var(--line-soft)" }}>
                    {activeSubject}
                  </span>
                )}
                {activeExam && (
                  <span className="text-[12px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "rgba(139,92,246,0.08)", color: "var(--violet)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    {activeExam}
                  </span>
                )}
              </div>
              <button onClick={clearFilters}
                className="text-[11px] font-medium flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-[var(--bg)] transition-colors"
                style={{ color: "var(--ink-4)" }}>
                <X size={11} /> Clear
              </button>
            </div>
            <ArticleList articles={browsed} readSlugs={readSlugs} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── HOME VIEW (no search, no filter) ── */}
      {!query && !isBrowsing && (
        <>
          {/* 🔥 Popular this month */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame size={14} style={{ color: "var(--amber)" }} />
                <h2 className="text-[13px] font-bold" style={{ color: "var(--ink-1)" }}>Popular this month</h2>
              </div>
              <Link href="/library/all?sort=popular"
                className="text-[11.5px] font-semibold flex items-center gap-1 hover:underline"
                style={{ color: "var(--blue)" }}>
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {/* Horizontal scroll cards */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {popular.map((a) => {
                const meta    = TYPE_META[a.type];
                const reads   = ARTICLE_POPULARITY[a.slug] ?? 0;
                const isRead  = readSlugs.has(a.slug);
                return (
                  <Link
                    key={a.id}
                    href={`/library/${a.slug}`}
                    className="shrink-0 w-[210px] flex flex-col gap-2.5 p-4 rounded-[14px] group relative transition-all"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--line-soft)",
                    }}
                  >
                    {/* Read badge */}
                    {isRead && (
                      <span className="absolute top-3 right-3 w-4.5 h-4.5 flex items-center justify-center rounded-full"
                        style={{ background: "var(--green)", width: 18, height: 18 }}>
                        <Check size={10} className="text-white" />
                      </span>
                    )}

                    {/* Monthly reads */}
                    <div className="flex items-center gap-1 text-[10px] font-semibold"
                      style={{ color: "var(--amber)" }}>
                      <Flame size={10} />
                      {reads.toLocaleString("en-IN")} reads/mo
                    </div>

                    {/* Type badge */}
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full w-fit"
                      style={{ background: meta.bg, color: meta.color }}>
                      {TYPE_ICONS[a.type]} {a.type}
                    </span>

                    {/* Title */}
                    <h3 className="text-[13px] font-bold leading-snug line-clamp-2 flex-1 group-hover:text-[var(--blue)] transition-colors"
                      style={{ color: "var(--ink-1)" }}>
                      {a.title}
                    </h3>

                    {/* Meta */}
                    <div className="flex items-center gap-1.5 text-[10.5px] flex-wrap mt-auto"
                      style={{ color: "var(--ink-4)" }}>
                      <span>{a.subject_tags[0]}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock size={9} /> {a.readTime}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: DIFF_COLOR[a.difficulty] }} />
                        {a.difficulty}
                      </span>
                    </div>
                  </Link>
                );
              })}

              {/* View all card */}
              <Link href="/library/all?sort=popular"
                className="shrink-0 w-[150px] flex flex-col items-center justify-center gap-3 p-4 rounded-[14px] transition-all hover:border-[var(--blue)] group"
                style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--blue-soft)]"
                  style={{ background: "var(--bg)" }}>
                  <ArrowRight size={16} className="group-hover:text-[var(--blue)] transition-colors" style={{ color: "var(--ink-3)" }} />
                </div>
                <p className="text-[11.5px] font-semibold text-center leading-snug" style={{ color: "var(--ink-3)" }}>
                  View all<br />
                  <span style={{ color: "var(--blue)" }}>{ARTICLES.length} articles</span>
                </p>
              </Link>
            </div>
          </section>

          {/* 🕐 Recently Added */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SortDesc size={14} style={{ color: "var(--ink-3)" }} />
                <h2 className="text-[13px] font-bold" style={{ color: "var(--ink-1)" }}>Recently added</h2>
              </div>
              <Link href="/library/all"
                className="text-[11.5px] font-semibold flex items-center gap-1 hover:underline"
                style={{ color: "var(--blue)" }}>
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <ArticleList articles={latest} readSlugs={readSlugs} />

            {/* All articles CTA */}
            <div className="mt-6 flex justify-center">
              <Link href="/library/all"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all hover:brightness-105"
                style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line-soft)" }}>
                <Filter size={13} /> Browse all {ARTICLES.length} articles
              </Link>
            </div>
          </section>
        </>
      )}

      <div className="h-12" />
    </div>
  );
}

/* ─── Article list (single column) ─── */
function ArticleList({ articles, readSlugs }: { articles: Article[]; readSlugs: Set<string> }) {
  return (
    <div className="flex flex-col">
      {articles.map((a, i) => {
        const meta   = TYPE_META[a.type];
        const isRead = readSlugs.has(a.slug);
        return (
          <Link key={a.id} href={`/library/${a.slug}`}
            className="flex items-start gap-4 py-4 group transition-colors"
            style={{ borderBottom: i < articles.length - 1 ? "1px solid var(--line-soft)" : "none" }}>

            {/* Type icon */}
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: meta.bg, color: meta.color }}>
              {TYPE_ICONS[a.type]}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <h3 className="text-[15px] font-bold leading-snug group-hover:text-[var(--blue)] transition-colors flex-1"
                  style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
                  {a.title}
                </h3>
                {isRead && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                    style={{ background: "rgba(34,197,94,0.12)", color: "var(--green)" }}>
                    <Check size={9} /> Read
                  </span>
                )}
              </div>
              <p className="text-[13px] mt-1 leading-relaxed line-clamp-2" style={{ color: "var(--ink-3)" }}>
                {a.description}
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] flex-wrap" style={{ color: "var(--ink-4)" }}>
                <span className="font-semibold" style={{ color: meta.color }}>{a.type}</span>
                <span>·</span>
                <span>{a.subject_tags[0]}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: DIFF_COLOR[a.difficulty] }} />
                  {a.difficulty}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5"><Clock size={10} /> {a.readTime}</span>
              </div>
            </div>

            <ChevronRight size={15} className="shrink-0 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--blue)" }} />
          </Link>
        );
      })}
    </div>
  );
}
