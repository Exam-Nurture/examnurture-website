"use client";

/**
 * Slide-over filter panel shared by the Test Series and PYQ libraries.
 *
 * Handles the chrome (backdrop, focus trap, escape-to-close, scroll lock) so
 * each page only has to describe its filter groups.
 */

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check } from "lucide-react";

export type FilterOpt = { id: string; label: string };

export interface FilterGroup {
  key: string;
  title: string;
  options: FilterOpt[];
  selected: string;
  onChange: (id: string) => void;
}

export function FilterDrawer({
  open,
  onClose,
  groups,
  activeCount,
  onClearAll,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  groups: FilterGroup[];
  activeCount: number;
  onClearAll: () => void;
  resultCount: number;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  /* Escape to close + body scroll lock while open */
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const usable = groups.filter((g) => g.options.length > 1);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex justify-end"
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(6, 8, 12, 0.42)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="relative flex h-full w-[350px] max-w-[88vw] flex-col outline-none"
            style={{
              background: "var(--d-surface)",
              borderLeft: "1px solid var(--d-line)",
              boxShadow: "-24px 0 60px -24px rgba(0,0,0,0.35)",
            }}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--d-line-soft)" }}
            >
              <div>
                <span className="d-eyebrow">Refine</span>
                <h2
                  className="d-title mt-1.5 text-[16px]"
                  style={{ fontFamily: "var(--font-sora)" }}
                >
                  Filters
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors d-focus"
                style={{ color: "var(--d-ink-3)", background: "var(--d-inset)" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 py-6">
              {usable.length === 0 ? (
                <p className="py-10 text-center text-[13px]" style={{ color: "var(--d-ink-4)" }}>
                  No filter options available yet.
                </p>
              ) : (
                usable.map((g) => (
                  <fieldset key={g.key} className="min-w-0">
                    <legend className="d-eyebrow mb-3">{g.title}</legend>
                    <div className="flex flex-wrap gap-1.5">
                      {g.options.map((opt) => {
                        const on = g.selected === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => g.onChange(opt.id)}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-[7px] text-[12px] font-medium transition-all duration-200 d-focus"
                            style={
                              on
                                ? {
                                    background: "var(--blue-soft)",
                                    color: "var(--blue-ink)",
                                    border: "1px solid rgba(29,78,216,0.35)",
                                  }
                                : {
                                    background: "var(--d-inset)",
                                    color: "var(--d-ink-2)",
                                    border: "1px solid var(--d-line-soft)",
                                  }
                            }
                          >
                            {on && <Check size={11} strokeWidth={3} />}
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="flex shrink-0 items-center gap-2.5 px-5 py-4"
              style={{ borderTop: "1px solid var(--d-line-soft)" }}
            >
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="rounded-full px-4 py-[11px] text-[13px] font-semibold transition-colors d-focus"
                  style={{
                    color: "var(--d-ink-2)",
                    background: "var(--d-inset)",
                    border: "1px solid var(--d-line-soft)",
                  }}
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full py-[11px] text-[13px] font-semibold text-white transition-transform duration-200 hover:-translate-y-[1px] d-focus"
                style={{
                  background: "var(--blue-ink)",
                  boxShadow: "0 8px 22px -12px rgba(13,40,126,.6)",
                }}
              >
                Show {resultCount} {resultCount === 1 ? "result" : "results"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════
   Removable chip for the active-filter row
══════════════════════════════════════════════════════ */

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-[5px] pl-3 pr-2 text-[11.5px] font-medium"
      style={{
        background: "var(--blue-soft)",
        color: "var(--blue-ink)",
        border: "1px solid rgba(29,78,216,0.28)",
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-[rgba(29,78,216,0.16)] d-focus"
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   Sticky glass toolbar
══════════════════════════════════════════════════════ */

export function StickyToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-[60px] z-30 -mx-1 px-1 py-2">
      <div className="d-glass flex flex-wrap items-center gap-2.5 rounded-[18px] px-3 py-2.5">
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Search field
══════════════════════════════════════════════════════ */

export function SearchField({
  value,
  onChange,
  placeholder,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full px-3.5 py-2"
      style={{ background: "var(--d-surface)", border: "1px solid var(--d-line-soft)" }}
    >
      <span className="shrink-0" style={{ color: "var(--d-ink-4)" }}>
        {icon}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
        style={{ color: "var(--d-ink)" }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors d-focus"
          style={{ color: "var(--d-ink-4)", background: "var(--d-inset)" }}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Filter trigger button (with active-count dot)
══════════════════════════════════════════════════════ */

export function FilterButton({
  count,
  onClick,
  children,
}: {
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const on = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 hover:-translate-y-[1px] d-focus"
      style={
        on
          ? {
              background: "var(--blue-soft)",
              color: "var(--blue-ink)",
              border: "1px solid rgba(29,78,216,0.35)",
            }
          : {
              background: "var(--d-surface)",
              color: "var(--d-ink-2)",
              border: "1px solid var(--d-line-soft)",
            }
      }
    >
      {children}
      {on && (
        <span
          className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[9.5px] font-bold text-white"
          style={{ background: "var(--blue-ink)" }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
