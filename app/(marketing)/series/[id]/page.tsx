"use client";

/**
 * Test series detail (v2).
 *   deep hero (exam → series title) → tests grouped by state
 *   (Available now · Upcoming · Locked) → side card with the one action.
 *
 * Removed from the old page because they weren't real data: a hard-coded
 * "Valid till 31 Dec 2025" and an assumed "English, Hindi" language row.
 * The old "Buy Now" button had no handler (the website has no checkout yet),
 * so the paid action now opens /pricing instead of doing nothing.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, FileText, Lock, Play } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/auth/AuthModal";
import PageHero, { SectionTitle } from "@/components/marketing/PageHero";

interface TestItem {
  id: string;
  title: string;
  durationSec: number;
  totalMarks: number;
  isLocked: boolean;
  scheduledAt?: string | null;
}

interface SeriesDetail {
  id: string;
  title: string;
  description?: string | null;
  totalTests: number;
  isPaid: boolean;
  price?: number;
  discountedPrice?: number | null;
  exam?: { id: string; name: string; shortName?: string } | null;
  tests?: TestItem[];
}

const display = { fontFamily: "var(--font-sora)" } as const;
const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [authOpen, setAuthOpen] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (apiFetch(`/test-series/${id}`) as Promise<SeriesDetail>)
      .then((data) => {
        if (!alive) return;
        setSeries(data);
        setStatus("ok");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [id]);

  // "now" after mount so server and browser agree on what is upcoming
  useEffect(() => {
    const t = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(t);
  }, []);

  const groups = useMemo(() => {
    const tests = series?.tests ?? [];
    const upcoming = (t: TestItem) => !!t.scheduledAt && now !== null && new Date(t.scheduledAt).getTime() > now;
    return {
      available: tests.filter((t) => !t.isLocked && !upcoming(t)),
      upcoming: tests.filter((t) => !t.isLocked && upcoming(t)),
      locked: tests.filter((t) => t.isLocked),
    };
  }, [series, now]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-16 sm:px-6" aria-busy="true">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
        <div className="mt-8 flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-[var(--bg-secondary)]" />)}
        </div>
      </div>
    );
  }

  if (status === "error" || !series) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-28 text-center">
        <h1 className="text-xl font-bold text-[var(--ink-1)]" style={display}>Series not found</h1>
        <p className="text-sm text-[var(--ink-3)]">It may have been removed, or the connection failed.</p>
        <Link href="/series/all" className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-[var(--brand-ink)]">All mock tests</Link>
      </div>
    );
  }

  const total = series.tests?.length ?? series.totalTests ?? 0;
  const price = series.discountedPrice ?? series.price ?? 0;
  const struck = series.discountedPrice != null && series.price != null && series.discountedPrice < series.price;
  const firstOpen = groups.available[0];

  const start = (testId?: string) =>
    user ? (
      <Link
        href={testId ? `/exam/${testId}` : "#tests"}
        className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-hover)]"
      >
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> {testId ? "Start first test" : "See tests"}
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => setAuthOpen(true)}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-hover)]"
      >
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> Sign in to start
      </button>
    );

  return (
    <div className="bg-[var(--bg)]">
      <PageHero
        eyebrow={series.exam?.name ?? "Mock tests"}
        title={series.title}
        subtitle={series.description || `${total} ${total === 1 ? "test" : "tests"} in the real exam interface.`}
      />

      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 pb-24 pt-4 sm:px-6 lg:grid-cols-[1fr_320px]">
        {/* Tests */}
        <div id="tests" className="flex min-w-0 flex-col gap-12">
          {total === 0 && (
            <p className="rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] px-6 py-10 text-center text-sm text-[var(--ink-3)]">Tests will be added soon.</p>
          )}
          {(
            [
              ["Available now", groups.available],
              ["Upcoming", groups.upcoming],
              ["Locked", groups.locked],
            ] as const
          ).map(([label, list]) =>
            list.length === 0 ? null : (
              <section key={label} className="reveal">
                <SectionTitle aside={<span className="text-sm text-[var(--ink-3)]">{list.length}</span>}>{label}</SectionTitle>
                <ul className="flex flex-col gap-3">
                  {list.map((t, i) => {
                    const mins = Math.round(t.durationSec / 60);
                    const isUpcoming = label === "Upcoming";
                    return (
                      <li key={t.id} className="reveal" style={{ transitionDelay: `${Math.min(i, 6) * 50}ms` }}>
                        <div className="en-card flex items-center gap-4 p-4 sm:p-5">
                          <span className={`grid h-10 w-10 flex-none place-items-center rounded-[12px] text-sm font-bold ${t.isLocked ? "bg-[var(--bg-secondary)] text-[var(--ink-3)]" : "bg-[var(--brand-soft)] text-[var(--brand)]"}`} style={display}>
                            {t.isLocked ? <Lock className="h-4 w-4" aria-hidden="true" /> : (series.tests?.indexOf(t) ?? i) + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-[var(--ink-1)]">{t.title}</p>
                            <p className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-[var(--ink-3)]">
                              {mins > 0 && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{mins} min</span>}
                              {t.totalMarks > 0 && <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" aria-hidden="true" />{t.totalMarks} marks</span>}
                              {t.scheduledAt && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                  {new Date(t.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </span>
                              )}
                            </p>
                          </div>
                          {t.isLocked ? (
                            <Link href="/pricing" className="min-h-10 flex-none rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-4 py-2.5 text-xs font-semibold text-[var(--ink-2)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">Unlock</Link>
                          ) : isUpcoming ? (
                            <span className="flex-none rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-ink)]">Upcoming</span>
                          ) : user ? (
                            <Link href={`/exam/${t.id}`} className="inline-flex min-h-10 flex-none items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--brand)] px-4 text-xs font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
                              <Play className="h-3 w-3 fill-current" aria-hidden="true" /> Start
                            </Link>
                          ) : (
                            <button type="button" onClick={() => setAuthOpen(true)} className="inline-flex min-h-10 flex-none items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--brand)] px-4 text-xs font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
                              <Play className="h-3 w-3 fill-current" aria-hidden="true" /> Start
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ),
          )}
        </div>

        {/* Side card */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <div className="en-card flex flex-col gap-5 p-6 !shadow-[0_2px_4px_rgba(22,26,51,.04),0_20px_44px_-16px_rgba(61,63,184,.28)]">
            {series.isPaid ? (
              <>
                <div>
                  <p className="text-xs text-[var(--ink-3)]">Full access</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--ink-1)]" style={display}>
                    {rupees(price)}
                    {struck && <s className="ml-2 text-base font-medium text-[var(--ink-3)]">{rupees(series.price!)}</s>}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-3)]">Also included in the monthly plans.</p>
                </div>
                <Link href="/pricing" className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-hover)]">
                  See plans <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                {firstOpen && <div className="-mt-2">{start(firstOpen.id)}</div>}
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-[var(--ink-3)]">Access</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--green)]" style={display}>Free</p>
                </div>
                {start(firstOpen?.id)}
              </>
            )}
          </div>

          <dl className="en-card flex flex-col gap-3 p-6 text-sm">
            {series.exam && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--ink-3)]">Exam</dt>
                <dd><Link href={`/exams/${series.exam.id}`} className="font-semibold text-[var(--brand)] hover:underline">{series.exam.name}</Link></dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--ink-3)]">Tests</dt>
              <dd className="font-semibold tabular-nums text-[var(--ink-1)]">{total}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--ink-3)]">Open now</dt>
              <dd className="font-semibold tabular-nums text-[var(--ink-1)]">{groups.available.length}</dd>
            </div>
          </dl>
        </aside>
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
