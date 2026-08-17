"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, SlidersHorizontal, Download, Play, CheckCircle2, Clock,
  BookOpen, FileText, Compass, Rows3, Grid2x2, RotateCcw, Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiGetPYQPapers, apiGetPYQAttempts } from "@/lib/api";
import {
  Bezel, Eyebrow, PageHeader, Skel, EmptyState, LoadingRegion, TONE,
  relativeDate, scoreTone, type Tone,
} from "@/components/dashboard/ui";
import {
  FilterDrawer, FilterChip, StickyToolbar, SearchField, FilterButton,
  type FilterOpt, type FilterGroup,
} from "@/components/dashboard/FilterDrawer";

const ALL = "__all__";

type Paper = Record<string, any>;
type Attempt = Record<string, any>;
type Status = "attempted" | "paused" | "new";

interface Row {
  paper: Paper;
  status: Status;
  attempt?: Attempt;
}

const STATUS_META: Record<Status, { label: string; tone: Tone; icon: React.ReactNode }> = {
  attempted: { label: "Attempted",   tone: "green",   icon: <CheckCircle2 size={11} strokeWidth={2.6} /> },
  paused:    { label: "Paused",      tone: "amber",   icon: <RotateCcw size={11} strokeWidth={2.6} /> },
  new:       { label: "Unattempted", tone: "neutral", icon: <BookOpen size={11} strokeWidth={2.4} /> },
};

function PYQPageInner() {
  const params = useSearchParams();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [scope, setScope] = useState<"all" | "attempted" | "new">(
    params.get("tab") === "attempts" ? "attempted" : "all",
  );
  const [query, setQuery] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stateId, setStateId] = useState(ALL);
  const [boardId, setBoardId] = useState(ALL);
  const [examId, setExamId] = useState(ALL);
  const [year, setYear] = useState(ALL);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([apiGetPYQPapers({ limit: 200 }), apiGetPYQAttempts()]).then(
      ([p, a]) => {
        if (!alive) return;
        if (p.status === "fulfilled") {
          setPapers(((p.value as any)?.items ?? []) as Paper[]);
        }
        if (a.status === "fulfilled") {
          setAttempts(Array.isArray(a.value) ? (a.value as Attempt[]) : []);
        }
        setFailed(p.status === "rejected");
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  /* ── Merge attempts into papers so status is a first-class property ── */
  const rows = useMemo<Row[]>(() => {
    const byPaper = new Map<string, Attempt>();
    attempts.forEach((a) => {
      const key = String(a.paperId ?? a.paper?.id ?? "");
      if (!key) return;
      const prev = byPaper.get(key);
      // Keep the most recent attempt per paper.
      if (!prev || new Date(a.completedAt ?? 0) > new Date(prev.completedAt ?? 0)) {
        byPaper.set(key, a);
      }
    });

    return papers.map((p) => {
      const a = byPaper.get(String(p.id));
      const status: Status = !a ? "new" : a.completedAt ? "attempted" : "paused";
      return { paper: p, status, attempt: a };
    });
  }, [papers, attempts]);

  /* ── Filter options ── */
  const stateOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    papers.forEach((p) =>
      map.set(
        String(p.exam?.board?.state?.id ?? "__national__"),
        p.exam?.board?.state?.name || "National",
      ),
    );
    return [
      { id: ALL, label: "All" },
      ...[...map.entries()]
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) =>
          a.label === "National" ? 1 : b.label === "National" ? -1 : a.label.localeCompare(b.label),
        ),
    ];
  }, [papers]);

  const boardOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    papers.forEach((p) => {
      const st = String(p.exam?.board?.state?.id ?? "__national__");
      if (stateId !== ALL && st !== stateId) return;
      if (p.exam?.board?.id) {
        map.set(p.exam.board.id, p.exam.board.shortName || p.exam.board.name);
      }
    });
    return [
      { id: ALL, label: "All" },
      ...[...map.entries()].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [papers, stateId]);

  const examOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    papers.forEach((p) => {
      const st = String(p.exam?.board?.state?.id ?? "__national__");
      if (stateId !== ALL && st !== stateId) return;
      if (boardId !== ALL && p.exam?.board?.id !== boardId) return;
      if (p.exam?.id) map.set(p.exam.id, p.exam.shortName || p.exam.name);
    });
    return [
      { id: ALL, label: "All" },
      ...[...map.entries()].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [papers, stateId, boardId]);

  const yearOptions = useMemo<FilterOpt[]>(() => {
    const years = new Set<number>();
    papers.forEach((p) => {
      if (p.year) years.add(Number(p.year));
    });
    return [
      { id: ALL, label: "All years" },
      ...[...years].sort((a, b) => b - a).map((y) => ({ id: String(y), label: String(y) })),
    ];
  }, [papers]);

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
    setYear(ALL);
  }

  const activeCount = [stateId, boardId, examId, year].filter((v) => v !== ALL).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ paper: p, status }) => {
      if (scope === "attempted" && status === "new") return false;
      if (scope === "new" && status !== "new") return false;
      if (q && !`${p.title ?? ""} ${p.exam?.name ?? ""} ${p.year ?? ""}`.toLowerCase().includes(q)) {
        return false;
      }
      const st = String(p.exam?.board?.state?.id ?? "__national__");
      if (stateId !== ALL && st !== stateId) return false;
      if (boardId !== ALL && p.exam?.board?.id !== boardId) return false;
      if (examId !== ALL && p.exam?.id !== examId) return false;
      if (year !== ALL && String(p.year) !== year) return false;
      return true;
    });
  }, [rows, scope, query, stateId, boardId, examId, year]);

  /* ── Group by year so the year reads as a section, not a chip ── */
  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    filtered.forEach((r) => {
      const y = String(r.paper.year ?? "Undated");
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(r);
    });
    return [...map.entries()].sort((a, b) => {
      if (a[0] === "Undated") return 1;
      if (b[0] === "Undated") return -1;
      return Number(b[0]) - Number(a[0]);
    });
  }, [filtered]);

  const groups: FilterGroup[] = [
    { key: "year", title: "Year", options: yearOptions, selected: year, onChange: setYear },
    { key: "state", title: "State", options: stateOptions, selected: stateId, onChange: pickState },
    { key: "board", title: "Board", options: boardOptions, selected: boardId, onChange: pickBoard },
    { key: "exam", title: "Exam", options: examOptions, selected: examId, onChange: setExamId },
  ];

  const label = (opts: FilterOpt[], id: string) => opts.find((o) => o.id === id)?.label;
  const attemptedCount = rows.filter((r) => r.status === "attempted").length;

  const SCOPES: { id: typeof scope; label: string; count: number }[] = [
    { id: "all", label: "All papers", count: rows.length },
    { id: "attempted", label: "Attempted", count: attemptedCount },
    { id: "new", label: "Unattempted", count: rows.length - attemptedCount },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Real exam papers"
        title="Previous Year Papers"
        sub="Solve the actual paper under real timing, or download the PDF to work offline."
        counts={
          loading
            ? undefined
            : [
                { label: "papers", value: rows.length },
                { label: "attempted", value: attemptedCount, tone: "green" },
              ]
        }
        action={{ label: "Browse all", href: "/pyq/all", icon: <Compass size={13} /> }}
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
          Could not load previous-year papers. Refresh to try again.
        </div>
      )}

      {rows.length > 0 && (
        <StickyToolbar>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by paper, exam or year…"
            icon={<Search size={15} />}
          />

          {/* Scope segmented control */}
          <div
            className="flex shrink-0 items-center gap-0.5 rounded-full p-1"
            style={{ background: "var(--d-inset)", border: "1px solid var(--d-line-soft)" }}
          >
            {SCOPES.map((s) => {
              const on = scope === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScope(s.id)}
                  aria-pressed={on}
                  className="rounded-full px-3 py-[6px] text-[12px] font-semibold transition-all duration-200 d-focus"
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
                  {s.label}
                  <span className="ml-1.5 opacity-60">{s.count}</span>
                </button>
              );
            })}
          </div>

          {/* View switch */}
          <div
            className="hidden shrink-0 items-center gap-0.5 rounded-full p-1 sm:flex"
            style={{ background: "var(--d-inset)", border: "1px solid var(--d-line-soft)" }}
          >
            {([
              { id: "grid", icon: <Grid2x2 size={14} />, label: "Grid view" },
              { id: "list", icon: <Rows3 size={14} />, label: "List view" },
            ] as const).map((v) => {
              const on = view === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  aria-label={v.label}
                  aria-pressed={on}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 d-focus"
                  style={
                    on
                      ? {
                          background: "var(--d-surface)",
                          color: "var(--d-ink)",
                          boxShadow: "0 1px 3px rgba(17,17,17,.10)",
                        }
                      : { color: "var(--d-ink-4)" }
                  }
                >
                  {v.icon}
                </button>
              );
            })}
          </div>

          <FilterButton count={activeCount} onClick={() => setDrawerOpen(true)}>
            <SlidersHorizontal size={14} />
            Filters
          </FilterButton>
        </StickyToolbar>
      )}

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {year !== ALL && <FilterChip label={year} onRemove={() => setYear(ALL)} />}
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

      {/* ── Content ── */}
      {loading ? (
        <LoadingRegion label="Loading previous-year papers">
          <div className="flex flex-col gap-3">
            <Skel className="h-3 w-16 rounded-full" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <PaperSkeleton key={i} />
              ))}
            </div>
          </div>
        </LoadingRegion>
      ) : rows.length === 0 ? (
        <EmptyState
          eyebrow="Nothing available"
          title="No papers here yet"
          body="Previous-year papers for your exams haven't been published yet. Browse the full catalogue to find what's live."
          action={{ label: "Browse all papers", href: "/pyq/all" }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          eyebrow="No matches"
          title="Nothing fits those filters"
          body="Try a different year or exam, or clear the filters to see every paper again."
          secondary={
            <button
              type="button"
              onClick={() => {
                setScope("all");
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
        <div className="flex flex-col gap-8">
          {grouped.map(([yr, items]) => (
            <section key={yr}>
              {/* Year rule — the year is the loudest element on the page */}
              <div className="mb-4 flex items-center gap-3.5">
                <h2
                  className="d-num text-[22px] font-semibold leading-none"
                  style={{ fontFamily: "var(--font-sora)", color: "var(--d-ink)", letterSpacing: "-0.03em" }}
                >
                  {yr}
                </h2>
                <span
                  className="rounded-full px-2 py-[3px] text-[10px] font-bold leading-none"
                  style={{
                    background: "var(--d-inset)",
                    color: "var(--d-ink-3)",
                    border: "1px solid var(--d-line-soft)",
                  }}
                >
                  {items.length} {items.length === 1 ? "PAPER" : "PAPERS"}
                </span>
                <span className="h-px flex-1" style={{ background: "var(--d-line-soft)" }} />
              </div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}
                className={
                  view === "grid"
                    ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col gap-2.5"
                }
              >
                {items.map((row) => (
                  <motion.div
                    key={row.paper.id}
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
                    }}
                  >
                    {view === "grid" ? <PaperCard row={row} /> : <PaperRow row={row} />}
                  </motion.div>
                ))}
              </motion.div>
            </section>
          ))}
        </div>
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

export default function PYQPage() {
  return (
    <Suspense fallback={<PYQFallback />}>
      <PYQPageInner />
    </Suspense>
  );
}

function PYQFallback() {
  return (
    <div className="flex flex-col gap-5">
      <Skel className="h-8 w-64 rounded-lg" />
      <Skel className="h-12 w-full rounded-[18px]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <PaperSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Status badge
══════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  const t = TONE[m.tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[4px] text-[10px] font-bold leading-none whitespace-nowrap"
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.line}` }}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   Grid card
══════════════════════════════════════════════════════ */

function PaperCard({ row }: { row: Row }) {
  const { paper: p, status, attempt } = row;
  const pct =
    attempt && attempt.totalMarks > 0
      ? Math.round((attempt.score / attempt.totalMarks) * 100)
      : null;

  return (
    <Bezel interactive className="h-full group" innerClassName="h-full flex flex-col">
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Eyebrow className="min-w-0 truncate">{p.exam?.shortName || p.exam?.name || "PYQ"}</Eyebrow>
          <StatusBadge status={status} />
        </div>

        <h3
          className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug"
          style={{ fontFamily: "var(--font-sora)", color: "var(--d-ink)", letterSpacing: "-0.02em" }}
        >
          {p.title}
        </h3>

        {p.shift && (
          <p className="mt-1 text-[12px]" style={{ color: "var(--d-ink-4)" }}>
            Shift {p.shift}
          </p>
        )}

        {/* Facts */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
          <Fact icon={<BookOpen size={12} />} text={`${p.totalQs ?? "—"} questions`} />
          <Fact icon={<Clock size={12} />} text={`${p.durationMin ?? "—"} min`} />
        </div>

        {/* Previous result */}
        {attempt && pct !== null && (
          <div className="d-well mt-4 flex items-center justify-between px-3.5 py-2.5">
            <div>
              <div className="d-eyebrow">Your score</div>
              <div
                className="d-num mt-1.5 text-[15px] font-semibold leading-none"
                style={{ color: "var(--d-ink)" }}
              >
                {attempt.score}
                <span className="text-[11.5px] font-medium" style={{ color: "var(--d-ink-4)" }}>
                  {" "}
                  / {attempt.totalMarks}
                </span>
              </div>
            </div>
            <span
              className="d-num rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{
                background: TONE[scoreTone(pct)].bg,
                color: TONE[scoreTone(pct)].fg,
                border: `1px solid ${TONE[scoreTone(pct)].line}`,
              }}
            >
              {pct}%
            </span>
          </div>
        )}

        <div className="mt-auto pt-4">
          <PaperActions row={row} />
        </div>
      </div>
    </Bezel>
  );
}

function Fact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12px]"
      style={{ color: "var(--d-ink-3)" }}
    >
      <span style={{ color: "var(--d-ink-4)" }}>{icon}</span>
      {text}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   List row — denser scanning mode
══════════════════════════════════════════════════════ */

function PaperRow({ row }: { row: Row }) {
  const { paper: p, status, attempt } = row;
  const pct =
    attempt && attempt.totalMarks > 0
      ? Math.round((attempt.score / attempt.totalMarks) * 100)
      : null;

  return (
    <Bezel interactive className="group" innerClassName="">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5">
        {/* Year block */}
        <div
          className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-[12px]"
          style={{ background: "var(--d-inset)", border: "1px solid var(--d-line-soft)" }}
        >
          <span
            className="d-num text-[15px] font-bold leading-none"
            style={{ color: "var(--d-ink)" }}
          >
            {p.year ?? "—"}
          </span>
          <span className="d-eyebrow mt-1" style={{ fontSize: 8 }}>
            YEAR
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="truncate text-[14px] font-semibold"
              style={{ color: "var(--d-ink)", letterSpacing: "-0.015em" }}
            >
              {p.title}
            </h3>
            <StatusBadge status={status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Fact icon={<FileText size={11} />} text={p.exam?.shortName || p.exam?.name || "PYQ"} />
            <Fact icon={<BookOpen size={11} />} text={`${p.totalQs ?? "—"} Qs`} />
            <Fact icon={<Clock size={11} />} text={`${p.durationMin ?? "—"} min`} />
            {attempt?.completedAt && (
              <Fact icon={<Trophy size={11} />} text={relativeDate(attempt.completedAt)} />
            )}
          </div>
        </div>

        {pct !== null && (
          <span
            className="d-num shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold"
            style={{
              background: TONE[scoreTone(pct)].bg,
              color: TONE[scoreTone(pct)].fg,
              border: `1px solid ${TONE[scoreTone(pct)].line}`,
            }}
          >
            {pct}%
          </span>
        )}

        <div className="shrink-0">
          <PaperActions row={row} compact />
        </div>
      </div>
    </Bezel>
  );
}

/* ══════════════════════════════════════════════════════
   Split action control
   Primary = attempt / review. Secondary = PDF download.
══════════════════════════════════════════════════════ */

function PaperActions({ row, compact }: { row: Row; compact?: boolean }) {
  const { paper: p, status, attempt } = row;

  const primary =
    status === "attempted"
      ? { label: "Review", href: `/pyq/${p.id}?attemptId=${attempt?.id}`, icon: <Trophy size={12} /> }
      : status === "paused"
        ? { label: "Resume", href: `/pyq/${p.id}`, icon: <Play size={11} fill="currentColor" stroke="none" /> }
        : { label: "Attempt", href: `/pyq/${p.id}`, icon: <Play size={11} fill="currentColor" stroke="none" /> };

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-2"}>
      <Link
        href={primary.href}
        target={status === "attempted" ? undefined : "_blank"}
        rel={status === "attempted" ? undefined : "noopener noreferrer"}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold text-white transition-transform duration-200 hover:-translate-y-[1px] d-focus ${
          compact ? "px-4 py-[8px]" : "flex-1 px-4 py-[9px]"
        }`}
        style={{
          background: "var(--blue-ink)",
          boxShadow: "0 6px 18px -10px rgba(13,40,126,.65)",
        }}
      >
        {primary.icon}
        {primary.label}
      </Link>

      {p.pdfUrl ? (
        <a
          href={p.pdfUrl}
          target="_blank"
          rel="noreferrer"
          title="Download paper PDF"
          aria-label="Download paper PDF"
          className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-[1px] d-focus"
          style={{
            color: "var(--d-ink-3)",
            background: "var(--d-inset)",
            border: "1px solid var(--d-line-soft)",
          }}
        >
          <Download size={14} />
        </a>
      ) : (
        <span
          title="PDF not available for this paper"
          className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full opacity-40"
          style={{
            color: "var(--d-ink-4)",
            background: "var(--d-inset)",
            border: "1px solid var(--d-line-soft)",
          }}
        >
          <Download size={14} />
        </span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Skeleton
══════════════════════════════════════════════════════ */

function PaperSkeleton() {
  return (
    <Bezel className="h-full" innerClassName="h-full">
      <div className="flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Skel className="h-2.5 w-16 rounded-full" />
          <Skel className="h-4 w-20 rounded-full" />
        </div>
        <Skel className="mt-3.5 h-4 w-[90%] rounded-md" />
        <Skel className="mt-2 h-4 w-[60%] rounded-md" />
        <div className="mt-4 flex gap-3">
          <Skel className="h-3 w-24 rounded-md" />
          <Skel className="h-3 w-16 rounded-md" />
        </div>
        <div className="mt-auto flex items-center gap-2 pt-5">
          <Skel className="h-[34px] flex-1 rounded-full" />
          <Skel className="h-[34px] w-[34px] rounded-full" />
        </div>
      </div>
    </Bezel>
  );
}
