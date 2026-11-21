import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/plans";

/** Free · Exam Pass · Pro. Used on the homepage and on /pricing. */
export default function PlanCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLANS.map((plan) => {
        const main = plan.id === "pass";
        const soon = plan.status === "coming-soon";
        return (
          <article
            key={plan.id}
            className={`flex flex-col gap-5 rounded-[var(--radius-lg)] border bg-[var(--card)] p-6 ${
              main ? "border-[var(--brand)] shadow-[inset_0_0_0_1px_var(--brand)]" : "border-[var(--line)]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>
                {plan.name}
              </h3>
              {plan.badge && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    soon ? "bg-[var(--bg-secondary)] text-[var(--ink-2)]" : "bg-[var(--brand-soft)] text-[var(--brand)]"
                  }`}
                >
                  {plan.badge}
                </span>
              )}
            </div>

            <div>
              <p className="text-3xl font-bold leading-none text-[var(--ink-1)] tabular-nums" style={{ fontFamily: "var(--font-sora)" }}>
                {plan.price}
                {plan.unit && <span className="ml-1 text-sm font-medium text-[var(--ink-3)]">{plan.unit}</span>}
              </p>
              <p className="mt-2 text-sm text-[var(--ink-3)]">{plan.audience}</p>
            </div>

            <ul className="flex flex-col gap-2.5 text-sm text-[var(--ink-2)]">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-[var(--green)]" aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-1">
              {plan.cta ? (
                <Link
                  href={plan.cta.href}
                  className={`flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-semibold ${
                    main
                      ? "bg-[var(--brand)] text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]"
                      : "border border-[var(--line)] text-[var(--ink-1)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {plan.cta.label}
                </Link>
              ) : (
                <p className="flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-[var(--line)] text-sm text-[var(--ink-3)]">
                  Not available yet
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
