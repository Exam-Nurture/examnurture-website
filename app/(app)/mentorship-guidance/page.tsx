"use client";

import { useState } from "react";
import {
  User, BookOpen, BarChart3, Target, Mic, CalendarCheck,
  CheckCircle2, ChevronDown, ArrowRight, Star, Zap, Users,
  ClipboardList, TrendingUp, Mail, Phone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ─── Data ───────────────────────────────────── */
const STATS = [
  { value: "95%",  label: "Success Rate",       icon: TrendingUp  },
  { value: "1:1",  label: "Personal Guidance",  icon: User        },
  { value: "500+", label: "Students Mentored",  icon: Users       },
  { value: "4.9",  label: "Avg. Rating",        icon: Star        },
];

const FEATURES = [
  {
    icon: User,
    title: "Personal Academic Guide",
    desc: "A dedicated mentor tracks your progress, clears doubts, and keeps you motivated throughout your preparation.",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    icon: Target,
    title: "Syllabus-to-Selection Roadmap",
    desc: "Smart, personalised study plans with clear milestones — from day 1 of prep to final selection.",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-900/20",
  },
  {
    icon: Mic,
    title: "One-to-One Mentorship Sessions",
    desc: "Weekly live 1:1 calls with your mentor for direct interaction, review, and guidance.",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    icon: BookOpen,
    title: "Subject-Wise Guidance",
    desc: "Step-by-step concept coverage for every subject — taught in order of your exam's actual syllabus.",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    icon: ClipboardList,
    title: "Career Support & Interview Prep",
    desc: "End-to-end guidance till final selection — including document verification, medical, and joining advice.",
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
  },
  {
    icon: BarChart3,
    title: "Weekly Performance Review",
    desc: "Data-driven feedback on mock tests, weak areas, accuracy, and speed — reviewed every week.",
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-900/20",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Enroll & Get Matched",
    desc: "Choose a program and get paired with a dedicated mentor suited to your exam and current level.",
    icon: Users,
    color: "var(--blue)",
    soft: "var(--blue-soft)",
  },
  {
    step: "02",
    title: "Personalised Study Plan",
    desc: "Your mentor builds a custom roadmap — daily targets, weekly goals, and exam-day strategy.",
    icon: Target,
    color: "var(--violet)",
    soft: "var(--violet-soft)",
  },
  {
    step: "03",
    title: "Regular Mentorship Sessions",
    desc: "Weekly 1:1 calls to review performance, clear doubts, and adjust your plan as needed.",
    icon: CalendarCheck,
    color: "var(--green)",
    soft: "var(--green-soft)",
  },
  {
    step: "04",
    title: "Achieve Your Goal",
    desc: "With consistent support, mock reviews, and interview prep — walk into your exam with full confidence.",
    icon: CheckCircle2,
    color: "var(--amber)",
    soft: "var(--amber-soft)",
  },
];

const FAQS = [
  {
    q: "How is this different from regular coaching?",
    a: "Regular coaching is one-size-fits-all. Our mentorship is personalised — you get a dedicated mentor who knows your weaknesses, tracks your daily progress, and builds a plan just for you. Think of it as having a topper guide you 1:1.",
  },
  {
    q: "Can I choose my mentor?",
    a: "Yes! After enrollment you can browse mentor profiles and request a specific mentor. We try our best to match you based on your exam, location preference, and language.",
  },
  {
    q: "What if I miss a session?",
    a: "No problem — every session is reschedulable. Simply inform your mentor 6 hours in advance and pick a new time that works for both of you.",
  },
  {
    q: "Is there a refund policy?",
    a: "We offer a 7-day satisfaction guarantee. If you feel the mentorship isn't right for you within the first week, reach out to us and we'll process a full refund.",
  },
  {
    q: "Which exams do you support?",
    a: "We currently support SSC (CGL, CHSL, MTS), Banking (IBPS PO/Clerk, SBI), Railways (RRB NTPC, Group D), State PSCs (JPSC, BPSC, UPPSC), and Defence (Agniveer). More exams being added.",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    exam: "IBPS PO 2024 — Selected",
    text: "The weekly 1:1 sessions made all the difference. My mentor kept me accountable and helped me improve my accuracy from 60% to 85% in just 3 months.",
    rating: 5,
    avatar: "PS",
    color: "from-violet-500 to-blue-500",
  },
  {
    name: "Rahul Kumar",
    exam: "SSC CGL 2024 — Selected",
    text: "I had been failing for 2 years. With ExamNurture mentorship, I finally cracked SSC CGL. The personalised roadmap and daily targets were game-changers.",
    rating: 5,
    avatar: "RK",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Anjali Singh",
    exam: "JPSC Prelims 2024 — Cleared",
    text: "My mentor understood the Jharkhand-specific syllabus deeply. The subject-wise guidance and mock review sessions helped me clear Prelims in my first attempt.",
    rating: 5,
    avatar: "AS",
    color: "from-emerald-500 to-teal-500",
  },
];

/* ─── Page ───────────────────────────────────── */
export default function MentorshipPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-14 fade-up">

      {/* ── Hero ── */}
      <section className="pt-4">
        <div
          className="relative rounded-3xl overflow-hidden p-8 md:p-12"
          style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #1E40AF 100%)" }}
        >
          {/* Glow orbs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }} />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(circle, #06B6D4, transparent 70%)" }} />

          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-5">
              <Zap size={12} className="text-amber-400" />
              <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Premium Mentorship Program</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4"
              style={{ fontFamily: "var(--font-sora)" }}>
              Your Journey from{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Syllabus to Success
              </span>
            </h1>

            <p className="text-white/60 text-[15px] leading-relaxed mb-8 max-w-lg">
              More than coaching — complete career mentorship. A dedicated mentor, personalised roadmap,
              weekly 1:1 sessions, and support till final selection.
            </p>

            <div className="flex flex-wrap gap-3">
              <a href="mailto:info@examnurture.com"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0F172A] text-sm font-bold hover:bg-blue-50 transition-all shadow-lg">
                Enroll Now <ArrowRight size={14} />
              </a>
              <a href="mailto:info@examnurture.com"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all">
                Schedule a Call
              </a>
            </div>
          </div>

          {/* Stats strip */}
          <div className="relative mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-white leading-none" style={{ fontFamily: "var(--font-sora)" }}>
                      {s.value}
                    </div>
                    <div className="text-[11px] text-white/50 mt-0.5">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section>
        <SectionHeader
          label="What You Get"
          title="More Than Coaching — Complete Career Mentorship"
          desc="Every aspect of your preparation is covered — from understanding the syllabus to cracking the interview."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                className="card p-5 flex gap-4 group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${f.bg}`}>
                  <Icon size={18} className={f.color} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--ink-1)" }}>{f.title}</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-4)" }}>{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section>
        <SectionHeader
          label="How It Works"
          title="4 Steps to Your Dream Job"
          desc="A simple, structured process that takes you from enrollment to final selection."
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="card p-5 flex flex-col gap-4 relative overflow-hidden"
              >
                {/* Step number watermark */}
                <div className="absolute -top-3 -right-2 text-[56px] font-black leading-none pointer-events-none select-none"
                  style={{ color: "var(--line-soft)", fontFamily: "var(--font-sora)" }}>
                  {s.step}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: s.soft }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-[13px] font-bold mb-1.5" style={{ color: "var(--ink-1)", fontFamily: "var(--font-sora)" }}>
                    {s.title}
                  </p>
                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-4)" }}>{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden xl:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight size={16} style={{ color: "var(--ink-4)" }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section>
        <SectionHeader
          label="Success Stories"
          title="Students Who Made It"
          desc="Real results from real students — mentored by ExamNurture."
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className="card p-5 flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={12} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-[13px] leading-relaxed italic" style={{ color: "var(--ink-2)" }}>
                "{t.text}"
              </p>
              <div className="flex items-center gap-3 mt-auto pt-2 border-t" style={{ borderColor: "var(--line-soft)" }}>
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold bg-gradient-to-br ${t.color} shrink-0`}>
                  {t.avatar}
                </span>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>{t.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--green)" }}>{t.exam}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQs ── */}
      <section>
        <SectionHeader
          label="FAQs"
          title="Frequently Asked Questions"
          desc="Everything you need to know before enrolling."
        />
        <div className="mt-8 flex flex-col gap-2 max-w-3xl">
          {FAQS.map((faq, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
              >
                <span className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>
                  {faq.q}
                </span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  style={{ color: "var(--ink-4)" }}
                />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 text-[13px] leading-relaxed border-t"
                      style={{ color: "var(--ink-3)", borderColor: "var(--line-soft)" }}>
                      <div className="pt-3">{faq.a}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section>
        <div
          className="rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ background: "var(--blue-soft)", border: "1px solid var(--line-soft)" }}
        >
          <div>
            <h3 className="text-xl font-extrabold mb-2" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
              Ready to start your mentorship journey?
            </h3>
            <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
              Join 500+ students already on their path to government job selection.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <a href="mailto:info@examnurture.com"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:brightness-110"
              style={{ background: "var(--blue)" }}>
              <Mail size={14} /> Enroll Now
            </a>
            <a href="tel:+917050722933"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-[var(--bg)]"
              style={{ color: "var(--ink-1)", border: "1px solid var(--line)" }}>
              <Phone size={14} /> Call Us
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ─── Shared section header ─────────────────── */
function SectionHeader({ label, title, desc }: { label: string; title: string; desc: string }) {
  return (
    <div className="max-w-2xl">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>
        {label}
      </div>
      <h2 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
        {title}
      </h2>
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-4)" }}>{desc}</p>
    </div>
  );
}
