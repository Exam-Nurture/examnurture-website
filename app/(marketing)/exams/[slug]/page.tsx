"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, FileText, FlaskConical,
  Clock, Users, Calendar, ChevronRight, CheckCircle,
  Flame, Lock, Sparkles, TrendingUp, RotateCcw, Zap,
  BookMarked, GraduationCap, BarChart3,
} from "lucide-react";
import {
  findExam, getBoardForExam, getStateForExam, getAllExams,
  type CatalogueExam,
} from "@/lib/data/examCatalogue";
import { useAuth } from "@/lib/auth-context";

/* ── Content stat pill ── */
function StatPill({
  icon, value, label, color,
}: { icon: React.ReactNode; value: number; label: string; color: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-3 rounded-[12px] min-w-[80px]"
      style={{ background: color + "14", border: `1px solid ${color}30` }}>
      <span style={{ color }}>{icon}</span>
      <span className="text-[18px] font-extrabold" style={{ color: "var(--ink-1)" }}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-4)" }}>{label}</span>
    </div>
  );
}

/* ── Quick action card ── */
function QuickAction({
  icon, title, subtitle, href, color, locked,
}: {
  icon: React.ReactNode; title: string; subtitle: string;
  href: string; color: string; locked?: boolean;
}) {
  return (
    <Link href={locked ? "/dashboard/plans" : href}
      className="group flex items-center gap-3.5 p-4 rounded-[14px] transition-all hover:border-opacity-100"
      style={{
        background: "var(--card)",
        border: `1px solid var(--line-soft)`,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color + "66"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--line-soft)"; }}
    >
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: color + "18", color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold leading-tight" style={{ color: "var(--ink-1)" }}>{title}</p>
        <p className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-4)" }}>{subtitle}</p>
      </div>
      {locked
        ? <Lock size={14} style={{ color: "var(--ink-4)" }} />
        : <ChevronRight size={15} className="opacity-40 group-hover:opacity-100 transition-opacity" style={{ color }} />
      }
    </Link>
  );
}

/* ── Syllabus section ── */
function SyllabusCard({ subjects }: { subjects: string[] }) {
  return (
    <div className="p-5 rounded-[14px]"
      style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}>
      <h3 className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
        Key Subjects
      </h3>
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <span key={s}
            className="text-[12px] font-medium px-3 py-1 rounded-full"
            style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line-soft)" }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Related exams (from same board) ── */
function RelatedExams({ currentExam }: { currentExam: CatalogueExam }) {
  const all = getAllExams().filter(
    (e) => e.boardId === currentExam.boardId && e.id !== currentExam.id
  );
  if (!all.length) return null;

  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
        More from this board
      </h3>
      <div className="flex flex-col gap-2">
        {all.map((e) => (
          <Link key={e.id} href={`/exams/${e.id}`}
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] group transition-all hover:border-[var(--blue)]"
            style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate group-hover:text-[var(--blue)] transition-colors"
                style={{ color: "var(--ink-1)" }}>{e.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-4)" }}>{e.eligibility} · {e.testCount} tests</p>
            </div>
            <ChevronRight size={14} className="shrink-0 opacity-40 group-hover:opacity-100" style={{ color: "var(--blue)" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Exam Hub Page
═══════════════════════════════════════════════ */
export default function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user }  = useAuth();
  const isPaid    = !!(user as any)?.subscription;

  const exam  = findExam(slug);
  const board = exam ? getBoardForExam(exam) : undefined;
  const state = exam ? getStateForExam(exam) : undefined;

  if (!exam || !board || !state) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <GraduationCap size={40} style={{ color: "var(--ink-4)" }} />
        <h1 className="text-[20px] font-bold" style={{ color: "var(--ink-1)" }}>Exam not found</h1>
        <Link href="/exams" className="text-[13px] font-semibold" style={{ color: "var(--blue)" }}>
          ← Browse all exams
        </Link>
      </div>
    );
  }

  const boardColor = board.color;

  return (
    <div className="flex flex-col gap-6 fade-up" style={{ maxWidth: 920, margin: "0 auto" }}>

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-[12px] flex-wrap" style={{ color: "var(--ink-4)" }}>
        <Link href="/exams" className="hover:text-[var(--ink-1)] transition-colors flex items-center gap-1">
          <ArrowLeft size={12} /> Browse Exams
        </Link>
        <ChevronRight size={11} />
        <button
          onClick={() => {/* state filter */}}
          className="hover:text-[var(--ink-1)] transition-colors">
          {state.emoji} {state.name}
        </button>
        <ChevronRight size={11} />
        <span className="font-semibold" style={{ color: board.color }}>{board.name}</span>
        <ChevronRight size={11} />
        <span style={{ color: "var(--ink-2)" }}>{exam.shortName}</span>
      </div>

      {/* ── Exam header ── */}
      <div className="p-6 rounded-[18px] relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${boardColor}16 0%, ${boardColor}06 100%)`,
          border: `1px solid ${boardColor}30`,
        }}>
        {/* Board badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] font-black"
            style={{ background: board.colorSoft, color: boardColor }}>
            {board.name.slice(0, 2)}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: boardColor }}>
            {board.fullName}
          </span>
          {exam.popular && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto"
              style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
              <Flame size={10} /> Popular
            </span>
          )}
        </div>

        <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight mb-4"
          style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
          {exam.name}
        </h1>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { icon: <GraduationCap size={12} />, text: exam.eligibility },
            { icon: <Clock size={12} />,         text: exam.pattern },
            exam.nextDate && { icon: <Calendar size={12} />, text: `Next: ${exam.nextDate}` },
            exam.applicants && { icon: <Users size={12} />, text: `${exam.applicants} applicants` },
          ].filter(Boolean).map((item: any, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
              style={{ background: "var(--card)", color: "var(--ink-2)", border: "1px solid var(--line-soft)" }}>
              {item.icon} {item.text}
            </span>
          ))}
        </div>

        {/* Content count pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatPill icon={<FlaskConical size={16} />} value={exam.testCount} label="Tests"    color="#3B82F6" />
          <StatPill icon={<FileText size={16} />}     value={exam.pyqCount}   label="PYQ"      color="#8B5CF6" />
          <StatPill icon={<BookOpen size={16} />}     value={exam.notesCount} label="Notes"    color="#10B981" />
          <StatPill icon={<BookMarked size={16} />}   value={exam.courseCount} label="Courses" color="#F59E0B" />
        </div>
      </div>

      {/* ── Two-column layout (content + sidebar) ── */}
      <div className="flex gap-6 items-start">

        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Quick actions */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
              Quick Start
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickAction
                icon={<FlaskConical size={18} />}
                title="Start Mock Test"
                subtitle={`${exam.testCount} tests available`}
                href={`/dashboard/series?exam=${exam.id}`}
                color="#3B82F6"
              />
              <QuickAction
                icon={<FileText size={18} />}
                title="Practice PYQ Papers"
                subtitle={`${exam.pyqCount} papers`}
                href={`/dashboard/pyq?exam=${exam.id}`}
                color="#8B5CF6"
              />
              <QuickAction
                icon={<BookOpen size={18} />}
                title="Study Notes"
                subtitle={`${exam.notesCount} articles`}
                href={`/library?exam=${exam.id}`}
                color="#10B981"
              />
              {exam.courseCount > 0 ? (
                <QuickAction
                  icon={<BarChart3 size={18} />}
                  title="Full Course"
                  subtitle={`${exam.courseCount} course${exam.courseCount !== 1 ? "s" : ""}`}
                  href={`/dashboard/courses?exam=${exam.id}`}
                  color="#F59E0B"
                  locked={!isPaid}
                />
              ) : (
                <div className="flex items-center gap-3.5 p-4 rounded-[14px] opacity-50"
                  style={{ background: "var(--bg)", border: "1px dashed var(--line)" }}>
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: "var(--bg)", color: "var(--ink-4)" }}>
                    <BookMarked size={18} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: "var(--ink-3)" }}>Course</p>
                    <p className="text-[11px]" style={{ color: "var(--ink-5, var(--ink-4))" }}>Coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Syllabus / subjects */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
              Exam Syllabus Overview
            </h2>
            <SyllabusCard subjects={exam.subjects} />
            <div className="mt-3 flex flex-wrap gap-3 text-[12.5px]" style={{ color: "var(--ink-3)" }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={13} style={{ color: "var(--green)" }} />
                Eligibility: <span className="font-semibold" style={{ color: "var(--ink-1)" }}>{exam.eligibility}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={13} style={{ color: "var(--green)" }} />
                Pattern: <span className="font-semibold" style={{ color: "var(--ink-1)" }}>{exam.pattern}</span>
              </span>
              {exam.nextDate && (
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={13} style={{ color: "var(--green)" }} />
                  Next exam: <span className="font-semibold" style={{ color: "var(--ink-1)" }}>{exam.nextDate}</span>
                </span>
              )}
            </div>
          </section>

          {/* Pro upgrade CTA (free users only) */}
          {!isPaid && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-[14px]"
              style={{
                background: "linear-gradient(135deg, var(--blue-soft), rgba(139,92,246,0.08))",
                border: "1px solid rgba(59,130,246,0.2)",
              }}>
              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: "var(--blue)", color: "#fff" }}>
                <Sparkles size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold" style={{ color: "var(--ink-1)" }}>
                  Unlock full prep for {exam.shortName}
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-3)" }}>
                  Get all {exam.testCount} mock tests, {exam.pyqCount} PYQ papers, and {exam.notesCount} study notes.
                </p>
              </div>
              <Link href="/dashboard/plans"
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-bold text-white hover:brightness-110 transition-all"
                style={{ background: "linear-gradient(135deg, var(--blue), var(--cyan))" }}>
                <Sparkles size={13} /> Upgrade to Pro
              </Link>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <aside className="hidden lg:flex flex-col gap-5 w-64 shrink-0">
          <RelatedExams currentExam={exam} />

          {/* Navigation links */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>
              Explore
            </h3>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Mock Tests", icon: <FlaskConical size={13} />, href: `/dashboard/series?exam=${exam.id}`, color: "#3B82F6" },
                { label: "PYQ Papers", icon: <FileText size={13} />,    href: `/dashboard/pyq?exam=${exam.id}`,    color: "#8B5CF6" },
                { label: "Study Notes", icon: <BookOpen size={13} />,   href: `/library?exam=${exam.id}`, color: "#10B981" },
                { label: "Analytics",  icon: <BarChart3 size={13} />,   href: `/dashboard/analytics`,              color: "var(--ink-3)" },
              ].map(({ label, icon, href, color }) => (
                <Link key={label} href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[12.5px] font-medium group transition-all hover:bg-[var(--bg)]"
                  style={{ color: "var(--ink-2)" }}>
                  <span style={{ color }}>{icon}</span>
                  {label}
                  <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100" style={{ color }} />
                </Link>
              ))}
            </div>
          </div>

          {/* State pill */}
          <Link href="/exams"
            className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[12px] font-medium hover:bg-[var(--bg)] transition-colors"
            style={{ background: "var(--card)", border: "1px solid var(--line-soft)", color: "var(--ink-3)" }}>
            <ArrowLeft size={12} />
            Back to {state.emoji} {state.name} exams
          </Link>
        </aside>
      </div>

      <div className="h-10" />
    </div>
  );
}
