"use client";

import Link from "next/link";
import { PlayCircle, Lock, ArrowRight } from "lucide-react";

export default function CoursesPage() {
  return (
    <div className="fade-up max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
          Video Courses
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-4)" }}>
          Expert-curated video courses for structured exam preparation.
        </p>
      </div>

      {/* Coming Soon Card */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #1E40AF 100%)" }}
      >
        {/* Glow orbs */}
        <div className="relative p-10 md:p-14 text-center">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }} />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(circle, #06B6D4, transparent 70%)" }} />

          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
              <PlayCircle className="w-10 h-10 text-white" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-white/70 text-[11px] font-bold uppercase tracking-widest mb-5">
              <Lock className="w-3 h-3" /> Coming Soon
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
              Video Courses Are<br />On Their Way
            </h2>
            <p className="text-white/60 max-w-md mx-auto text-[15px] leading-relaxed mb-8">
              We are working with expert educators to bring you structured, subject-wise video courses with downloadable PDFs and notes. Stay tuned!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/series"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#0F172A] font-bold text-sm hover:bg-blue-50 transition-all shadow-lg"
              >
                Explore Test Series <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/mentorship"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all"
              >
                Try Mentorship
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* What to expect */}
      <div
        className="mt-6 p-6 rounded-2xl border"
        style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
      >
        <h3 className="font-bold text-[14px] mb-4" style={{ color: "var(--ink-1)" }}>
          What to expect with Video Courses:
        </h3>
        <ul className="space-y-2.5">
          {[
            "Subject-wise structured video lessons",
            "Downloadable PDF notes for each topic",
            "Chapter-end quizzes to test your understanding",
            "Offline access via mobile app",
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-[13px]" style={{ color: "var(--ink-3)" }}>
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "var(--blue)" }} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
