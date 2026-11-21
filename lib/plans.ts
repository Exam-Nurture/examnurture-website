/**
 * Single source of truth for plan copy. Every page that talks about what is
 * free or paid (homepage, /pricing, upgrade prompts) must read from here, so
 * the site never says two different things.
 *
 * Decided 2026-11-22 (v2 plan):
 *  - Free, per exam: latest past paper, one full mock, the daily quiz.
 *  - Exam Pass is the main product: one price per exam, valid until exam day.
 *  - Pro (all exams) is the upsell. The backend has no PLAN content type yet,
 *    so Pro is shown as "Coming soon" with no buy button.
 */

export type PlanId = "free" | "pass" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  unit?: string;
  audience: string;
  features: string[];
  cta: { label: string; href: string } | null;
  badge?: string;
  status?: "available" | "coming-soon";
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    audience: "Try any exam before you pay.",
    features: [
      "Latest past paper for every exam",
      "One full mock test per exam",
      "Daily quiz",
      "Scores and solutions",
    ],
    cta: { label: "Find your exam", href: "/exams" },
    status: "available",
  },
  {
    id: "pass",
    name: "Exam Pass",
    price: "Priced per exam",
    audience: "Everything for the one exam you're serious about.",
    features: [
      "All past papers with solutions",
      "All mock tests: full, sectional, topic",
      "Weak-topic plan",
      "Valid until exam day",
    ],
    cta: { label: "Choose your exam", href: "/exams" },
    badge: "Most chosen",
    status: "available",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹1,999",
    unit: "/ year",
    audience: "For students taking several exams.",
    features: [
      "Every Exam Pass",
      "Up to 5 exams on one dashboard",
      "Form and exam-date alerts",
    ],
    cta: null,
    badge: "Coming soon",
    status: "coming-soon",
  },
];

/** Short list for compact places (homepage hero, upgrade prompts). */
export const FREE_SUMMARY = "Latest past paper, one full mock and the daily quiz are free for every exam.";
