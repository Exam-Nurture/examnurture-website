"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Bookmark, BookmarkX, Check, Clock, Hash, ArrowRight,
  BookMarked, Search, Library, Sparkles,
} from "lucide-react";
import { apiGetBookmarks, apiGetBlogs, type PublicBlogPost } from "@/lib/api";
import {
  Bezel, Eyebrow, PageHeader, Skel, EmptyState, LoadingRegion, SectionHead,
  TONE, relativeDate, type Tone,
} from "@/components/dashboard/ui";
import { SearchField } from "@/components/dashboard/FilterDrawer";

const READ_KEY = "en_lib_read";
const SAVED_KEY = "library-bookmarks";

/** Category → accent, drawn from the token palette rather than raw hexes. */
const CAT_TONE: Record<string, Tone> = {
  "Current Affairs": "green",
  Strategy: "violet",
  Concept: "cyan",
  Formula: "violet",
  Revision: "amber",
  News: "amber",
  Announcement: "red",
  General: "blue",
};

function toneFor(cat: string): Tone {
  return CAT_TONE[cat] ?? "neutral";
}

function parseTags(raw?: string): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export default function SavedBlogsPage() {
  const [articles, setArticles] = useState<PublicBlogPost[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingBM, setLoadingBM] = useState(true);

  const [readSlugs, setReadSlugs] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"saved" | "read">("saved");

  /* localStorage is only readable after mount — keeps SSR output stable */
  useEffect(() => {
    setReadSlugs(readSet(READ_KEY));
    setSavedIds(readSet(SAVED_KEY));
    setHydrated(true);
  }, []);

  useEffect(() => {
    let alive = true;
    apiGetBlogs({ limit: 100 })
      .then((res) => {
        if (alive) setArticles(res.items ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingArticles(false);
      });

    apiGetBookmarks()
      .then((data: any) => {
        if (alive) setBookmarks(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingBM(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const unsave = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      } catch {
        /* storage unavailable — the in-memory state still updates */
      }
      return next;
    });
  }, []);

  const saved = useMemo(
    () => articles.filter((a) => savedIds.has(a.id)),
    [articles, savedIds],
  );
  const read = useMemo(
    () => articles.filter((a) => readSlugs.has(a.slug)),
    [articles, readSlugs],
  );

  const active = tab === "saved" ? saved : read;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return active;
    return active.filter((a) =>
      `${a.title} ${a.excerpt ?? ""} ${a.category} ${parseTags(a.tags).join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  }, [active, query]);

  const minutes = read.reduce((sum, a) => sum + (a.readTimeMin || 0), 0);
  const topics = [...new Set(read.flatMap((a) => parseTags(a.tags)))].slice(0, 14);

  const loading = loadingArticles || !hydrated;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Reading list"
        title="Saved Articles"
        sub="Everything you've bookmarked, plus the questions you flagged during tests."
        counts={
          loading
            ? undefined
            : [
                { label: "saved", value: saved.length },
                { label: "read", value: read.length, tone: "green" },
                { label: "min read", value: minutes, tone: "violet" },
              ]
        }
        action={{ label: "Browse library", href: "/blogs", icon: <Library size={13} /> }}
      />

      {/* ── Tabs + search ── */}
      {!loading && (saved.length > 0 || read.length > 0) && (
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="flex shrink-0 items-center gap-0.5 rounded-full p-1"
            style={{ background: "var(--d-inset)", border: "1px solid var(--d-line-soft)" }}
          >
            {([
              { id: "saved", label: "Saved", count: saved.length },
              { id: "read", label: "Completed", count: read.length },
            ] as const).map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-pressed={on}
                  className="rounded-full px-4 py-[7px] text-[12.5px] font-semibold transition-all duration-200 d-focus"
                  style={
                    on
                      ? {
                          background: "var(--d-surface)",
                          color: "var(--d-ink)",
                          boxShadow: "0 1px 3px rgba(17,17,17,.10)",
                        }
                      : { color: "var(--d-ink-3)" }
                  }
                >
                  {t.label}
                  <span className="ml-1.5 opacity-60">{t.count}</span>
                </button>
              );
            })}
          </div>

          <div className="min-w-[220px] flex-1">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search your reading list…"
              icon={<Search size={15} />}
            />
          </div>
        </div>
      )}

      {/* ── Editorial list ── */}
      {loading ? (
        <LoadingRegion label="Loading your reading list">
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <ArticleSkeleton key={i} />
            ))}
          </div>
        </LoadingRegion>
      ) : active.length === 0 ? (
        <EmptyState
          eyebrow={tab === "saved" ? "Nothing saved" : "Nothing finished"}
          title={tab === "saved" ? "Your reading list is empty" : "No completed articles yet"}
          body={
            tab === "saved"
              ? "Tap the bookmark icon on any article and it will wait for you here."
              : "Articles are marked complete once you scroll past 80% of the page."
          }
          action={{ label: "Browse the library", href: "/blogs" }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          eyebrow="No matches"
          title="Nothing matches that search"
          body="Try a different word, or clear the search to see your whole list."
          secondary={
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-[10px] text-[13px] font-semibold transition-transform hover:-translate-y-[1px] d-focus"
              style={{
                background: "var(--d-surface)",
                color: "var(--d-ink-2)",
                border: "1px solid var(--d-line)",
              }}
            >
              Clear search
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false} mode="popLayout">
            {filtered.map((a, i) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.035, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
                exit={{ opacity: 0, x: -24, transition: { duration: 0.25 } }}
              >
                <ArticleCard
                  article={a}
                  isRead={readSlugs.has(a.slug)}
                  isSaved={savedIds.has(a.id)}
                  onUnsave={() => unsave(a.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Topics ── */}
      {!loading && topics.length > 0 && (
        <Bezel innerClassName="px-5 sm:px-6 py-5">
          <SectionHead size="sm" eyebrow="Coverage" title="Topics you've read" />
          <div className="mt-4 flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-[5px] text-[11.5px] font-medium"
                style={{
                  background: "var(--d-inset)",
                  color: "var(--d-ink-2)",
                  border: "1px solid var(--d-line-soft)",
                }}
              >
                <Hash size={9} style={{ color: "var(--d-ink-4)" }} />
                {t}
              </span>
            ))}
          </div>
        </Bezel>
      )}

      {/* ── Bookmarked questions ── */}
      <section>
        <SectionHead
          eyebrow="From your tests"
          title="Bookmarked questions"
          sub="Questions you flagged mid-test, ready for a second look"
          className="mb-4"
        />

        {loadingBM ? (
          <LoadingRegion label="Loading bookmarked questions">
            <div className="flex flex-col gap-3">
              {[0, 1].map((i) => (
                <Bezel key={i} innerClassName="p-5">
                  <Skel className="h-4 w-[80%] rounded-md" />
                  <Skel className="mt-2 h-4 w-[55%] rounded-md" />
                  <div className="mt-4 flex flex-col gap-2">
                    {[0, 1, 2, 3].map((j) => (
                      <Skel key={j} className="h-8 w-full rounded-[10px]" />
                    ))}
                  </div>
                </Bezel>
              ))}
            </div>
          </LoadingRegion>
        ) : bookmarks.length === 0 ? (
          <Bezel innerClassName="flex flex-col items-center px-6 py-12 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "var(--d-inset)", color: "var(--d-ink-4)" }}
            >
              <BookMarked size={20} />
            </span>
            <p className="mt-4 text-[14px] font-semibold" style={{ color: "var(--d-ink-2)" }}>
              No bookmarked questions
            </p>
            <p
              className="mt-1.5 text-[12.5px]"
              style={{ color: "var(--d-ink-4)", maxWidth: "42ch" }}
            >
              While taking a test, tap the bookmark icon on any question and it will collect here
              for revision.
            </p>
          </Bezel>
        ) : (
          <div className="flex flex-col gap-3">
            {bookmarks.map((bm: any) => (
              <QuestionCard key={bm.id} bookmark={bm} />
            ))}
          </div>
        )}
      </section>

      {/* ── Discover ── */}
      <Bezel innerClassName="relative px-5 sm:px-6 py-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 140% at 90% 0%, var(--blue-soft) 0%, transparent 62%)",
          }}
        />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]"
            style={{
              background: "var(--blue-soft)",
              color: "var(--blue-ink)",
              border: "1px solid rgba(29,78,216,0.24)",
            }}
          >
            <Sparkles size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-semibold" style={{ color: "var(--d-ink)" }}>
              Find your next read
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--d-ink-3)" }}>
              Concepts, formulas, revision notes and exam strategy — updated weekly.
            </p>
          </div>
          <Link href="/blogs" className="shrink-0 rounded-full d-focus">
            <span
              className="group inline-flex items-center gap-2 rounded-full px-5 py-[11px] text-[13px] font-semibold text-white transition-transform duration-300 hover:-translate-y-[1px]"
              style={{
                background: "var(--blue-ink)",
                boxShadow: "0 8px 22px -10px rgba(13,40,126,.55)",
              }}
            >
              Browse library
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
      </Bezel>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Editorial article card
══════════════════════════════════════════════════════ */

function ArticleCard({
  article: a,
  isRead,
  isSaved,
  onUnsave,
}: {
  article: PublicBlogPost;
  isRead: boolean;
  isSaved: boolean;
  onUnsave: () => void;
}) {
  const tone = toneFor(a.category);
  const t = TONE[tone];
  const tags = parseTags(a.tags);

  return (
    <Bezel interactive className="group" innerClassName="">
      <article className="flex items-start gap-4 p-4 sm:gap-5 sm:p-5">
        {/* Thumbnail */}
        <Link
          href={`/blogs/${a.slug}`}
          aria-hidden="true"
          tabIndex={-1}
          className="relative hidden h-[86px] w-[112px] shrink-0 overflow-hidden rounded-[14px] sm:block"
          style={{ background: t.bg, border: `1px solid ${t.line}` }}
        >
          {a.coverUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={a.coverUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center"
              style={{ color: t.fg }}
            >
              <BookOpen size={24} strokeWidth={1.5} />
            </span>
          )}
          {isRead && (
            <span
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
              style={{ background: "var(--green)", color: "#fff" }}
            >
              <Check size={11} strokeWidth={3} />
            </span>
          )}
        </Link>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2 py-[3px] text-[9.5px] font-bold uppercase leading-none tracking-[0.08em]"
              style={{ background: t.bg, color: t.fg, border: `1px solid ${t.line}` }}
            >
              {a.category}
            </span>
            {isRead && (
              <span
                className="inline-flex items-center gap-1 text-[10.5px] font-semibold"
                style={{ color: "var(--green)" }}
              >
                <Check size={10} strokeWidth={3} /> Read
              </span>
            )}
          </div>

          {/* Large editorial title */}
          <h3
            className="mt-2 text-[17px] font-semibold leading-[1.28] sm:text-[19px]"
            style={{
              fontFamily: "var(--font-sora)",
              color: "var(--d-ink)",
              letterSpacing: "-0.022em",
            }}
          >
            <Link href={`/blogs/${a.slug}`} className="d-focus rounded transition-colors duration-200 group-hover:text-[var(--blue-ink)]">
              {a.title}
            </Link>
          </h3>

          {a.excerpt && (
            <p
              className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed"
              style={{ color: "var(--d-ink-3)", maxWidth: "62ch" }}
            >
              {a.excerpt}
            </p>
          )}

          {/* Byline row */}
          <div
            className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]"
            style={{ color: "var(--d-ink-4)" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Clock size={11} />
              {a.readTimeMin} min read
            </span>
            {a.publishedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span>{relativeDate(a.publishedAt)}</span>
              </>
            )}
            {tags[0] && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Hash size={9} />
                  {tags[0]}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Hover actions — always reachable by keyboard, revealed on hover */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            href={`/blogs/${a.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] font-semibold transition-all duration-300 d-focus sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            style={{
              background: "var(--blue-soft)",
              color: "var(--blue-ink)",
              border: "1px solid rgba(29,78,216,0.26)",
            }}
          >
            {isRead ? "Read again" : "Read now"}
            <ArrowRight size={12} />
          </Link>

          {isSaved && (
            <button
              type="button"
              onClick={onUnsave}
              title="Remove from reading list"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-[6px] text-[11.5px] font-semibold transition-all duration-300 d-focus sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              style={{ color: "var(--d-ink-4)", background: "var(--d-inset)" }}
            >
              <BookmarkX size={12} />
              Unsave
            </button>
          )}
        </div>
      </article>
    </Bezel>
  );
}

function ArticleSkeleton() {
  return (
    <Bezel innerClassName="">
      <div className="flex items-start gap-5 p-5">
        <Skel className="hidden h-[86px] w-[112px] shrink-0 rounded-[14px] sm:block" />
        <div className="min-w-0 flex-1">
          <Skel className="h-4 w-20 rounded-full" />
          <Skel className="mt-3 h-5 w-[85%] rounded-md" />
          <Skel className="mt-2 h-3.5 w-[95%] rounded-md" />
          <Skel className="mt-1.5 h-3.5 w-[70%] rounded-md" />
          <Skel className="mt-3.5 h-3 w-40 rounded-md" />
        </div>
        <Skel className="h-8 w-24 shrink-0 rounded-full" />
      </div>
    </Bezel>
  );
}

/* ══════════════════════════════════════════════════════
   Bookmarked question
══════════════════════════════════════════════════════ */

/** Question text is LLM-generated and may carry markup — always strip it. */
function stripHtml(s: string) {
  return (s || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function QuestionCard({ bookmark: bm }: { bookmark: any }) {
  const q = bm.question;
  if (!q) return null;

  let options: string[] = [];
  try {
    const raw = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
    options = Array.isArray(raw) ? raw : [];
  } catch {
    options = [];
  }

  const text = stripHtml(q.text);

  return (
    <Bezel innerClassName="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "var(--amber-soft)",
            color: "var(--amber)",
            border: "1px solid rgba(232,169,60,0.3)",
          }}
        >
          <Bookmark size={13} />
        </span>
        <p
          className="text-[13.5px] font-medium leading-relaxed"
          style={{ color: "var(--d-ink)", maxWidth: "72ch" }}
        >
          {text.length > 260 ? `${text.slice(0, 260)}…` : text}
        </p>
      </div>

      {options.length > 0 && (
        <ol className="mt-4 flex flex-col gap-1.5">
          {options.slice(0, 4).map((opt, i) => {
            const correct = i === q.correctIndex;
            return (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-[10px] px-3 py-2 text-[12.5px]"
                style={
                  correct
                    ? {
                        background: "var(--green-soft)",
                        color: "var(--green)",
                        border: "1px solid rgba(59,170,111,0.3)",
                        fontWeight: 600,
                      }
                    : {
                        color: "var(--d-ink-2)",
                        border: "1px solid var(--d-line-soft)",
                      }
                }
              >
                <span className="w-4 shrink-0 font-bold">{["A", "B", "C", "D"][i]}.</span>
                <span>{stripHtml(opt)}</span>
                {correct && <Check size={13} strokeWidth={3} className="ml-auto shrink-0" />}
              </li>
            );
          })}
        </ol>
      )}

      {(q.subject || q.difficulty) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {q.subject && (
            <span
              className="rounded-full px-2.5 py-[4px] text-[10px] font-semibold uppercase tracking-[0.06em]"
              style={{
                background: "var(--d-inset)",
                color: "var(--d-ink-3)",
                border: "1px solid var(--d-line-soft)",
              }}
            >
              {q.subject}
            </span>
          )}
          {q.difficulty && (
            <span
              className="rounded-full px-2.5 py-[4px] text-[10px] font-semibold uppercase tracking-[0.06em]"
              style={{
                background: "var(--d-inset)",
                color: "var(--d-ink-4)",
                border: "1px solid var(--d-line-soft)",
              }}
            >
              {q.difficulty}
            </span>
          )}
        </div>
      )}
    </Bezel>
  );
}
