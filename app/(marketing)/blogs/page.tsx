"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, X, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { apiGetBlogs, type PublicBlogPost } from "@/lib/api";
import { ExamFilterPanel } from "@/components/layout/FilterSidebar";
import { useExamFilter, parseIds, serializeIds } from "@/hooks/useExamFilter";
import PageHero, { HeroSearch } from "@/components/marketing/PageHero";

/* ── Category chips ── */
const CATEGORIES = [
  { key: "All", label: "All" },
  { key: "General", label: "General" },
  { key: "Current Affairs", label: "Current Affairs" },
  { key: "Strategy", label: "Strategy" },
  { key: "Concept", label: "Concepts" },
  { key: "Formula", label: "Formulas" },
  { key: "Revision", label: "Revision" },
  { key: "News", label: "News" },
  { key: "Announcement", label: "Announcements" },
];

/* Legacy ?tab= links map onto categories. */
const TAB_TO_CATEGORY: Record<string, string> = { news: "News" };

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ── Blog Card ── */
function BlogCard({ post, index }: { post: PublicBlogPost; index: number }) {
  return (
    <li className="reveal" style={{ transitionDelay: `${(index % 3) * 70}ms` }}>
      <Link
        href={`/blogs/${post.slug}`}
        className="en-card en-card-link flex h-full flex-col overflow-hidden rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
      >
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-t-[20px] bg-[var(--brand-soft)]">
          {post.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen size={36} strokeWidth={1.5} className="text-[var(--brand)]" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <span className="text-xs font-semibold text-[var(--brand)]">{post.category}</span>
          <h3
            className="line-clamp-2 text-[17px] font-semibold leading-snug text-[var(--ink-1)]"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="line-clamp-2 text-sm leading-relaxed text-[var(--ink-3)]">{post.excerpt}</p>
          )}
          <p className="mt-auto pt-2 text-xs text-[var(--ink-3)]">
            {[formatDate(post.publishedAt), `${post.readTimeMin} min read`].filter(Boolean).join(" · ")}
          </p>
        </div>
      </Link>
    </li>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading articles">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="en-card animate-pulse overflow-hidden rounded-[20px]">
          <div className="aspect-[16/9] w-full bg-[var(--bg-secondary)]" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-1/4 rounded-full bg-[var(--bg-secondary)]" />
            <div className="h-4 w-3/4 rounded-full bg-[var(--bg-secondary)]" />
            <div className="h-3 w-full rounded-full bg-[var(--bg-secondary)]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

const LIMIT = 12;

function BlogPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filterOpen, setFilterOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  // Result is keyed by the request that produced it, so "loading" is derived (no sync setState in effect).
  const [result, setResult] = useState<{ key: string; items: PublicBlogPost[]; total: number; error: boolean } | null>(null);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const tabCategory = TAB_TO_CATEGORY[(searchParams.get("tab") || "").toLowerCase()];
  const category = searchParams.get("category") || tabCategory || "All";
  const query = searchParams.get("q") || "";

  const [searchText, setSearchText] = useState(query);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const examFilter = useExamFilter({
    stateIds: parseIds(searchParams.get("stateIds"), Number),
    boardIds: parseIds(searchParams.get("boardIds"), String),
    examIds: parseIds(searchParams.get("examIds"), String),
  });

  const requestKey = `${page}|${category}|${retry}`;

  useEffect(() => {
    let cancelled = false;
    const params: Record<string, string | number> = { page, limit: LIMIT };
    if (category !== "All") params.category = category;
    apiGetBlogs(params)
      .then((res) => { if (!cancelled) setResult({ key: requestKey, items: res.items, total: res.total, error: false }); })
      .catch(() => { if (!cancelled) setResult({ key: requestKey, items: [], total: 0, error: true }); });
    return () => { cancelled = true; };
  }, [page, category, requestKey]);

  const loading = result?.key !== requestKey;
  const posts = result?.items ?? [];
  const total = result?.total ?? 0;
  const error = !loading && !!result?.error;

  function updateFilter(key: string, value: string | number) {
    const params = new URLSearchParams(searchParams);
    if (key === "category") params.delete("tab");
    if (value === "All" || !value) params.delete(key);
    else params.set(key, String(value));
    if (key !== "page") params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function onSearchChange(v: string) {
    setSearchText(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (v.trim()) params.set("q", v.trim()); else params.delete("q");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
  }

  // Sync exam filter selection -> URL (only when it actually changed)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const sIds = serializeIds(examFilter.selectedStateIds);
    const bIds = serializeIds(examFilter.selectedBoardIds);
    const eIds = serializeIds(examFilter.selectedExamIds);
    if (sIds) params.set("stateIds", sIds); else params.delete("stateIds");
    if (bIds) params.set("boardIds", bIds); else params.delete("boardIds");
    if (eIds) params.set("examIds", eIds); else params.delete("examIds");
    if (params.toString() === searchParams.toString()) return;
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examFilter.selectedStateIds, examFilter.selectedBoardIds, examFilter.selectedExamIds]);

  // Close drawer on Escape
  useEffect(() => {
    if (!filterOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFilterOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filterOpen]);

  function resetFilters() {
    examFilter.resetExamFilter();
    setSearchText("");
    router.push(pathname);
  }

  const totalPages = Math.ceil(total / LIMIT);

  // Client-side filtering for query and exam hierarchy (API doesn't support them yet)
  const filtered = posts.filter((p) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !(p.excerpt ?? "").toLowerCase().includes(q)) return false;
    }
    if (examFilter.selectedExamIds.length > 0) {
      const selectedNames = new Set(
        examFilter.availableExams
          .filter((e) => examFilter.selectedExamIds.includes(e.id))
          .flatMap((e) => [e.shortName.toLowerCase(), e.name.toLowerCase()])
      );
      let tagsArr: string[] = [];
      try { tagsArr = JSON.parse(p.tags); } catch { tagsArr = []; }
      const tagSet = new Set(tagsArr.map((t) => t.toLowerCase()));
      if (![...selectedNames].some((n) => tagSet.has(n))) return false;
    }
    return true;
  });

  const examCount =
    examFilter.selectedStateIds.length + examFilter.selectedBoardIds.length + examFilter.selectedExamIds.length;

  const chipBase =
    "inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]";
  const chipOn = "bg-[var(--brand)] text-[var(--brand-ink)]";
  const chipOff = "bg-[var(--bg-secondary)] text-[var(--ink-2)] hover:bg-[var(--brand-soft)]";

  const pageBtn =
    "inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--bg-secondary)] px-5 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--brand-soft)] disabled:opacity-40 disabled:hover:bg-[var(--bg-secondary)]";

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageHero
        eyebrow="Blog"
        title="Read, learn, stay ahead."
        subtitle="Strategy, current affairs and study notes for your exam."
      >
        <HeroSearch
          id="blog-search"
          label="Search articles"
          placeholder="Search articles"
          value={searchText}
          onChange={onSearchChange}
        />
      </PageHero>

      <section className="mx-auto max-w-[1180px] px-4 pb-20 pt-8 sm:px-6">
        {/* Filter chips */}
        <div className="flex items-center gap-3">
          <div
            className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0 [scrollbar-width:none]"
            role="group"
            aria-label="Category"
          >
            {CATEGORIES.map((c) => {
              const on = category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => updateFilter("category", c.key)}
                  className={`${chipBase} ${on ? chipOn : chipOff}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            aria-haspopup="dialog"
            className={`${chipBase} gap-2 ${examCount > 0 ? chipOn : chipOff}`}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Exam{examCount > 0 ? ` (${examCount})` : ""}
          </button>
        </div>

        <div className="mt-8" aria-live="polite">
          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <div className="en-card mx-auto flex max-w-md flex-col items-center gap-4 rounded-[20px] px-6 py-12 text-center">
              <p className="text-base font-semibold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>
                Could not load articles.
              </p>
              <p className="text-sm text-[var(--ink-3)]">Check your connection and try again.</p>
              <button
                type="button"
                onClick={() => setRetry((n) => n + 1)}
                className="min-h-11 rounded-full bg-[var(--brand)] px-6 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-hover)]"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="en-card mx-auto flex max-w-md flex-col items-center gap-4 rounded-[20px] px-6 py-12 text-center">
              <BookOpen size={32} strokeWidth={1.5} className="text-[var(--brand)]" aria-hidden="true" />
              <p className="text-base font-semibold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>
                No articles match.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-11 rounded-full bg-[var(--brand-soft)] px-6 text-sm font-semibold text-[var(--brand)] transition-colors hover:bg-[var(--bg-secondary)]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((post, i) => <BlogCard key={post.id} post={post} index={i} />)}
              </ul>

              {totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-between gap-3" aria-label="Pagination">
                  <button type="button" onClick={() => updateFilter("page", page - 1)} disabled={page === 1} className={pageBtn}>
                    <ChevronLeft size={16} aria-hidden="true" /> Prev
                  </button>
                  <span className="text-sm text-[var(--ink-3)]">Page {page} of {totalPages}</span>
                  <button type="button" onClick={() => updateFilter("page", page + 1)} disabled={page >= totalPages} className={pageBtn}>
                    Next <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>

      {/* Exam filter drawer */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFilterOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filter by exam"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] max-w-xl flex-col rounded-t-[24px] bg-[var(--card)] shadow-[0_-20px_60px_-20px_rgba(10,12,60,.35)]"
            >
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="text-lg font-bold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>
                  Filter by exam
                </h2>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  aria-label="Close"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--ink-2)] hover:bg-[var(--brand-soft)]"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-4">
                <ExamFilterPanel
                  allCategories={examFilter.allCategories}
                  selectedCategoryIds={examFilter.selectedCategoryIds}
                  onToggleCategory={examFilter.toggleCategory}
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
              <div className="flex gap-3 px-5 py-4">
                <button
                  type="button"
                  onClick={() => { resetFilters(); setFilterOpen(false); }}
                  className="min-h-11 flex-1 rounded-full bg-[var(--bg-secondary)] text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--brand-soft)]"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="min-h-11 flex-[1.4] rounded-full bg-[var(--brand)] text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]"
                >
                  Done
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)]">
          <section className="en-hero-deep"><div className="mx-auto h-64 max-w-[1180px]" /></section>
        </div>
      }
    >
      <BlogPageContent />
    </Suspense>
  );
}
