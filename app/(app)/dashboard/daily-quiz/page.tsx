"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, CheckCircle, AlertCircle, Trophy,
  ArrowRight, ArrowLeft, LayoutDashboard,
  Calendar, Target, Flame, Zap,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const CONTENT_API = process.env.NEXT_PUBLIC_CONTENT_API_URL || "http://localhost:8000";

/* ── Weekly schedule ── */
const WEEKLY_SCHEDULE: Record<number, { day: string; subjects: string[]; emoji: string; color: string }> = {
  1: { day: "Monday",    subjects: ["SCIENCE", "Environment"],                                                                             emoji: "🔬", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  2: { day: "Tuesday",   subjects: ["INDIAN ECONOMY", "REASONING"],                                                                        emoji: "📊", color: "text-blue-600 bg-blue-50 border-blue-200" },
  3: { day: "Wednesday", subjects: ["GEOGRAPHY", "Environment"],                                                                            emoji: "🌍", color: "text-amber-600 bg-amber-50 border-amber-200" },
  4: { day: "Thursday",  subjects: ["HISTORY", "POLITY"],                                                                                   emoji: "📜", color: "text-rose-600 bg-rose-50 border-rose-200" },
  5: { day: "Friday",    subjects: ["JHARKHAND", "MATH", "REASONING"],                                                                      emoji: "🧮", color: "text-violet-600 bg-violet-50 border-violet-200" },
  6: { day: "Saturday",  subjects: ["JHARKHAND", "GEOGRAPHY", "HISTORY", "POLITY", "SCIENCE", "INDIAN ECONOMY", "MATH", "REASONING"],      emoji: "📚", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  0: { day: "Sunday",    subjects: ["JHARKHAND", "GEOGRAPHY", "HISTORY", "POLITY", "SCIENCE", "INDIAN ECONOMY", "MATH", "REASONING"],      emoji: "🎯", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
};

type GameState = "loading" | "intro" | "playing" | "result" | "error";

interface Option { id: string; text: string; text_hindi?: string | null }
interface Question {
  id: string | number;
  text: string;
  text_hindi?: string | null;
  options: Option[];
  correct_answer: string;
  explanation?: string | null;
}
interface QuizData {
  id: string | number;
  time_limit?: number;
  user_attempts?: number;
  max_attempts?: number;
  questions: Question[];
}

/* ── helpers ── */
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function transformQuestion(q: Record<string, unknown>): Question {
  return {
    id: (q.QuestionID ?? q.question_id ?? q.id) as string,
    text: (q.Question ?? q.question) as string,
    text_hindi: (q.QuestionHindi ?? q.question_hindi ?? null) as string | null,
    options: [
      { id: "A", text: (q.OptionA ?? q.option_a) as string, text_hindi: (q.OptionAHindi ?? q.option_a_hindi ?? null) as string | null },
      { id: "B", text: (q.OptionB ?? q.option_b) as string, text_hindi: (q.OptionBHindi ?? q.option_b_hindi ?? null) as string | null },
      { id: "C", text: (q.OptionC ?? q.option_c) as string, text_hindi: (q.OptionCHindi ?? q.option_c_hindi ?? null) as string | null },
      { id: "D", text: (q.OptionD ?? q.option_d) as string, text_hindi: (q.OptionDHindi ?? q.option_d_hindi ?? null) as string | null },
    ],
    correct_answer: (q.Answer ?? q.answer) as string,
    explanation: (q.Explanation ?? q.explanation ?? null) as string | null,
  };
}

export default function DailyQuizPage() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>("loading");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().getDay();
  const todaySchedule = WEEKLY_SCHEDULE[today];

  /* Fetch quiz */
  useEffect(() => {
    if (gameState !== "loading") return;
    async function fetchQuiz() {
      try {
        const res = await fetch(`${CONTENT_API}/api/daily-quiz/`);
        if (!res.ok) throw new Error("Failed to load quiz");
        const data = await res.json();

        if (data.user_attempts !== undefined && data.max_attempts !== undefined && data.user_attempts >= data.max_attempts) {
          setErrorMsg(`You have already completed today's quiz. Come back tomorrow!`);
        }

        setQuizData({
          id: data.id,
          time_limit: data.time_limit,
          user_attempts: data.user_attempts,
          max_attempts: data.max_attempts,
          questions: (data.questions as Record<string, unknown>[]).map(transformQuestion),
        });
        if (data.time_limit) setTimeLeft(data.time_limit * 60);
        setGameState("intro");
      } catch {
        /* No backend — use demo questions */
        setQuizData({
          id: "demo",
          time_limit: 10,
          questions: [
            {
              id: "1", text: "Which Article of the Indian Constitution provides free and compulsory education to children aged 6–14?",
              options: [
                { id: "A", text: "Article 19" }, { id: "B", text: "Article 21A" },
                { id: "C", text: "Article 29" }, { id: "D", text: "Article 45" },
              ],
              correct_answer: "B",
              explanation: "The 86th Amendment Act (2002) inserted Article 21A, making education a fundamental right for children aged 6–14.",
            },
            {
              id: "2", text: "If A is the brother of B, B is the sister of C, and C is the father of D — what is A to D?",
              options: [
                { id: "A", text: "Uncle" }, { id: "B", text: "Father" },
                { id: "C", text: "Brother" }, { id: "D", text: "Grandfather" },
              ],
              correct_answer: "A",
              explanation: "A and C are siblings. Since C is the father of D, C's brother A is the uncle of D.",
            },
            {
              id: "3", text: "A train travels 360 km in 4 hours. What is its speed in m/s?",
              options: [
                { id: "A", text: "20 m/s" }, { id: "B", text: "25 m/s" },
                { id: "C", text: "28 m/s" }, { id: "D", text: "30 m/s" },
              ],
              correct_answer: "B",
              explanation: "Speed = 360/4 = 90 km/h. Convert: 90 × (5/18) = 25 m/s.",
            },
            {
              id: "4", text: "Who is known as the 'Iron Man of India'?",
              options: [
                { id: "A", text: "Mahatma Gandhi" }, { id: "B", text: "Jawaharlal Nehru" },
                { id: "C", text: "Sardar Vallabhbhai Patel" }, { id: "D", text: "Subhas Chandra Bose" },
              ],
              correct_answer: "C",
              explanation: "Sardar Vallabhbhai Patel is called the Iron Man of India for unifying 562 princely states into the Indian Union.",
            },
            {
              id: "5", text: "Which river is known as the 'Sorrow of Bihar'?",
              options: [
                { id: "A", text: "Ganga" }, { id: "B", text: "Kosi" },
                { id: "C", text: "Gandak" }, { id: "D", text: "Son" },
              ],
              correct_answer: "B",
              explanation: "The Kosi river is called the 'Sorrow of Bihar' due to its frequent flooding and changing course.",
            },
          ],
        });
        setGameState("intro");
      }
    }
    fetchQuiz();
  }, [gameState]);

  /* Countdown timer */
  useEffect(() => {
    if (gameState !== "playing" || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState, timeLeft]);

  /* Sync selected option on question change */
  useEffect(() => {
    setSelectedOption(userAnswers[currentIdx] ?? null);
  }, [currentIdx]);

  const handleStart = () => {
    if (errorMsg) return;
    setGameState("playing");
  };

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setUserAnswers((prev) => ({ ...prev, [currentIdx]: optionId }));
  };

  const handleNext = () => {
    if (!quizData) return;
    if (currentIdx < quizData.questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => setCurrentIdx((i) => Math.max(0, i - 1));

  const handleSubmit = async () => {
    if (!quizData || submitting) return;
    setSubmitting(true);

    let finalScore = 0;
    Object.entries(userAnswers).forEach(([idx, ans]) => {
      if (quizData.questions[parseInt(idx)]?.correct_answer === ans) finalScore++;
    });
    setScore(finalScore);

    /* Try to submit to backend — best-effort */
    try {
      const answers = Object.entries(userAnswers).map(([idx, selected_option]) => ({
        question_id: quizData.questions[parseInt(idx)]?.id,
        selected_option,
      }));
      await fetch(`${CONTENT_API}/api/daily-quiz/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quiz_id: quizData.id, answers }),
      });
    } catch { /* silent — score is shown regardless */ }

    setSubmitting(false);
    setGameState("result");

    /* Confetti on good score */
    if (quizData && finalScore > quizData.questions.length / 2) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — canvas-confetti optional dep
      import("canvas-confetti").then((m: any) => {
        m.default({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#2563EB", "#06b6d4", "#10b981"] });
      }).catch(() => {});
    }
  };

  const q = quizData?.questions[currentIdx];
  const totalQ = quizData?.questions.length ?? 0;

  /* ── Loading ── */
  if (gameState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-[var(--blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium" style={{ color: "var(--ink-3)" }}>Preparing your daily challenge…</p>
        </div>
      </div>
    );
  }

  /* ── mock data ── */
  const toppers = [
    { rank: 1, name: "Priya S.", score: 5, time: "4:12", badge: "🥇" },
    { rank: 2, name: "Rahul K.", score: 5, time: "5:44", badge: "🥈" },
    { rank: 3, name: "Anjali M.", score: 4, time: "6:01", badge: "🥉" },
    { rank: 4, name: "Vikram T.", score: 4, time: "7:22", badge: "4" },
    { rank: 5, name: "Sneha R.", score: 3, time: "8:15", badge: "5" },
  ];
  const pastResults = [
    { day: "Wednesday", date: "Apr 29", score: 4, total: 5, pct: 80, subjects: ["GEOGRAPHY", "Environment"] },
    { day: "Tuesday", date: "Apr 28", score: 3, total: 5, pct: 60, subjects: ["ECONOMY", "REASONING"] },
    { day: "Monday", date: "Apr 27", score: 5, total: 5, pct: 100, subjects: ["SCIENCE", "Environment"] },
  ];

  /* ── Intro ── */
  if (gameState === "intro") {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-10">

        {/* ── HERO BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #0891b2 60%, #0e7490 100%)" }}
        >
          {/* decorative blobs */}
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-white/5" />

          <div className="relative z-10 px-8 md:px-12 py-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm">
                  <Flame size={12} /> Daily Challenge
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm">
                  <Calendar size={12} /> {todaySchedule.day}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
                Today's Daily Quiz
              </h1>
              <p className="text-white/75 text-base mb-5">
                {totalQ} questions · {quizData?.time_limit ?? 10} minutes · Test your knowledge
              </p>
              <div className="flex flex-wrap gap-2 mb-7">
                {todaySchedule.subjects.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-xs font-bold backdrop-blur-sm border border-white/20">{s}</span>
                ))}
              </div>
              <div className="flex items-center gap-4">
                {errorMsg ? (
                  <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-500/20 text-white text-sm font-medium border border-red-300/30">
                    <AlertCircle size={16} /> {errorMsg}
                  </div>
                ) : (
                  <button
                    onClick={handleStart}
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-blue-700 font-extrabold text-base shadow-2xl shadow-black/20 hover:shadow-white/20 hover:scale-105 transition-all duration-200"
                  >
                    <Zap size={18} /> Start Today's Quiz
                  </button>
                )}
                <div className="flex items-center gap-5 text-white/70 text-sm">
                  <span className="flex items-center gap-1.5"><Clock size={14} /> {quizData?.time_limit ?? 10} min</span>
                  <span className="flex items-center gap-1.5"><Target size={14} /> {totalQ} Qs</span>
                  <span className="flex items-center gap-1.5"><Flame size={14} /> +1 streak</span>
                </div>
              </div>
            </div>
            {/* right stats box */}
            <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-full md:w-52 flex flex-col gap-5">
              {[
                { label: "Questions", value: totalQ, icon: "📝" },
                { label: "Time Limit", value: `${quizData?.time_limit ?? 10}m`, icon: "⏱️" },
                { label: "Streak Reward", value: "+1 🔥", icon: "⚡" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-white/50 text-xs font-medium mb-0.5">{s.label}</div>
                  <div className="text-white text-xl font-extrabold">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── SCHEDULE + TOPPERS row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Weekly Schedule table — spans 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-2 overflow-hidden rounded-3xl border shadow-sm"
            style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
          >
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--line-soft)" }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: "var(--ink-1)" }}>Weekly Schedule</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-4)" }}>Daily quiz subjects by day</p>
              </div>
              <Calendar size={18} style={{ color: "var(--ink-4)" }} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--line-soft)" }}>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ink-4)" }}>Day</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ink-4)" }}>Subjects</th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: "var(--ink-4)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(WEEKLY_SCHEDULE)
                    .sort(([a], [b]) => [1,2,3,4,5,6,0].indexOf(Number(a)) - [1,2,3,4,5,6,0].indexOf(Number(b)))
                    .map(([key, sched]) => {
                      const isToday = Number(key) === today;
                      return (
                        <tr key={key} style={{
                          borderBottom: "1px solid var(--line-soft)",
                          background: isToday ? "var(--blue-soft)" : "transparent"
                        }}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{sched.emoji}</span>
                              <span className="font-bold text-sm" style={{ color: isToday ? "var(--blue)" : "var(--ink-1)" }}>{sched.day}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {sched.subjects.slice(0, 4).map((sub) => (
                                <span key={sub} className="px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-tight border"
                                  style={isToday
                                    ? { color: "var(--blue)", background: "var(--card)", borderColor: "var(--blue)" }
                                    : { color: "var(--ink-3)", background: "var(--bg)", borderColor: "var(--line-soft)" }}>
                                  {sub}
                                </span>
                              ))}
                              {sched.subjects.length > 4 && <span className="text-[9px] font-bold" style={{ color: "var(--ink-4)" }}>+{sched.subjects.length - 4}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isToday ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-[9px] font-bold rounded-full">
                                <Flame size={9} /> TODAY
                              </span>
                            ) : (
                              <span className="text-[10px]" style={{ color: "var(--ink-4)" }}>Scheduled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Today's Toppers */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-3xl border shadow-sm overflow-hidden"
            style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
          >
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--line-soft)" }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: "var(--ink-1)" }}>Today's Toppers</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-4)" }}>Live leaderboard</p>
              </div>
              <Trophy size={18} style={{ color: "var(--ink-4)" }} />
            </div>
            <div className="divide-y" style={{ borderColor: "var(--line-soft)" }}>
              {toppers.map((t) => (
                <div key={t.rank} className="px-6 py-4 flex items-center gap-4 hover:opacity-90 transition-opacity">
                  <span className="text-xl w-7 text-center">{t.rank <= 3 ? t.badge : <span className="text-xs font-bold" style={{ color: "var(--ink-4)" }}>{t.rank}</span>}</span>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: "var(--ink-1)" }}>{t.name}</div>
                    <div className="text-xs" style={{ color: "var(--ink-4)" }}>{t.score}/{totalQ} correct</div>
                  </div>
                  <div className="text-xs font-bold" style={{ color: "var(--ink-3)" }}>{t.time}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── PAST RESULTS ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-3xl border shadow-sm overflow-hidden"
          style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
        >
          <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--line-soft)" }}>
            <div>
              <h2 className="font-bold text-base" style={{ color: "var(--ink-1)" }}>Your Past Results</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-4)" }}>Your recent quiz performance</p>
            </div>
            <LayoutDashboard size={18} style={{ color: "var(--ink-4)" }} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--line-soft)" }}>
                  {["Date", "Topics", "Score", "Accuracy"].map((h) => (
                    <th key={h} className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ink-4)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pastResults.map((r) => (
                  <tr key={r.date} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm" style={{ color: "var(--ink-1)" }}>{r.day}</div>
                      <div className="text-xs" style={{ color: "var(--ink-4)" }}>{r.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {r.subjects.map((s) => (
                          <span key={s} className="px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase border"
                            style={{ color: "var(--ink-3)", background: "var(--bg)", borderColor: "var(--line-soft)" }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-extrabold" style={{ color: "var(--ink-1)" }}>{r.score}/{r.total}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden" style={{ background: "var(--line)" }}>
                          <div className="h-full rounded-full" style={{
                            width: `${r.pct}%`,
                            background: r.pct === 100 ? "#10b981" : r.pct >= 60 ? "var(--blue)" : "#f59e0b"
                          }} />
                        </div>
                        <span className="text-xs font-bold w-10 text-right" style={{
                          color: r.pct === 100 ? "#10b981" : r.pct >= 60 ? "var(--blue)" : "#f59e0b"
                        }}>{r.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    );
  }

  /* ── Playing ── */

  if (gameState === "playing" && q && quizData) {
    const progress = ((currentIdx + 1) / totalQ) * 100;
    return (
      <div className="max-w-2xl mx-auto py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>
            Question {currentIdx + 1} / {totalQ}
          </div>
          <div
            className={`font-mono text-lg font-bold tabular-nums ${timeLeft < 60 ? "text-red-500 animate-pulse" : ""}`}
            style={timeLeft >= 60 ? { color: "var(--ink-1)" } : undefined}
          >
            <Clock size={14} className="inline mr-1 -mt-0.5" style={{ color: "var(--ink-4)" }} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full mb-8 overflow-hidden" style={{ background: "var(--line)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--blue)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Question */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}>
              <p className="text-base font-semibold leading-relaxed" style={{ color: "var(--ink-1)" }}>{q.text}</p>
              {q.text_hindi && (
                <p className="text-sm mt-3 pt-3 font-medium leading-relaxed" style={{ color: "var(--ink-3)", borderTop: "1px solid var(--line-soft)" }}>
                  {q.text_hindi}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3 mb-8">
              {q.options.map((opt, i) => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className="flex items-start gap-4 px-5 py-4 rounded-xl text-left transition-all"
                    style={{
                      background: isSelected ? "var(--blue-soft)" : "var(--card)",
                      border: isSelected ? "2px solid var(--blue)" : "1px solid var(--line-soft)",
                      color: isSelected ? "var(--blue)" : "var(--ink-2)",
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: isSelected ? "var(--blue)" : "var(--bg)",
                        color: isSelected ? "white" : "var(--ink-4)",
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-medium leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-30"
                style={{ color: "var(--ink-3)", background: "var(--bg)", border: "1px solid var(--line-soft)" }}
              >
                <ArrowLeft size={15} /> Previous
              </button>

              <div className="flex gap-1.5">
                {quizData.questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      background: userAnswers[i] !== undefined
                        ? "var(--green)"
                        : i === currentIdx ? "var(--blue)" : "var(--line)",
                    }}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: "var(--blue)" }}
              >
                {currentIdx === totalQ - 1
                  ? submitting ? "Submitting…" : "Finish"
                  : "Next"}
                <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  /* ── Result ── */
  if (gameState === "result" && quizData) {
    const pct = Math.round((score / totalQ) * 100);
    const passed = pct >= 60;

    return (
      <div className="max-w-xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl overflow-hidden text-center"
          style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
        >
          {/* Top ribbon */}
          <div
            className="px-8 py-10"
            style={{
              background: passed
                ? "linear-gradient(135deg, #10b981, #06b6d4)"
                : "linear-gradient(135deg, var(--blue), #6366f1)",
            }}
          >
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              {passed
                ? <CheckCircle size={36} className="text-white" />
                : <Trophy size={36} className="text-white" />}
            </div>
            <h2 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-sora)" }}>
              {passed ? "Well Done!" : "Quiz Complete!"}
            </h2>
            <p className="text-white/80 text-sm">
              {passed
                ? "You're on your way to exam success 🎉"
                : "Keep practising — consistency is key!"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-0 divide-x" style={{ borderBottom: "1px solid var(--line-soft)" }}>
            {[
              { label: "Correct", value: score },
              { label: "Attempted", value: Object.keys(userAnswers).length },
              { label: "Accuracy", value: `${pct}%` },
            ].map((stat) => (
              <div key={stat.label} className="py-6">
                <div className="text-2xl font-bold" style={{ color: "var(--ink-1)", fontFamily: "var(--font-sora)" }}>{stat.value}</div>
                <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: "var(--ink-4)" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Answer review */}
          <div className="p-6 text-left space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
              Answer Review
            </div>
            {quizData.questions.map((question, i) => {
              const given = userAnswers[i];
              const correct = question.correct_answer;
              const isRight = given === correct;
              const givenOpt = question.options.find((o) => o.id === given);
              const correctOpt = question.options.find((o) => o.id === correct);
              return (
                <div
                  key={question.id}
                  className="rounded-xl p-4 text-sm"
                  style={{
                    background: !given ? "var(--bg)" : isRight ? "var(--green-soft)" : "var(--red-soft)",
                    border: `1px solid ${!given ? "var(--line-soft)" : isRight ? "var(--green)" : "var(--red)"}`,
                  }}
                >
                  <div className="font-medium mb-2 line-clamp-2" style={{ color: "var(--ink-1)" }}>
                    Q{i + 1}. {question.text}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {given ? (
                      <span style={{ color: isRight ? "var(--green)" : "var(--red)" }}>
                        {isRight ? "✓" : "✗"} Your answer: {givenOpt?.text ?? given}
                      </span>
                    ) : (
                      <span style={{ color: "var(--ink-4)" }}>Not attempted</span>
                    )}
                    {!isRight && (
                      <span style={{ color: "var(--green)" }}>
                        ✓ Correct: {correctOpt?.text ?? correct}
                      </span>
                    )}
                  </div>
                  {question.explanation && (
                    <div className="mt-2 text-xs leading-relaxed" style={{ color: "var(--ink-3)" }}>
                      💡 {question.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <Link href="/dashboard" className="flex-1">
              <button
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
                style={{ background: "var(--blue)" }}
              >
                <LayoutDashboard size={15} /> Dashboard
              </button>
            </Link>
            <button
              onClick={() => {
                setGameState("loading");
                setCurrentIdx(0);
                setUserAnswers({});
                setSelectedOption(null);
                setScore(0);
              }}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-95"
              style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line)" }}
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
