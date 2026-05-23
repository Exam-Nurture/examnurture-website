"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/auth/AuthModal";
import { 
  ArrowRight, 
  Sparkles, 
  CalendarDays, 
  BrainCircuit,
  Timer,
  Trophy,
  CheckCircle2,
  Calendar
} from "lucide-react";

const DAY_MAPPING = [
  { day: "Monday",    subject: "Indian History",      icon: "🏛️", color: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" },
  { day: "Tuesday",   subject: "Geography",           icon: "🌍", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { day: "Wednesday", subject: "Indian Polity",       icon: "⚖️", color: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  { fullWidth: true }, // For layout breaks if needed
  { day: "Thursday",  subject: "Indian Economy",      icon: "📈", color: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
  { day: "Friday",    subject: "General Science",     icon: "🔬", color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400" },
  { day: "Saturday",  subject: "Current Affairs",     icon: "📰", color: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" },
  { day: "Sunday",    subject: "Aptitude & Reasoning",icon: "🧠", color: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
];

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
            {DAY_MAPPING.filter(d => !d.fullWidth).map((item, idx) => {
              const isToday = item.day === today;
              return (
                <div 
                  key={idx}
                  className={`relative p-6 rounded-3xl border transition-all duration-300 ${
                    isToday 
                      ? "bg-white dark:bg-[var(--card)] border-[#0D287E] dark:border-[var(--blue)] shadow-[0_8px_32px_rgba(13,40,126,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] scale-105 z-10" 
                      : "bg-white dark:bg-[var(--card)] border-[#EAE8EC] dark:border-[var(--line-soft)] hover:border-[#CBCDD5] dark:hover:border-[var(--ink-4)]"
                  }`}
                >
                  {isToday && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0D287E] dark:bg-[var(--blue)] text-white text-[10px] uppercase tracking-wider font-bold rounded-full">
                      Today
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 ${item.color}`}>
                      {item.icon}
                    </div>
                    <div className="text-[12px] uppercase font-bold text-[#8D8D8F] dark:text-[var(--ink-4)] tracking-widest mb-1" style={{ fontFamily: "var(--font-mono)" }}>
                      {item.day}
                    </div>
                    <h3 className="text-[20px] font-bold text-[#2C2C2E] dark:text-[var(--ink-1)] leading-tight">
                      {item.subject}
                    </h3>
                  </div>
                </div>
              );
            })}
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
