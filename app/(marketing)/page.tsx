"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AuthModal from "@/components/auth/AuthModal";
import {
  ArrowRight,
  BookOpen,
  BarChart3,
  Trophy,
  Clock,
  Users,
  Zap,
  CheckCircle,
  Star,
  ChevronRight,
  FileText,
  Target,
  Calendar,
  TrendingUp,
  GraduationCap,
  Landmark,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

/* ══════════════════════════════════════════════
   THREE-LAYER BACKGROUND
   L1 → Mesh gradient   (base atmosphere)
   L2 → Halftone dots   (low opacity grid)
   L3 → Noise / grain   (very subtle texture)
══════════════════════════════════════════════ */
function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">

      {/* ── Layer 1: Mesh gradient ── */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            /* top-left blue node */
            "radial-gradient(ellipse 90% 55% at -5%  45%, rgba(59,130,246,0.22)  0%, transparent 60%)",
            /* top-right cyan node */
            "radial-gradient(ellipse 70% 45% at 105% 5%,  rgba(34,211,238,0.16)  0%, transparent 55%)",
            /* center-right violet node */
            "radial-gradient(ellipse 50% 40% at 95%  60%, rgba(139,92,246,0.10)  0%, transparent 50%)",
            /* upper-center blue highlight */
            "radial-gradient(ellipse 40% 30% at 35%  8%,  rgba(59,130,246,0.10)  0%, transparent 45%)",
            /* bottom-left emerald note */
            "radial-gradient(ellipse 35% 30% at 5%   95%, rgba(16,185,129,0.08)  0%, transparent 45%)",
            /* bottom-right indigo whisper */
            "radial-gradient(ellipse 30% 25% at 98%  98%, rgba(99,102,241,0.07)  0%, transparent 40%)",
            /* center white bloom (keeps text readable) */
            "radial-gradient(ellipse 55% 55% at 50%  50%, rgba(255,255,255,0.55) 0%, transparent 70%)",
            /* base tint — pure white */
            "#ffffff",
          ].join(", "),
        }}
      />

      {/* ── Layer 2: Halftone / dot grid (Corner Clustered) ── */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.04, // Keeps the whitish, light aesthetic
          backgroundImage:
            "radial-gradient(circle, #1e3a8a 1.5px, transparent 1.5px)",
          backgroundSize: "14px 14px", // Dense spacing
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 0% 0%, black 0%, transparent 70%), radial-gradient(ellipse 80% 80% at 100% 100%, black 0%, transparent 70%)",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 0% 0%, black 0%, transparent 70%), radial-gradient(ellipse 80% 80% at 100% 100%, black 0%, transparent 70%)",
        }}
      />

      {/* ── Layer 3: Noise / grain texture ── */}
      {/* Rendered as an inline SVG so no external asset is needed */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.026 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="en-landing-noise" x="0%" y="0%" width="100%" height="100%"
            colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="2"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#en-landing-noise)" />
      </svg>
    </div>
  );
}

/* ── animations ── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

/* ── static data ── */
const features = [
  {
    icon: FileText,
    title: "Full-Length Mock Tests",
    desc: "CBT-style exams with real exam interface, auto-timer, and question palette — just like the actual test.",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    href: "/dashboard/series",
  },
  {
    icon: BookOpen,
    title: "Previous Year Papers",
    desc: "Thousands of PYQ papers with detailed solutions across JPSC, Banking, SSC, Railway, and more.",
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    href: "/dashboard/pyq",
  },
  {
    icon: BarChart3,
    title: "AI Analytics",
    desc: "Detailed performance breakdown — weak areas, accuracy trends, percentile ranking, and improvement tips.",
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
    href: "/dashboard/analytics",
  },
  {
    icon: Target,
    title: "Study Library",
    desc: "Structured study materials, notes, and topic-wise resources curated by expert faculties.",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    href: "/blog",
  },

  {
    icon: Calendar,
    title: "Exam Guides",
    desc: "Syllabus, eligibility, exam pattern, admit card dates — everything in one place per exam.",
    color: "from-cyan-500 to-cyan-600",
    bg: "bg-cyan-50",
    href: "/dashboard/guides",
  },
  {
    icon: Users,
    title: "Mentorship Support",
    desc: "Guided preparation plans, expert support, and focused direction when your study path needs clarity.",
    color: "from-rose-500 to-rose-600",
    bg: "bg-rose-50",
    href: "/mentorship",
  },
];

const examCategories = [
  { name: "JPSC Prelims", tag: "State PSC", color: "bg-blue-100 text-blue-700", slug: "jpsc-prelims" },
  { name: "SBI PO", tag: "Banking", color: "bg-emerald-100 text-emerald-700", slug: "sbi-po" },
  { name: "IBPS PO", tag: "Banking", color: "bg-emerald-100 text-emerald-700", slug: "ibps-po" },
  { name: "SSC CGL", tag: "SSC", color: "bg-purple-100 text-purple-700", slug: "ssc-cgl" },
  { name: "Railway NTPC", tag: "Railway", color: "bg-amber-100 text-amber-700", slug: "rrb-ntpc" },
  { name: "Daroga SI", tag: "Police", color: "bg-rose-100 text-rose-700", slug: "up-si" },
  { name: "RBI Grade B", tag: "Banking", color: "bg-emerald-100 text-emerald-700", slug: "rbi-grade-b" },
  { name: "UET", tag: "Engineering", color: "bg-cyan-100 text-cyan-700", slug: null },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "JPSC Prelims 2024 — Cleared",
    text: "ExamNurture's CBT interface and analytics helped me identify my weak areas. I improved from 45% to 78% in just 3 months.",
    initials: "PS",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Rahul Kumar",
    role: "SBI PO 2024 — Selected",
    text: "The PYQ section is outstanding. Real exam papers with detailed solutions. This platform made my banking exam prep so much easier.",
    initials: "RK",
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Anjali Singh",
    role: "SSC CGL 2024 — Tier 1 Qualified",
    text: "The platform's interface and analytics helped me identify my weak areas. Being able to see my progress in real-time was game changing.",
    initials: "AS",
    color: "from-purple-500 to-pink-500",
  },
];

const planHighlights = [
  "Unlimited Mock Tests",
  "Full PYQ Access",
  "AI Weak Area Analysis",
  "Real-time Percentile",
  "Detailed Solutions",
];

/* ── stats ── */
interface PlatformStats {
  examBoards: number;
  exams: number;
  languages: number;
  tests: number;
  testSeries: number;
  pyqPapers: number;
  users: number;
  states: number;
  courses: number;
}

function useStats(): { stats: PlatformStats | null; loading: boolean } {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/stats`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch {
        setStats(null); // Ensure null on failure to show NA
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { stats, loading };
}

/* ══════════════════════════════════════════════
   HERO
══════════════════════════════════════════════ */
function HeroSection({ onLogin, stats, loading }: { onLogin: () => void; stats: PlatformStats | null; loading: boolean }) {
  const { user, loading: authLoading } = useAuth();

  const format = (val: number | undefined, isUsers = false) => {
    if (val === undefined || val === null) return "—";
    if (isUsers && val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toLocaleString();
  };

  const statItems = [];

  return (
    <section className="relative overflow-hidden bg-white">
      <MeshBackground />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Left */}
          <div className="text-center lg:text-left lg:pt-10">
            <motion.h1
              initial={{ opacity: 1, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-gray-900"
            >
              Master Your
              <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Exam Dreams
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 1, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-lg text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Full-length mock tests, PYQ papers, and AI analytics — everything you need to crack
              <span className="font-semibold text-blue-600"> JPSC, Banking, SSC, Railway</span> and more.
            </motion.p>

            <motion.div
              initial={{ opacity: 1, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              {authLoading ? (
                <div className="h-[56px] w-48 rounded-xl bg-blue-100 animate-pulse" />
              ) : user ? (
                <Link href="/dashboard">
                  <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-blue-500/25">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              ) : (
                <>
                  <button
                    onClick={onLogin}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
                  >
                    Start Free Today
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <Link href="/exams">
                    <button className="w-full sm:w-auto px-8 py-4 border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                      Browse Exams
                    </button>
                  </Link>
                </>
              )}
            </motion.div>

          </div>

          {/* Right — Compact Stats Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="relative mt-12 lg:mt-0 flex items-center justify-center lg:justify-end"
          >
            <div className="w-full max-w-md rounded-[2.5rem] border border-white/80 bg-white/40 p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60">
              {/* Panel header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-2.5 w-2.5">
                    <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <div className="relative h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Live Platform Stats</p>
                </div>
                <div className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">24h Update</div>
              </div>

              {/* Free PYQ highlight — Premium Card */}
              <Link href="/pyq/all" className="group mb-5 block">
                <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 transition-all duration-500 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] hover:-translate-y-1">
                  {/* Premium animated background elements */}
                  <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-blue-600/20 blur-3xl transition-all duration-500 group-hover:bg-blue-600/30" />
                  <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-600/20 blur-3xl transition-all duration-500 group-hover:bg-emerald-600/30" />

                  {/* FREE badge — Glass style */}
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-md">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/90">Curated PYQ Library</span>
                  </div>

                  <h3 className="text-xl font-bold leading-tight text-white mb-1.5">Previous Year Papers</h3>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed mb-4">Access 10,000+ real exam papers with detailed step-by-step solutions.</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-blue-500">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-emerald-500">
                        <BookOpen className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white transition-all duration-300 group-hover:gap-2.5">
                      Attempt Now <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Stat Grid — 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Landmark} label="Exam Boards" rawValue={stats?.examBoards} color="blue" />
                <StatCard icon={MapPin} label="States" rawValue={stats?.states} color="rose" />
                <StatCard icon={GraduationCap} label="Exams" rawValue={stats?.exams} color="violet" />
                <StatCard icon={BookOpen} label="Test Series" rawValue={stats?.testSeries} color="emerald" />
                <StatCard icon={FileText} label="PYQ Papers" rawValue={stats?.pyqPapers} color="cyan" />
                <StatCard icon={Users} label="Learners" rawValue={stats?.users} color="amber" isUsers />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── Count-up hook ── */
function useCountUp(target: number | undefined, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === undefined || target === null) return;
    const start = performance.now();
    const from = 0;
    const to = target;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (to - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

function StatCard({ icon: Icon, label, rawValue, color = "blue", isUsers = false }: {
  icon: React.ElementType;
  label: string;
  rawValue: number | undefined;
  color?: "blue" | "emerald" | "violet" | "amber" | "rose" | "cyan";
  isUsers?: boolean;
}) {
  const count = useCountUp(rawValue);

  const display = rawValue === undefined || rawValue === null
    ? "—"
    : isUsers && count >= 1000
      ? `${(count / 1000).toFixed(1)}K+`
      : isUsers
        ? `${count}+`
        : count.toLocaleString();

  const styles = {
    blue: "hover:bg-blue-600 hover:border-blue-600 text-blue-600",
    emerald: "hover:bg-emerald-600 hover:border-emerald-600 text-emerald-600",
    violet: "hover:bg-violet-600 hover:border-violet-600 text-violet-600",
    amber: "hover:bg-amber-600 hover:border-amber-600 text-amber-600",
    rose: "hover:bg-rose-600 hover:border-rose-600 text-rose-600",
    cyan: "hover:bg-cyan-600 hover:border-cyan-600 text-cyan-600",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`group relative flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-4 text-center transition-all duration-300 ${styles[color]} hover:shadow-2xl hover:shadow-current/10`}
    >
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 transition-all duration-500 group-hover:rotate-[15deg] group-hover:bg-white/20 group-hover:text-white shadow-sm">
        <Icon className="h-4.5 w-4.5" />
      </div>

      <motion.div
        initial={false}
        whileHover={{ rotateX: 10, rotateY: 10, perspective: 1000 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors duration-300 group-hover:text-white/70">{label}</p>
        <p className="text-xl font-black tabular-nums text-slate-900 transition-colors duration-300 group-hover:text-white">{display}</p>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   FEATURES
══════════════════════════════════════════════ */
function FeaturesSection() {
  return (
    <section className="py-20 lg:py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.18em] mb-3">Everything You Need</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-950 mb-4">
            One Platform. Complete Prep.
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Every tool designed to help you prepare smarter and score higher.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} variants={fadeUp}>
                <Link href={f.href} className="group block h-full">
                  <div className="h-full min-h-[218px] rounded-lg border border-gray-200 bg-gray-50/70 p-6 text-center shadow-sm shadow-gray-200/40 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-100/50">
                    <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg ${f.bg} transition-transform duration-300 group-hover:scale-105`}>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br ${f.color}`}>
                        <Icon className="h-4 w-4 text-white" strokeWidth={2.4} />
                      </div>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-gray-950 transition-colors group-hover:text-blue-600">{f.title}</h3>
                    <p className="mx-auto max-w-[24rem] text-sm leading-6 text-gray-600">{f.desc}</p>
                    <div className="mt-5 flex items-center justify-center gap-1 text-sm font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                      Explore <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   EXAM CATEGORIES
══════════════════════════════════════════════ */
function ExamCategoriesSection() {
  return (
    <section className="py-20 lg:py-28 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">Exams Covered</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Prepare for Any Exam</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From state PSC to banking to central government — comprehensive coverage for all major competitive exams.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="flex flex-wrap gap-3 justify-center mb-12"
        >
          {examCategories.map((exam) => (
            <motion.div key={exam.name} variants={fadeUp}>
              <Link href={exam.slug ? `/exams/${exam.slug}` : "/exams"}>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${exam.color}`}>{exam.tag}</span>
                  <span className="text-sm font-semibold text-gray-800">{exam.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center">
          <Link href="/exams">
            <button className="px-8 py-4 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mx-auto">
              Browse All Exams
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════ */
function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">Student Success</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Toppers Trust ExamNurture</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Thousands of students have cracked their dream exams with our platform.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div key={t.name} variants={fadeUp}>
              <div className="h-full bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">&quot;{t.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${t.color}`}>
                    {t.initials}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   CTA
══════════════════════════════════════════════ */
function CTASection({ stats, loading }: { stats: PlatformStats | null; loading: boolean }) {
  const { user } = useAuth();
  const promptGoogleSignIn = () => {
    const google = (window as Window & {
      google?: { accounts?: { id?: { prompt?: () => void } } };
    }).google;

    google?.accounts?.id?.prompt?.();
  };

  return (
    <section className="py-20 lg:py-28 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-6">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Free to Start</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Ready to Start Preparing?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join {stats?.users !== undefined ? stats.users.toLocaleString() : (loading ? "..." : "NA")} students already preparing smarter. Get access to mock tests, PYQ papers and analytics — free.
          </p>

          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
            {planHighlights.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/dashboard">
                <button className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:shadow-blue-500/25 text-base flex items-center gap-2 mx-auto sm:mx-0">
                  Open Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            ) : (
              <>
                <button
                  onClick={promptGoogleSignIn}
                  className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:shadow-blue-500/25 text-base flex items-center gap-2 mx-auto sm:mx-0"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={promptGoogleSignIn}
                  className="px-10 py-4 border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-all text-base mx-auto sm:mx-0"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════ */
export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const openLogin = useCallback(() => setShowModal(true), []);
  const { stats, loading } = useStats();

  return (
    <div className="min-h-screen bg-white relative">
      {/* Subtle page-wide grain overlay */}
      <svg className="pointer-events-none fixed inset-0 w-full h-full z-0" style={{ opacity: 0.018 }} aria-hidden="true">
        <defs>
          <filter id="en-page-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#en-page-grain)" />
      </svg>
      {showModal && <AuthModal onClose={() => setShowModal(false)} next="/dashboard" />}
      <HeroSection onLogin={openLogin} stats={stats} loading={loading} />
      <FeaturesSection />
      <ExamCategoriesSection />
      <TestimonialsSection />
      <CTASection stats={stats} loading={loading} />
    </div>
  );
}
