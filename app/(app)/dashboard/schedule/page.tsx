import { CalendarDays, Play } from "lucide-react";

export const metadata = { title: "Schedule — ExamNurture" };

const UPCOMING = [
  { title: "JPSC Prelims Full Mock #05",       date: "Apr 26, 2026", time: "10:00 AM", type: "Full Mock",    color: "#8B5CF6" },
  { title: "Reasoning — Syllogisms Drill",     date: "Apr 27, 2026", time: "08:00 PM", type: "Chapter Test", color: "var(--blue)" },
  { title: "GK — Indian Polity & Economy",     date: "Apr 28, 2026", time: "07:00 PM", type: "Subject Test", color: "#10B981" },
  { title: "JPSC Prelims PYQ 2022",            date: "Apr 30, 2026", time: "09:00 AM", type: "PYQ Paper",    color: "#F59E0B" },
  { title: "IBPS PO — Quantitative Aptitude",  date: "May 2, 2026",  time: "06:30 PM", type: "Chapter Test", color: "#2563EB" },
  { title: "UP SI / Daroga Full Mock #02",     date: "May 4, 2026",  time: "10:00 AM", type: "Full Mock",    color: "#EF4444" },
];

const TODAY  = "Apr 26, 2026";
const THIS_WEEK = ["Apr 26, 2026", "Apr 27, 2026", "Apr 28, 2026", "Apr 29, 2026", "Apr 30, 2026"];

function sectionOf(date: string) {
  if (date === TODAY)           return "Today";
  if (THIS_WEEK.includes(date)) return "This Week";
  return "Upcoming";
}

export default function SchedulePage() {
  /* Group items */
  const groups: Record<string, typeof UPCOMING> = {};
  UPCOMING.forEach((item) => {
    const s = sectionOf(item.date);
    if (!groups[s]) groups[s] = [];
    groups[s].push(item);
  });

  return (
    <div className="flex flex-col gap-7 fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-[22px] font-bold tracking-tight"
            style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
          >
            Schedule
          </h1>
          <p className="text-[12px] mt-1.5" style={{ color: "var(--ink-4)" }}>
            Your upcoming tests and study sessions
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-all hover:brightness-105"
          style={{ background: "var(--blue)" }}
        >
          <CalendarDays size={14} /> Add Session
        </button>
      </div>

      {/* Grouped schedule */}
      {["Today", "This Week", "Upcoming"].map((section) =>
        groups[section] ? (
          <div key={section}>
            <div
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--ink-4)" }}
            >
              {section}
            </div>
            <div className="flex flex-col gap-3">
              {groups[section].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-4 rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    background: "white",
                    border: "1px solid var(--line-soft)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {/* Color bar */}
                  <div
                    className="w-1 h-12 rounded-full flex-shrink-0"
                    style={{ background: item.color }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[14px] font-semibold"
                      style={{ color: "var(--ink-1)" }}
                    >
                      {item.title}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--ink-3)" }}>
                      {item.date} · {item.time}
                    </div>
                  </div>

                  {/* Type badge */}
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-[5px] flex-shrink-0"
                    style={{ background: item.color + "18", color: item.color }}
                  >
                    {item.type.toUpperCase()}
                  </span>

                  {/* CTA */}
                  <button
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-[9px] text-white transition-all hover:brightness-105 flex-shrink-0"
                    style={{ background: item.color }}
                  >
                    <Play size={11} fill="white" stroke="none" />
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}
