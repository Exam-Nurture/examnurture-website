"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, SlidersHorizontal, Layers, ShoppingCart, ArrowRight,
  Compass, GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiGetTestSeries } from "@/lib/api";
import {
  Bezel, Eyebrow, PageHeader, Track, Skel, EmptyState, LoadingRegion, TONE,
  type Tone,
} from "@/components/dashboard/ui";
import {
  FilterDrawer, FilterChip, StickyToolbar, SearchField, FilterButton,
  type FilterOpt, type FilterGroup,
} from "@/components/dashboard/FilterDrawer";

const ALL = "__all__";

/** Controlled accent rotation — no random gradients, five brand-adjacent tints. */
const ACCENTS: Tone[] = ["blue", "violet", "cyan", "green", "amber"];

function accentFor(seed: string): Tone {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n + seed.charCodeAt(i)) % 997;
  return ACCENTS[n % ACCENTS.length];
}

function monogram(text: string) {
  const clean = (text || "?").trim();
  const parts = clean.split(/[\s-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

type Series = Record<string, any>;

export default function SeriesPage() {
  const [list, setList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stateId, setStateId] = useState(ALL);
  const [boardId, setBoardId] = useState(ALL);
  const [examId, setExamId] = useState(ALL);

  useEffect(() => {
    let alive = true;
    apiGetTestSeries({ limit: 100 })
      .then((data: any) => {
        if (alive) setList(data?.items ?? []);
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  /* ── Category rail ── */
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(list.map((s) => s.exam?.shortName || "Other"))).sort(),
    ],
    [list],
  );

  /* ── Cascading hierarchy options ── */
  const stateOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    list.forEach((s) => {
      map.set(
        String(s.exam?.board?.state?.id ?? "__national__"),
        s.exam?.board?.state?.name || "National",
      );
    });
    const sorted = [...map.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) =>
        a.label === "National" ? 1 : b.label === "National" ? -1 : a.label.localeCompare(b.label),
      );
    return [{ id: ALL, label: "All" }, ...sorted];
  }, [list]);

  const boardOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    list.forEach((s) => {
      const st = String(s.exam?.board?.state?.id ?? "__national__");
      if (stateId !== ALL && st !== stateId) return;
      if (s.exam?.board?.id) {
        map.set(s.exam.board.id, s.exam.board.shortName || s.exam.board.name);
      }
    });
    return [
      { id: ALL, label: "All" },
      ...[...map.entries()]
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [list, stateId]);

  const examOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    list.forEach((s) => {
      const st = String(s.exam?.board?.state?.id ?? "__national__");
      if (stateId !== ALL && st !== stateId) return;
      if (boardId !== ALL && s.exam?.board?.id !== boardId) return;
      if (s.exam?.id) map.set(s.exam.id, s.exam.shortName || s.exam.name);
    });
    return [
      { id: ALL, label: "All" },
      ...[...map.entries()]
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [list, stateId, boardId]);

  function pickState(id: string) {
    setStateId(id);
    setBoardId(ALL);
    setExamId(ALL);
  }
  function pickBoard(id: string) {
    setBoardId(id);
    setExamId(ALL);
  }
  function clearAll() {
    setStateId(ALL);
    setBoardId(ALL);
    setExamId(ALL);
  }

  const activeCount = [stateId, boardId, examId].filter((v) => v !== ALL).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((s) => {
      if (category !== "All" && s.exam?.shortName !== category) return false;
      if (q && !`${s.title ?? ""} ${s.exam?.name ?? ""} ${s.description ?? ""}`.toLowerCase().includes(q)) {
        return false;
      }
      const st = String(s.exam?.board?.state?.id ?? "__national__");
      if (stateId !== ALL && st !== stateId) return false;
      if (boardId !== ALL && s.exam?.board?.id !== boardId) return false;
      if (examId !== ALL && s.exam?.id !== examId) return false;
      return true;
    });
  }, [list, category, query, stateId, boardId, examId]);

  const groups: FilterGroup[] = [
    { key: "state", title: "State", options: stateOptions, selected: stateId, onChange: pickState },
    { key: "board", title: "Board", options: boardOptions, selected: boardId, onChange: pickBoard },
    { key: "exam", title: "Exam", options: examOptions, selected: examId, onChange: setExamId },
  ];

  const uniqueExams = new Set(list.map((s) => s.exam?.name).filter(Boolean)).size;
  const label = (opts: FilterOpt[], id: string) => opts.find((o) => o.id === id)?.label;

  const isFilteredEmpty =
    !loading && list.length > 0 && filtered.length === 0;
  const isLibraryEmpty = !loading && list.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Your library"
        title="Test Series"
        sub="Structured, full-length practice bundles. Pick up any series where you left it."
        counts={
          loading
            ? undefined
            : [
                { label: list.length === 1 ? "series" : "series", value: list.length },
                { label: uniqueExams === 1 ? "exam" : "exams", value: uniqueExams, tone: "green" },
              ]
        }
        action={{ label: "Browse all", href: "/series/all", icon: <Compass size={13} /> }}
      />

      {failed && (
        <div
          className="rounded-[14px] px-4 py-3 text-[12.5px]"
          style={{
            background: "var(--red-soft)",
            color: "var(--red)",
            border: "1px solid rgba(217,92,92,0.26)",
          }}
        >
          Could not reach the test-series service. Refresh to try again.
        </div>
      )}

      {/* ── Sticky glass toolbar ── */}
      {!isLibraryEmpty && (
        <StickyToolbar>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search series, exam or topic…"
            icon={<Search size={15} />}
          />
          <FilterButton count={activeCount} onClick={() => setDrawerOpen(true)}>
            <SlidersHorizontal size={14} />
            Filters
          </FilterButton>
        </StickyToolbar>
      )}

      {/* ── Category rail ── */}
      {!loading && categories.length > 2 && (
        <div className="d-rail -mx-1 px-1">
          {categories.map((cat) => {
            const on = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={on}
                className="shrink-0 rounded-full px-3.5 py-[7px] text-[12.5px] font-medium transition-all duration-200 d-focus"
                style={
                  on
                    ? {
                        background: "var(--blue-ink)",
                        color: "#fff",
                        border: "1px solid var(--blue-ink)",
                        boxShadow: "0 6px 16px -10px rgba(13,40,126,.7)",
                      }
                    : {
                        background: "var(--d-surface)",
                        color: "var(--d-ink-2)",
                        border: "1px solid var(--d-line-soft)",
                      }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Active filter chips ── */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {stateId !== ALL && (
            <FilterChip label={label(stateOptions, stateId) ?? ""} onRemove={() => pickState(ALL)} />
          )}
          {boardId !== ALL && (
            <FilterChip label={label(boardOptions, boardId) ?? ""} onRemove={() => pickBoard(ALL)} />
          )}
          {examId !== ALL && (
            <FilterChip label={label(examOptions, examId) ?? ""} onRemove={() => setExamId(ALL)} />
          )}
          <button
            type="button"
            onClick={clearAll}
            className="text-[11.5px] font-semibold underline underline-offset-2 d-focus"
            style={{ color: "var(--d-ink-4)" }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {loading ? (
        <LoadingRegion label="Loading your test series">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SeriesCardSkeleton key={i} />
            ))}
          </div>
        </LoadingRegion>
      ) : isLibraryEmpty ? (
        <EmptyState
          eyebrow="Nothing here yet"
          title="Your shelf is empty"
          body="You haven't enrolled in a test series. Explore the catalogue and pick the exam you're preparing for."
          action={{ label: "Explore exams", href: "/exams" }}
          secondary={
            <Link
              href="/series/all"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold d-focus"
              style={{ color: "var(--d-ink-2)" }}
            >
              <GraduationCap size={15} />
              Browse all series
            </Link>
          }
        />
      ) : isFilteredEmpty ? (
        <EmptyState
          eyebrow="No matches"
          title="Nothing fits those filters"
          body="Try widening your search, or clear the filters to see your whole library again."
          secondary={
            <button
              type="button"
              onClick={() => {
                setCategory("All");
                setQuery("");
                clearAll();
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-[10px] text-[13px] font-semibold transition-transform hover:-translate-y-[1px] d-focus"
              style={{
                background: "var(--d-surface)",
                color: "var(--d-ink-2)",
                border: "1px solid var(--d-line)",
              }}
            >
              Reset everything
            </button>
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((s) => (
            <motion.div
              key={s.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
              }}
            >
              <SeriesCard series={s} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        groups={groups}
        activeCount={activeCount}
        onClearAll={clearAll}
        resultCount={filtered.length}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Series card
══════════════════════════════════════════════════════ */

function SeriesCard({ series: s }: { series: Series }) {
  const examShort = s.exam?.shortName || s.exam?.name || "General";
  const tone = accentFor(String(s.id ?? s.title ?? "x"));
  const t = TONE[tone];

  const total = Number(s.totalTests ?? s.tests?.length ?? 0);
  // The list endpoint only returns per-user progress for enrolled series, so
  // the progress block is rendered strictly when that number actually exists.
  const hasProgress = typeof s.completedTests === "number";
  const done = hasProgress ? Number(s.completedTests) : 0;
  const pct = hasProgress && total > 0 ? Math.round((done / total) * 100) : 0;

  const price = s.isPaid ? (s.discountedPrice || s.price) : null;
  const cta = !hasProgress ? "Start" : done === 0 ? "Start" : done >= total ? "Review" : "Continue";

  return (
    <Bezel interactive className="h-full" innerClassName="h-full flex flex-col">
      {/* Header band — tinted, compact, no photo slab */}
      <div
        className="relative flex items-center gap-3 px-4 py-3.5"
        style={{ borderBottom: "1px solid var(--d-line-soft)" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: t.bg, opacity: 0.55 }}
        />
        <span
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[13px] font-bold tracking-tight"
          style={{ background: "var(--d-surface)", color: t.fg, border: `1px solid ${t.line}` }}
        >
          {monogram(examShort)}
        </span>

        <div className="relative min-w-0 flex-1">
          <p
            className="truncate text-[13px] font-semibold"
            style={{ color: "var(--d-ink)" }}
          >
            {examShort}
          </p>
          <p className="truncate text-[11px]" style={{ color: "var(--d-ink-3)" }}>
            {total > 0 ? `${total} ${total === 1 ? "test" : "tests"}` : "Tests coming soon"}
          </p>
        </div>

        <div className="relative flex shrink-0 items-center gap-1.5">
          {s.isFeatured && (
            <span
              className="rounded-full px-2 py-[3px] text-[9px] font-bold leading-none"
              style={{
                background: "var(--d-surface)",
                color: "var(--d-ink-3)",
                border: "1px solid var(--d-line)",
              }}
            >
              FEATURED
            </span>
          )}
          {!s.isPaid && (
            <span
              className="rounded-full px-2 py-[3px] text-[9px] font-bold leading-none"
              style={{
                background: "var(--green-soft)",
                color: "var(--green)",
                border: "1px solid rgba(59,170,111,0.3)",
              }}
            >
              FREE
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-4 py-4">
        <h3
          className="line-clamp-2 text-[15px] font-semibold leading-snug"
          style={{ fontFamily: "var(--font-sora)", color: "var(--d-ink)", letterSpacing: "-0.02em" }}
        >
          {s.title}
        </h3>

        {s.description && (
          <p
            className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed"
            style={{ color: "var(--d-ink-3)" }}
          >
            {s.description}
          </p>
        )}

        {/* Progress — only when the backend reports it */}
        {hasProgress && total > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="d-eyebrow">Progress</span>
              <span
                className="d-num text-[11.5px] font-semibold"
                style={{ color: "var(--d-ink-2)" }}
              >
                {done}/{total} · {pct}%
              </span>
            </div>
            <Track value={pct} tone={pct >= 100 ? "green" : tone} height={6} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2 pt-5">
          <span
            className="d-num shrink-0 text-[14px] font-semibold"
            style={{ color: price ? "var(--d-ink)" : "var(--green)" }}
          >
            {price ? `₹${price}` : "Free"}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {s.isPaid && (
              <Link
                href={`/dashboard/checkout/${encodeURIComponent(`TEST_SERIES:${s.id}`)}`}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-[8px] text-[12px] font-semibold transition-colors d-focus"
                style={{
                  color: "var(--d-ink-2)",
                  background: "var(--d-inset)",
                  border: "1px solid var(--d-line-soft)",
                }}
              >
                <ShoppingCart size={12} />
                Buy
              </Link>
            )}
            <Link
              href={`/dashboard/series/${s.id}`}
              className="group inline-flex items-center gap-1.5 rounded-full px-4 py-[8px] text-[12px] font-semibold text-white transition-transform duration-200 hover:-translate-y-[1px] d-focus"
              style={{
                background: "var(--blue-ink)",
                boxShadow: "0 6px 18px -10px rgba(13,40,126,.65)",
              }}
            >
              {cta}
              <ArrowRight
                size={12}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </div>
    </Bezel>
  );
}

/** Skeleton mirrors the card's exact geometry so nothing shifts on load. */
function SeriesCardSkeleton() {
  return (
    <Bezel className="h-full" innerClassName="h-full flex flex-col">
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={{ borderBottom: "1px solid var(--d-line-soft)" }}
      >
        <Skel className="h-10 w-10 shrink-0 rounded-[12px]" />
        <div className="min-w-0 flex-1">
          <Skel className="h-3.5 w-20 rounded-md" />
          <Skel className="mt-1.5 h-2.5 w-14 rounded-md" />
        </div>
        <Skel className="h-4 w-10 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col px-4 py-4">
        <Skel className="h-4 w-[92%] rounded-md" />
        <Skel className="mt-2 h-4 w-[64%] rounded-md" />
        <Skel className="mt-3.5 h-3 w-full rounded-md" />
        <Skel className="mt-1.5 h-3 w-[80%] rounded-md" />
        <div className="mt-5">
          <Skel className="h-2.5 w-16 rounded-full" />
          <Skel className="mt-2 h-[6px] w-full rounded-full" />
        </div>
        <div className="mt-auto flex items-center pt-5">
          <Skel className="h-4 w-12 rounded-md" />
          <Skel className="ml-auto h-[30px] w-24 rounded-full" />
        </div>
      </div>
    </Bezel>
  );
}
