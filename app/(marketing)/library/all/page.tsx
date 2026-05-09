"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Clock, Check, ChevronRight,
  Flame, SortDesc, Filter, X, BookOpen,
  Zap, RotateCcw, TrendingUp,
} from "lucide-react";
import {
  ARTICLES, SUBJECT_OPTIONS, EXAM_OPTIONS, TYPE_META, DIFF_COLOR,
  ARTICLE_POPULARITY, getExamTags,
  type Article,
} from "../data";

const TYPE_ICONS: Record<Article["type"], React.ReactNode> = {
  Concept:  <BookOpen size={13} />,
  Formula:  <Zap size={13} />,
  Revision: <RotateCcw size={13} />,
  Strategy: <TrendingUp size={13} />,
};

const PAGE_SIZE = 10;

/* ── Filter chip ── */
function Chip({
  label, onRemove,
}: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "var(--blue-soft)", color: "var(--blue)", border: "1px solid var(--blue)" }}>
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
        <X size={10} />
      </button>
    </span>
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

  /* Reset page whenever filters change */
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

  return (
    <div className="flex flex-col fade-up" style={{ maxWidth: 820, margin: "0 auto" }}>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/library"
          className="flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:text-[var(--ink-1)]"
          style={{ color: "var(--ink-4)" }}>
          <ArrowLeft size={14} /> Nurture Library
        </Link>
        <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        <span className="text-[12px] font-semibold" style={{ color: "var(--ink-4)" }}>
          {filtered.length} article{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-start gap-2 mb-5 flex-wrap">
        <h1 className="text-[26px] font-bold flex-1" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
          All Articles
        </h1>

        {/* Sort toggle */}
        <div className="flex items-center gap-1 p-1 rounded-[10px]" style={{ background: "var(--bg)", border: "1px solid var(--line-soft)" }}>
          <button
            onClick={() => setSortBy("newest")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all"
            style={{
              background: sortBy === "newest" ? "var(--card)" : "transparent",
              color: sortBy === "newest" ? "var(--ink-1)" : "var(--ink-4)",
              boxShadow: sortBy === "newest" ? "var(--shadow-xs)" : "none",
            }}>
            <SortDesc size={12} /> Newest
          </button>
          <button
            onClick={() => setSortBy("popular")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all"
            style={{
              background: sortBy === "popular" ? "var(--card)" : "transparent",
              color: sortBy === "popular" ? "var(--ink-1)" : "var(--ink-4)",
              boxShadow: sortBy === "popular" ? "var(--shadow-xs)" : "none",
            }}>
            <Flame size={12} /> Popular
          </button>
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold transition-all"
          style={{
            background: showFilters || activeCount > 0 ? "var(--blue-soft)" : "var(--bg)",
            color: showFilters || activeCount > 0 ? "var(--blue)" : "var(--ink-3)",
            border: `1px solid ${showFilters || activeCount > 0 ? "var(--blue)" : "var(--line-soft)"}`,
          }}>
          <Filter size={12} /> Filters
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
              style={{ background: "var(--blue)" }}>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-5 p-4 rounded-[14px] flex flex-col gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}>

          {/* Type */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--ink-4)" }}>Type</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(TYPE_META) as Article["type"][]).map((t) => {
                const meta = TYPE_META[t];
                const on   = filterType === t;
                return (
                  <button key={t}
                    onClick={() => setFilterType(on ? null : t)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                    style={{
                      background: on ? meta.color : "var(--bg)",
                      color: on ? "#fff" : "var(--ink-3)",
                      border: `1.5px solid ${on ? meta.color : "var(--line-soft)"}`,
                    }}>
                    {TYPE_ICONS[t]} {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--ink-4)" }}>Subject</p>
            <div className="flex gap-2 flex-wrap">
              {SUBJECT_OPTIONS.map((s) => {
                const on = filterSubject === s;
                return (
                  <button key={s}
                    onClick={() => setFilterSubject(on ? null : s)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                    style={{
                      background: on ? "var(--ink-1)" : "var(--bg)",
                      color: on ? "var(--card)" : "var(--ink-3)",
                      border: `1px solid ${on ? "var(--ink-1)" : "var(--line-soft)"}`,
                    }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exam */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--ink-4)" }}>Exam</p>
            <div className="flex gap-2 flex-wrap">
              {EXAM_OPTIONS.map((e) => {
                const on = filterExam === e;
                return (
                  <button key={e}
                    onClick={() => setFilterExam(on ? null : e)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                    style={{
                      background: on ? "var(--violet)" : "var(--bg)",
                      color: on ? "#fff" : "var(--ink-3)",
                      border: `1px solid ${on ? "var(--violet)" : "var(--line-soft)"}`,
                    }}>
                    {e}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--ink-4)" }}>Difficulty</p>
            <div className="flex gap-2 flex-wrap">
              {(["Easy", "Medium", "Hard"] as Article["difficulty"][]).map((d) => {
                const on = filterDiff === d;
                return (
                  <button key={d}
                    onClick={() => setFilterDiff(on ? null : d)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                    style={{
                      background: on ? DIFF_COLOR[d] : "var(--bg)",
                      color: on ? "#fff" : "var(--ink-3)",
                      border: `1px solid ${on ? DIFF_COLOR[d] : "var(--line-soft)"}`,
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{ background: on ? "#fff" : DIFF_COLOR[d] }} />
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {activeCount > 0 && (
            <button
              onClick={() => { setFilterType(null); setFilterSubject(null); setFilterExam(null); setFilterDiff(null); }}
              className="self-start text-[11.5px] font-semibold flex items-center gap-1 hover:underline"
              style={{ color: "var(--red, #ef4444)" }}>
              <X size={11} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {activeCount > 0 && !showFilters && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {filterType    && <Chip label={filterType}    onRemove={() => setFilterType(null)} />}
          {filterSubject && <Chip label={filterSubject} onRemove={() => setFilterSubject(null)} />}
          {filterExam    && <Chip label={filterExam}    onRemove={() => setFilterExam(null)} />}
          {filterDiff    && <Chip label={filterDiff}    onRemove={() => setFilterDiff(null)} />}
        </div>
      )}

      {/* Article list */}
      {paginated.length > 0 ? (
        <div className="flex flex-col">
          {paginated.map((a, i) => {
            const meta    = TYPE_META[a.type];
            const isRead  = readSlugs.has(a.slug);
            const reads   = ARTICLE_POPULARITY[a.slug] ?? 0;
            return (
              <Link key={a.id} href={`/library/${a.slug}`}
                className="flex items-start gap-4 py-4 group transition-colors"
                style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--line-soft)" : "none" }}>

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
                    {reads > 0 && sortBy === "popular" && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5" style={{ color: "var(--amber)" }}>
                          <Flame size={10} /> {reads.toLocaleString("en-IN")}/mo
                        </span>
                      </>
                    )}
                  </div>
                  {/* Exam tags */}
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {getExamTags(a.boardIds).slice(0, 3).map((tag) => (
                      <span key={tag}
                        className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-[4px]"
                        style={{ background: "rgba(139,92,246,0.08)", color: "var(--violet)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <ChevronRight size={15} className="shrink-0 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--blue)" }} />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-20 gap-3">
          <BookOpen size={36} style={{ color: "var(--ink-5, var(--ink-4))" }} />
          <p className="text-[14px] font-semibold" style={{ color: "var(--ink-3)" }}>No articles match your filters</p>
          <button onClick={() => { setFilterType(null); setFilterSubject(null); setFilterExam(null); setFilterDiff(null); }}
            className="text-[12px] font-semibold hover:underline" style={{ color: "var(--blue)" }}>
            Clear filters
          </button>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all hover:brightness-105"
            style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line-soft)" }}>
            Load more ({filtered.length - paginated.length} remaining)
          </button>
        </div>
      )}

      <div className="h-12" />
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
