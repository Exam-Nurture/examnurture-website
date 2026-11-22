import PageHero from "@/components/marketing/PageHero";

const SECTIONS = [
  {
    title: "Refund window",
    body: "Refund requests are reviewed for duplicate payments, technical access failures, or accidental purchases reported promptly after payment.",
  },
  {
    title: "Non-refundable cases",
    body: "Completed practice usage, extensive content access, expired plans, and policy misuse may not qualify for refunds.",
  },
  {
    title: "How to request",
    body: "Contact support with your registered email, payment reference, plan name, and issue details so the team can verify the transaction.",
  },
];

export const metadata = { title: "Refund Policy - ExamNurture" };

export default function RefundPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Refund Policy" subtitle="What we refund, and how to ask." align="center" />
      <section className="mx-auto max-w-[760px] px-4 pb-20 pt-4 sm:px-6">
        <ol className="space-y-5">
          {SECTIONS.map((section, i) => (
            <li key={section.title} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
              <article className="en-card p-6 sm:p-8">
                <h2 className="mb-2 text-lg font-bold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>
                  {section.title}
                </h2>
                <p className="leading-relaxed text-[var(--ink-2)]">{section.body}</p>
              </article>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center text-sm text-[var(--ink-3)]">Last updated: April 30, 2026</p>
      </section>
    </>
  );
}
