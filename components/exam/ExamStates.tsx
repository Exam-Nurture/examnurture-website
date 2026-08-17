"use client";

/**
 * Shared loading / error screens for the exam surfaces.
 * Both sit inside the `.exam-shell` token scope so they follow the same
 * light and dark palette as the portal and the result view.
 */

import { AlertTriangle, ArrowLeft } from "lucide-react";

export function ExamLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="exam-shell fixed inset-0 flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center">
        <span
          className="h-9 w-9 animate-spin rounded-full"
          style={{
            border: "3px solid var(--x-inset-2)",
            borderTopColor: "var(--blue-ink)",
          }}
        />
        <p className="mt-4 text-[13px] font-medium" style={{ color: "var(--x-ink-3)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export function ExamError({
  message,
  onBack,
  backLabel = "Back to test series",
}: {
  message: string;
  onBack: () => void;
  backLabel?: string;
}) {
  return (
    <div className="exam-shell flex min-h-screen items-center justify-center px-4">
      <div className="x-paper flex max-w-[420px] flex-col items-center p-7 text-center">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-[14px]"
          style={{
            background: "var(--red-soft)",
            color: "var(--x-unanswered)",
            border: "1px solid rgba(217,92,92,0.28)",
          }}
        >
          <AlertTriangle size={22} />
        </span>

        <h1
          className="mt-5 text-[19px] font-semibold"
          style={{
            fontFamily: "var(--font-sora)",
            color: "var(--x-ink)",
            letterSpacing: "-0.025em",
          }}
        >
          Something went wrong
        </h1>
        <p
          className="mt-2 text-[13.5px] leading-relaxed"
          style={{ color: "var(--x-ink-3)", maxWidth: "40ch" }}
        >
          {message || "We couldn't load this test. Please try again."}
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-[11px] text-[13.5px] font-semibold text-white transition-transform duration-200 hover:-translate-y-[1px] d-focus"
          style={{
            background: "var(--blue-ink)",
            boxShadow: "0 8px 22px -12px rgba(13,40,126,.7)",
          }}
        >
          <ArrowLeft size={15} />
          {backLabel}
        </button>
      </div>
    </div>
  );
}
