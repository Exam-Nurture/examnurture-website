"use client";

/**
 * Series detail (in-app, v2): tests grouped Available now / Upcoming / Locked
 * with a small summary card. Real data only. Old page removed: assumed
 * "English, Hindi" language row, invented fallback description, and the
 * checkout links (the website has no checkout yet; paid actions open /pricing).
 */

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, FileText, Lock, Play } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { withAccess } from "@/lib/series-access";
import AppPage from "@/components/app/AppPage";

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
const BACK = { href: "/dashboard/series", label: "Mock tests" };

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [reload, setReload] = useState(0);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (apiFetch(`/test-series/${id}`) as Promise<SeriesDetail>)
      // paid series: every test needs the student's entitlement (backend rule)
      .then((data) => withAccess(data, true))
      .then((data) => {
        if (!alive) return;
        setSeries(data);
        setStatus("ok");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [id, reload]);

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
      <AppPage title={<span className="inline-block h-9 w-64 animate-pulse rounded-lg bg-[var(--bg-secondary)] align-middle" />} back={BACK}>
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading series">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-[var(--bg-secondary)]" />)}
        </div>
      </AppPage>
    );
  }

  if (status === "error" || !series) {
    return (
      <AppPage title="Series not found" back={BACK} width="narrow">
        <div className="flex flex-col items-start gap-3" role="alert">
          <p className="text-sm text-[var(--ink-3)]">It may have been removed, or the connection failed.</p>
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              setReload((n) => n + 1);
            }}
            className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]"
          >
            Try again
          </button>
        </div>
      </AppPage>
    );
  }

  const total = series.tests?.length ?? series.totalTests ?? 0;
  const price = series.discountedPrice ?? series.price ?? 0;
  const struck = series.discountedPrice != null && series.price != null && series.discountedPrice < series.price;
  const hasLocked = groups.locked.length > 0;

  return (
    <AppPage
      title={series.title}
      subtitle={series.description || `${total} ${total === 1 ? "test" : "tests"} in the real exam interface.`}
      back={BACK}
      width="wide"
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="flex min-w-0 flex-col gap-10">
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
              <section key={label} className="reveal" aria-labelledby={`g-${label.replace(/\s/g, "")}`}>
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 id={`g-${label.replace(/\s/g, "")}`} className="text-lg font-semibold text-[var(--ink-1)]" style={display}>{label}</h2>
                  <span className="text-sm text-[var(--ink-3)]">{list.length}</span>
                </div>
                <ul className="flex flex-col gap-3">
                  {list.map((t, i) => {
                    const mins = Math.round(t.durationSec / 60);
                    const isUpcoming = label === "Upcoming";
                    const n = (series.tests?.indexOf(t) ?? i) + 1;
                    return (
                      <li key={t.id} className="reveal" style={{ transitionDelay: `${Math.min(i, 6) * 50}ms` }}>
                        <div className="en-card flex items-center gap-4 p-4 sm:p-5">
                          <span className={`grid h-10 w-10 flex-none place-items-center rounded-[12px] text-sm font-bold ${t.isLocked ? "bg-[var(--bg-secondary)] text-[var(--ink-3)]" : isUpcoming ? "bg-[var(--accent-soft)] text-[var(--accent-ink)]" : "bg-[var(--brand-soft)] text-[var(--brand)]"}`} style={display}>
                            {t.isLocked ? <Lock className="h-4 w-4" aria-hidden="true" /> : n}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-[var(--ink-1)]">{t.title}</p>
                            <p className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-[var(--ink-3)]">
                              {mins > 0 && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{mins} min</span>}
                              {t.totalMarks > 0 && <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" aria-hidden="true" />{t.totalMarks} marks</span>}
                              {t.scheduledAt && now !== null && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                  {new Date(t.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </span>
                              )}
                            </p>
                          </div>
                          {t.isLocked ? (
                            <Link href="/pricing" className="inline-flex min-h-11 flex-none items-center rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-4 text-xs font-semibold text-[var(--ink-2)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">Unlock</Link>
                          ) : isUpcoming ? (
                            <span className="flex-none rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-ink)]">Upcoming</span>
                          ) : (
                            <Link href={`/exam/${t.id}`} className="inline-flex min-h-11 flex-none items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
                              <Play className="h-3 w-3 fill-current" aria-hidden="true" /> Start
                            </Link>
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

        <aside className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">
          <dl className="en-card flex flex-col gap-3 p-6 text-sm">
            {series.exam && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--ink-3)]">Exam</dt>
                <dd className="text-right font-semibold text-[var(--ink-1)]">{series.exam.name}</dd>
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
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--ink-3)]">Access</dt>
              <dd className="font-semibold text-[var(--ink-1)]">
                {!series.isPaid ? (
                  <span className="text-[var(--green)]">Free</span>
                ) : (
                  <span className="tabular-nums">
                    {struck && <s className="mr-1.5 font-normal text-[var(--ink-3)]">{rupees(series.price!)}</s>}
                    {rupees(price)}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {series.isPaid && hasLocked && (
            <Link href="/pricing" className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-hover)]">
              See plans <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </aside>
      </div>
    </AppPage>
  );
}
