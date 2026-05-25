"use client";

import { Check } from "lucide-react";
import type { ApiState, ApiBoard, ApiBoardExam, ApiExamCategory } from "@/lib/api";

/* ── Multi-select section ──────────────────────────────────── */

interface MultiSelectSectionProps {
  title: string;
  options: { value: string | number; label: string }[];
  selectedValues: (string | number)[];
  onToggle: (value: string | number) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function MultiSelectSection({
  title,
  options,
  selectedValues,
  onToggle,
  isLoading,
  placeholder,
}: MultiSelectSectionProps) {
  const count = selectedValues.length;

  return (
    <div
      className="rounded-[14px] border p-3"
      style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <p
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: "var(--ink-3)" }}
        >
          {title}
        </p>
        {count > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--blue)] px-1 text-[9px] font-bold text-white">
            {count}
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-7 rounded-[8px] animate-pulse"
              style={{ background: "var(--bg-secondary)" }}
            />
          ))}
        </div>
      ) : options.length === 0 ? (
        /* Empty / placeholder */
        <p className="px-1 text-[12px]" style={{ color: "var(--ink-4)" }}>
          {placeholder ?? "None available"}
        </p>
      ) : (
        /* Options list */
        <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto [scrollbar-width:thin]">
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt.value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => onToggle(opt.value)}
                className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[13px] transition-all"
                style={{
                  background: isSelected ? "var(--blue-soft)" : "transparent",
                  color: isSelected ? "var(--blue)" : "var(--ink-2)",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {/* Checkbox */}
                <span
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-all"
                  style={{
                    borderColor: isSelected ? "var(--blue)" : "var(--line)",
                    background: isSelected ? "var(--blue)" : "transparent",
                  }}
                >
                  {isSelected && <Check size={9} color="white" strokeWidth={3} />}
                </span>
                <span className="flex-1 min-w-0 truncate leading-tight">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── ExamFilterPanel — drop-in for any sidebar / drawer ────── */

export interface ExamFilterPanelProps {
  allCategories: ApiExamCategory[];
  selectedCategoryIds: number[];
  onToggleCategory: (id: number) => void;

  allStates: ApiState[];
  selectedStateIds: number[];
  onToggleState: (id: number) => void;

  availableBoards: ApiBoard[];
  selectedBoardIds: string[];
  onToggleBoard: (id: string) => void;

  availableExams: ApiBoardExam[];
  selectedExamIds: string[];
  onToggleExam: (id: string) => void;

  isLoading?: boolean;
  examsLoading?: boolean;
}

export function ExamFilterPanel({
  allCategories,
  selectedCategoryIds,
  onToggleCategory,
  allStates,
  selectedStateIds,
  onToggleState,
  availableBoards,
  selectedBoardIds,
  onToggleBoard,
  availableExams,
  selectedExamIds,
  onToggleExam,
  isLoading,
  examsLoading,
}: ExamFilterPanelProps) {
  return (
    <>
      {/* ── Categories ── */}
      <MultiSelectSection
        title="Exam Category"
        isLoading={isLoading}
        options={allCategories.map((c) => ({ value: c.id, label: c.name }))}
        selectedValues={selectedCategoryIds}
        onToggle={(v) => onToggleCategory(Number(v))}
        placeholder="No categories available"
      />

      {/* ── States ── */}
      <MultiSelectSection
        title="State"
        isLoading={isLoading}
        options={allStates.map((s) => ({ value: s.id, label: s.name }))}
        selectedValues={selectedStateIds}
        onToggle={(v) => onToggleState(Number(v))}
        placeholder="No states available"
      />

      {/* ── Boards (cascade from selected states) ── */}
      <MultiSelectSection
        title="Exam Board"
        isLoading={isLoading}
        options={availableBoards.map((b) => ({
          value: b.id,
          label: b.shortName || b.name,
        }))}
        selectedValues={selectedBoardIds}
        onToggle={(v) => onToggleBoard(String(v))}
        placeholder={
          allStates.length > 0 && selectedStateIds.length === 0
            ? "Select a state first"
            : "No boards available"
        }
      />

      {/* ── Exams (cascade from selected boards) ── */}
      <MultiSelectSection
        title="Exam"
        isLoading={examsLoading}
        options={availableExams.map((e) => ({
          value: e.id,
          label: e.shortName || e.name,
        }))}
        selectedValues={selectedExamIds}
        onToggle={(v) => onToggleExam(String(v))}
        placeholder={
          selectedBoardIds.length === 0
            ? "Select a board first"
            : examsLoading
            ? "Loading exams…"
            : "No exams available"
        }
      />
    </>
  );
}
