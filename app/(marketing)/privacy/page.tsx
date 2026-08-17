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
  return <PolicyPage title="Privacy Policy" intro="Clear rules for how ExamNurture handles learner and account data." sections={SECTIONS} />;
}

function PolicyPage({ title, intro, sections }: { title: string; intro: string; sections: typeof SECTIONS }) {
  return (
    <div className="bg-[var(--bg)]">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <p className="eyebrow">ExamNurture Legal</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink-1)] mb-5" style={{ fontFamily: "var(--font-sora)" }}>
          {title}
        </h1>
        <p className="text-lg text-[var(--ink-2)] leading-8 max-w-2xl">{intro}</p>
        <div className="mt-10 grid gap-4">
          {sections.map((section) => (
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
