import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Headphones } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";

const ROLES = [
  { title: "Exam Content Reviewer", team: "Academic", icon: BookOpen, detail: "Review mocks, PYQs, and explanations for accuracy." },
  { title: "Student Success Mentor", team: "Learner Support", icon: Headphones, detail: "Guide aspirants through study plans and platform workflows." },
  { title: "Course Operations Associate", team: "Operations", icon: GraduationCap, detail: "Coordinate launches, schedules, and live class readiness." },
];

export const metadata = { title: "Careers - ExamNurture" };

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Build for serious aspirants."
        subtitle="Join a small team making practical exam-prep tools."
        align="center"
      />

      <section className="mx-auto max-w-[1180px] px-4 pb-20 pt-4 sm:px-6">
        <ul className="grid gap-5 md:grid-cols-3">
          {ROLES.map(({ title, team, icon: Icon, detail }, i) => (
            <li key={title} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
              <article className="en-card h-full p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">{team}</p>
                <h2 className="mb-2 text-lg font-bold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>{title}</h2>
                <p className="text-sm leading-relaxed text-[var(--ink-2)]">{detail}</p>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]"
          >
            Contact hiring team <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
