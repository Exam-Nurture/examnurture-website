import { BarChart2 } from "lucide-react";
import * as motion from "framer-motion/client";

export const metadata = { title: "Analytics — ExamNurture" };

export default function AnalyticsPage() {
  const stats = [
    { label: "Overall Accuracy",    val: "68%",    delta: "+5%",   color: "var(--blue)"   },
    { label: "Tests This Month",    val: "22",     delta: "+7",    color: "var(--green)"  },
    { label: "Study Time Today",    val: "1h 48m", delta: "+24m",  color: "#F59E0B"       },
  ];

  const subjectStats = [
    { label: "General Knowledge",     acc: 71, color: "#8B5CF6" },
    { label: "Reasoning",             acc: 64, color: "var(--blue)" },
    { label: "Quantitative Aptitude", acc: 58, color: "#EF4444" },
    { label: "English Language",      acc: 80, color: "var(--green)" },
    { label: "Hindi Language",        acc: 74, color: "#F59E0B" },
  ];

  return (
    <div className="flex flex-col gap-6 fade-up">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
        >
          Analytics
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "var(--ink-4)" }}>
          Performance insights across all your exams
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            key={s.label}
            className="card p-6"
          >
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
              {s.label}
            </div>
            <div
              className="text-3xl font-bold leading-none mb-2"
              style={{ color: s.color, fontFamily: "var(--font-sora)" }}
            >
              {s.val}
            </div>
            <div className="text-xs font-semibold" style={{ color: "var(--green)" }}>
              {s.delta} vs last month
            </div>
          </motion.div>
        ))}
      </div>

      {/* Subject accuracy */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="card p-8"
      >
        <div className="text-lg font-semibold mb-6" style={{ color: "var(--ink-1)", fontFamily: "var(--font-sora)" }}>
          Subject-wise Accuracy
        </div>
        <div className="flex flex-col gap-5">
          {subjectStats.map((s, i) => (
            <motion.div 
              key={s.label}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
            >
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>{s.label}</span>
                <span className="text-sm font-bold font-mono tabular-nums" style={{ color: s.color }}>
                  {s.acc}%
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-[var(--line-soft)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.acc}%` }}
                  transition={{ delay: 0.8 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: s.color, opacity: 0.9 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Charts coming soon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center glass"
        style={{ minHeight: 300 }}
      >
        <div className="w-16 h-16 rounded-full bg-[var(--blue-soft)] flex items-center justify-center mb-2">
          <BarChart2 size={32} className="text-[var(--blue)]" />
        </div>
        <h3 className="text-xl font-bold font-[var(--font-sora)] text-[var(--ink-1)]">
          Detailed charts coming soon
        </h3>
        <p className="text-sm max-w-md text-[var(--ink-4)] leading-relaxed">
          Score trends, rank history, topic accuracy heatmaps, and time-per-question analysis will be available here.
        </p>
      </motion.div>
    </div>
  );
}
