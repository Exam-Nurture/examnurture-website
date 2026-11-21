import type { Metadata } from "next";
import PlanCards from "@/components/marketing/PlanCards";
import FaqList from "@/components/marketing/FaqList";
import HeroGeometry from "@/components/marketing/HeroGeometry";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free past papers, plus monthly plans for 10th, 12th and Graduation level exams.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="bg-[var(--bg)]">
      <section className="en-hero-deep">
        <HeroGeometry variant="compact" chartSide="left" />
        <header className="relative mx-auto flex max-w-[680px] flex-col items-center gap-4 px-4 pb-16 pt-14 text-center sm:px-6 lg:pt-20">
          <p className="en-rise text-xs font-semibold uppercase tracking-[0.09em] text-[#C9CBFF]">Pricing</p>
          <h1 style={{ fontFamily: "var(--font-sora)", animationDelay: "60ms" }} className="en-rise text-4xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
            Start free. Pick your level.
          </h1>
          <p style={{ animationDelay: "120ms" }} className="en-rise text-lg text-white/80">One monthly plan for your level. Higher plans include every exam below them.</p>
        </header>
      </section>

      <div className="mx-auto flex max-w-[1180px] flex-col gap-16 px-4 pb-20 pt-12 sm:px-6">
        <PlanCards />
        <div className="reveal mx-auto w-full max-w-[760px]">
          <FaqList title="Questions" />
        </div>
      </div>
    </div>
  );
}
