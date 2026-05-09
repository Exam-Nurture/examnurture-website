"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Clock, Check, ChevronRight,
  Flame, SortDesc, Filter, X, BookOpen,
  Zap, RotateCcw, TrendingUp, Sparkles, RefreshCw, Target, Hash,
} from "lucide-react";
import {
  ARTICLES, SUBJECT_OPTIONS, EXAM_OPTIONS, TYPE_META, DIFF_COLOR,
  ARTICLE_POPULARITY, getExamTags,
  type Article,
} from "../data";

/* ─── Gradients & icons shared with listing ─── */
const COVER_GRADIENTS: Record<Article["type"], string> = {
  Concept:  "linear-gradient(135deg,#1E40AF 0%,#0891B2 100%)",
  Formula:  "linear-gradient(135deg,#6D28D9 0%,#BE185D 100%)",
  Revision: "linear-gradient(135deg,#92400E 0%,#D97706 100%)",
  Strategy: "linear-gradient(135deg,#065F46 0%,#059669 100%)",
};

const TYPE_ICONS: Record<Article["type"], React.ReactNode> = {
  Concept:  <BookOpen  size={13} />,
  Formula:  <Zap       size={13} />,
  Revision: <RotateCcw size={13} />,
  Strategy: <TrendingUp size={13} />,
};

const COVER_ICONS_MD: Record<Article["type"], React.ReactNode> = {
  Concept:  <BookOpen  size={26} strokeWidth={1.2} />,
  Formula:  <Zap       size={26} strokeWidth={1.2} />,
  Revision: <RefreshCw size={26} strokeWidth={1.2} />,
  Strategy: <Target    size={26} strokeWidth={1.2} />,
};

const PAGE_SIZE = 12;

/* ─── Blog card ─── */
function BlogCard({ article, isRead }: { article: Article; isRead: boolean }) {
  const meta  = TYPE_META[article.type];
  const reads = ARTICLE_POPULARITY[article.slug] ?? 0;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--card)",
        border: "1px solid var(--line-soft)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Cover gradient */}
      <div
        className="relative h-[88px] flex items-center justify-center overflow-hidden shrink-0"
        style={{ background: COVER_GRADIENTS[article.type] }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="text-white opacity-80">
          {COVER_ICONS_MD[article.type]}
        </div>
        {isRead && (
          <span
            className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(4px)" }}
          >
            <Check size={10} className="text-white" />
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: meta.bg, color: meta.color }}
          >
            {TYPE_ICONS[article.type]} {meta.label}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium"
            style={{ color: "var(--ink-4)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: DIFF_COLOR[article.difficulty] }} />
            {article.difficulty}
          </span>
        </div>

        <h3
          className="text-[14px] font-bold leading-snug mb-1.5 flex-1 line-clamp-2 group-hover:text-[var(--blue)] transition-colors"
          style={{ color: "var(--ink-1)" }}
        >
          {article.title}
        </h3>

        <p className="text-[12px] leading-relaxed line-clamp-2 mb-3" style={{ color: "var(--ink-3)" }}>
          {article.description}
        </p>

        {/* Exam tags */}
        {getExamTags(article.boardIds).length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {getExamTags(article.boardIds).slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: "rgba(139,92,246,0.08)", color: "var(--violet)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="flex items-center justify-between text-[11px] pt-3 mt-auto"
          style={{ borderTop: "1px solid var(--line-soft)", color: "var(--ink-4)" }}
        >
          <span className="flex items-center gap-1">
            <Clock size={10} /> {article.readTime}
          </span>
          {reads > 0 ? (
            <span className="flex items-center gap-1" style={{ color: "var(--amber)" }}>
              <Flame size={10} /> {reads.toLocaleString("en-IN")}/mo
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[var(--blue)] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Read <ChevronRight size={11} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function AllArticlesInner() {
  const searchParams = useSearchParams();
  const initialSort = (searchParams.get("sort") === "popular") ? "popular" : "newest";

  const [sortBy,        setSortBy]        = useState<"newest" | "popular">(initialSort);
  const [filterType,    setFilterType]    = useState<Article["type"] | null>(null);
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  const [filterExam,    setFilterExam]    = useState<string | null>(null);
  const [filterDiff,    setFilterDiff]    = useState<Article["difficulty"] | null>(null);
  const [page,          setPage]          = useState(1);
  const [readSlugs,     setReadSlugs]     = useState<Set<string>>(new Set());
  const [showFilters,   setShowFilters]   = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("en_lib_read");
      if (raw) setReadSlugs(new Set<string>(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { setPage(1); }, [sortBy, filterType, filterSubject, filterExam, filterDiff]);

  const filtered = useMemo(() => {
    let list = [...ARTICLES];
    if (filterType)    list = list.filter((a) => a.type === filterType);
    if (filterSubject) list = list.filter((a) => a.subject_tags.includes(filterSubject));
    if (filterExam)    list = list.filter((a) => getExamTags(a.boardIds).includes(filterExam));
    if (filterDiff)    list = list.filter((a) => a.difficulty === filterDiff);
    if (sortBy === "popular") {
      list.sort((a, b) => (ARTICLE_POPULARITY[b.slug] ?? 0) - (ARTICLE_POPULARITY[a.slug] ?? 0));
    } else {
      list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    return list;
  }, [filterType, filterSubject, filterExam, filterDiff, sortBy]);

  const paginated   = filtered.slice(0, page * PAGE_SIZE);
  const hasMore     = paginated.length < filtered.length;
  const activeCount = [filterType, filterSubject, filterExam, filterDiff].filter(Boolean).length;

  const clearAll = () => {
    setFilterType(null); setFilterSubject(null); setFilterExam(null); setFilterDiff(null);
  };

  return (
    <div className="flex flex-col fade-up" style={{ maxWidth: 960, margin: "0 auto" }}>

      {/* Back nav */}
      <Link
        href="/blog"
        className="flex items-center gap-1.5 mb-6 text-[13px] font-medium transition-colors hover:text-[var(--ink-1)] self-start"
        style={{ color: "var(--ink-4)" }}
      >
        <ArrowLeft size={14} /> Blog
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1
            className="text-[26px] font-extrabold leading-tight"
            style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
          >
            All Blog Posts
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--ink-4)" }}>
            {filtered.length} article{filtered.length !== 1 ? "s" : ""} · Browse and filter by topic, exam, or type
          </p>
        </div>

        {/* Sort + Filter controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sort toggle */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: "var(--bg)", border: "1px solid var(--line-soft)" }}
          >
            <button
              onClick={() => setSortBy("newest")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold transition-all"
              style={{
                background: sortBy === "newest" ? "var(--card)" : "transparent",
                color: sortBy === "newest" ? "var(--ink-1)" : "var(--ink-4)",
                boxShadow: sortBy === "newest" ? "var(--shadow-xs)" : "none",
              }}
            >
              <SortDesc size={12} /> Newest
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold transition-all"
              style={{
                background: sortBy === "popular" ? "var(--card)" : "transparent",
                color: sortBy === "popular" ? "var(--ink-1)" : "var(--ink-4)",
                boxShadow: sortBy === "popular" ? "var(--shadow-xs)" : "none",
              }}
            >
              <Flame size={12} /> Popular
            </button>
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{
              background: showFilters || activeCount > 0 ? "var(--blue-soft)" : "var(--bg)",
              color: showFilters || activeCount > 0 ? "var(--blue)" : "var(--ink-3)",
              border: `1px solid ${showFilters || activeCount > 0 ? "var(--blue)" : "var(--line-soft)"}`,
            }}
          >
            <Filter size={12} /> Filters
            {activeCount > 0 && (
              <span
                className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: "var(--blue)" }}
              >
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div
          className="mb-6 p-5 rounded-2xl flex flex-col gap-5"
          style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
        >
          {/* Type */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
              Type
            </p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(TYPE_META) as Article["type"][]).map((t) => {
                const meta = TYPE_META[t];
                const on   = filterType === t;
                return (
                  <button
                    key={t}
                    onClick={() => setFilterType(on ? null : t)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                    style={{
                      background: on ? meta.color : "var(--bg)",
                      color: on ? "#fff" : "var(--ink-3)",
                      border: `1.5px solid ${on ? meta.color : "var(--line-soft)"}`,
                    }}
                  >
                    {TYPE_ICONS[t]} {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
              Difficulty
            </p>
            <div className="flex gap-2 flex-wrap">
              {(["Easy", "Medium", "Hard"] as Article["difficulty"][]).map((d) => {
                const on = filterDiff === d;
                return (
                  <button
                    key={d}
                    onClick={() => setFilterDiff(on ? null : d)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                    style={{
                      background: on ? DIFF_COLOR[d] : "var(--bg)",
                      color: on ? "#fff" : "var(--ink-3)",
                      border: `1px solid ${on ? DIFF_COLOR[d] : "var(--line-soft)"}`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? "#fff" : DIFF_COLOR[d] }} />
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
              Subject
            </p>
            <div className="flex gap-2 flex-wrap">
              {SUBJECT_OPTIONS.map((s) => {
                const on = filterSubject === s;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterSubject(on ? null : s)}
                    className="px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all"
                    style={{
                      background: on ? "var(--ink-1)" : "var(--bg)",
                      color: on ? "var(--card)" : "var(--ink-3)",
                      border: `1px solid ${on ? "var(--ink-1)" : "var(--line-soft)"}`,
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exam */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
              Exam
            </p>
            <div className="flex gap-2 flex-wrap">
              {EXAM_OPTIONS.map((e) => {
                const on = filterExam === e;
                return (
                  <button
                    key={e}
                    onClick={() => setFilterExam(on ? null : e)}
                    className="px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all"
                    style={{
                      background: on ? "var(--violet)" : "var(--bg)",
                      color: on ? "#fff" : "var(--ink-3)",
                      border: `1px solid ${on ? "var(--violet)" : "var(--line-soft)"}`,
                    }}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          </div>

          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="self-start text-[12px] font-semibold flex items-center gap-1.5 hover:underline"
              style={{ color: "#ef4444" }}
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {activeCount > 0 && !showFilters && (
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <span className="text-[11px]" style={{ color: "var(--ink-4)" }}>Filters:</span>
          {filterType && (
            <button
              onClick={() => setFilterType(null)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--blue-soft)", color: "var(--blue)", border: "1px solid var(--blue)" }}
            >
              {filterType} <X size={10} />
            </button>
          )}
          {filterDiff && (
            <button
              onClick={() => setFilterDiff(null)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--blue-soft)", color: "var(--blue)", border: "1px solid var(--blue)" }}
            >
              {filterDiff} <X size={10} />
            </button>
          )}
          {filterSubject && (
            <button
              onClick={() => setFilterSubject(null)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--blue-soft)", color: "var(--blue)", border: "1px solid var(--blue)" }}
            >
              {filterSubject} <X size={10} />
            </button>
          )}
          {filterExam && (
            <button
              onClick={() => setFilterExam(null)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--blue-soft)", color: "var(--blue)", border: "1px solid var(--blue)" }}
            >
              {filterExam} <X size={10} />
            </button>
          )}
          <button onClick={clearAll} className="text-[11px] font-semibold hover:underline" style={{ color: "#ef4444" }}>
            Clear all
          </button>
        </div>
      )}

      {/* ── Card grid ── */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((a) => (
            <BlogCard key={a.id} article={a} isRead={readSlugs.has(a.slug)} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center py-20 gap-3 rounded-2xl border-2 border-dashed"
          style={{ borderColor: "var(--line-soft)" }}
        >
          <BookOpen size={36} style={{ color: "var(--ink-4)" }} />
          <p className="text-[14px] font-semibold" style={{ color: "var(--ink-3)" }}>
            No articles match your filters
          </p>
          <button
            onClick={clearAll}
            className="text-[12px] font-semibold hover:underline"
            style={{ color: "var(--blue)" }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-7 py-3 rounded-xl text-[13px] font-semibold transition-all hover:brightness-105"
            style={{ background: "var(--card)", color: "var(--ink-2)", border: "1px solid var(--line-soft)" }}
          >
            Load more · {filtered.length - paginated.length} remaining
          </button>
        </div>
      )}

      <div className="h-16" />
    </div>
  );
}

export default function AllArticlesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32" style={{ color: "var(--ink-4)" }}>Loading…</div>}>
      <AllArticlesInner />
    </Suspense>
  );
}
