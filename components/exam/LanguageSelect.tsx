"use client";

/**
 * Language selector for the exam portal.
 *
 * Replaces the old two-button EN / हिं toggle. Renders as a dropdown listing
 * every language the paper is actually published in, so the control scales to
 * Bengali, Tamil, Telugu and beyond without a redesign. With only one language
 * available it renders nothing.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Languages } from "lucide-react";
import { languageOf, type LanguageDef } from "./languages";

export default function LanguageSelect({
  options,
  value,
  onChange,
  compact,
}: {
  options: LanguageDef[];
  value: string;
  onChange: (code: string) => void;
  /** Icon-only trigger, for narrow toolbars. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = languageOf(value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // A selector with nothing to select is just noise.
  if (options.length < 2) return null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Question language: ${current.label}`}
        className="inline-flex items-center gap-2 rounded-full py-[7px] pl-3 pr-2.5 text-[12.5px] font-semibold transition-all duration-200 d-focus"
        style={{
          background: "var(--x-inset)",
          color: "var(--x-ink)",
          border: "1px solid var(--x-line)",
        }}
      >
        <Languages size={14} style={{ color: "var(--x-ink-3)" }} />
        {!compact && <span className="hidden sm:inline">{current.native}</span>}
        <span className="sm:hidden">{current.short}</span>
        <ChevronDown
          size={13}
          className="transition-transform duration-200"
          style={{ color: "var(--x-ink-3)", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Select question language"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 max-h-[320px] w-[190px] overflow-y-auto rounded-[14px] p-1.5"
            style={{
              background: "var(--x-surface)",
              border: "1px solid var(--x-line)",
              boxShadow: "0 18px 44px -18px rgba(0,0,0,0.45)",
            }}
          >
            {options.map((l) => {
              const on = l.code === value;
              return (
                <li key={l.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => {
                      onChange(l.code);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left transition-colors duration-150 d-focus"
                    style={{
                      background: on ? "var(--blue-soft)" : "transparent",
                      color: on ? "var(--blue-ink)" : "var(--x-ink)",
                    }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{l.native}</span>
                      <span
                        className="block truncate text-[10.5px]"
                        style={{ color: on ? "var(--blue-ink)" : "var(--x-ink-3)" }}
                      >
                        {l.label}
                      </span>
                    </span>
                    {on && <Check size={14} strokeWidth={3} className="shrink-0" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
