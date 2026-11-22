"use client";

/**
 * "Which exam are you preparing for?" — a soft dialog with search over the
 * exam catalogue. Used by the exam switcher and the dashboard's first step.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { apiGetExams } from "@/lib/api";
import type { MyExam } from "@/lib/my-exam";

interface ExamRow {
  id: string;
  name: string;
  shortName?: string;
  board?: { shortName?: string } | null;
  examCategory?: { name?: string } | null;
}

export default function ExamPicker({
  current,
  onPick,
  onClose,
}: {
  current: MyExam | null;
  onPick: (e: MyExam) => void;
  onClose: () => void;
}) {
  const [exams, setExams] = useState<ExamRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (apiGetExams() as Promise<ExamRow[]>)
      .then((r) => alive && setExams(Array.isArray(r) ? r : []))
      .catch(() => alive && setFailed(true));
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (exams ?? []).filter((e) => !n || `${e.name} ${e.shortName ?? ""} ${e.board?.shortName ?? ""}`.toLowerCase().includes(n));
  }, [exams, q]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(14,17,32,.45)] p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-picker-title"
        onClick={(e) => e.stopPropagation()}
        className="en-rise flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] bg-[var(--card)] shadow-[0_30px_80px_-20px_rgba(14,17,32,.5)] sm:rounded-[24px]"
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-6">
          <div>
            <h2 id="exam-picker-title" className="text-xl font-bold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>
              Which exam are you preparing for?
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-3)]">Your dashboard will be set up around it. You can change it any time.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-10 w-10 flex-none place-items-center rounded-full text-[var(--ink-3)] hover:bg-[var(--bg-secondary)]">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 pb-3">
          <div className="flex items-center gap-3 rounded-[14px] bg-[var(--bg-secondary)] px-4 focus-within:ring-2 focus-within:ring-[var(--brand-line)]">
            <Search className="h-4 w-4 text-[var(--ink-3)]" aria-hidden="true" />
            <label htmlFor="exam-picker-search" className="sr-only">Search exams</label>
            <input
              ref={inputRef}
              id="exam-picker-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search, e.g. JPSC, SSC CGL"
              className="min-h-12 flex-1 bg-transparent text-base text-[var(--ink-1)] outline-none placeholder:text-[var(--ink-3)]"
            />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Exams">
          {failed ? (
            <li className="px-3 py-10 text-center text-sm text-[var(--ink-3)]">Couldn&apos;t load exams. Check your connection and try again.</li>
          ) : exams === null ? (
            Array.from({ length: 6 }).map((_, i) => <li key={i} className="mx-3 my-1.5 h-12 animate-pulse rounded-[12px] bg-[var(--bg-secondary)]" />)
          ) : list.length === 0 ? (
            <li className="px-3 py-10 text-center text-sm text-[var(--ink-3)]">No exams match.</li>
          ) : (
            list.map((e) => {
              const on = current?.id === e.id;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onPick({ id: e.id, name: e.name, shortName: e.shortName })}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-[14px] px-3 text-left transition-colors ${on ? "bg-[var(--brand-soft)]" : "hover:bg-[var(--bg-secondary)]"}`}
                  >
                    <span className="grid h-9 min-w-9 place-items-center rounded-[10px] bg-[var(--brand-soft)] px-1.5 text-[10px] font-bold text-[var(--brand)]">
                      {(e.board?.shortName || e.shortName || e.name).slice(0, 5).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[var(--ink-1)]">{e.name}</span>
                      {e.examCategory?.name && <span className="block text-xs text-[var(--ink-3)]">{e.examCategory.name}</span>}
                    </span>
                    {on && <Check className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
