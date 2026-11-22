import PageHero from "@/components/marketing/PageHero";

const SECTIONS = [
  {
    title: "What we collect",
    body: "We collect account details, contact information, subscription status, test activity, quiz attempts, bookmarks, and support messages needed to run ExamNurture.",
  },
  {
    title: "How we use it",
    body: "Your data powers authentication, exam recommendations, progress tracking, payment support, platform security, and learner communication.",
  },
  {
    title: "Your choices",
    body: "You can update your profile, contact support for account changes, and request deletion where legally permitted.",
  },
];

export const metadata = { title: "Privacy Policy - ExamNurture" };

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" subtitle="How we handle your account and learning data." align="center" />
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
