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
    <div className="bg-[var(--bg)]">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <p className="eyebrow">ExamNurture Legal</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink-1)] mb-5" style={{ fontFamily: "var(--font-sora)" }}>
          Refund Policy
        </h1>
        <p className="text-lg text-[var(--ink-2)] leading-8 max-w-2xl">A practical policy for payment issues and subscription refund requests.</p>
        <div className="mt-10 grid gap-4">
          {SECTIONS.map((section) => (
            <article key={section.title} className="card-bezel">
              <div className="card-bezel-inner p-6">
                <h2 className="text-base font-bold text-[var(--ink-1)] mb-2">{section.title}</h2>
                <p className="text-sm leading-7 text-[var(--ink-2)]">{section.body}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-[var(--ink-4)]">Last updated: April 30, 2026</p>
      </section>
    </div>
  );
}
