"use client";

/**
 * Saved articles (v2).
 * Articles: ids live in localStorage ("library-bookmarks", written by the blog
 * reader); we match them against the public blog list. Read after mount so the
 * server render and first client render agree.
 * Questions: bookmarks come from the API and can be removed with the same API.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Bookmark, X } from "lucide-react";
import AppPage from "@/components/app/AppPage";
import { apiGetBookmarks, apiGetBlogs, apiRemoveBookmark, type PublicBlogPost } from "@/lib/api";

const ARTICLE_KEY = "library-bookmarks";
const display = { fontFamily: "var(--font-sora)" } as const;

interface BookmarkedQuestion {
  id: string;
  questionId?: string;
  question?: {
    id?: string;
    text?: string;
    options?: string[] | string;
    correctIndex?: number;
    subject?: string;
  } | null;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Preview text must never render raw HTML (question content can be LLM-generated).
const stripHtml = (s: string) => (s || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");

function parseOptions(raw: string[] | string | undefined): string[] {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function ArticleCard({ post, index, onRemove }: { post: PublicBlogPost; index: number; onRemove: () => void }) {
  return (
    <li className="reveal" style={{ transitionDelay: `${(index % 3) * 70}ms` }}>
      <div className="relative h-full">
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
            <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-[var(--ink-1)]" style={display}>
              {post.title}
            </h3>
            {post.excerpt && <p className="line-clamp-2 text-sm leading-relaxed text-[var(--ink-3)]">{post.excerpt}</p>}
            <p className="mt-auto pt-2 text-xs text-[var(--ink-3)]">
              {[formatDate(post.publishedAt), `${post.readTimeMin} min read`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${post.title} from saved`}
          className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-[var(--card)] text-[var(--ink-2)] shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--ink-1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function QuestionRow({ bm, onRemove, busy }: { bm: BookmarkedQuestion; onRemove: () => void; busy: boolean }) {
  const q = bm.question;
  if (!q) return null;
  const text = stripHtml(q.text ?? "");
  const opts = parseOptions(q.options).slice(0, 4);
  return (
    <li className="en-card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-relaxed text-[var(--ink-1)]">
          {text.slice(0, 200)}
          {text.length > 200 ? "…" : ""}
        </p>
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          aria-label="Remove question from saved"
          className="-mr-2 -mt-2 grid h-11 w-11 flex-none place-items-center rounded-full text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--ink-1)] disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {opts.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {opts.map((opt, i) => {
            const correct = i === q.correctIndex;
            return (
              <li
                key={i}
                className={`flex items-start gap-2 rounded-[10px] px-3 py-2 text-sm ${
                  correct ? "bg-[var(--green-soft)] font-semibold text-[var(--green)]" : "bg-[var(--bg-secondary)] text-[var(--ink-2)]"
                }`}
              >
                <span className="w-4 flex-none font-semibold">{["A", "B", "C", "D"][i]}.</span>
                <span>
                  {stripHtml(opt)}
                  {correct && <span className="sr-only"> (correct answer)</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {q.subject && <span className="self-start rounded-full bg-[var(--bg-secondary)] px-2.5 py-0.5 text-xs text-[var(--ink-3)]">{q.subject}</span>}
    </li>
  );
}

function Skeleton({ label }: { label: string }) {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2" aria-busy="true" aria-label={label}>
      {[0, 1].map((i) => (
        <li key={i} className="h-56 animate-pulse rounded-[20px] bg-[var(--bg-secondary)]" />
      ))}
    </ul>
  );
}

export default function SavedBlogsPage() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [articles, setArticles] = useState<PublicBlogPost[] | null>(null);
  const [articlesFailed, setArticlesFailed] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[] | null>(null);
  const [bookmarksFailed, setBookmarksFailed] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  // localStorage is read after mount to avoid a hydration mismatch.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        const raw = window.localStorage.getItem(ARTICLE_KEY);
        setSavedIds(new Set<string>(raw ? (JSON.parse(raw) as string[]) : []));
      } catch {
        /* storage unavailable or corrupt: treat as empty */
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let alive = true;
    apiGetBlogs({ limit: 100 })
      .then((r) => {
        if (!alive) return;
        setArticles(r.items ?? []);
        setArticlesFailed(false);
      })
      .catch(() => alive && setArticlesFailed(true));
    (apiGetBookmarks() as Promise<unknown>)
      .then((d) => {
        if (!alive) return;
        setBookmarks(Array.isArray(d) ? (d as BookmarkedQuestion[]) : []);
        setBookmarksFailed(false);
      })
      .catch(() => alive && setBookmarksFailed(true));
    return () => {
      alive = false;
    };
  }, [reload]);

  const removeArticle = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      try {
        window.localStorage.setItem(ARTICLE_KEY, JSON.stringify([...next]));
      } catch {
        /* keep in memory */
      }
      return next;
    });
  }, []);

  async function removeQuestion(bm: BookmarkedQuestion) {
    const qid = bm.questionId ?? bm.question?.id;
    if (!qid) return;
    setRemoving(bm.id);
    try {
      await apiRemoveBookmark(qid);
      setBookmarks((prev) => (prev ?? []).filter((b) => b.id !== bm.id));
    } catch {
      setBookmarksFailed(true);
    } finally {
      setRemoving(null);
    }
  }

  const saved = (articles ?? []).filter((a) => savedIds.has(a.id));
  const questions = (bookmarks ?? []).filter((b) => b.question);

  return (
    <AppPage title="Saved articles" subtitle="Articles and questions you saved to come back to." back={{ href: "/dashboard/profile", label: "Me" }} width="normal">
      <section aria-labelledby="saved-articles" className="reveal">
        <h2 id="saved-articles" className="mb-4 text-lg font-semibold text-[var(--ink-1)]" style={display}>Articles</h2>
        {articlesFailed ? (
          <div className="en-card flex flex-col items-center gap-3 px-6 py-10 text-center">
            <p className="font-semibold text-[var(--ink-1)]">Couldn&apos;t load articles.</p>
            <button type="button" onClick={() => setReload((n) => n + 1)} className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
              Try again
            </button>
          </div>
        ) : articles === null ? (
          <Skeleton label="Loading articles" />
        ) : saved.length === 0 ? (
          <div className="en-card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
              <Bookmark className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="font-semibold text-[var(--ink-1)]">Nothing saved yet.</p>
            <Link href="/blogs" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--brand)] hover:underline">
              Browse articles <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {saved.map((a, i) => (
              <ArticleCard key={a.id} post={a} index={i} onRemove={() => removeArticle(a.id)} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="saved-questions" className="reveal">
        <h2 id="saved-questions" className="mb-4 text-lg font-semibold text-[var(--ink-1)]" style={display}>Questions</h2>
        {bookmarksFailed ? (
          <div className="en-card flex flex-col items-center gap-3 px-6 py-10 text-center">
            <p className="font-semibold text-[var(--ink-1)]">Couldn&apos;t update saved questions.</p>
            <button type="button" onClick={() => setReload((n) => n + 1)} className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
              Try again
            </button>
          </div>
        ) : bookmarks === null ? (
          <Skeleton label="Loading questions" />
        ) : questions.length === 0 ? (
          <div className="en-card px-6 py-10 text-center">
            <p className="font-semibold text-[var(--ink-1)]">No saved questions.</p>
            <p className="mt-1 text-sm text-[var(--ink-3)]">Bookmark a question during a test and it shows up here.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {questions.map((b) => (
              <QuestionRow key={b.id} bm={b} busy={removing === b.id} onRemove={() => removeQuestion(b)} />
            ))}
          </ul>
        )}
      </section>
    </AppPage>
  );
}
