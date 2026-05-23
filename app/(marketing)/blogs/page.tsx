"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  Search, Clock, Eye, Calendar, ArrowRight, Rss, BookOpen,
  TrendingUp, Sparkles, Filter, ChevronLeft, ChevronRight, X, RotateCcw,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { apiGetBlogs, type PublicBlogPost } from "@/lib/api";
import { FilterSidebar, FilterSection, MobileFilterBar, ActiveFilterChips, ExamFilterPanel } from "@/components/layout/FilterSidebar";
import { useExamFilter, parseIds, serializeIds } from "@/hooks/useExamFilter";

/* ── Category config ── */
const CATEGORIES = [
  { key: "All",            label: "All Posts",       color: "#3B82F6" },
  { key: "General",        label: "General",          color: "#64748B" },
  { key: "Current Affairs",label: "Current Affairs",  color: "#10B981" },
  { key: "Strategy",       label: "Strategy",         color: "#8B5CF6" },
  { key: "Concept",        label: "Concepts",         color: "#0891B2" },
  { key: "Formula",        label: "Formulas",         color: "#EC4899" },
  { key: "Revision",       label: "Revision",         color: "#F59E0B" },
  { key: "News",           label: "News",             color: "#F97316" },
  { key: "Announcement",   label: "Announcements",    color: "#EF4444" },
];

const CAT_GRADIENTS: Record<string, string> = {
  "General":         "linear-gradient(135deg,#3B82F6,#6366F1)",
  "Current Affairs": "linear-gradient(135deg,#10B981,#059669)",
  "Strategy":        "linear-gradient(135deg,#8B5CF6,#6D28D9)",
  "Concept":         "linear-gradient(135deg,#0891B2,#1E40AF)",
  "Formula":         "linear-gradient(135deg,#EC4899,#8B5CF6)",
  "Revision":        "linear-gradient(135deg,#F59E0B,#F97316)",
  "News":            "linear-gradient(135deg,#F97316,#EF4444)",
  "Announcement":    "linear-gradient(135deg,#EF4444,#BE185D)",
};

function getCatColor(cat: string) {
  return CATEGORIES.find((c) => c.key === cat)?.color ?? "#64748B";
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

/* ── Blog Card ── */
function BlogCard({ post }: { post: PublicBlogPost }) {
  const tags = parseTags(post.tags).slice(0, 2);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-[var(--card)] border border-[var(--line)] rounded-[12px] overflow-hidden hover:border-[var(--blue)] transition-colors duration-200"
    >
      {/* Cover */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden">
        {post.coverUrl ? (
          <img
            src={post.coverUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--surface-hover)]">
            <BookOpen size={40} className="text-[var(--ink-2)]" strokeWidth={1} />
          </div>
        )}
        <span className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full bg-black text-white">
          {post.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-[var(--ink-1)]">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="text-[13px] text-[var(--ink-2)] line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--line-soft)] text-[var(--ink-3)]">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[var(--line)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {post.author[0]?.toUpperCase() ?? "E"}
            </div>
            <span className="text-xs text-[var(--ink-2)] truncate max-w-[100px]">{post.author}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[var(--ink-2)]">
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {formatDate(post.publishedAt)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {post.readTimeMin} min
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ink-1)] group-hover:gap-2 transition-all">
          Read more <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}

/* ── Featured Card (large) ── */
function FeaturedCard({ post }: { post: PublicBlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col md:flex-row bg-[var(--card)] border border-[var(--line)] rounded-[16px] overflow-hidden hover:border-[var(--blue)] transition-colors duration-200"
    >
      <div className="relative md:w-2/5 h-56 md:h-auto shrink-0 overflow-hidden">
        {post.coverUrl ? (
          <img src={post.coverUrl} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--surface-hover)]">
            <Sparkles size={48} className="text-[var(--ink-2)]" strokeWidth={1} />
          </div>
        )}
        <span className="absolute top-4 left-4 text-[11px] font-medium px-2.5 py-1 rounded-full bg-black text-white">
          {post.category}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-6 md:p-8 gap-4">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-2)]"
             style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>
          <TrendingUp size={12} /> FEATURED
        </div>
        <h2 className="text-[22px] md:text-[28px] leading-tight text-[var(--ink-1)]"
            style={{ fontWeight: 300, letterSpacing: "-0.96px" }}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-[15px] text-[var(--ink-2)] leading-relaxed line-clamp-3"
             style={{ fontWeight: 300 }}>
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center gap-4 text-xs text-[var(--ink-2)]">
          <span className="flex items-center gap-1.5 font-medium text-[var(--ink-1)]">
            <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-white text-[9px] font-bold">
              {post.author[0]?.toUpperCase()}
            </div>
            {post.author}
          </span>
          {post.publishedAt && (
            <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(post.publishedAt)}</span>
          )}
          <span className="flex items-center gap-1"><Clock size={11} />{post.readTimeMin} min read</span>
          <span className="flex items-center gap-1"><Eye size={11} />{post.viewCount.toLocaleString()}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink-1)] group-hover:gap-2.5 transition-all">
          Read full article <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

const LIMIT = 12;

function BlogPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<PublicBlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const category = searchParams.get("category") || "All";
  const language = searchParams.get("language") || "All";
  const query = searchParams.get("q") || "";

  const examFilter = useExamFilter({
    stateIds: parseIds(searchParams.get("stateIds"), Number),
    boardIds:  parseIds(searchParams.get("boardIds"),  String),
    examIds:   parseIds(searchParams.get("examIds"),   String),
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (category !== "All") params.category = category;
      // language + exam filters applied client-side (API doesn't support them yet)
      const res = await apiGetBlogs(params);
      setPosts(res.items);
      setTotal(res.total);
    } catch {
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, category]);

  useEffect(() => { load(); }, [load]);

  function updateFilter(key: string, value: string | number) {
    const params = new URLSearchParams(searchParams);
    if (value === "All" || !value) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    if (key !== "page") params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateExamFilterInUrl() {
    const params = new URLSearchParams(searchParams);
    const sIds = serializeIds(examFilter.selectedStateIds);
    const bIds = serializeIds(examFilter.selectedBoardIds);
    const eIds = serializeIds(examFilter.selectedExamIds);
    if (sIds) params.set("stateIds", sIds); else params.delete("stateIds");
    if (bIds) params.set("boardIds", bIds); else params.delete("boardIds");
    if (eIds) params.set("examIds",  eIds); else params.delete("examIds");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  // Sync exam filter selection → URL
  useEffect(() => {
    updateExamFilterInUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examFilter.selectedStateIds, examFilter.selectedBoardIds, examFilter.selectedExamIds]);

  function resetFilters() {
    examFilter.resetExamFilter();
    router.push(pathname);
  }

  const totalPages = Math.ceil(total / LIMIT);

  // Client-side filtering for query, language, and exam hierarchy
  const filtered = posts.filter((p) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !(p.excerpt ?? "").toLowerCase().includes(q)) return false;
    }
    // Exam filter: match selected exam shortNames against post tags
    if (examFilter.selectedExamIds.length > 0) {
      const selectedNames = new Set(
        examFilter.availableExams
          .filter(e => examFilter.selectedExamIds.includes(e.id))
          .flatMap(e => [e.shortName.toLowerCase(), e.name.toLowerCase()])
      );
      let tagsArr: string[] = [];
      try { tagsArr = JSON.parse(p.tags); } catch { tagsArr = []; }
      const tagSet = new Set(tagsArr.map(t => t.toLowerCase()));
      if (![...selectedNames].some(n => tagSet.has(n))) return false;
    }
    return true;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const activeFilters: { key: string; value: string }[] = [];
  if (category !== "All") activeFilters.push({ key: "category", value: category });
  if (language !== "All") activeFilters.push({ key: "language", value: language });
  examFilter.selectedStateIds.forEach(id => {
    const name = examFilter.allStates.find(s => s.id === id)?.name ?? String(id);
    activeFilters.push({ key: `state:${id}`, value: name });
  });
  examFilter.selectedBoardIds.forEach(id => {
    const name = examFilter.availableBoards.find(b => b.id === id)?.shortName ?? id;
    activeFilters.push({ key: `board:${id}`, value: name });
  });
  examFilter.selectedExamIds.forEach(id => {
    const name = examFilter.availableExams.find(e => e.id === id)?.shortName ?? id;
    activeFilters.push({ key: `exam:${id}`, value: name });
  });

  const activeFilterCount = activeFilters.length + (query ? 1 : 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <section className="py-20 md:py-28 px-4 bg-[var(--bg-secondary)] border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[11px] font-normal uppercase mb-5 text-[var(--ink-1)]" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>ExamNurture Blog</p>
          <h1 className="text-[40px] md:text-[56px] leading-[1.10] text-[var(--ink-1)] mb-5" style={{ fontWeight: 300, letterSpacing: "-0.96px" }}>
            Insights, Strategies &amp;<br />Exam Updates
          </h1>
          <p className="text-[18px] max-w-2xl mx-auto mb-0 text-[var(--ink-2)]" style={{ fontWeight: 300, letterSpacing: "-0.26px" }}>
            Expert articles, current affairs, exam strategies, and study tips for government competitive exams across India.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-6 items-start">
          
          {/* Sidebar */}
          <FilterSidebar
            searchQuery={query}
            onSearchChange={(v) => updateFilter("q", v)}
            activeFilterCount={activeFilterCount}
            onReset={resetFilters}
          >
            <FilterSection
              title="Category"
              selectedValue={category}
              onSelect={(v) => updateFilter("category", v)}
              options={[{ value: "All", label: "All Posts" }, ...CATEGORIES.slice(1).map(c => ({ value: c.key, label: c.label }))]}
            />
            <FilterSection
              title="Language"
              selectedValue={language}
              onSelect={(v) => updateFilter("language", v)}
              options={[
                { value: "All", label: "All Languages" },
                { value: "English", label: "English" },
                { value: "Hindi", label: "Hindi" },
                { value: "Bilingual", label: "Bilingual" },
              ]}
            />
            {/* ── Cascading State → Board → Exam filter ── */}
            <ExamFilterPanel
              allStates={examFilter.allStates}
              selectedStateIds={examFilter.selectedStateIds}
              onToggleState={examFilter.toggleState}
              availableBoards={examFilter.availableBoards}
              selectedBoardIds={examFilter.selectedBoardIds}
              onToggleBoard={examFilter.toggleBoard}
              availableExams={examFilter.availableExams}
              selectedExamIds={examFilter.selectedExamIds}
              onToggleExam={examFilter.toggleExam}
              isLoading={examFilter.isLoading}
              examsLoading={examFilter.examsLoading}
            />
          </FilterSidebar>

          {/* Right Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <MobileFilterBar
              searchQuery={query}
              onSearchChange={(v) => updateFilter("q", v)}
              activeFilterCount={activeFilterCount}
              onOpenMobileFilter={() => setMobileFilterOpen(true)}
            />

            {/* Active filters */}
            <ActiveFilterChips
              filters={activeFilters}
              onRemove={(key) => {
                if (key.startsWith("state:")) examFilter.toggleState(Number(key.slice(6)));
                else if (key.startsWith("board:")) examFilter.toggleBoard(key.slice(6));
                else if (key.startsWith("exam:"))  examFilter.toggleExam(key.slice(5));
                else updateFilter(key, "All");
              }}
              onReset={resetFilters}
            />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border animate-pulse" style={{ borderColor: "var(--line)" }}>
                    <div className="h-44 w-full" style={{ background: "var(--line)" }} />
                    <div className="p-5 space-y-3">
                      <div className="h-4 rounded w-3/4" style={{ background: "var(--line)" }} />
                      <div className="h-3 rounded w-full" style={{ background: "var(--line)" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--line)]">
                <BookOpen size={48} strokeWidth={1} style={{ color: "var(--ink-3)" }} />
                <p className="text-lg font-semibold" style={{ color: "var(--ink-2)" }}>No articles found</p>
                <button onClick={resetFilters} className="px-4 py-2 rounded-lg text-sm font-semibold text-white mt-2 bg-[var(--blue)]">
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                {featured && !query && page === 1 && category === "All" && activeFilters.length === 0 && (
                  <div className="mb-6">
                    <FeaturedCard post={featured} />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(query || page > 1 || activeFilters.length > 0 ? filtered : rest).map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-[var(--line)] pt-6 mt-6">
                    <button
                      onClick={() => updateFilter("page", page - 1)}
                      disabled={page === 1}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-[var(--line)] disabled:opacity-40"
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <span className="text-sm font-medium text-[var(--ink-3)]">Page {page} of {totalPages}</span>
                    <button
                      onClick={() => updateFilter("page", page + 1)}
                      disabled={page >= totalPages}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-[var(--line)] disabled:opacity-40"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex h-[85vh] flex-col rounded-t-[24px] bg-[var(--bg)] lg:hidden"
              style={{ borderTop: "1px solid var(--line-soft)" }}
            >
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--line-soft)" }}>
                <h3 className="font-bold text-[var(--ink-1)]">Filters</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="rounded-full p-2 bg-[var(--card)] border border-[var(--line-soft)] text-[var(--ink-2)]">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 pb-20 [scrollbar-width:none]">
                <div className="flex flex-col gap-4">
                  <FilterSection
                    title="Category"
                    selectedValue={category}
                    onSelect={(v) => updateFilter("category", v)}
                    options={[{ value: "All", label: "All Posts" }, ...CATEGORIES.slice(1).map(c => ({ value: c.key, label: c.label }))]}
                  />
                  <FilterSection
                    title="Language"
                    selectedValue={language}
                    onSelect={(v) => updateFilter("language", v)}
                    options={[
                      { value: "All", label: "All Languages" },
                      { value: "English", label: "English" },
                      { value: "Hindi", label: "Hindi" },
                      { value: "Bilingual", label: "Bilingual" },
                    ]}
                  />
                  <ExamFilterPanel
                    allStates={examFilter.allStates}
                    selectedStateIds={examFilter.selectedStateIds}
                    onToggleState={examFilter.toggleState}
                    availableBoards={examFilter.availableBoards}
                    selectedBoardIds={examFilter.selectedBoardIds}
                    onToggleBoard={examFilter.toggleBoard}
                    availableExams={examFilter.availableExams}
                    selectedExamIds={examFilter.selectedExamIds}
                    onToggleExam={examFilter.toggleExam}
                    isLoading={examFilter.isLoading}
                    examsLoading={examFilter.examsLoading}
                  />
                </div>
              </div>
              <div className="flex gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--line-soft)" }}>
                <button type="button" onClick={() => { resetFilters(); setMobileFilterOpen(false); }}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] border text-[13px] font-semibold transition-colors hover:border-[var(--blue)]"
                  style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}>
                  <RotateCcw size={13} /> Clear all
                </button>
                <button type="button" onClick={() => setMobileFilterOpen(false)}
                  className="flex h-11 flex-[1.4] items-center justify-center rounded-[12px] text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
                  style={{ background: "var(--blue)" }}>
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="animate-pulse text-[var(--ink-2)]">Loading Articles...</div>
      </div>
    }>
      <BlogPageContent />
    </Suspense>
  );
}
