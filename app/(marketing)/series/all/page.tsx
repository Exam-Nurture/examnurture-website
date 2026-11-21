"use client";

/**
 * Mock tests catalogue (v2). Calm, simple, findable:
 *   soft header with search → exam + price filters → soft cards, free first.
 * Filters live in the URL (?q, ?exam, ?access) so results can be shared.
 * Each card opens the series; the exam name opens that exam's course page.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Search, Timer } from "lucide-react";
import { apiGetTestSeries } from "@/lib/api";
import HeroGeometry from "@/components/marketing/HeroGeometry";

interface SeriesItem {
  id: string;
  title: string;
  description?: string | null;
  totalTests: number;
  isPaid: boolean;
  isOwned?: boolean;
  price: number;
  discountedPrice?: number | null;
  exam?: { id: string; name: string; shortName?: string; board?: { shortName?: string; state?: { name: string } | null } | null } | null;
}

type Access = "all" | "free" | "paid";

const display = { fontFamily: "var(--font-sora)" } as const;
const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function Catalogue() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [items, setItems] = useState<SeriesItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);

  const [q, setQ] = useState(params.get("q") ?? "");
  const exam = params.get("exam") ?? "all";
  const access = (params.get("access") as Access) ?? "all";

  useEffect(() => {
    let alive = true;
    (apiGetTestSeries({ limit: 100 }) as Promise<{ items: SeriesItem[] }>)
      .then((r) => {
        if (!alive) return;
        setItems(r.items ?? []);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [reload]);

  // keep ?q in sync without spamming history
  useEffect(() => {
    const t = setTimeout(() => setParam("q", q.trim() || null), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  const exams = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; n: number }>();
    (items ?? []).forEach((s) => {
      if (!s.exam) return;
      const cur = counts.get(s.exam.id) ?? { id: s.exam.id, name: s.exam.name, n: 0 };
      cur.n += 1;
      counts.set(s.exam.id, cur);
    });
    return [...counts.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }, [items]);

  const visible = useMemo(() => {
    const needle = (params.get("q") ?? "").toLowerCase();
    return (items ?? [])
      .filter((s) => (exam === "all" ? true : s.exam?.id === exam))
      .filter((s) => (access === "free" ? !s.isPaid : access === "paid" ? s.isPaid : true))
      .filter((s) => !needle || `${s.title} ${s.exam?.name ?? ""} ${s.exam?.board?.shortName ?? ""}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(a.isPaid) - Number(b.isPaid) || Number(!!b.isOwned) - Number(!!a.isOwned));
  }, [items, exam, access, params]);

  const filtered = exam !== "all" || access !== "all" || !!params.get("q");

  return (
    <div className="bg-[var(--bg)]">
      {/* ── Header ── */}
      <section className="en-hero-deep">
        <HeroGeometry variant="compact" />
        <div className="relative mx-auto flex max-w-[1180px] flex-col gap-5 px-4 pb-14 pt-12 sm:px-6 lg:pt-16">
          <p className="en-rise text-xs font-semibold uppercase tracking-[0.09em] text-[#C9CBFF]">Mock tests</p>
          <h1 style={{ ...display, animationDelay: "60ms" }} className="en-rise max-w-2xl text-4xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            Practise in the real exam interface.
          </h1>
          <p style={{ animationDelay: "120ms" }} className="en-rise max-w-xl text-lg text-white/80">Full-length mocks with timer, palette and solutions. Start with a free series.</p>
          <div style={{ animationDelay: "180ms" }} className="en-rise flex w-full max-w-[600px] items-center gap-2 rounded-[16px] bg-[var(--card)] px-4 shadow-[0_20px_50px_-12px_rgba(10,12,60,.55)] ring-1 ring-white/20 focus-within:ring-4 focus-within:ring-white/30">
            <Search className="h-5 w-5 flex-none text-[var(--ink-3)]" aria-hidden="true" />
            <label htmlFor="series-search" className="sr-only">Search mock tests</label>
            <input
              id="series-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by exam or series"
              className="min-h-13 min-w-0 flex-1 bg-transparent py-3.5 text-base text-[var(--ink-1)] outline-none placeholder:text-[var(--ink-3)]"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] px-4 pb-20 sm:px-6">
        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line-soft)] py-5">
          <div role="group" aria-label="Price" className="inline-flex rounded-[12px] bg-[var(--bg-secondary)] p-1">
            {(["all", "free", "paid"] as Access[]).map((a) => (
              <button
                key={a}
                aria-pressed={access === a}
                onClick={() => setParam("access", a)}
                className={`min-h-9 rounded-[9px] px-4 text-sm capitalize transition-colors ${
                  access === a ? "bg-[var(--card)] font-semibold text-[var(--ink-1)] shadow-[var(--shadow-xs)]" : "text-[var(--ink-3)] hover:text-[var(--ink-1)]"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <label htmlFor="series-exam" className="sr-only">Exam</label>
          <select
            id="series-exam"
            value={exam}
            onChange={(e) => setParam("exam", e.target.value)}
            className="min-h-11 rounded-[12px] border border-[var(--line-soft)] bg-[var(--card)] px-3 text-sm text-[var(--ink-1)] shadow-[var(--shadow-xs)]"
          >
            <option value="all">All exams</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({e.n})</option>
            ))}
          </select>

          <p className="ml-auto text-sm text-[var(--ink-3)]" aria-live="polite">
            {items ? `${visible.length} ${visible.length === 1 ? "series" : "series"}` : ""}
            {filtered && (
              <button
                onClick={() => {
                  setQ("");
                  router.replace(pathname, { scroll: false });
                }}
                className="ml-3 font-semibold text-[var(--brand)] hover:underline"
              >
                Clear
              </button>
            )}
          </p>
        </div>

        {/* ── Results ── */}
        <div className="pt-8">
          {failed ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <p className="font-semibold text-[var(--ink-1)]">Couldn&apos;t load mock tests.</p>
              <button onClick={() => setReload((n) => n + 1)} className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)]">Try again</button>
            </div>
          ) : items === null ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => <li key={i} className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-[var(--bg-secondary)]" />)}
            </ul>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <p className="font-semibold text-[var(--ink-1)]">No mock tests match.</p>
              <p className="text-sm text-[var(--ink-3)]">Try another exam or clear the filters.</p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((s, i) => {
                const price = s.discountedPrice ?? s.price;
                const struck = s.discountedPrice != null && s.discountedPrice < s.price;
                return (
                  <li key={s.id} className="reveal" style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                    <article className="en-card en-card-link relative flex h-full flex-col gap-4 p-6">
                      <div className="flex items-center justify-between gap-3">
                        <span className="grid h-10 min-w-10 place-items-center rounded-[10px] bg-[var(--brand-soft)] px-2 text-[11px] font-bold text-[var(--brand)]" style={display}>
                          {(s.exam?.board?.shortName || s.exam?.shortName || "EN").slice(0, 5).toUpperCase()}
                        </span>
                        {!s.isPaid ? (
                          <span className="rounded-full bg-[var(--green-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--green)]">Free</span>
                        ) : s.isOwned ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]"><Check className="h-3 w-3" aria-hidden="true" />Yours</span>
                        ) : (
                          <span className="text-sm font-semibold tabular-nums text-[var(--ink-1)]">
                            {struck && <s className="mr-1.5 font-normal text-[var(--ink-3)]">{rupees(s.price)}</s>}
                            {rupees(price)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <h2 className="text-[1.05rem] font-semibold leading-snug text-[var(--ink-1)]" style={display}>
                          {/* stretched link: the whole card opens the series */}
                          <Link href={`/series/${s.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-lg)] focus-visible:outline-none">
                            {s.title}
                          </Link>
                        </h2>
                        {s.exam && <p className="text-sm text-[var(--ink-3)]">{s.exam.name}</p>}
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-1 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-[var(--ink-3)]">
                          <Timer className="h-4 w-4" aria-hidden="true" />
                          {s.totalTests > 0 ? `${s.totalTests} tests` : "Tests coming soon"}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-[var(--brand)]">
                          {!s.isPaid || s.isOwned ? "Start" : "View"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AllSeriesPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Catalogue />
    </Suspense>
  );
}
