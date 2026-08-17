"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowRight, ChevronRight, GraduationCap, Calendar, Users, FlaskConical,
  FileText, BookOpen, BarChart3, ChevronDown, Search, AlertCircle,
  PlayCircle, CheckCircle2, Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiGetExamById, apiGetExams, apiGetTestSeries, apiGetPYQPapers, apiGetBlogs, type PublicBlogPost } from "@/lib/api";
import { Newspaper } from "lucide-react";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: "smooth" });
}

/* ── Shared primitives ── */

function SectionHeading({ title, icon: Icon, color }: { title: string; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <h2 className="text-[22px] font-bold" style={{ color: "var(--ink-1)" }}>{title}</h2>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="border rounded-2xl p-4 flex flex-col items-center text-center" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={18} />
      </div>
      <span className="text-xl font-extrabold leading-none mb-1" style={{ color: "var(--ink-1)" }}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>{label}</span>
    </div>
  );
}

/* ── NAV TABS ── */

const NAV_TABS = [
  { id: "overview",  label: "Overview" },
  { id: "dates",     label: "Important Dates" },
  { id: "pattern",   label: "Exam Pattern" },
  { id: "syllabus",  label: "Syllabus" },
  { id: "materials", label: "Practice Materials" },
  { id: "news",      label: "Latest News" },
  { id: "faqs",      label: "FAQs" },
];

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */

/* ── Static fallback exam data (shown when API is offline) ── */
const SLUG_FALLBACK_MAP: Record<string, any> = {
  "jpsc-combined": {
    id: "jpsc-combined", name: "JPSC Combined Civil Services", shortName: "JPSC", slug: "jpsc-combined",
    description: "The Jharkhand Public Service Commission (JPSC) Combined Civil Services Examination is the premier state-level exam for recruitment to Group A & B posts in the Jharkhand government. It is held in two stages: Preliminary (objective) and Mains (descriptive), followed by a Personality Test (Interview).",
    eligibility: "Bachelor's degree in any discipline from a recognized university. Age: 21–35 years (relaxation for reserved categories as per Jharkhand government norms).",
    pattern: "Prelims: 2 objective papers (GS Paper I + GS Paper II/CSAT), 200 marks each. Mains: 6 papers including General Hindi, General English, and subject-specific papers. Interview: 100 marks.",
    subjects: "Jharkhand GK,Indian History,Indian Geography,Indian Polity,Indian Economy,General Science,Current Affairs,Aptitude & Reasoning",
    languages: "Hindi,English",
    stages: "Preliminary Exam ➔ Mains Exam ➔ Personality Test (Interview)",
    _count: { testSeries: 48, pyqPapers: 12 },
    board: { id: 1, name: "JPSC", tint: "#0D287E", state: { id: 1, name: "Jharkhand" } },
  },
  "jssc-cgl": {
    id: "jssc-cgl", name: "JSSC CGL", shortName: "JSSC CGL", slug: "jssc-cgl",
    description: "The Jharkhand Staff Selection Commission Combined Graduate Level examination recruits for Group C posts including Clerks, Stenographers, Accountants, and other allied positions in state government departments.",
    eligibility: "Bachelor's degree in any stream. Age: 21–35 years with category-based relaxations applicable.",
    pattern: "Single-stage CBT: 3 papers — General Knowledge (120 Q), Regional Language (40 Q), General Maths/Reasoning (40 Q). Total 200 questions, 600 marks.",
    subjects: "Jharkhand GK,Indian GK,Regional Language,Mathematics,Reasoning,Computer Knowledge",
    languages: "Hindi,English",
    stages: "CBT Written Exam ➔ Document Verification ➔ Medical Test",
    _count: { testSeries: 36, pyqPapers: 8 },
    board: { id: 2, name: "JSSC", tint: "#059669", state: { id: 1, name: "Jharkhand" } },
  },
  "sbi-po": {
    id: "sbi-po", name: "SBI PO", shortName: "SBI PO", slug: "sbi-po",
    description: "The State Bank of India Probationary Officer examination is one of the most prestigious banking exams in India. Selected candidates join as Probationary Officers and are confirmed as Assistant Managers after successful completion of probation.",
    eligibility: "Bachelor's degree in any discipline. Age: 21–30 years.",
    pattern: "Phase I (Prelims): 100 Q, 100 marks, 60 min — English (30), Quantitative Aptitude (35), Reasoning (35). Phase II (Mains): 250 marks — Data Analysis (35), Reasoning (45), GK & Economy (40), English (35), Computer (20).",
    subjects: "English Language,Quantitative Aptitude,Reasoning Ability,Data Analysis & Interpretation,General/Economy/Banking Awareness,Computer Aptitude",
    languages: "English,Hindi",
    stages: "Phase I Prelims ➔ Phase II Mains ➔ Group Exercise & Interview",
    _count: { testSeries: 62, pyqPapers: 15 },
    board: { id: 3, name: "SBI", tint: "#2563EB", state: null },
  },
  "ibps-po": {
    id: "ibps-po", name: "IBPS PO", shortName: "IBPS PO", slug: "ibps-po",
    description: "The IBPS PO exam conducted by the Institute of Banking Personnel Selection recruits Probationary Officers for 19 participating nationalised banks across India including PNB, Bank of Baroda, Canara Bank, and others.",
    eligibility: "Bachelor's degree. Age: 20–30 years with SC/ST/OBC/PWD relaxations.",
    pattern: "Prelims: 100 Q, 100 marks, 60 min. Mains: 200 marks (Objective) + 25 marks (English letter/essay). Interview: 100 marks. Final merit: Mains 80% + Interview 20%.",
    subjects: "English Language,Quantitative Aptitude,Reasoning Ability,General Awareness,Computer Knowledge",
    languages: "English,Hindi",
    stages: "Prelims ➔ Mains ➔ Interview",
    _count: { testSeries: 55, pyqPapers: 18 },
    board: { id: 4, name: "IBPS", tint: "#7C3AED", state: null },
  },
  "ssc-cgl": {
    id: "ssc-cgl", name: "SSC CGL", shortName: "SSC CGL", slug: "ssc-cgl",
    description: "The Staff Selection Commission Combined Graduate Level exam recruits for Group B and Group C posts in various Ministries, Departments, and Organisations of the Central Government including Income Tax Officer, Auditor, Assistant, and Inspector roles.",
    eligibility: "Bachelor's degree in any stream. Age: 18–32 years depending on post (varies).",
    pattern: "Tier I: 100 Q, 200 marks, 60 min (GK, Reasoning, Maths, English — 25 each). Tier II: Papers I & II covering Quantitative Ability (200 marks) and English & Comprehension (200 marks).",
    subjects: "General Intelligence & Reasoning,General Awareness,Quantitative Aptitude,English Comprehension,Statistics (for specific posts)",
    languages: "English,Hindi",
    stages: "Tier I (CBT) ➔ Tier II (CBT) ➔ Document Verification",
    _count: { testSeries: 78, pyqPapers: 22 },
    board: { id: 5, name: "SSC", tint: "#D97706", state: null },
  },
  "railway-ntpc": {
    id: "railway-ntpc", name: "Railway NTPC", shortName: "RRB NTPC", slug: "railway-ntpc",
    description: "RRB NTPC (Non-Technical Popular Categories) recruitment is conducted by Railway Recruitment Boards for posts like Junior Clerk cum Typist, Accounts Clerk cum Typist, Junior Time Keeper, Trains Clerk, Commercial cum Ticket Clerk, Traffic Assistant, Goods Guard, and more.",
    eligibility: "12th Pass / Bachelor's Degree depending on post. Age: 18–30 years (post-specific).",
    pattern: "CBT 1: 100 Q, 90 min — Mathematics (30), GI & Reasoning (30), GK & Current Affairs (40). CBT 2: 120 Q, 90 min — Mathematics (35), GI & Reasoning (35), GK & Current Affairs (50). Typing Test/Skill Test for specific posts.",
    subjects: "Mathematics,General Intelligence & Reasoning,General Awareness & Current Affairs",
    languages: "English,Hindi",
    stages: "CBT Stage 1 ➔ CBT Stage 2 ➔ Skill Test/Typing Test ➔ Document Verification",
    _count: { testSeries: 44, pyqPapers: 16 },
    board: { id: 6, name: "RRB", tint: "#DC2626", state: null },
  },
  "rbi-grade-b": {
    id: "rbi-grade-b", name: "RBI Grade B Officer", shortName: "RBI Grade B", slug: "rbi-grade-b",
    description: "The Reserve Bank of India Grade B Officer exam is one of India's most prestigious and well-paying banking exams. Grade B Officers join as Assistant Managers in RBI's various departments handling monetary policy, regulation, and financial inclusion.",
    eligibility: "Bachelor's degree with min 60% marks (55% for SC/ST). Age: 21–30 years.",
    pattern: "Phase I: Objective — GS (80 Q), English (30 Q), Quantitative Aptitude (30 Q), Reasoning (60 Q) — 200 marks. Phase II: Paper I ESI (100 marks) + Paper II Finance & Management (100 marks) + Paper III English (100 marks). Phase III: Interview (75 marks).",
    subjects: "English,Quantitative Aptitude,Reasoning,General Awareness,Economic & Social Issues,Finance & Management",
    languages: "English",
    stages: "Phase I ➔ Phase II ➔ Interview",
    _count: { testSeries: 32, pyqPapers: 10 },
    board: { id: 7, name: "RBI", tint: "#0891B2", state: null },
  },
  "daroga-si": {
    id: "daroga-si", name: "JSSC Daroga (Sub-Inspector)", shortName: "Daroga SI", slug: "daroga-si",
    description: "The Jharkhand Daroga (Sub-Inspector) exam is conducted by JSSC for recruitment to the Jharkhand Police force. It is one of the most applied-for state police exams in Jharkhand, attracting lakhs of candidates each cycle.",
    eligibility: "Bachelor's degree. Age: 21–25 years (general), with relaxation for reserved categories.",
    pattern: "Written Exam: Paper I — General Knowledge & Jharkhand GK (100 Q); Paper II — General Hindi/Regional Language (50 Q). Physical Efficiency Test (PET). Medical Examination.",
    subjects: "Jharkhand GK,Indian History & Polity,General Science,Current Affairs,Hindi/Regional Language,Aptitude",
    languages: "Hindi",
    stages: "Written Exam ➔ Physical Efficiency Test ➔ Medical Exam ➔ Document Verification",
    _count: { testSeries: 24, pyqPapers: 5 },
    board: { id: 2, name: "JSSC", tint: "#059669", state: { id: 1, name: "Jharkhand" } },
  },
  "bihar-police-si": {
    id: "bihar-police-si", name: "Bihar Police SI", shortName: "BPSSC SI", slug: "bihar-police-si",
    description: "Bihar Police Sub-Inspector exam conducted by Bihar Police Subordinate Services Commission (BPSSC) for recruitment to Sub-Inspector (Constable Executive) and Sergeant posts in the Bihar Police.",
    eligibility: "Bachelor's degree. Age: 20–37 years for men, 20–40 years for women.",
    pattern: "Prelims: 100 Q, 200 marks, 2 hours — GK, Current Affairs, Hindi, Maths, Reasoning. Mains: 200 marks. PET/PMT. Character Verification.",
    subjects: "General Hindi,General Knowledge,Current Affairs,Mathematics,Reasoning",
    languages: "Hindi",
    stages: "Preliminary Written Test ➔ PET/PMT ➔ Mains Written Test ➔ Character Verification",
    _count: { testSeries: 28, pyqPapers: 6 },
    board: { id: 8, name: "BPSSC", tint: "#B45309", state: { id: 2, name: "Bihar" } },
  },
  "bpsc-70th": {
    id: "bpsc-70th", name: "BPSC 70th Combined Competitive Exam", shortName: "BPSC 70th", slug: "bpsc-70th",
    description: "The Bihar Public Service Commission 70th Combined Competitive Examination recruits candidates for Class I, II, and III civil services posts in the state of Bihar. It is one of the most competitive state PSC exams in India, with candidates typically requiring 1–2 years of dedicated preparation.",
    eligibility: "Bachelor's degree from a recognised university. Age: 20–37 years (general). Relaxation: SC/ST up to 42 years, OBC/EBC/Women up to 40 years.",
    pattern: "Prelims (PT): 150 Q, 150 marks, 2 hours — General Studies (History, Polity, Geography, Economy, Science, Current Affairs). Mains: 8 papers — General Hindi (100 marks qualifying), Essay (300 marks), 2 × General Studies papers (300 marks each), 4 Optional papers (300 marks each). Interview: 120 marks.",
    subjects: "Indian History,Indian Polity,Indian Geography,Indian Economy,General Science,Bihar GK,Current Affairs,Essay Writing,Optional Subjects",
    languages: "Hindi,English",
    stages: "Preliminary Exam (PT) ➔ Mains Exam (8 Papers) ➔ Interview/Personality Test",
    _count: { testSeries: 40, pyqPapers: 14 },
    board: { id: 9, name: "BPSC", tint: "#7C3AED", state: { id: 2, name: "Bihar" } },
  },
};

export default function ExamHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();

  const [exam, setExam] = useState<any>(null);
  const [board, setBoard] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [loadingExam, setLoadingExam] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    setLoadingExam(true);
    setNotFoundError(false);
    setNetworkError(false);
    apiGetExamById(slug)
      .then((data) => {
        setExam(data);
        setBoard(data.board);
        setState(data.board?.state);
      })
      .catch((err: any) => {
        const status = err?.status ?? err?.statusCode;
        if (status === 404) {
          setNotFoundError(true);
        } else {
          // API offline — try static fallback before showing error
          const fallback = SLUG_FALLBACK_MAP[slug];
          if (fallback) {
            setExam(fallback);
            setBoard(fallback.board);
            setState(fallback.board?.state ?? null);
          } else {
            setNetworkError(true);
          }
        }
      })
      .finally(() => setLoadingExam(false));
  }, [slug]);

  const boardColor = board?.tint || "#0D287E";
  const [activeTab, setActiveTab] = useState("overview");

  // Related exams in the same board
  const [relatedExams, setRelatedExams] = useState<any[]>([]);
  useEffect(() => {
    if (!board) return;
    apiGetExams({ board: board.id })
      .then((exams) => {
        setRelatedExams((exams as any[]).filter((e: any) => e.id !== exam?.id).slice(0, 5));
      })
      .catch(() => setRelatedExams([]));
  }, [board?.id, exam?.id]);

  // Live counts — prefer _count from exam response, fall back to separate calls
  const [liveCounts, setLiveCounts] = useState<{ tests: number; pyqs: number }>({ tests: 0, pyqs: 0 });
  useEffect(() => {
    if (!exam) return;
    // Backend now returns _count.testSeries and _count.pyqPapers
    const fromCount = exam._count;
    if (fromCount) {
      setLiveCounts({ tests: fromCount.testSeries ?? 0, pyqs: fromCount.pyqPapers ?? 0 });
      return;
    }
    // Fallback: fetch separately
    let cancelled = false;
    Promise.all([
      apiGetTestSeries({ examId: exam.id, limit: 1 }).catch(() => null) as Promise<any>,
      apiGetPYQPapers({ examId: exam.id, limit: 1 }).catch(() => null) as Promise<any>,
    ]).then(([ts, pyq]) => {
      if (cancelled) return;
      setLiveCounts({ tests: ts?.total ?? 0, pyqs: pyq?.total ?? 0 });
    });
    return () => { cancelled = true; };
  }, [exam]);

  // Latest exam news
  const [news, setNews] = useState<PublicBlogPost[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  useEffect(() => {
    if (!exam) return;
    let cancelled = false;
    apiGetBlogs({ limit: 8 })
      .then(res => {
        if (cancelled) return;
        const all = res.items ?? [];
        const examKeys = [exam.shortName?.toLowerCase(), exam.name.toLowerCase()].filter(Boolean) as string[];
        const matched = all.filter(p => {
          const blob = `${p.title} ${p.tags} ${p.category}`.toLowerCase();
          return examKeys.some(k => blob.includes(k));
        });
        setNews((matched.length > 0 ? matched : all).slice(0, 4));
      })
      .catch(() => setNews([]))
      .finally(() => { if (!cancelled) setNewsLoading(false); });
    return () => { cancelled = true; };
  }, [exam]);

  // Scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const ids = NAV_TABS.map(t => t.id);
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && el.getBoundingClientRect().top <= 160) { setActiveTab(ids[i]); break; }
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Split-mappers for database-string fields
  const subjectsList = useMemo(() => {
    if (!exam) return [];
    if (Array.isArray(exam.subjects)) return exam.subjects;
    if (typeof exam.subjects === "string") return exam.subjects.split(",").map((s: string) => s.trim()).filter(Boolean);
    return [];
  }, [exam]);

  const languagesList = useMemo(() => {
    if (!exam) return [];
    if (Array.isArray(exam.languages)) return exam.languages;
    if (typeof exam.languages === "string") return exam.languages.split(",").map((s: string) => s.trim()).filter(Boolean);
    return ["English", "Hindi"];
  }, [exam]);

  const stagesList = useMemo(() => {
    if (!exam) return [];
    if (Array.isArray(exam.stages)) return exam.stages;
    if (typeof exam.stages === "string") return exam.stages.split("➔").map((s: string) => s.trim()).filter(Boolean);
    return ["Written Exam", "Interview"];
  }, [exam]);

  const faqsList = useMemo(() => {
    if (!exam) return [];
    if (Array.isArray(exam.faqs)) return exam.faqs;
    return [
      { q: `What is the eligibility for ${exam.shortName || exam.name}?`, a: exam.eligibility || "Please refer to the official notification for detailed eligibility criteria." },
      { q: `What is the exam pattern?`, a: exam.pattern || "The selection process typically includes written tests and/or interviews. Please refer to the official notification." },
      { q: `How can I prepare for ${exam.shortName || exam.name}?`, a: "You can practice using our comprehensive test series and previous year question papers." }
    ];
  }, [exam]);

  if (loadingExam) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--line)] border-t-[var(--ink-1)] mx-auto" />
          <p className="text-[var(--ink-2)] mt-4 text-sm font-semibold">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (notFoundError) return notFound();

  if (networkError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center py-16 max-w-sm mx-auto px-4">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--ink-1)" }}>Could not load exam</h2>
          <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>There was a problem connecting to the server. Please check your connection and try again.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: "#0D287E" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const liveTestCount = liveCounts.tests;
  const livePyqCount  = liveCounts.pyqs;

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg)" }}>

      {/* ── HERO ── */}
      <section className="border-b pt-10 pb-16 relative overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full blur-[120px] opacity-8 pointer-events-none transform translate-x-1/3 -translate-y-1/4" style={{ backgroundColor: boardColor }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide" style={{ color: "var(--ink-3)" }}>
            <Link href="/exams" className="hover:underline flex items-center gap-1" style={{ color: "var(--ink-3)" }}>
              <ArrowLeft size={14} /> Exams
            </Link>
            <ChevronRight size={14} />
            <span className="flex items-center gap-1.5"><span className="opacity-75">{state?.emoji || "🌿"}</span> {state?.name || "State"}</span>
            <ChevronRight size={14} />
            <span className="font-medium" style={{ color: boardColor }}>{board.name}</span>
            <ChevronRight size={14} />
            <span className="font-semibold" style={{ color: "var(--ink-1)" }}>{exam.shortName}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1">
              {/* Board badge */}
              <div
                className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border mb-5"
                style={{ backgroundColor: `${boardColor}10`, borderColor: `${boardColor}25`, color: boardColor }}
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: boardColor }}>
                  {board.name.slice(0, 2)}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">{board.fullName || board.name}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5" style={{ color: "var(--ink-1)" }}>
                {exam.name}
              </h1>
              <p className="text-lg mb-8 leading-relaxed max-w-3xl" style={{ color: "var(--ink-2)" }}>
                {exam.description || `Prepare for ${exam.name} with our comprehensive test series, previous year papers, and detailed study notes designed by experts.`}
              </p>

              <div className="flex flex-wrap gap-4 items-center">
                <Link
                  href={`/dashboard/series?exam=${exam.id}`}
                  className="px-8 py-4 rounded-xl text-white font-bold transition-all hover:-translate-y-0.5 flex items-center gap-2"
                  style={{ backgroundColor: boardColor, boxShadow: `0 8px 24px ${boardColor}35` }}
                >
                  <FlaskConical size={18} /> Start Free Test
                </Link>
                <Link
                  href={`/dashboard/pyq?exam=${exam.id}`}
                  className="px-8 py-4 rounded-xl font-bold border-2 transition-all flex items-center gap-2"
                  style={{ background: "var(--bg)", borderColor: `${boardColor}30`, color: "var(--ink-1)" }}
                >
                  <FileText size={18} /> View PYQs
                </Link>
              </div>
            </div>

            {/* Stat grid */}
            <div className="w-full lg:w-[360px] shrink-0 grid grid-cols-2 gap-3">
              <StatCard label="Test Series"  value={liveTestCount || "—"}  icon={FlaskConical} color="#0D287E" />
              <StatCard label="PYQ Papers"   value={livePyqCount  || "—"}  icon={FileText}     color="#7C3AED" />
              <StatCard label="Study Notes"  value={exam.notesCount ?? 15} icon={BookOpen}     color="#059669" />
              <StatCard label="Difficulty"   value={exam.difficulty || "Moderate"} icon={BarChart3} color="#D97706" />
            </div>
          </div>
        </div>
      </section>

      {/* ── MOBILE NAV TABS ── */}
      <div className="lg:hidden sticky top-16 z-40 border-b backdrop-blur-xl" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto scrollbar-hide py-3 gap-2 items-center">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); scrollToSection(tab.id); }}
                className="whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={
                  activeTab === tab.id
                    ? { background: "#0D287E", color: "#fff" }
                    : { color: "var(--ink-3)", background: "transparent" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-[100px]">
          <div className="border rounded-3xl p-4 space-y-1" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
            {NAV_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); scrollToSection(tab.id); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all"
                style={
                  activeTab === tab.id
                    ? { background: "#0D287E", color: "#fff" }
                    : { color: "var(--ink-3)", background: "transparent" }
                }
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
            <div className="border rounded-3xl p-6 md:p-8" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {[
                  { label: "Conducting Body",    value: exam.conductingBody || board.fullName || board.name },
                  { label: "Exam Frequency",     value: exam.frequency || "Annual" },
                  { label: "Mode of Exam",        value: exam.mode || "Online/Offline" },
                  { label: "Exam Languages",      value: languagesList.join(", ") },
                  { label: "Eligibility Criteria", value: exam.eligibility },
                  { label: "Selection Stages",    value: stagesList.join(" ➔ ") },
                  { label: "Applicants (Approx)", value: exam.applicants || "Varies" },
                  { label: "Vacancy Trend",       value: exam.vacancyTrend || "Not available" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col border-b pb-4 last:border-0 last:pb-0 md:[&:nth-last-child(-n+2)]:border-0 md:[&:nth-last-child(-n+2)]:pb-0" style={{ borderColor: "var(--line-soft)" }}>
                    <span className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ink-4)" }}>{item.label}</span>
                    <span className="text-base font-bold" style={{ color: "var(--ink-1)" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── IMPORTANT DATES ── */}
          <section id="dates" className="scroll-mt-32">
            <SectionHeading title="Important Dates" icon={Calendar} color={boardColor} />
            <div className="border rounded-3xl p-6 md:p-8 relative overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
              <div className="absolute top-0 left-8 bottom-0 w-px hidden md:block" style={{ background: "var(--line-soft)" }} />
              <div className="space-y-8 relative">
                {(exam.importantDates || [{ label: "Upcoming Registration", date: exam.upcomingDate || "TBA", status: "upcoming" }]).map((dateObj: any, i: number) => (
                  <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-8 relative">
                    <div
                      className="hidden md:flex absolute -left-[5px] top-1.5 w-3 h-3 rounded-full border-2"
                      style={{
                        background: "var(--card)",
                        borderColor: dateObj.status === "completed" ? "#059669" : dateObj.status === "ongoing" ? "#D97706" : "#0D287E",
                      }}
                    />
                    <div className="md:w-32 shrink-0">
                      <span
                        className="inline-block px-3 py-1 rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: dateObj.status === "completed" ? "rgba(5,150,105,0.12)" : dateObj.status === "ongoing" ? "rgba(217,119,6,0.12)" : "rgba(13,40,126,0.10)",
                          color: dateObj.status === "completed" ? "#059669" : dateObj.status === "ongoing" ? "#D97706" : "#0D287E",
                        }}
                      >
                        {(dateObj.status || "upcoming").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 rounded-2xl p-5 border" style={{ background: "var(--bg)", borderColor: "var(--line-soft)" }}>
                      <h4 className="text-lg font-bold mb-1" style={{ color: "var(--ink-1)" }}>{dateObj.label}</h4>
                      <p className="font-medium flex items-center gap-2" style={{ color: "var(--ink-3)" }}>
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
              <div className="rounded-3xl p-8 text-white shadow-xl relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0D287E 0%, #1D4ED8 100%)" }}>
                <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                  <BarChart3 size={200} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-green-300" /> Structure overview
                  </h3>
                  <p className="text-white/80 leading-relaxed text-lg">{exam.pattern}</p>
                  {exam.selectionRatio && (
                    <div className="mt-6 inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl">
                      <Users size={16} className="text-blue-200" />
                      <span className="font-semibold">Selection Ratio: {exam.selectionRatio}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div id="syllabus" className="scroll-mt-32">
              <SectionHeading title="Key Subjects" icon={BookOpen} color={boardColor} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjectsList.map((sub: string, i: number) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border flex items-center gap-4 cursor-default group transition-colors"
                    style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors" style={{ background: "var(--bg)", color: "var(--ink-4)" }}>
                      <BookOpen size={20} />
                    </div>
                    <span className="font-bold text-lg" style={{ color: "var(--ink-1)" }}>{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PRACTICE MATERIALS ── */}
          <section id="materials" className="scroll-mt-32">
            <SectionHeading title="Practice & Preparation" icon={PlayCircle} color={boardColor} />
            <div className="flex flex-col gap-3">
              {[
                {
                  icon: FlaskConical,
                  title: "Test Series",
                  desc: `Full-length tests and sectionals based on the latest ${exam.shortName} pattern.`,
                  count: `${liveTestCount} Tests`,
                  accentColor: "#0D287E",
                  iconBg: "rgba(13,40,126,0.10)",
                  href: `/dashboard/series?exam=${exam.id}`,
                },
                {
                  icon: FileText,
                  title: "Previous Papers",
                  desc: "Official question papers from past years with detailed solutions.",
                  count: `${livePyqCount} Papers`,
                  accentColor: "#7C3AED",
                  iconBg: "rgba(124,58,237,0.10)",
                  href: `/dashboard/pyq?exam=${exam.id}`,
                },
                {
                  icon: BookOpen,
                  title: "Study Notes",
                  desc: "Concise revision notes, formula sheets, and subject-wise guides.",
                  count: `${exam.notesCount ?? 15} PDF notes`,
                  accentColor: "#059669",
                  iconBg: "rgba(5,150,105,0.10)",
                  href: `/blog?exam=${exam.id}`,
                },
              ].map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="flex items-center gap-5 border rounded-2xl p-5 transition-all group hover:-translate-y-0.5"
                  style={{ background: "var(--card)", borderColor: "var(--line-soft)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                >
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: card.iconBg }}
                  >
                    <card.icon size={26} style={{ color: card.accentColor }} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[17px] font-bold mb-1" style={{ color: "var(--ink-1)" }}>{card.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--ink-3)" }}>{card.desc}</p>
                  </div>

                  {/* Count + arrow */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <span className="text-sm font-extrabold hidden sm:block" style={{ color: card.accentColor }}>
                      {card.count}
                    </span>
                    <div
                      className="w-9 h-9 rounded-full text-white flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: card.accentColor, boxShadow: `0 4px 12px ${card.accentColor}40` }}
                    >
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── LATEST NEWS ── */}
          <section id="news" className="scroll-mt-32">
            <SectionHeading title="Latest News & Updates" icon={Newspaper} color={boardColor} />
            {newsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: "var(--card)" }} />
                ))}
              </div>
            ) : news.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed p-8 text-center" style={{ borderColor: "var(--line-soft)" }}>
                <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: "var(--ink-4)" }} />
                <p className="text-sm" style={{ color: "var(--ink-4)" }}>
                  No recent updates for {exam.shortName} yet. Check back soon.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {news.map(post => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group block border rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                      style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                          style={{ background: `${boardColor}15`, color: boardColor }}
                        >
                          {post.category || "News"}
                        </span>
                        {post.publishedAt && (
                          <span className="text-[11px]" style={{ color: "var(--ink-4)" }}>
                            {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[15px] line-clamp-2 mb-1.5 transition-colors" style={{ color: "var(--ink-1)" }}>
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-[13px] line-clamp-2" style={{ color: "var(--ink-3)" }}>{post.excerpt}</p>
                      )}
                      <div className="mt-3 flex items-center text-[12px] font-bold" style={{ color: boardColor }}>
                        Read more <ArrowRight size={14} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-5 text-center">
                  <Link
                    href={`/blog?q=${encodeURIComponent(exam.shortName || exam.name)}`}
                    className="inline-flex items-center gap-1 text-sm font-bold hover:underline"
                    style={{ color: boardColor }}
                  >
                    View all {exam.shortName} updates <ChevronRight size={16} />
                  </Link>
                </div>
              </>
            )}
          </section>

          {/* ── FAQS ── */}
          {(faqsList && faqsList.length > 0) && (
            <section id="faqs" className="scroll-mt-32">
              <SectionHeading title="Frequently Asked Questions" icon={AlertCircle} color={boardColor} />
              <div className="space-y-4">
                {faqsList.map((faq: any, i: number) => (
                  <details
                    key={i}
                    className="group border rounded-2xl [&_summary::-webkit-details-marker]:hidden"
                    style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
                  >
                    <summary className="flex items-center justify-between cursor-pointer p-6 font-bold" style={{ color: "var(--ink-1)" }}>
                      {faq.q}
                      <span className="transition group-open:rotate-180 shrink-0 ml-4" style={{ color: "var(--ink-4)" }}>
                        <ChevronDown size={20} />
                      </span>
                    </summary>
                    <div className="px-6 pb-6 leading-relaxed" style={{ color: "var(--ink-2)" }}>
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="w-full lg:w-72 shrink-0 space-y-6 lg:sticky lg:top-[140px]">

          {/* Quick Actions */}
          <div className="border rounded-3xl p-5" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: "var(--ink-4)" }}>Quick Actions</h3>
            <div className="space-y-1">
              {[
                { href: `/dashboard/series?exam=${exam.id}`, icon: FlaskConical, label: "Start Test Series",  color: "#0D287E" },
                { href: `/dashboard/pyq?exam=${exam.id}`,    icon: FileText,     label: "Solve PYQs",         color: "#7C3AED" },
                { href: `/blog?exam=${exam.id}`,              icon: BookOpen,     label: "Study Notes",        color: "#059669" },
                ...(exam.syllabusUrl ? [{ href: exam.syllabusUrl, icon: LinkIcon, label: "Official Syllabus", color: "#D97706", external: true }] : []),
              ].map((link: any) => (
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl transition-colors group"
                    style={{ color: "var(--ink-2)" }}
                  >
                    <span className="font-bold flex items-center gap-3" style={{ color: "var(--ink-2)" }}>
                      <link.icon size={16} style={{ color: link.color }} /> {link.label}
                    </span>
                    <ChevronRight size={16} style={{ color: "var(--ink-4)" }} />
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between p-3 rounded-xl transition-colors group"
                  >
                    <span className="font-bold flex items-center gap-3" style={{ color: "var(--ink-2)" }}>
                      <link.icon size={16} style={{ color: link.color }} /> {link.label}
                    </span>
                    <ChevronRight size={16} style={{ color: "var(--ink-4)" }} />
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Related Exams */}
          {relatedExams.length > 0 && (
            <div className="border rounded-3xl p-5" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
              <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: "var(--ink-4)" }}>More from {board.name}</h3>
              <div className="space-y-4">
                {relatedExams.map(relExam => (
                  <Link key={relExam.id} href={`/exams/${relExam.id}`} className="flex items-start gap-4 group">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 transition-colors"
                      style={{ background: "var(--bg)", borderColor: "var(--line-soft)", color: "var(--ink-4)" }}
                    >
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight mb-1 transition-colors" style={{ color: "var(--ink-1)" }}>
                        {relExam.name}
                      </h4>
                      <p className="text-xs" style={{ color: "var(--ink-4)" }}>
                        {[relExam.hasTests && "Tests available", relExam.hasPYQ && "PYQs available"].filter(Boolean).join(" · ") || "Coming soon"}
                      </p>
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
