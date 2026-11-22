"use client";

/**
 * All exams (v2). Find your exam fast:
 *   deep hero with search → state and board chips → exams grouped by state
 *   and board as soft cards. Filters and search live in the URL.
 * Data: boards with nested exams via useExamFilter (unchanged).
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, FileText, Timer } from "lucide-react";
import PageHero, { HeroSearch, SectionTitle } from "@/components/marketing/PageHero";
import { useExamFilter, parseIds, serializeIds } from "@/hooks/useExamFilter";
import type { ApiBoard, ApiBoardExam } from "@/lib/api";

const display = { fontFamily: "var(--font-sora)" } as const;

interface StateGroup {
  id: number | null;
  name: string;
  boards: ApiBoard[];
}

function groupByState(boards: ApiBoard[]): StateGroup[] {
  const map = new Map<string, StateGroup>();
  for (const board of boards) {
    const key = board.state ? String(board.state.id) : "__none__";
    const name = board.state?.name ?? "Central & all-India";
    if (!map.has(key)) map.set(key, { id: board.state?.id ?? null, name, boards: [] });
    map.get(key)!.boards.push(board);
  }
  return [...map.values()].sort((a, b) => {
    if (a.id === null) return -1; // all-India first
    if (b.id === null) return 1;
    return a.name.localeCompare(b.name);
  });
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex min-h-10 flex-none items-center gap-1.5 rounded-full px-4 text-sm transition-all ${
        on
          ? "bg-[var(--brand)] font-semibold text-[var(--brand-ink)] shadow-[0_6px_16px_-8px_var(--brand)]"
          : "bg-[var(--bg-secondary)] text-[var(--ink-2)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
      }`}
    >
      {children}
    </button>
  );
}

function ExamCard({ exam, board, delay = 0 }: { exam: ApiBoardExam; board: ApiBoard; delay?: number }) {
  return (
    <li className="reveal" style={{ transitionDelay: `${delay}ms` }}>
      <Link href={`/exams/${exam.id}`} className="group en-card en-card-link flex h-full flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="grid h-10 min-w-10 place-items-center rounded-[10px] bg-[var(--brand-soft)] px-2 text-[11px] font-bold text-[var(--brand)] transition-transform duration-300 group-hover:scale-105" style={display}>
            {(board.shortName || exam.shortName).slice(0, 5).toUpperCase()}
          </span>
          <ArrowRight className="h-4 w-4 -translate-x-1 text-[var(--brand)] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
        </div>
        <span className="font-semibold leading-snug text-[var(--ink-1)]" style={display}>{exam.name}</span>
        <span className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ink-3)]">
          {exam.hasTests && <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" aria-hidden="true" />Mock tests</span>}
          {exam.hasPYQ && <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" aria-hidden="true" />Past papers</span>}
          {!exam.hasTests && !exam.hasPYQ && <span>Details and dates</span>}
        </span>
      </Link>
    </li>
  );
}

function AllExams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get("q") ?? "");
  const f = useExamFilter({
    stateIds: parseIds(params.get("stateIds"), Number),
    boardIds: parseIds(params.get("boardIds"), String),
    examIds: parseIds(params.get("examIds"), String),
  });

  // URL sync
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      if (search.trim()) p.set("q", search.trim());
      const s = serializeIds(f.selectedStateIds);
      const b = serializeIds(f.selectedBoardIds);
      if (s) p.set("stateIds", s);
      if (b) p.set("boardIds", b);
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 200);
    return () => clearTimeout(t);
  }, [search, f.selectedStateIds, f.selectedBoardIds, pathname, router]);

  const groups = useMemo(() => groupByState(f.allBoards), [f.allBoards]);
  const totalExams = useMemo(() => f.allBoards.reduce((n, b) => n + (b.exams?.length ?? 0), 0), [f.allBoards]);

  const boardsForChips = useMemo(
    () =>
      groups
        .filter((g) => f.selectedStateIds.length === 0 || (g.id !== null && f.selectedStateIds.includes(g.id)))
        .flatMap((g) => g.boards)
        .filter((b) => (b.exams?.length ?? 0) > 0),
    [groups, f.selectedStateIds],
  );

  const needle = search.trim().toLowerCase();
  const visible = useMemo(() => {
    return groups
      .filter((g) => f.selectedStateIds.length === 0 || (g.id !== null && f.selectedStateIds.includes(g.id)))
      .map((g) => ({
        ...g,
        boards: g.boards
          .filter((b) => f.selectedBoardIds.length === 0 || f.selectedBoardIds.includes(b.id))
          .map((b) => ({
            ...b,
            exams: (b.exams ?? []).filter(
              (e) => !needle || e.name.toLowerCase().includes(needle) || e.shortName.toLowerCase().includes(needle) || b.shortName.toLowerCase().includes(needle),
            ),
          }))
          .filter((b) => b.exams.length > 0),
      }))
      .filter((g) => g.boards.length > 0);
  }, [groups, f.selectedStateIds, f.selectedBoardIds, needle]);

  const shown = visible.reduce((n, g) => n + g.boards.reduce((m, b) => m + b.exams.length, 0), 0);
  const filtered = !!needle || f.selectedStateIds.length > 0 || f.selectedBoardIds.length > 0;

  return (
    <div className="bg-[var(--bg)]">
      <PageHero
        eyebrow="Exams"
        title="Find your exam."
        subtitle={totalExams > 0 ? `${totalExams} exams by state and board. Open one for papers, mocks and dates.` : "Exams by state and board. Open one for papers, mocks and dates."}
      >
        <HeroSearch id="exam-search" label="Search exams" placeholder="Search by exam or board, e.g. JPSC, SSC CGL" value={search} onChange={setSearch} />
      </PageHero>

      <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-4 sm:px-6">
        {/* Filters */}
        {groups.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="State">
              <Chip on={f.selectedStateIds.length === 0} onClick={() => f.resetExamFilter()}>All states</Chip>
              {groups.filter((g) => g.id !== null).map((g) => (
                <Chip key={g.id} on={f.selectedStateIds.includes(g.id as number)} onClick={() => f.toggleState(g.id as number)}>
                  {g.name}
                </Chip>
              ))}
            </div>
            {boardsForChips.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Board">
                {boardsForChips.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={f.selectedBoardIds.includes(b.id)}
                    onClick={() => f.toggleBoard(b.id)}
                    className={`min-h-9 flex-none rounded-full px-3.5 text-[13px] transition-colors ${
                      f.selectedBoardIds.includes(b.id) ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)]" : "text-[var(--ink-3)] hover:text-[var(--ink-1)]"
                    }`}
                  >
                    {b.shortName}
                  </button>
                ))}
              </div>
            )}
            <p className="text-sm text-[var(--ink-3)]" aria-live="polite">
              {shown} {shown === 1 ? "exam" : "exams"}
              {filtered && (
                <button
                  type="button"
                  onClick={() => {
                    f.resetExamFilter();
                    setSearch("");
                  }}
                  className="ml-3 font-semibold text-[var(--brand)] hover:underline"
                >
                  Clear
                </button>
              )}
            </p>
          </div>
        )}

        {/* Results */}
        <div className="pt-8">
          {f.isLoading ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
              {Array.from({ length: 8 }).map((_, i) => <li key={i} className="h-36 animate-pulse rounded-[var(--radius-lg)] bg-[var(--bg-secondary)]" />)}
            </ul>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <p className="font-semibold text-[var(--ink-1)]">Couldn&apos;t load exams.</p>
              <button onClick={() => window.location.reload()} className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)]">Try again</button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <p className="font-semibold text-[var(--ink-1)]">No exams match.</p>
              <p className="text-sm text-[var(--ink-3)]">Try another name or clear the filters.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-14">
              {visible.map((g) => (
                <section key={g.name} className="reveal">
                  <SectionTitle>{g.name}</SectionTitle>
                  <div className="flex flex-col gap-8">
                    {g.boards.map((b) => (
                      <div key={b.id}>
                        <h3 className="mb-3 flex items-baseline gap-2 text-sm text-[var(--ink-3)]">
                          <span className="font-semibold text-[var(--ink-1)]">{b.shortName}</span>
                          {b.name !== b.shortName && <span>{b.name}</span>}
                        </h3>
                        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                          {b.exams.map((e, i) => <ExamCard key={e.id} exam={e} board={b} delay={(i % 4) * 60} />)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AllExamsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <AllExams />
    </Suspense>
  );
}
