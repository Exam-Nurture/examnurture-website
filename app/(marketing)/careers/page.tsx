import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Headphones, Sparkles } from "lucide-react";

const ROLES = [
  { title: "Exam Content Reviewer", team: "Academic", icon: BookOpen, detail: "Review mocks, PYQs, and explanations for accuracy." },
  { title: "Student Success Mentor", team: "Learner Support", icon: Headphones, detail: "Guide aspirants through study plans and platform workflows." },
  { title: "Course Operations Associate", team: "Operations", icon: GraduationCap, detail: "Coordinate launches, schedules, and live class readiness." },
];

export const metadata = { title: "Careers - ExamNurture" };

export default function CareersPage() {
  return (
    <div className="bg-[var(--bg)]">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow">
            <Sparkles size={12} /> Careers
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink-1)] mb-5" style={{ fontFamily: "var(--font-sora)" }}>
            Build for serious exam aspirants.
          </h1>
          <p className="text-lg text-[var(--ink-2)] leading-8">
            Join a focused team creating practical learning tools for competitive exam preparation across India.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {ROLES.map(({ title, team, icon: Icon, detail }) => (
            <article key={title} className="card-bezel">
              <div className="card-bezel-inner p-6 h-full">
                <div className="w-10 h-10 rounded-xl bg-[var(--blue-soft)] text-[var(--blue)] flex items-center justify-center mb-5">
                  <Icon size={20} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-4)] mb-2" style={{ fontFamily: "var(--font-mono)" }}>{team}</p>
                <h2 className="text-lg font-bold text-[var(--ink-1)] mb-3">{title}</h2>
                <p className="text-sm leading-7 text-[var(--ink-2)]">{detail}</p>
              </div>
            </article>
          ))}
        </div>

        <Link href="/contact" className="btn-pill mt-10">
          Contact hiring team
          <span className="btn-pill-icon"><ArrowRight size={14} /></span>
        </Link>
      </section>
    </div>
  );
}
