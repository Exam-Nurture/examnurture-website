"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, Bookmark, BookmarkCheck,
  Share2, BookOpen, Zap, RotateCcw, TrendingUp, Check,
  Play, ExternalLink, ArrowRight, Calendar, Lock,
  FlaskConical, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ARTICLES, TYPE_META, DIFF_COLOR, type ContentBlock, type Article } from "../data";
import { useAuth } from "@/lib/auth-context";

/* ─── Helpers ─── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

const TYPE_ICONS: Record<Article["type"], React.ReactNode> = {
  Concept:  <BookOpen size={13} />,
  Formula:  <Zap size={13} />,
  Revision: <RotateCcw size={13} />,
  Strategy: <TrendingUp size={13} />,
};

/* Extract YouTube ID from URL */
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/* ─── Content block renderer ─── */
function RenderBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 id={block.text.replace(/\s+/g, "-").toLowerCase()}
          className="text-[24px] font-bold mt-12 mb-4 tracking-tight scroll-mt-24"
          style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="text-[18px] font-bold mt-7 mb-2.5"
          style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
          {block.text}
        </h3>
      );
    case "p":
      return (
        <p className="text-[16px] leading-[1.85] mb-5" style={{ color: "var(--ink-2)" }}>
          {block.text}
        </p>
      );
    case "ul":
      return (
        <ul className="mb-6 flex flex-col gap-2.5 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.75]" style={{ color: "var(--ink-2)" }}>
              <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--blue)" }} />
              {item}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mb-6 flex flex-col gap-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.75]" style={{ color: "var(--ink-2)" }}>
              <span className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white"
                style={{ background: "var(--blue)" }}>
                {i + 1}
              </span>
              <span className="flex-1 pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <aside className="my-6 flex gap-3 p-5 rounded-[12px]"
          style={{ background: "var(--blue-soft)", borderLeft: "3px solid var(--blue)" }}>
          <div className="min-w-0">
            {block.label && (
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--blue)" }}>
                {block.label}
              </p>
            )}
            <p className="text-[14px] leading-[1.7]" style={{ color: "var(--ink-2)" }}>{block.text}</p>
          </div>
        </aside>
      );
    case "formula":
      return (
        <div className="my-5 rounded-[12px] overflow-hidden"
          style={{ border: "1px solid var(--line-soft)" }}>
          <div className="px-5 py-4 font-mono text-[14px] leading-[1.7]"
            style={{ background: "var(--bg)", color: "var(--ink-1)" }}>
            {block.text}
          </div>
          {block.note && (
            <div className="px-5 py-2.5 text-[12px]" style={{ background: "var(--card)", color: "var(--ink-4)", borderTop: "1px solid var(--line-soft)" }}>
              ↳ {block.note}
            </div>
          )}
        </div>
      );
    case "table":
      return (
        <div className="my-6 overflow-x-auto rounded-[12px]" style={{ border: "1px solid var(--line-soft)" }}>
          <table className="w-full text-[14px] border-collapse">
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-wider"
                    style={{ color: "var(--ink-3)", borderBottom: "1px solid var(--line-soft)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < block.rows.length - 1 ? "1px solid var(--line-soft)" : "none" }}
                  className="transition-colors hover:bg-[var(--bg)]">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 leading-relaxed" style={{ color: j === 0 ? "var(--ink-1)" : "var(--ink-3)" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "video": {
      const youtubeId = getYouTubeId(block.url);
      return (
        <div className="my-6">
          {youtubeId ? (
            <div className="rounded-[12px] overflow-hidden" style={{ border: "1px solid var(--line-soft)", aspectRatio: "16/9" }}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={block.title ?? "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <a href={block.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-[12px] transition-all hover:border-[var(--blue)]"
              style={{ border: "1px solid var(--line-soft)", background: "var(--card)" }}>
              <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: "var(--red)" }}>
                <Play size={16} className="text-white ml-0.5" fill="white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ink-1)" }}>
                  {block.title ?? "Watch video"}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--ink-4)" }}>
                  {block.source ?? "External video"}
                </p>
              </div>
              <ExternalLink size={14} style={{ color: "var(--ink-4)" }} />
            </a>
          )}
          {block.title && youtubeId && (
            <p className="text-[12px] mt-2 italic" style={{ color: "var(--ink-4)" }}>
              ↳ {block.title}
            </p>
          )}
        </div>
      );
    }
    case "link-article": {
      const linked = ARTICLES.find((a) => a.slug === block.slug);
      if (!linked) return null;
      const meta = TYPE_META[linked.type];
      return (
        <Link href={`/library/${linked.slug}`}
          className="my-5 flex items-center gap-3 p-4 rounded-[12px] group transition-all hover:border-[var(--blue)]"
          style={{ border: "1px solid var(--line-soft)", background: "var(--card)" }}>
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: meta.bg, color: meta.color }}>
            {TYPE_ICONS[linked.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--ink-4)" }}>
              {block.note ?? "Related article"}
            </p>
            <p className="text-[14px] font-semibold leading-snug group-hover:text-[var(--blue)] transition-colors line-clamp-1"
              style={{ color: "var(--ink-1)" }}>
              {linked.title}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-4)" }}>
              {linked.subject_tags[0]} · {linked.readTime}
            </p>
          </div>
          <ArrowRight size={15} className="shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            style={{ color: "var(--blue)" }} />
        </Link>
      );
    }
    case "external-link":
      return (
        <a href={block.url} target="_blank" rel="noopener noreferrer"
          className="my-5 flex items-center gap-3 p-4 rounded-[12px] transition-all hover:border-[var(--blue)] group"
          style={{ border: "1px solid var(--line-soft)", background: "var(--card)" }}>
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: "var(--bg)", color: "var(--ink-3)" }}>
            <ExternalLink size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--ink-4)" }}>
              External Resource
            </p>
            <p className="text-[14px] font-semibold leading-snug group-hover:text-[var(--blue)] transition-colors line-clamp-1"
              style={{ color: "var(--ink-1)" }}>
              {block.title}
            </p>
            {block.note && (
              <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--ink-4)" }}>{block.note}</p>
            )}
          </div>
          <ArrowRight size={15} className="shrink-0 -rotate-45 opacity-50 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--blue)" }} />
        </a>
      );
    case "divider":
      return <hr className="my-10 mx-auto w-12" style={{ borderColor: "var(--line)" }} />;
    default:
      return null;
  }
}

/* ─── TOC helper ─── */
function buildTOC(content: ContentBlock[]) {
  return content
    .filter((b): b is Extract<ContentBlock, { type: "h2" }> => b.type === "h2")
    .map((b) => ({ text: b.text, id: b.text.replace(/\s+/g, "-").toLowerCase() }));
}

/* ─────────────────────────────────────────────
   Article Page
───────────────────────────────────────────── */
export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router   = useRouter();
  const { user } = useAuth();

  const article = ARTICLES.find((a) => a.slug === slug);
  const isPaid  = !!(user as any)?.subscription;

  const [isBookmarked,   setIsBookmarked]   = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [activeHeading,  setActiveHeading]  = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isRead,         setIsRead]         = useState(false);
  const [showReadBanner, setShowReadBanner] = useState(false);
  const markedRef = useRef(false);  // guard so we only fire once

  /* Load bookmark + read status */
  useEffect(() => {
    if (!article) return;
    try {
      const bm = localStorage.getItem("library-bookmarks");
      if (bm) setIsBookmarked(new Set<string>(JSON.parse(bm)).has(article.id));

      const rd = localStorage.getItem("en_lib_read");
      if (rd) {
        const set = new Set<string>(JSON.parse(rd));
        if (set.has(article.slug)) { setIsRead(true); markedRef.current = true; }
      }
    } catch { /* ignore */ }
  }, [article]);

  const toggleBookmark = useCallback(() => {
    if (!article) return;
    setIsBookmarked((prev) => {
      try {
        const saved = localStorage.getItem("library-bookmarks");
        const set = new Set<string>(saved ? JSON.parse(saved) : []);
        if (prev) set.delete(article.id); else set.add(article.id);
        localStorage.setItem("library-bookmarks", JSON.stringify([...set]));
      } catch { /* ignore */ }
      return !prev;
    });
  }, [article]);

  const handleShare = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  /* Auto-mark read at 80% scroll */
  const markRead = useCallback(() => {
    if (!article || markedRef.current) return;
    markedRef.current = true;
    setIsRead(true);
    setShowReadBanner(true);
    setTimeout(() => setShowReadBanner(false), 4000);
    try {
      const raw = localStorage.getItem("en_lib_read");
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      set.add(article.slug);
      localStorage.setItem("en_lib_read", JSON.stringify([...set]));
    } catch { /* ignore */ }
  }, [article]);

  // Scroll-spy for TOC + reading progress bar + auto-mark-read
  useEffect(() => {
    if (!article) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveHeading(e.target.id); });
      },
      { rootMargin: "-10% 0px -80% 0px" }
    );
    document.querySelectorAll("h2[id]").forEach((el) => observer.observe(el));

    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct   = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0;
      setScrollProgress(pct);
      if (pct >= 80) markRead();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [article, markRead]);

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <BookOpen size={40} style={{ color: "var(--ink-4)" }} />
        <h1 className="text-[20px] font-bold" style={{ color: "var(--ink-1)" }}>Article not found</h1>
        <Link href="/library" className="text-[13px] font-semibold" style={{ color: "var(--blue)" }}>
          ← Back to Nurture Library
        </Link>
      </div>
    );
  }

  const meta = TYPE_META[article.type];
  const toc  = buildTOC(article.content);

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50" style={{ background: "transparent" }}>
        <div className="h-full transition-all" style={{ width: `${scrollProgress}%`, background: "var(--blue)" }} />
      </div>

      {/* Auto-read toast */}
      <AnimatePresence>
        {showReadBanner && (
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-[14px] shadow-lg"
            style={{
              transform: "translateX(-50%)",
              background: "var(--card)",
              border: "1px solid rgba(34,197,94,0.3)",
              boxShadow: "0 8px 28px -6px rgba(0,0,0,0.2)",
              translateX: "-50%",
            }}
          >
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--green)" }}>
              <Check size={14} className="text-white" />
            </span>
            <div>
              <p className="text-[13px] font-bold" style={{ color: "var(--ink-1)" }}>
                Article marked as read ✓
              </p>
              <p className="text-[11px]" style={{ color: "var(--ink-4)" }}>
                Your progress is saved automatically
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-12 items-start fade-up" style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* ── Article column (Medium-style narrow) ── */}
        <article className="flex-1 min-w-0" style={{ maxWidth: 720 }}>

          {/* Back link */}
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 mb-8 text-[13px] font-medium transition-colors hover:text-[var(--ink-1)]"
            style={{ color: "var(--ink-4)" }}>
            <ArrowLeft size={14} /> Nurture Library
          </button>

          {/* Article header */}
          <header className="mb-10">
            {/* Type badge + Read badge row */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: meta.bg, color: meta.color }}>
                {TYPE_ICONS[article.type]} {meta.label}
              </span>
              {isRead && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(34,197,94,0.12)", color: "var(--green)" }}>
                  <Check size={11} /> Completed
                </span>
              )}
            </div>

            {/* Title — Medium-style large */}
            <h1 className="text-[32px] sm:text-[38px] font-bold tracking-tight leading-[1.15] mb-5"
              style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
              {article.title}
            </h1>

            {/* Subtitle */}
            <p className="text-[17px] leading-[1.6] font-light mb-6" style={{ color: "var(--ink-3)" }}>
              {article.description}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-4 flex-wrap py-4 text-[12px]"
              style={{ borderTop: "1px solid var(--line-soft)", borderBottom: "1px solid var(--line-soft)", color: "var(--ink-4)" }}>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} /> {formatDate(article.publishedAt)}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} /> {article.readTime} read
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: DIFF_COLOR[article.difficulty] }} />
                {article.difficulty}
              </span>
              <div className="flex-1" />
              <button onClick={toggleBookmark}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] transition-all hover:bg-[var(--bg)]"
                style={{ color: isBookmarked ? "var(--blue)" : "var(--ink-3)" }}
                title={isBookmarked ? "Saved" : "Save"}>
                {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                <span className="text-[12px] font-medium">{isBookmarked ? "Saved" : "Save"}</span>
              </button>
              <button onClick={handleShare}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] transition-all hover:bg-[var(--bg)]"
                style={{ color: "var(--ink-3)" }}>
                <Share2 size={13} />
                <span className="text-[12px] font-medium">{copied ? "Copied!" : "Share"}</span>
              </button>
            </div>

            {/* Topic tags */}
            {article.topic_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-5">
                {article.topic_tags.map((t) => (
                  <span key={t} className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "var(--bg)", color: "var(--ink-3)", border: "1px solid var(--line-soft)" }}>
                    #{t.replace(/\s+/g, "")}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Article content */}
          <div className="article-body">
            {article.content.map((block, i) => (
              <RenderBlock key={i} block={block} />
            ))}
          </div>

          {/* Footer actions */}
          <footer className="mt-16 pt-8 space-y-6" style={{ borderTop: "1px solid var(--line-soft)" }}>

            {/* Take Test CTA */}
            {isPaid ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-[14px]"
                style={{ background: "linear-gradient(135deg, var(--blue-soft), rgba(139,92,246,0.08))", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ background: "var(--blue)", color: "#fff" }}>
                  <FlaskConical size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold" style={{ color: "var(--ink-1)" }}>
                    Test your understanding
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-3)" }}>
                    Take a quick quiz based on this article to reinforce what you just learned.
                  </p>
                </div>
                <button
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-bold text-white transition-all hover:brightness-110 hover:scale-[1.02]"
                  style={{ background: "var(--blue)" }}
                  onClick={() => alert("Article test — coming soon!")}
                >
                  <FlaskConical size={14} /> Take Test
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-[14px]"
                style={{ background: "var(--bg)", border: "1px solid var(--line-soft)" }}>
                <div className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ background: "var(--card)", color: "var(--ink-4)", border: "1px solid var(--line-soft)" }}>
                  <Lock size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold" style={{ color: "var(--ink-2)" }}>
                    Test your understanding
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-4)" }}>
                    Take article-based quizzes and track your progress. Available for Pro users.
                  </p>
                </div>
                <Link href="/plans"
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-bold text-white transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, var(--blue), var(--cyan))" }}>
                  <Sparkles size={13} /> Upgrade to Pro
                </Link>
              </div>
            )}

            {/* Save + Share */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[13px]" style={{ color: "var(--ink-4)" }}>
                Was this article helpful?
              </p>
              <div className="flex items-center gap-2">
                <button onClick={toggleBookmark}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all hover:brightness-105"
                  style={{
                    background: isBookmarked ? "var(--blue-soft)" : "var(--bg)",
                    color: isBookmarked ? "var(--blue)" : "var(--ink-2)",
                    border: "1px solid var(--line-soft)",
                  }}>
                  {isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                  {isBookmarked ? "Saved" : "Save for later"}
                </button>
                <button onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all hover:brightness-105"
                  style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line-soft)" }}>
                  <Share2 size={13} /> {copied ? "Copied!" : "Share"}
                </button>
              </div>
            </div>
          </footer>

          <div className="h-16" />
        </article>

        {/* ── TOC sidebar (desktop only) ── */}
        {toc.length > 1 && (
          <aside className="hidden lg:block w-56 shrink-0 sticky top-20">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
              On this page
            </p>
            <nav className="flex flex-col gap-0.5">
              {toc.map((item) => (
                <a key={item.id} href={`#${item.id}`}
                  className="text-[12px] leading-snug py-1.5 px-3 rounded-[6px] transition-all block"
                  style={{
                    color: activeHeading === item.id ? "var(--blue)" : "var(--ink-4)",
                    background: activeHeading === item.id ? "var(--blue-soft)" : "transparent",
                    fontWeight: activeHeading === item.id ? 600 : 400,
                    borderLeft: `2px solid ${activeHeading === item.id ? "var(--blue)" : "var(--line-soft)"}`,
                  }}>
                  {item.text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>
    </>
  );
}
