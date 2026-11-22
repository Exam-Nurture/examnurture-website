/**
 * Standard frame for every page inside the student app (v2).
 * Calm header (title + one-line subtitle + optional actions/back link) and a
 * centred content column. Matches Today and Performance.
 *
 *   <AppPage title="My purchases" subtitle="Orders, access and invoices.">…</AppPage>
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AppPage({
  title,
  subtitle,
  actions,
  back,
  width = "normal",
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  width?: "narrow" | "normal" | "wide";
  children: React.ReactNode;
}) {
  const max = width === "narrow" ? "max-w-[720px]" : width === "wide" ? "max-w-[1180px]" : "max-w-[960px]";
  return (
    <div className={`mx-auto flex ${max} flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12`}>
      <header className="en-rise flex flex-col gap-3">
        {back && (
          <Link href={back.href} className="inline-flex min-h-9 items-center gap-1.5 self-start text-sm text-[var(--ink-3)] hover:text-[var(--brand)]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {back.label}
          </Link>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-[-0.02em] text-[var(--ink-1)] sm:text-4xl" style={{ fontFamily: "var(--font-sora)" }}>
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-[var(--ink-3)]">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </header>
      {children}
    </div>
  );
}

/** Brand spinner for redirect/loading screens. */
export function AppSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg)]" role="status" aria-label={label}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand-soft)] border-t-[var(--brand)]" />
    </div>
  );
}
