"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, Clock, Eye, Calendar, ArrowRight, Rss, BookOpen,
  TrendingUp, Sparkles, Filter, ChevronLeft, ChevronRight,
} from "lucide-react";
import { apiGetBlogs, type PublicBlogPost } from "@/lib/api";

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
      className="group flex flex-col bg-[var(--bg-secondary)] border border-[var(--line)] rounded-[12px] overflow-hidden hover:border-black transition-colors duration-200"
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
        <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-black">
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
              <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-[var(--line)] text-[var(--ink-2)]">
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
        <span className="inline-flex items-center gap-1 text-xs font-medium text-black group-hover:gap-2 transition-all">
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
      className="group relative flex flex-col md:flex-row bg-[var(--bg-secondary)] border border-[var(--line)] rounded-[16px] overflow-hidden hover:border-black transition-colors duration-200"
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
        <h2 className="text-[22px] md:text-[28px] leading-tight text-black"
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
          <span className="flex items-center gap-1.5 font-medium text-black">
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
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-black group-hover:gap-2.5 transition-all">
          Read full article <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

/* ── Main Page ── */
const LIMIT = 12;

export default function BlogPage() {
  const [posts, setPosts] = useState<PublicBlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number, cat: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: LIMIT };
      if (cat !== "All") params.category = cat;
      const res = await apiGetBlogs(params);
      setPosts(res.items);
      setTotal(res.total);
    } catch {
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, category); }, [page, category, load]);

  function handleCategory(cat: string) {
    setCategory(cat);
    setPage(1);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const filtered = query.trim()
    ? posts.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        (p.excerpt ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : posts;

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-20 md:py-28 px-4 bg-white border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[11px] font-normal uppercase mb-5 text-black"
             style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>
            ExamNurture Blog
          </p>
          <h1 className="text-[40px] md:text-[56px] leading-[1.10] text-black mb-5"
              style={{ fontWeight: 300, letterSpacing: "-0.96px" }}>
            Insights, Strategies &amp;<br />Exam Updates
          </h1>
          <p className="text-[18px] max-w-2xl mx-auto mb-8 text-[var(--ink-2)]"
             style={{ fontWeight: 300, letterSpacing: "-0.26px" }}>
            Expert articles, current affairs, exam strategies, and study tips for government competitive exams across India.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-2)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm outline-none border border-[var(--line)] bg-[var(--bg-secondary)] text-black focus:border-black transition-colors"
            />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Category filter */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 scrollbar-none">
          <Filter size={14} className="text-[var(--ink-2)] shrink-0" />
          {CATEGORIES.map((c) => {
            const active = c.key === category;
            return (
              <button
                key={c.key}
                onClick={() => handleCategory(c.key)}
                className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--blue)" : "var(--bg-secondary)",
                  color: active ? "#fff" : "var(--ink-2)",
                  border: active ? `1.5px solid var(--blue)` : "1.5px solid var(--line)",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border animate-pulse" style={{ borderColor: "var(--line)" }}>
                <div className="h-44 w-full" style={{ background: "var(--line)" }} />
                <div className="p-5 space-y-3">
                  <div className="h-4 rounded w-3/4" style={{ background: "var(--line)" }} />
                  <div className="h-3 rounded w-full" style={{ background: "var(--line)" }} />
                  <div className="h-3 rounded w-5/6" style={{ background: "var(--line)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <BookOpen size={48} strokeWidth={1} style={{ color: "var(--ink-3)" }} />
            <p className="text-lg font-semibold" style={{ color: "var(--ink-2)" }}>No articles found</p>
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>
              {query ? "Try a different search term." : "Check back soon — new articles are on their way!"}
            </p>
            {(query || category !== "All") && (
              <button
                onClick={() => { setQuery(""); setCategory("All"); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white mt-2"
                style={{ background: "var(--blue)" }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && !query && page === 1 && category === "All" && (
              <div className="mb-8">
                <FeaturedCard post={featured} />
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(query || page > 1 || category !== "All" ? filtered : rest).map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between mt-6 text-xs" style={{ color: "var(--ink-3)" }}>
              <span>
                Showing {filtered.length} of {total} article{total !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={12} /> Page {page} of {totalPages || 1}
              </span>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
                  style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}
                >
                  <ChevronLeft size={15} /> Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-8 h-8 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          background: p === page ? "var(--blue)" : "var(--card)",
                          color: p === page ? "#fff" : "var(--ink-2)",
                          border: "1px solid var(--line)",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
                  style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
