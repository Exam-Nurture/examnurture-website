"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BookOpen, ExternalLink, ArrowRight, BookMarked } from "lucide-react";
import { apiGetBookmarks } from "@/lib/api";

export default function MyLibraryPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetBookmarks()
      .then((data: any) => setBookmarks(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
            My Library
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-4)" }}>
            Your bookmarked questions and saved content
          </p>
        </div>
        <Link
          href="/library"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-[var(--bg)]"
          style={{ color: "var(--blue)", borderColor: "var(--blue)", borderWidth: 1.5 }}
        >
          <BookOpen className="w-4 h-4" />
          Browse All Articles
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Bookmarked Questions */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="w-4 h-4" style={{ color: "var(--amber)" }} />
          <h2 className="text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>
            Bookmarked Questions
          </h2>
          {!loading && (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--amber-soft)", color: "var(--amber)" }}
            >
              {bookmarks.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--bg)" }} />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div
            className="flex flex-col items-center py-12 rounded-2xl border-2 border-dashed"
            style={{ borderColor: "var(--line-soft)" }}
          >
            <BookMarked className="w-10 h-10 mb-3" style={{ color: "var(--ink-4)" }} />
            <p className="font-semibold text-sm" style={{ color: "var(--ink-3)" }}>No bookmarks yet</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--ink-4)" }}>
              Bookmark questions during tests to review them here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookmarks.map((bm: any) => {
              const q = bm.question;
              if (!q) return null;
              let opts: string[] = [];
              try { opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options; } catch {}
              return (
                <div
                  key={bm.id}
                  className="card p-4"
                >
                  <p
                    className="text-[13px] font-medium leading-relaxed mb-3"
                    style={{ color: "var(--ink-1)" }}
                    dangerouslySetInnerHTML={{ __html: q.text?.slice(0, 200) + (q.text?.length > 200 ? "…" : "") }}
                  />
                  <div className="flex flex-col gap-1.5">
                    {opts.slice(0, 4).map((opt: string, i: number) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 text-[12px] px-3 py-2 rounded-lg ${
                          i === q.correctIndex
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                            : "text-[var(--ink-3)]"
                        }`}
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

      {/* Coming Soon — Saved Articles */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4" style={{ color: "var(--blue)" }} />
          <h2 className="text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>Saved Articles</h2>
        </div>
        <div
          className="flex flex-col items-center py-10 rounded-2xl border-2 border-dashed"
          style={{ borderColor: "var(--line-soft)" }}
        >
          <BookOpen className="w-8 h-8 mb-2" style={{ color: "var(--ink-4)" }} />
          <p className="font-semibold text-sm" style={{ color: "var(--ink-3)" }}>Article saving coming soon</p>
          <Link
            href="/library"
            className="mt-3 flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: "var(--blue)" }}
          >
            Browse Articles <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
