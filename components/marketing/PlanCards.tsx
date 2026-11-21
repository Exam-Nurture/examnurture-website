import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, checkoutReady } from "@/lib/plans";

/** Free · 10th · 12th · Graduation. Used on the homepage and on /pricing. */
export default function PlanCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {PLANS.map((plan, i) => {
        const paid = plan.id !== "free";
        return (
          <div key={plan.id} className="reveal flex" style={{ transitionDelay: `${i * 90}ms` }}>
          <article className="en-card en-card-link flex w-full flex-col gap-5 p-7">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>
                {plan.name}
              </h3>
              {paid && !checkoutReady && (
                <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-ink)]">
                  Launching soon
                </span>
              )}
            </div>

            <div>
              <p className="text-3xl font-bold leading-none text-[var(--ink-1)] tabular-nums" style={{ fontFamily: "var(--font-sora)" }}>
                {plan.price}
                {plan.unit && <span className="ml-1 text-sm font-medium text-[var(--ink-3)]">{plan.unit}</span>}
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--ink-2)]">{plan.audience}</p>
              {plan.examples && <p className="mt-1 text-xs leading-relaxed text-[var(--ink-3)]">{plan.examples}</p>}
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
                  className="flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand)] px-4 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-hover)]"
                >
                  {plan.cta.label}
                </Link>
              ) : (
                <p className="flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] text-sm font-medium text-[var(--ink-3)]">
                  Subscriptions open soon
                </p>
              )}
            </div>
          </article>
          </div>
        );
      })}
    </div>
  );
}
