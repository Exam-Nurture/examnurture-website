import type { Metadata } from "next";
import PlanCards from "@/components/marketing/PlanCards";
import FaqList from "@/components/marketing/FaqList";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start free. Pay only for the exam you're preparing for.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-16 px-4 py-14 sm:px-6 lg:py-20">
      <header className="flex max-w-xl flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.09em] text-[var(--brand)]">Pricing</p>
        <h1 className="text-4xl font-bold leading-tight text-[var(--ink-1)] sm:text-5xl" style={{ fontFamily: "var(--font-sora)" }}>
          Start free. Pay for one exam.
        </h1>
        <p className="text-lg text-[var(--ink-2)]">No subscription needed. Try any exam before you pay.</p>
      </header>

      <PlanCards />

      <div className="max-w-[760px]">
        <FaqList title="Questions" />
      </div>
    </div>
  );
}
