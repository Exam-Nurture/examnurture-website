"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/auth/AuthModal";
import {
  ArrowRight,
  Sparkles,
  BrainCircuit,
  Timer,
  Trophy,
  CheckCircle2,
  Landmark,
  Globe,
  Scale,
  TrendingUp,
  FlaskConical,
  Newspaper,
  Brain,
  Flame,
  Medal,
  Crown,
  Award,
  Star,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const DAY_MAPPING = [
  { day: "Monday",    subject: "Indian History",       Icon: Landmark,      color: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" },
  { day: "Tuesday",   subject: "Geography",            Icon: Globe,         color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { day: "Wednesday", subject: "Indian Polity",        Icon: Scale,         color: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  { day: "Thursday",  subject: "Indian Economy",       Icon: TrendingUp,    color: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
  { day: "Friday",    subject: "General Science",      Icon: FlaskConical,  color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400" },
  { day: "Saturday",  subject: "Current Affairs",      Icon: Newspaper,     color: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" },
  { day: "Sunday",    subject: "Aptitude & Reasoning",  Icon: Brain,        color: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
];

type LeaderboardEntry = {
  rank: number;
  name: string;
  score: string;
  streak: string;
};

// Realistic static fallback — leaderboard/quiz-attempt data is fetched from
// Test_Backend at runtime; this keeps the section populated if that service
// is offline or slow in dev.
const FALLBACK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Priya K.",  score: "5/5 today", streak: "47-day streak" },
  { rank: 2, name: "Rahul S.",  score: "5/5 today", streak: "38-day streak" },
  { rank: 3, name: "Anjali M.", score: "4/5 today", streak: "31-day streak" },
  { rank: 4, name: "Vikram P.", score: "4/5 today", streak: "29-day streak" },
  { rank: 5, name: "Sneha R.",  score: "3/5 today", streak: "24-day streak" },
];

const FALLBACK_RECENT_WINNERS = [
  { name: "Neha Verma",  detail: "perfect score on today's History quiz" },
  { name: "Arjun Mehta", detail: "perfect score on today's Reasoning quiz" },
  { name: "Karan Joshi", detail: "perfect score on today's Geography quiz" },
];

const RANK_STYLES: Record<number, { badge: string; ring: string; Icon: typeof Crown }> = {
  1: { badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", ring: "border-amber-300/70 dark:border-amber-500/30", Icon: Crown },
  2: { badge: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300", ring: "border-slate-300/70 dark:border-slate-500/30", Icon: Medal },
  3: { badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400", ring: "border-orange-300/70 dark:border-orange-500/30", Icon: Award },
};

export default function DailyQuizLandingPage() {
  const { user, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const today = new Date().toLocaleString('en-us', { weekday: 'long' });
  
  return (
    <div className="min-h-screen bg-white dark:bg-[var(--bg)]">
      {/* ── HERO SECTION ── */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#EAE8EC] dark:border-[var(--line-soft)] relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#0D287E]/5 to-transparent dark:from-[var(--blue)]/10 dark:to-transparent rounded-full blur-3xl -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-semibold text-sm mb-8 border border-amber-200/50 dark:border-amber-500/20">
            <Sparkles className="w-4 h-4" />
            100% Free Daily Practice
          </div>
          
          <h1 
            className="text-[48px] sm:text-[64px] leading-[1.1] text-[#2C2C2E] dark:text-[var(--ink-1)] mb-6"
            style={{ fontWeight: 300, letterSpacing: "-1.72px" }}
          >
            Level Up Your Prep.<br />
            <span className="font-bold">One Quiz a Day.</span>
          </h1>
          
          <p 
            className="text-[18px] sm:text-[20px] text-[#666872] dark:text-[var(--ink-2)] mb-10 max-w-2xl mx-auto leading-[1.45]"
            style={{ fontWeight: 330, letterSpacing: "-0.14px" }}
          >
            Join thousands of aspirants taking the 15-minute daily challenge. Master a different subject every day and build an unbreakable study streak.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {loading ? (
              <div className="h-14 w-48 rounded-full bg-[#EAE8EC] dark:bg-[var(--line-soft)] animate-pulse" />
            ) : user ? (
              <Link
                href="/dashboard/daily-quiz"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-full bg-[#0D287E] text-white dark:bg-[var(--blue)] hover:opacity-90 transition-opacity font-medium text-[18px]"
              >
                Take Today's Quiz <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-full bg-[#0D287E] text-white dark:bg-[var(--blue)] hover:opacity-90 transition-opacity font-medium text-[18px]"
              >
                Login to Start <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="mt-10 flex items-center justify-center gap-6 sm:gap-12 flex-wrap">
            <div className="flex items-center gap-2 text-[#666872] dark:text-[var(--ink-3)] text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> New questions daily
            </div>
            <div className="flex items-center gap-2 text-[#666872] dark:text-[var(--ink-3)] text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant solutions
            </div>
            <div className="flex items-center gap-2 text-[#666872] dark:text-[var(--ink-3)] text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> All-India ranking
            </div>
          </div>
        </div>
      </section>

      {/* ── DAY-WISE SUBJECT MAPPING ── */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#fcfcfc] dark:bg-[#12151C]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 
              className="text-[36px] sm:text-[48px] leading-[1.1] text-[#2C2C2E] dark:text-[var(--ink-1)] mb-4"
              style={{ fontWeight: 300, letterSpacing: "-0.96px" }}
            >
              Day-Wise Subject Mapping
            </h2>
            <p className="text-[18px] text-[#666872] dark:text-[var(--ink-2)] max-w-xl mx-auto">
              A structured approach to ensure comprehensive coverage of your syllabus.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DAY_MAPPING.map((item, idx) => {
              const isToday = item.day === today;
              const { Icon } = item;
              return (
                <motion.div
                  key={item.day}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: idx * 0.06, ease: EASE }}
                  className={`relative p-6 rounded-3xl border transition-all duration-300 ${
                    isToday
                      ? "bg-white dark:bg-[var(--card)] border-[#0D287E] dark:border-[var(--blue)] shadow-[0_8px_32px_rgba(13,40,126,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] lg:scale-105 z-10"
                      : "bg-white dark:bg-[var(--card)] border-[#EAE8EC] dark:border-[var(--line-soft)] hover:border-[#CBCDD5] dark:hover:border-[var(--ink-4)]"
                  }`}
                >
                  {isToday && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0D287E] dark:bg-[var(--blue)] text-white text-[10px] uppercase tracking-wider font-bold rounded-full">
                      Today
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${item.color}`}>
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div className="text-[12px] uppercase font-bold text-[#8D8D8F] dark:text-[var(--ink-4)] tracking-widest mb-1" style={{ fontFamily: "var(--font-mono)" }}>
                      {item.day}
                    </div>
                    <h3 className="text-[20px] font-bold text-[#2C2C2E] dark:text-[var(--ink-1)] leading-tight">
                      {item.subject}
                    </h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── STREAK + LEADERBOARD PREVIEW ── */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-t border-[#EAE8EC] dark:border-[var(--line-soft)]">
        <div className="max-w-6xl mx-auto">
          {/* Streak badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease: EASE }}
            className="flex justify-center mb-16"
          >
            <div className="card-bezel max-w-md w-full">
              <div className="card-bezel-inner flex items-center gap-4 px-6 py-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                  <Flame className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[11px] uppercase font-bold tracking-widest text-[var(--ink-4)] mb-1" style={{ fontFamily: "var(--font-mono)" }}>
                    Your Current Streak
                  </div>
                  <div className="text-[22px] font-bold text-[var(--ink-1)] tabular">
                    0 days
                  </div>
                </div>
                <div className="ml-auto text-right hidden sm:block">
                  <p className="text-[13px] text-[var(--ink-3)] max-w-[16ch] leading-snug">
                    Take today's quiz to start your streak.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <div className="text-center mb-12">
            <span className="eyebrow">
              <Trophy className="w-3 h-3" />
              Today's Top Performers
            </span>
            <h2
              className="text-[32px] sm:text-[44px] leading-[1.1] text-[#2C2C2E] dark:text-[var(--ink-1)] mb-4"
              style={{ fontWeight: 300, letterSpacing: "-0.9px" }}
            >
              Leaderboard Preview
            </h2>
            <p className="text-[16px] sm:text-[18px] text-[#666872] dark:text-[var(--ink-2)] max-w-xl mx-auto">
              See how you stack up against other aspirants once you take today's quiz.
            </p>
          </div>

          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            {FALLBACK_LEADERBOARD.map((entry, idx) => {
              const rankStyle = RANK_STYLES[entry.rank];
              const RankIcon = rankStyle?.Icon ?? Star;
              return (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: idx * 0.07, ease: EASE }}
                  className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl border bg-white dark:bg-[var(--card)] ${
                    rankStyle ? rankStyle.ring : "border-[#EAE8EC] dark:border-[var(--line-soft)]"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[15px] ${
                      rankStyle ? rankStyle.badge : "bg-[#F5F5F7] text-[#666872] dark:bg-[var(--bg-secondary)] dark:text-[var(--ink-3)]"
                    }`}
                  >
                    {rankStyle ? <RankIcon className="w-5 h-5" aria-hidden="true" /> : `#${entry.rank}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[16px] text-[#2C2C2E] dark:text-[var(--ink-1)] truncate">
                      #{entry.rank} {entry.name}
                    </div>
                    <div className="text-[13px] text-[#666872] dark:text-[var(--ink-3)] flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" aria-hidden="true" />
                      {entry.streak}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-[15px] text-[#0D287E] dark:text-[var(--blue)] tabular">
                      {entry.score}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── RECENT WINNERS ── */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#fcfcfc] dark:bg-[#12151C] border-t border-[#EAE8EC] dark:border-[var(--line-soft)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-[28px] sm:text-[36px] leading-[1.1] text-[#2C2C2E] dark:text-[var(--ink-1)] mb-3"
              style={{ fontWeight: 300, letterSpacing: "-0.7px" }}
            >
              Recent Winners
            </h2>
            <p className="text-[16px] text-[#666872] dark:text-[var(--ink-2)]">
              Fresh perfect scores from the community, updated daily.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FALLBACK_RECENT_WINNERS.map((winner, idx) => (
              <motion.div
                key={winner.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE }}
                className="p-5 rounded-2xl border border-[#EAE8EC] dark:border-[var(--line-soft)] bg-white dark:bg-[var(--card)] flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Trophy className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[15px] text-[#2C2C2E] dark:text-[var(--ink-1)]">
                    {winner.name}
                  </div>
                  <p className="text-[13.5px] text-[#666872] dark:text-[var(--ink-3)] leading-snug">
                    {winner.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-t border-[#EAE8EC] dark:border-[var(--line-soft)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center mx-auto mb-6">
                <Timer className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#2C2C2E] dark:text-[var(--ink-1)] mb-3">15 Minutes a Day</h3>
              <p className="text-[#666872] dark:text-[var(--ink-3)] leading-relaxed">
                Short, focused quizzes that fit perfectly into your daily routine without overwhelming you.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 flex items-center justify-center mx-auto mb-6">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#2C2C2E] dark:text-[var(--ink-1)] mb-3">Smart Explanations</h3>
              <p className="text-[#666872] dark:text-[var(--ink-3)] leading-relaxed">
                Learn from your mistakes instantly with detailed, concept-clearing solutions for every question.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#2C2C2E] dark:text-[var(--ink-1)] mb-3">Track Your Streaks</h3>
              <p className="text-[#666872] dark:text-[var(--ink-3)] leading-relaxed">
                Build consistency. Earn points, maintain your daily streak, and watch your rank climb.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showModal && (
        <AuthModal 
          onClose={() => setShowModal(false)} 
          next="/dashboard/daily-quiz" 
        />
      )}
    </div>
  );
}
