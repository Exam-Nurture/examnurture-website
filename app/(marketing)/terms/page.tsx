import PageHero from "@/components/marketing/PageHero";

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
    <>
      <PageHero eyebrow="Legal" title="Terms of Service" subtitle="The simple rules for using ExamNurture." align="center" />
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
