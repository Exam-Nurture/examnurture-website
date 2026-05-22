"use client";

import Link from "next/link";
import {
  BookOpen, FileText, GraduationCap, CheckCircle2,
  ShoppingCart, ArrowRight, Lock,
} from "lucide-react";

export default function PlansPage() {
  return (
    <div className="flex flex-col gap-12 fade-up pb-12 max-w-4xl mx-auto">

      {/* Header */}
      <div className="text-center pt-4">
        <h1
          className="text-4xl font-bold tracking-tight mb-4"
          style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
        >
          Simple, transparent pricing
        </h1>
        <p className="text-[var(--ink-3)] text-lg leading-relaxed">
          All PYQs are free forever. Buy only the test series you need.
        </p>
      </div>

      {/* Two plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Free card */}
        <div className="rounded-3xl p-7 flex flex-col gap-5 border bg-[var(--card)]"
          style={{ borderColor: "var(--line-soft)" }}>
          <div>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 mb-3">
              Free Forever
            </span>
            <h2 className="text-2xl font-extrabold mb-1" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
              Free
            </h2>
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>
              Start immediately — no card required.
            </p>
          </div>

          <div className="text-4xl font-extrabold" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
            ₹0 <span className="text-base font-medium text-[var(--ink-4)]">forever</span>
          </div>

          <div className="flex flex-col gap-3">
            <FeatureRow icon={<BookOpen size={15} />} color="text-purple-500"
              label="All PYQ papers" note="Every previous year paper, all exams" />
            <FeatureRow icon={<FileText size={15} />} color="text-blue-500"
              label="Free test series" note="Selected series marked as free" />
            <FeatureRow icon={<GraduationCap size={15} />} color="text-green-500"
              label="Free study material" note="Selected notes and guides" />
          </div>

          <Link
            href="/dashboard"
            className="mt-auto w-full py-3 rounded-2xl text-center text-sm font-bold border transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
            style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}
          >
            Start Free
          </Link>
        </div>

        {/* Individual purchase card */}
        <div className="rounded-3xl p-7 flex flex-col gap-5 border-2 bg-[var(--card)]"
          style={{ borderColor: "var(--blue)" }}>
          <div>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>
              Best Value
            </span>
            <h2 className="text-2xl font-extrabold mb-1" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
              Buy Test Series
            </h2>
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>
              Purchase only what you need. Lifetime access — never expires.
            </p>
          </div>

          <div className="flex items-baseline gap-1" style={{ color: "var(--ink-1)" }}>
            <span className="text-4xl font-extrabold" style={{ fontFamily: "var(--font-sora)" }}>₹50</span>
            <span className="text-base font-medium text-[var(--ink-4)]">– ₹100 per series</span>
          </div>

          <div className="flex flex-col gap-3">
            <FeatureRow icon={<CheckCircle2 size={15} />} color="text-blue-500"
              label="Lifetime access" note="Pay once, use forever" />
            <FeatureRow icon={<CheckCircle2 size={15} />} color="text-blue-500"
              label="Exam-specific series" note="Targeted mock tests for your exam" />
            <FeatureRow icon={<CheckCircle2 size={15} />} color="text-blue-500"
              label="Full-length mocks" note="Timed tests with detailed analysis" />
            <FeatureRow icon={<Lock size={15} />} color="text-blue-500"
              label="Secured by Razorpay" note="Safe and instant payment" />
          </div>

          <Link
            href="/dashboard/series"
            className="mt-auto w-full py-3 rounded-2xl text-center text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
            style={{ background: "var(--blue)" }}
          >
            <ShoppingCart size={14} /> Browse Test Series
          </Link>
        </div>
      </div>

      {/* What's always free */}
      <div className="rounded-2xl p-6 border" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
        <h3 className="text-base font-bold mb-4" style={{ color: "var(--ink-1)" }}>What's always free?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <BookOpen size={20} />, color: "#7c3aed", bg: "#f5f3ff", label: "All PYQ Papers", desc: "Every previous year paper across all exams — no login required to browse, just login to attempt." },
            { icon: <FileText size={20} />, color: "#2563eb", bg: "#eff6ff", label: "Free Test Series", desc: "Selected test series marked free by our team — full-length, timed, with results analysis." },
            { icon: <GraduationCap size={20} />, color: "#059669", bg: "#ecfdf5", label: "Study Material", desc: "Selected notes, revision sheets, and PDF guides for free access." },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: item.bg }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "white", color: item.color }}>
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: "var(--ink-1)" }}>{item.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--ink-3)" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold" style={{ color: "var(--ink-1)" }}>Common questions</h3>
        {[
          {
            q: "Do I need to subscribe monthly?",
            a: "No. There are no subscriptions. You either access free content or buy a specific test series once — that's it."
          },
          {
            q: "Does my access expire after buying a test series?",
            a: "Never. Individual test series purchases give you lifetime access regardless of any future pricing changes."
          },
          {
            q: "Are all PYQs really free?",
            a: "Yes. Every previous year question paper on ExamNurture is free for all logged-in users, with no purchase required."
          },
          {
            q: "How do I know which test series are free?",
            a: "Free series are clearly marked with a 'FREE' badge in the Test Series listing. Paid series show their price."
          },
        ].map((item) => (
          <div key={item.q} className="p-4 rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
            <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--ink-1)" }}>{item.q}</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-3)" }}>{item.a}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/dashboard/series"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110"
          style={{ background: "var(--blue)" }}
        >
          Browse Test Series <ArrowRight size={14} />
        </Link>
        <p className="text-xs mt-3" style={{ color: "var(--ink-4)" }}>
          Questions? <a href="mailto:info@examnurture.com" className="underline" style={{ color: "var(--blue)" }}>Contact support</a>
        </p>
      </div>
    </div>
  );
}

function FeatureRow({ icon, color, label, note }: { icon: React.ReactNode; color: string; label: string; note: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 shrink-0 ${color}`}>{icon}</span>
      <div>
        <span className="text-sm font-medium" style={{ color: "var(--ink-1)" }}>{label}</span>
        <span className="text-xs ml-1.5" style={{ color: "var(--ink-4)" }}>{note}</span>
      </div>
    </div>
  );
}
