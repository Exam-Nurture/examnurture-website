"use client";

import React, { ReactNode } from "react";
import { Search, X, RotateCcw, Filter } from "lucide-react";

export { MultiSelectSection } from "./ExamFilterPanel";
export { ExamFilterPanel } from "./ExamFilterPanel";
export type { ExamFilterPanelProps } from "./ExamFilterPanel";

export interface FilterOption {
  value: string | number;
  label: string;
}

export interface FilterSectionProps {
  title: string;
  options: FilterOption[];
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  isMulti?: boolean;
  selectedValues?: (string | number)[];
}

export function FilterSection({ title, options, selectedValue, onSelect, isMulti, selectedValues }: FilterSectionProps) {
  return (
    <div className="rounded-[14px] border p-3" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
      <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: "var(--ink-3)" }}>{title}</p>
      <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto [scrollbar-width:thin]">
        {options.map((opt) => {
          const isSelected = isMulti 
            ? selectedValues?.includes(opt.value) 
            : selectedValue === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onSelect(opt.value)}
              className="w-full text-left px-2.5 py-1.5 rounded-[8px] text-[13px] transition-all"
              style={{
                background: isSelected ? "var(--blue-soft)" : "transparent",
                color: isSelected ? "var(--blue)" : "var(--ink-2)",
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface FilterSidebarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilterCount: number;
  onReset: () => void;
  children: ReactNode;
}

export function FilterSidebar({ searchQuery, onSearchChange, activeFilterCount, onReset, children }: FilterSidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col gap-5 w-[210px] shrink-0 sticky top-20">
      {/* Search */}
      <div
        className="flex items-center gap-2 rounded-[14px] border px-3 py-2.5"
        style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
      >
        <Search size={14} style={{ color: "var(--ink-4)" }} className="shrink-0" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[var(--ink-4)]"
          style={{ color: "var(--ink-1)" }}
        />
        {searchQuery && (
          <button type="button" onClick={() => onSearchChange("")} style={{ color: "var(--ink-4)" }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Dynamic Filter Sections injected as children */}
      {children}

      {/* Reset */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 rounded-[12px] border py-2 text-[12px] font-semibold transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
          style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}
        >
          <RotateCcw size={12} /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
        </button>
      )}
    </aside>
  );
}

export interface MobileFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilterCount: number;
  onOpenMobileFilter: () => void;
}

export function MobileFilterBar({ searchQuery, onSearchChange, activeFilterCount, onOpenMobileFilter }: MobileFilterBarProps) {
  return (
    <div className="flex gap-2 lg:hidden">
      <div
        className="flex flex-1 items-center gap-2 rounded-[14px] border px-3 py-2.5"
        style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
      >
        <Search size={14} style={{ color: "var(--ink-4)" }} />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[var(--ink-4)]"
          style={{ color: "var(--ink-1)" }}
        />
        {searchQuery && <button type="button" onClick={() => onSearchChange("")} style={{ color: "var(--ink-4)" }}><X size={12} /></button>}
      </div>
      <button
        type="button"
        onClick={onOpenMobileFilter}
        className="relative flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border transition-colors hover:border-[var(--blue)]"
        style={{ background: "var(--card)", borderColor: "var(--line-soft)", color: "var(--ink-2)" }}
      >
        <Filter size={15} />
        {activeFilterCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--blue)] text-[9px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}

export function ActiveFilterChips({ filters, onRemove, onReset }: { filters: { key: string; value: string }[], onRemove: (key: string) => void, onReset: () => void }) {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onRemove(f.key)}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:opacity-80"
          style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
        >
          {f.value} <X size={10} />
        </button>
      ))}
      <button type="button" onClick={onReset} className="text-[11px] font-semibold hover:underline" style={{ color: "var(--ink-4)" }}>
        Clear all
      </button>
    </div>
  );
}
