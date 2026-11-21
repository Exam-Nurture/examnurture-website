/**
 * Single source of truth for plan copy. Every page that talks about what is
 * free or paid (homepage, /pricing, course pages) must read from here, so the
 * site never says two different things.
 *
 * Pricing model (decided 2026-11-22, replaces Exam Pass / Pro):
 *  - Free: selected past papers and study material, daily quiz.
 *  - Three monthly subscriptions by qualification level:
 *      10th ₹399 · 12th ₹599 · Graduation ₹799 (per month)
 *
 * Backend status: orders support TEST_SERIES only; there is no subscription
 * content type yet, so paid plans render as "Launching soon" (no checkout).
 * Flip `checkoutReady` once the backend supports SUBSCRIPTION orders.
 */

export type PlanId = "free" | "tenth" | "twelfth" | "graduation";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  unit?: string;
  audience: string;
  examples?: string;
  features: string[];
  cta: { label: string; href: string } | null;
}

export const checkoutReady = false;

/* A plan covers every exam at its level and every test series inside those
   exams. Tiers stack: 12th includes all 10th-level exams; Graduation includes
   10th- and 12th-level exams too (decided 2026-11-22). */
const PAID_FEATURES = [
  "Every exam at this level",
  "All test series and mock tests",
  "All past papers with solutions",
  "Weak-topic plan",
];

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    audience: "Start without paying.",
    features: ["Selected past papers", "Selected study material", "Daily quiz"],
    cta: { label: "Find your exam", href: "/exams" },
  },
  {
    id: "tenth",
    name: "10th",
    price: "₹399",
    unit: "/ month",
    audience: "Exams that need 10th pass.",
    examples: "SSC MTS · SSC GD · Railway Group D · Police Constable",
    features: PAID_FEATURES,
    cta: null,
  },
  {
    id: "twelfth",
    name: "12th",
    price: "₹599",
    unit: "/ month",
    audience: "Exams that need 12th pass.",
    examples: "SSC CHSL · Railway NTPC (12th level) · JSSC Inter level",
    features: ["Everything in 10th", ...PAID_FEATURES],
    cta: null,
  },
  {
    id: "graduation",
    name: "Graduation",
    price: "₹799",
    unit: "/ month",
    audience: "Exams that need a degree.",
    examples: "JPSC · BPSC · SSC CGL · IBPS PO · SBI PO",
    features: ["Everything in 10th and 12th", ...PAID_FEATURES],
    cta: null,
  },
];

/**
 * Best-effort plan for an exam, from its "educational qualification" text.
 * Returns null when the text doesn't clearly say, so we never guess wrong.
 */
export function planForQualification(text?: string | null): Plan | null {
  if (!text) return null;
  const t = text.toLowerCase();
  const id: PlanId | null =
    /graduat|bachelor|degree/.test(t) ? "graduation"
    : /12th|intermediate|higher secondary|\+2|class xii/.test(t) ? "twelfth"
    : /10th|matric|secondary|class x\b/.test(t) ? "tenth"
    : null;
  return id ? PLANS.find((p) => p.id === id) ?? null : null;
}
