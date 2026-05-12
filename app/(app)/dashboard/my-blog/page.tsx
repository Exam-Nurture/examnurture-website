"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark, BookOpen, ExternalLink, ArrowRight, BookMarked,
  Check, Clock, Flame, TrendingUp, Zap, RotateCcw, RefreshCw,
  Target, Hash,
} from "lucide-react";
import { apiGetBookmarks, apiGetBlogs, type PublicBlogPost } from "@/lib/api";

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

const CAT_ICONS: Record<string, React.ReactNode> = {
  "Concept":  <BookOpen   size={12} />,
  "Formula":  <Zap        size={12} />,
  "Revision": <RotateCcw  size={12} />,
  "Strategy": <TrendingUp size={12} />,
  "General":  <BookOpen   size={12} />,
};

const COVER_ICONS_SM: Record<string, React.ReactNode> = {
  "Concept":  <BookOpen  size={20} strokeWidth={1.5} />,
  "Formula":  <Zap       size={20} strokeWidth={1.5} />,
  "Revision": <RefreshCw size={20} strokeWidth={1.5} />,
  "Strategy": <Target    size={20} strokeWidth={1.5} />,
  "General":  <BookOpen  size={20} strokeWidth={1.5} />,
};

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

/* ─── Compact article card ─── */
function ArticleCard({ article, isRead }: { article: PublicBlogPost; isRead?: boolean }) {
  const gradient = CAT_GRADIENTS[article.category] ?? CAT_GRADIENTS["General"];
  const catColor = getCatColor(article.category);
  const tags = parseTags(article.tags);

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex items-start gap-3 p-3.5 rounded-2xl transition-all hover:border-[var(--blue)]"
      style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
    >
      {/* Mini cover */}
      <div
        className="relative w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
        style={{ background: gradient }}
      >
        {article.coverUrl ? (
          <img src={article.coverUrl} alt={article.title} className="w-full h-full object-cover" />
        ) : (
          <div className="opacity-70 text-white">
            {COVER_ICONS_SM[article.category] ?? <BookOpen size={20} strokeWidth={1.5} />}
          </div>
        )}
        {isRead && (
          <span
            className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(4px)" }}
          >
            <Check size={9} className="text-white" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${catColor}20`, color: catColor }}
          >
            {CAT_ICONS[article.category] ?? <BookOpen size={12} />} {article.category}
          </span>
        </div>
        <p
          className="text-[13px] font-semibold leading-snug line-clamp-2 group-hover:text-[var(--blue)] transition-colors"
          style={{ color: "var(--ink-1)" }}
        >
          {article.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]" style={{ color: "var(--ink-4)" }}>
          <Clock size={10} /> {article.readTimeMin} min
          {tags[0] && (
            <>
              <span>·</span>
              <span>{tags[0]}</span>
            </>
          )}
        </div>
      </div>

      <ArrowRight
        size={14}
        className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
        style={{ color: "var(--blue)" }}
      />
    </Link>
  );
}

/* ─── Section header ─── */
function SectionHeader({
  icon, title, count, badge,
}: {
  icon: React.ReactNode; title: string; count?: number; badge?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: "var(--ink-3)" }}>{icon}</span>
      <h2 className="text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>{title}</h2>
      {count !== undefined && (
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "var(--bg)", color: "var(--ink-4)" }}
        >
          {count}
        </span>
      )}
      {badge && (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "var(--amber-soft)", color: "var(--amber)" }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState({
  icon, title, sub, action,
}: {
  icon: React.ReactNode; title: string; sub: string; action?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center py-10 rounded-2xl border-2 border-dashed"
      style={{ borderColor: "var(--line-soft)" }}
    >
      <span className="mb-3" style={{ color: "var(--ink-4)" }}>{icon}</span>
      <p className="font-semibold text-sm" style={{ color: "var(--ink-3)" }}>{title}</p>
      <p className="text-[12px] mt-1" style={{ color: "var(--ink-4)" }}>{sub}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ────────────────────────────────────────────
   Main page
──────────────────────────────────────────── */
export default function MyLibraryPage() {
  const [bookmarks,      setBookmarks]      = useState<any[]>([]);
  const [loadingBM,      setLoadingBM]      = useState(true);
  const [readSlugs,      setReadSlugs]      = useState<Set<string>>(new Set());
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());
  const [allArticles,    setAllArticles]    = useState<PublicBlogPost[]>([]);

  useEffect(() => {
    try {
      const rd = localStorage.getItem("en_lib_read");
      if (rd) setReadSlugs(new Set<string>(JSON.parse(rd)));
      const bm = localStorage.getItem("library-bookmarks");
      if (bm) setSavedArticleIds(new Set<string>(JSON.parse(bm)));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    apiGetBookmarks()
      .then((data: any) => setBookmarks(Array.isArray(data) ? data : []))
      .finally(() => setLoadingBM(false));
      
    apiGetBlogs({ limit: 100 })
      .then(res => setAllArticles(res.items))
      .catch(() => {});
  }, []);

  /* Map localStorage data to article objects */
  const readArticles  = allArticles.filter((a) => readSlugs.has(a.slug));
  const savedArticles = allArticles.filter((a) => savedArticleIds.has(a.id));
  const unreadSaved   = savedArticles.filter((a) => !readSlugs.has(a.slug));

  /* Stats */
  const totalReadTime = readArticles.reduce((acc, a) => acc + (a.readTimeMin || 0), 0);
  const topicsCovered = [...new Set(readArticles.flatMap((a) => parseTags(a.tags)))];

  return (
    <div className="fade-up max-w-3xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1
            className="text-2xl font-extrabold"
            style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
          >
            My Library
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-4)" }}>
            Your reading progress, saves, and bookmarks
          </p>
        </div>
        <Link
          href="/blog"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-[var(--bg)]"
          style={{ color: "var(--blue)", borderColor: "var(--blue)", borderWidth: 1.5 }}
        >
          <BookOpen className="w-4 h-4" />
          Browse Blog
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          {
            icon: <Check size={16} className="text-white" />,
            value: readArticles.length,
            label: "Articles Read",
            gradient: "linear-gradient(135deg,#065F46,#059669)",
          },
          {
            icon: <Bookmark size={16} className="text-white" />,
            value: savedArticles.length,
            label: "Saved",
            gradient: "linear-gradient(135deg,#1E40AF,#0891B2)",
          },
          {
            icon: <Clock size={16} className="text-white" />,
            value: `${totalReadTime}m`,
            label: "Time Reading",
            gradient: "linear-gradient(135deg,#6D28D9,#BE185D)",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 p-4 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: stat.gradient }}
            >
              {stat.icon}
            </div>
            <div>
              <p
                className="text-[22px] font-extrabold leading-none"
                style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
              >
                {stat.value}
              </p>
              <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--ink-4)" }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Topics covered ── */}
      {topicsCovered.length > 0 && (
        <div
          className="mb-8 p-4 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
            Topics Covered
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topicsCovered.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: "var(--bg)", color: "var(--ink-3)", border: "1px solid var(--line-soft)" }}
              >
                <Hash size={9} /> {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Continue Reading (saved but not read) ── */}
      {unreadSaved.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            icon={<BookOpen size={16} />}
            title="Continue Reading"
            count={unreadSaved.length}
            badge="Saved"
          />
          <div className="flex flex-col gap-2">
            {unreadSaved.slice(0, 5).map((a) => (
              <ArticleCard key={a.id} article={a} isRead={false} />
            ))}
          </div>
          {unreadSaved.length > 5 && (
            <Link
              href="/blog"
              className="mt-3 flex items-center gap-1 text-[12px] font-semibold transition-colors hover:text-[var(--blue)]"
              style={{ color: "var(--ink-4)" }}
            >
              View all {unreadSaved.length} saved articles <ArrowRight size={13} />
            </Link>
          )}
        </section>
      )}

      {/* ── Completed articles ── */}
      <section className="mb-8">
        <SectionHeader
          icon={<Check size={16} />}
          title="Completed"
          count={readArticles.length}
        />
        {readArticles.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={36} />}
            title="Nothing completed yet"
            sub="Articles are marked as read when you scroll past 80%"
            action={
              <Link
                href="/blog"
                className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: "var(--blue)" }}
              >
                Start reading <ArrowRight size={14} />
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {readArticles.slice(0, 4).map((a) => (
              <ArticleCard key={a.id} article={a} isRead={true} />
            ))}
            {readArticles.length > 4 && (
              <Link
                href="/blog"
                className="mt-1 flex items-center gap-1 text-[12px] font-semibold transition-colors hover:text-[var(--blue)]"
                style={{ color: "var(--ink-4)" }}
              >
                View all {readArticles.length} completed <ArrowRight size={13} />
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── Bookmarked Questions ── */}
      <section className="mb-8">
        <SectionHeader
          icon={<Bookmark size={16} style={{ color: "var(--amber)" }} />}
          title="Bookmarked Questions"
          count={loadingBM ? undefined : bookmarks.length}
        />

        {loadingBM ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--bg)" }} />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <EmptyState
            icon={<BookMarked size={36} />}
            title="No bookmarks yet"
            sub="Bookmark questions during tests to review them here"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {bookmarks.map((bm: any) => {
              const q = bm.question;
              if (!q) return null;
              let opts: string[] = [];
              try { opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options; } catch { /* ignore */ }
              return (
                <div key={bm.id} className="card p-4">
                  <p
                    className="text-[13px] font-medium leading-relaxed mb-3"
                    style={{ color: "var(--ink-1)" }}
                    dangerouslySetInnerHTML={{
                      __html: q.text?.slice(0, 200) + (q.text?.length > 200 ? "…" : ""),
                    }}
                  />
                  <div className="flex flex-col gap-1.5">
                    {opts.slice(0, 4).map((opt: string, i: number) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 text-[12px] px-3 py-2 rounded-lg ${
                          i === q.correctIndex
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                            : ""
                        }`}
                        style={i !== q.correctIndex ? { color: "var(--ink-3)" } : {}}
                      >
                        <span className="font-bold shrink-0 w-4">{["A","B","C","D"][i]}.</span>
                        <span dangerouslySetInnerHTML={{ __html: opt }} />
                      </div>
                    ))}
                  </div>
                  {q.subject && (
                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ background: "var(--bg)", color: "var(--ink-4)", border: "1px solid var(--line-soft)" }}
                      >
                        {q.subject}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Discover more ── */}
      <section
        className="p-5 rounded-2xl flex items-center gap-4"
        style={{
          background: "linear-gradient(135deg, var(--blue-soft), rgba(139,92,246,0.06))",
          border: "1px solid rgba(59,130,246,0.15)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--blue)", color: "#fff" }}
        >
          <Flame size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold" style={{ color: "var(--ink-1)" }}>
            Explore more posts
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-3)" }}>
            Concepts, formulas, revision notes, and strategies — all in one place.
          </p>
        </div>
        <Link
          href="/blog"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all hover:brightness-110"
          style={{ background: "var(--blue)" }}
        >
          Browse <ArrowRight size={13} />
        </Link>
      </section>

      <div className="h-8" />
    </div>
  );
}

