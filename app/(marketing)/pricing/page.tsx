import type { Metadata } from "next";
import PlanCards from "@/components/marketing/PlanCards";
import FaqList from "@/components/marketing/FaqList";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free past papers, plus monthly plans for 10th, 12th and Graduation level exams.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="bg-[var(--bg)]">
      <section className="en-band-hero">
        <header className="mx-auto flex max-w-[680px] flex-col items-center gap-4 px-4 pb-12 pt-14 text-center sm:px-6 lg:pt-20">
          <p className="en-rise text-xs font-semibold uppercase tracking-[0.09em] text-[var(--brand)]">Pricing</p>
          <h1 style={{ fontFamily: "var(--font-sora)", animationDelay: "60ms" }} className="en-rise text-4xl font-bold leading-tight tracking-[-0.02em] text-[var(--ink-1)] sm:text-5xl">
            Start free. Pick your level.
          </h1>
          <p style={{ animationDelay: "120ms" }} className="en-rise text-lg text-[var(--ink-2)]">One monthly plan for your qualification. Many past papers stay free.</p>
        </header>
      </section>

      <div className="mx-auto flex max-w-[1180px] flex-col gap-16 px-4 pb-20 sm:px-6">
        <div style={{ animationDelay: "180ms" }} className="en-rise">
          <PlanCards />
        </div>
        <div className="reveal mx-auto w-full max-w-[760px]">
          <FaqList title="Questions" />
        </div>
      </div>
    </div>
  );
}
