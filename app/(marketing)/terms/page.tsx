const SECTIONS = [
  {
    title: "Use of the platform",
    body: "ExamNurture is for personal exam preparation. Do not misuse tests, scrape content, share paid access, or interfere with platform security.",
  },
  {
    title: "Content and results",
    body: "Mocks, analytics, rankings, and recommendations are preparation aids. Official exam notifications and final eligibility should be verified from the recruiting body.",
  },
  {
    title: "Subscriptions",
    body: "Paid plans unlock tier-based content. Access, renewal, and cancellation depend on the selected billing cycle and payment status.",
  },
];

export const metadata = { title: "Terms of Service - ExamNurture" };

export default function TermsPage() {
  return (
    <div className="bg-[var(--bg)]">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <p className="eyebrow">ExamNurture Legal</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink-1)] mb-5" style={{ fontFamily: "var(--font-sora)" }}>
          Terms of Service
        </h1>
        <p className="text-lg text-[var(--ink-2)] leading-8 max-w-2xl">The working agreement for using ExamNurture responsibly.</p>
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
