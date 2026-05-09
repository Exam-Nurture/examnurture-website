"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronRight, GraduationCap, Clock, Calendar, Users, FlaskConical,
  FileText, BookOpen, BarChart3, ChevronDown, Award, Search, Sparkles, AlertCircle,
  PlayCircle, CheckCircle2, Star, Link as LinkIcon
} from "lucide-react";
import { findExam, getBoardForExam, getStateForExam, getAllExams, CatalogueExam, ExamDate, ExamFAQ } from "@/lib/data/examCatalogue";
import { useAuth } from "@/lib/auth-context";

// Helper for generic scrolling
function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (element) {
    // Add offset for sticky header + tabs
    const y = element.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

/* ═══════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════ */

function SectionHeading({ title, icon: Icon, color }: { title: string; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={20} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  if (!value) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={18} />
      </div>
      <span className="text-xl font-extrabold text-gray-900 dark:text-white leading-none mb-1">{value}</span>
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function PremiumBanner({ exam, isPaid }: { exam: CatalogueExam, isPaid: boolean }) {
  if (isPaid) return null;
  return (
    <div className="mt-10 p-6 rounded-3xl relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Sparkles size={120} />
      </div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-4 border border-white/20">
            <Star size={12} className="fill-current" /> Premium Access
          </span>
          <h3 className="text-2xl font-bold text-white mb-2">Unlock {exam.shortName} Pro</h3>
          <p className="text-blue-100 max-w-lg">
            Get unlimited access to all {exam.testCount} mock tests, {exam.pyqCount} previous year papers, AI analytics, and personalized guidance.
          </p>
        </div>
        <Link href="/dashboard/plans" className="shrink-0 w-full md:w-auto px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
          View Plans <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */

export default function ExamHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const isPaid = !!(user as any)?.subscription;

  const exam = findExam(slug);
  if (!exam) return notFound();

  const board = getBoardForExam(exam);
  const state = getStateForExam(exam);
  if (!board || !state) return notFound();

  const boardColor = board.color || "#3B82F6";
  const [activeTab, setActiveTab] = useState("overview");

  // Filter out other exams from the same board
  const relatedExams = getAllExams().filter(e => e.boardId === board.id && e.id !== exam.id);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "dates", "pattern", "syllabus", "materials", "faqs"];
      for (let i = sections.length - 1; i >= 0; i--) {
        const id = sections[i];
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Adjust offset as needed (160px from the top is usually safe for sticky headers)
          if (rect.top <= 160) {
            setActiveTab(id);
            break;
          }
        }
      }
    };

    // Run once on mount to set initial tab, and then add listener
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      
      {/* ── HERO SECTION ── */}
      <section className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 pt-10 pb-16 relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 w-[800px] h-[600px] rounded-full blur-[120px] opacity-10 pointer-events-none transform translate-x-1/3 -translate-y-1/4" style={{ backgroundColor: boardColor }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
            <Link href="/exams" className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft size={14} /> Exams
            </Link>
            <ChevronRight size={14} />
            <span className="flex items-center gap-1.5"><span className="opacity-75">{state.emoji}</span> {state.name}</span>
            <ChevronRight size={14} />
            <span className="font-medium" style={{ color: boardColor }}>{board.name}</span>
            <ChevronRight size={14} />
            <span className="text-gray-900 dark:text-white font-semibold">{exam.shortName}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1">
              {/* Board Badge */}
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border mb-5" style={{ backgroundColor: `${boardColor}10`, borderColor: `${boardColor}20`, color: boardColor }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: boardColor }}>
                  {board.name.slice(0, 2)}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">{board.fullName}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-5">
                {exam.name}
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl">
                {exam.description || `Prepare for ${exam.name} with our comprehensive test series, previous year papers, and detailed study notes designed by experts.`}
              </p>

              <div className="flex flex-wrap gap-4 items-center">
                <Link href={`/dashboard/series?exam=${exam.id}`} className="px-8 py-4 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2" style={{ backgroundColor: boardColor, "--tw-shadow-color": `${boardColor}40` } as React.CSSProperties}>
                  <FlaskConical size={18} /> Start Free Mock Test
                </Link>
                <Link href={`/dashboard/pyq?exam=${exam.id}`} className="px-8 py-4 rounded-xl font-bold bg-white dark:bg-gray-900 border-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2" style={{ borderColor: `${boardColor}30` }}>
                  <FileText size={18} /> View PYQs
                </Link>
              </div>
            </div>

            {/* Right side stat grid */}
            <div className="w-full lg:w-[400px] shrink-0 grid grid-cols-2 gap-3">
               <StatCard label="Mock Tests" value={exam.testCount} icon={FlaskConical} color="#3B82F6" />
               <StatCard label="PYQ Papers" value={exam.pyqCount} icon={FileText} color="#8B5CF6" />
               <StatCard label="Study Notes" value={exam.notesCount} icon={BookOpen} color="#10B981" />
               <StatCard label="Difficulty" value={exam.difficulty || "Moderate"} icon={BarChart3} color="#F59E0B" />
            </div>
          </div>
        </div>
      </section>

      {/* ── MOBILE STICKY NAV TABS ── */}
      <div className="lg:hidden sticky top-16 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto scrollbar-hide py-3 gap-2 sm:gap-6 items-center">
            {[
              { id: "overview", label: "Overview" },
              { id: "dates", label: "Important Dates" },
              { id: "pattern", label: "Exam Pattern" },
              { id: "syllabus", label: "Syllabus" },
              { id: "materials", label: "Practice Materials" },
              { id: "faqs", label: "FAQs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  scrollToSection(tab.id);
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md" 
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        
        {/* ── LEFT NAV SIDEBAR ── */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-[100px]">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 shadow-sm space-y-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "dates", label: "Important Dates" },
              { id: "pattern", label: "Exam Pattern" },
              { id: "syllabus", label: "Syllabus" },
              { id: "materials", label: "Practice Materials" },
              { id: "faqs", label: "FAQs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  scrollToSection(tab.id);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md" 
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0 space-y-20">

          {/* ── OVERVIEW ── */}
          <section id="overview" className="scroll-mt-32">
            <SectionHeading title="Exam Overview" icon={Search} color={boardColor} />
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {[
                  { label: "Conducting Body", value: exam.conductingBody || board.fullName },
                  { label: "Exam Frequency", value: exam.frequency || "Annual" },
                  { label: "Mode of Exam", value: exam.mode || "Online/Offline" },
                  { label: "Exam Languages", value: exam.languages?.join(", ") || "English, Hindi" },
                  { label: "Eligibility Criteria", value: exam.eligibility },
                  { label: "Selection Stages", value: exam.stages?.join(" ➔ ") || "Written ➔ Interview" },
                  { label: "Applicants (Approx)", value: exam.applicants || "Varies" },
                  { label: "Vacancy Trend", value: exam.vacancyTrend || "Not available" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0 md:[&:nth-last-child(-n+2)]:border-0 md:[&:nth-last-child(-n+2)]:pb-0">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{item.label}</span>
                    <span className="text-base font-bold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── IMPORTANT DATES ── */}
          <section id="dates" className="scroll-mt-32">
            <SectionHeading title="Important Dates" icon={Calendar} color={boardColor} />
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-8 bottom-0 w-px bg-gray-100 dark:bg-gray-800 hidden md:block"></div>
              
              <div className="space-y-8 relative">
                {(exam.importantDates || [
                  { label: "Next Expected Date", date: exam.nextDate || "TBA", status: "upcoming" }
                ]).map((dateObj, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-8 relative">
                    {/* Timeline dot */}
                    <div className="hidden md:flex absolute -left-[5px] top-1.5 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-2 shadow-sm"
                         style={{ borderColor: dateObj.status === "completed" ? "#10B981" : dateObj.status === "ongoing" ? "#F59E0B" : "#3B82F6" }}>
                    </div>
                    
                    <div className="md:w-32 shrink-0">
                      <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold"
                            style={{ 
                              backgroundColor: dateObj.status === "completed" ? "rgba(16, 185, 129, 0.1)" : dateObj.status === "ongoing" ? "rgba(245, 158, 11, 0.1)" : "rgba(59, 130, 246, 0.1)",
                              color: dateObj.status === "completed" ? "#10B981" : dateObj.status === "ongoing" ? "#F59E0B" : "#3B82F6"
                            }}>
                        {dateObj.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{dateObj.label}</h4>
                      <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                        <Calendar size={14} /> {dateObj.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── EXAM PATTERN & SYLLABUS ── */}
          <section id="pattern" className="scroll-mt-32 space-y-12">
            <div>
              <SectionHeading title="Exam Pattern" icon={BarChart3} color={boardColor} />
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <BarChart3 size={200} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="text-green-400" /> Structure overview</h3>
                    <p className="text-gray-300 leading-relaxed text-lg">{exam.pattern}</p>
                    {exam.selectionRatio && (
                      <div className="mt-6 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                        <Users size={16} className="text-blue-400" />
                        <span className="font-semibold">Selection Ratio: {exam.selectionRatio}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div id="syllabus" className="scroll-mt-32">
              <SectionHeading title="Key Subjects" icon={BookOpen} color={boardColor} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exam.subjects.map((sub, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group cursor-default shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                      <BookOpen size={20} />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white text-lg">{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PRACTICE MATERIALS ── */}
          <section id="materials" className="scroll-mt-32">
            <SectionHeading title="Practice & Preparation" icon={PlayCircle} color={boardColor} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Mock Tests Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 flex flex-col hover:shadow-xl dark:hover:shadow-gray-800/50 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                  <FlaskConical size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mock Tests</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 flex-1 text-sm">Full-length tests and sectionals based on the latest {exam.shortName} pattern.</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-blue-600 dark:text-blue-400">{exam.testCount} Tests</span>
                  <Link href={`/dashboard/series?exam=${exam.id}`} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

              {/* PYQ Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 flex flex-col hover:shadow-xl dark:hover:shadow-gray-800/50 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Previous Papers</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 flex-1 text-sm">Official question papers from past years with detailed solutions.</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-purple-600 dark:text-purple-400">{exam.pyqCount} Papers</span>
                  <Link href={`/dashboard/pyq?exam=${exam.id}`} className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors">
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 flex flex-col hover:shadow-xl dark:hover:shadow-gray-800/50 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mb-6">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Study Notes</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 flex-1 text-sm">Concise revision notes, formula sheets, and subject-wise guides.</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-green-600 dark:text-green-400">{exam.notesCount} PDF notes</span>
                  <Link href={`/library?exam=${exam.id}`} className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors">
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

            </div>
          </section>

          {/* ── FAQS ── */}
          {(exam.faqs && exam.faqs.length > 0) && (
            <section id="faqs" className="scroll-mt-32">
              <SectionHeading title="Frequently Asked Questions" icon={AlertCircle} color={boardColor} />
              <div className="space-y-4">
                {exam.faqs.map((faq, i) => (
                  <details key={i} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl [&_summary::-webkit-details-marker]:hidden shadow-sm">
                    <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-gray-900 dark:text-white">
                      {faq.q}
                      <span className="transition group-open:rotate-180 text-gray-400 dark:text-gray-500 shrink-0 ml-4">
                        <ChevronDown size={20} />
                      </span>
                    </summary>
                    <div className="px-6 pb-6 text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* ── PREMIUM CTA ── */}
          <PremiumBanner exam={exam} isPaid={isPaid} />

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="w-full lg:w-80 shrink-0 space-y-8 lg:sticky lg:top-[140px]">
          
          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-5">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/dashboard/series?exam=${exam.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-3">
                  <FlaskConical size={16} className="text-blue-500" /> Start Mock Test
                </span>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </Link>
              <Link href={`/dashboard/pyq?exam=${exam.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-3">
                  <FileText size={16} className="text-purple-500" /> Solve PYQs
                </span>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
              </Link>
              <Link href={`/library?exam=${exam.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 flex items-center gap-3">
                  <BookOpen size={16} className="text-green-500" /> Study Notes
                </span>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-green-600 dark:group-hover:text-green-400" />
              </Link>
              {exam.syllabusUrl && (
                <a href={exam.syllabusUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 flex items-center gap-3">
                    <LinkIcon size={16} className="text-orange-500" /> Official Syllabus
                  </span>
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
                </a>
              )}
            </div>
          </div>

          {/* Related Exams */}
          {relatedExams.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-5">More from {board.name}</h3>
              <div className="space-y-4">
                {relatedExams.map(relExam => (
                  <Link key={relExam.id} href={`/exams/${relExam.id}`} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight mb-1">{relExam.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{relExam.testCount} tests · {relExam.pyqCount} pyqs</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </aside>

      </div>
    </div>
  );
}

// Ensure we have ArrowRight available since it's used in the cards but wasn't imported from lucide-react in the main list above (I'll add it inline here or import it)
function ArrowRight(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
}
