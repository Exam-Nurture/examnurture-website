"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ArrowRight, FileText, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Exam taxonomy ── */
interface Exam {
  name: string;
  href: string;
  tag?: { label: string; color: string };
  desc?: string;
}

interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;       // Tailwind bg class for active pill
  textColor: string;   // Tailwind text class
  exams: Exam[];
}

const categories: Category[] = [
  {
    id: "psc",
    label: "State PSC",
    emoji: "🏛️",
    color: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
    exams: [
      { name: "JPSC Prelims", href: "/exams/jpsc", tag: { label: "Popular", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" }, desc: "Jharkhand Public Service" },
      { name: "JPSC Mains", href: "/exams/jpsc-mains", desc: "Jharkhand Public Service" },
      { name: "BPSC", href: "/exams/bpsc", tag: { label: "Hot", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" }, desc: "Bihar Public Service" },
      { name: "UPPSC", href: "/exams/uppsc", desc: "Uttar Pradesh PSC" },
      { name: "MPSC", href: "/exams/mpsc", desc: "Maharashtra PSC" },
    ],
  },
  {
    id: "banking",
    label: "Banking",
    emoji: "🏦",
    color: "bg-emerald-500/10",
    textColor: "text-emerald-600 dark:text-emerald-400",
    exams: [
      { name: "SBI PO", href: "/exams/sbi-po", tag: { label: "🔥 Hot", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" }, desc: "State Bank of India PO" },
      { name: "IBPS PO", href: "/exams/ibps-po", tag: { label: "Popular", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" }, desc: "Institute of Banking Personnel" },
      { name: "IBPS Clerk", href: "/exams/ibps-clerk", desc: "IBPS Clerical Cadre" },
      { name: "SBI Clerk", href: "/exams/sbi-clerk", desc: "SBI Junior Associates" },
      { name: "RBI Grade B", href: "/exams/rbi-grade-b", tag: { label: "Hard", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" }, desc: "Reserve Bank of India" },
      { name: "NABARD Grade A", href: "/exams/nabard", desc: "National Bank Agriculture" },
    ],
  },
  {
    id: "ssc",
    label: "SSC",
    emoji: "📋",
    color: "bg-purple-500/10",
    textColor: "text-purple-600 dark:text-purple-400",
    exams: [
      { name: "SSC CGL", href: "/exams/ssc-cgl", tag: { label: "⭐ Popular", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" }, desc: "Combined Graduate Level" },
      { name: "SSC CHSL", href: "/exams/ssc-chsl", tag: { label: "Popular", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" }, desc: "Combined Higher Sec. Level" },
      { name: "SSC MTS", href: "/exams/ssc-mts", desc: "Multi Tasking Staff" },
      { name: "SSC GD Constable", href: "/exams/ssc-gd", desc: "General Duty Constable" },
      { name: "SSC CPO", href: "/exams/ssc-cpo", desc: "Central Police Organisation" },
    ],
  },
  {
    id: "railway",
    label: "Railway",
    emoji: "🚆",
    color: "bg-amber-500/10",
    textColor: "text-amber-600 dark:text-amber-400",
    exams: [
      { name: "RRB NTPC", href: "/exams/rrb-ntpc", tag: { label: "🔥 Hot", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" }, desc: "Non-Technical Popular Cat." },
      { name: "RRB Group D", href: "/exams/rrb-group-d", tag: { label: "Popular", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" }, desc: "Railway Group D Posts" },
      { name: "RRB ALP", href: "/exams/rrb-alp", desc: "Assistant Loco Pilot" },
      { name: "RRB JE", href: "/exams/rrb-je", desc: "Junior Engineer" },
    ],
  },
  {
    id: "police",
    label: "Police & Defence",
    emoji: "🛡️",
    color: "bg-rose-500/10",
    textColor: "text-rose-600 dark:text-rose-400",
    exams: [
      { name: "Jharkhand Daroga SI", href: "/exams/daroga", tag: { label: "⭐ Popular", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" }, desc: "Sub Inspector Recruitment" },
      { name: "UP Police Constable", href: "/exams/up-police", tag: { label: "Hot", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" }, desc: "UP Police Recruitment" },
      { name: "CRPF", href: "/exams/crpf", desc: "Central Reserve Police" },
      { name: "CDS", href: "/exams/cds", tag: { label: "Hard", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" }, desc: "Combined Defence Services" },
      { name: "NDA", href: "/exams/nda", desc: "National Defence Academy" },
    ],
  },
  {
    id: "teaching",
    label: "Teaching",
    emoji: "👨‍🏫",
    color: "bg-cyan-500/10",
    textColor: "text-cyan-600 dark:text-cyan-400",
    exams: [
      { name: "CTET", href: "/exams/ctet", tag: { label: "Popular", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" }, desc: "Central Teacher Eligibility" },
      { name: "STET (Jharkhand)", href: "/exams/stet", desc: "State Teacher Eligibility" },
      { name: "KVS PGT/TGT", href: "/exams/kvs", desc: "Kendriya Vidyalaya" },
      { name: "DSSSB", href: "/exams/dsssb", desc: "Delhi Subordinate Services" },
    ],
  },
];

/* Flatten all exams for search */
const allExams = categories.flatMap((cat) =>
  cat.exams.map((exam) => ({ ...exam, category: cat.label, categoryId: cat.id }))
);

interface MegaMenuProps {
  show: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function MegaMenu({ show, onMouseEnter, onMouseLeave }: MegaMenuProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  /* Reset search when menu closes */
  useEffect(() => {
    if (!show) {
      setSearchQuery("");
      setActiveCategory(categories[0].id);
    } else {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [show]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allExams.filter(
      (e) => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.desc?.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeExams = categories.find((c) => c.id === activeCategory)?.exams ?? [];
  const activeCat = categories.find((c) => c.id === activeCategory)!;

  const isExamsActive = pathname === "/exams" || pathname.startsWith("/exams/");

  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Trigger button */}
      <button
        type="button"
        className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
          isExamsActive || show
            ? "text-blue-600 bg-blue-50/80 dark:bg-blue-900/20"
            : "text-[var(--ink-2)] hover:text-blue-600 hover:bg-blue-50/60 dark:hover:bg-blue-900/10"
        }`}
      >
        Exams
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${show ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" as const }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-[200]"
            style={{ width: "800px" }}
          >
            {/* Arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--card)] rotate-45 border-l border-t border-[var(--line-soft)] shadow-sm rounded-sm" />

            <div className="bg-[var(--card)] rounded-2xl shadow-2xl border border-[var(--line-soft)] overflow-hidden">

              {/* Top bar: search */}
              <div className="px-4 py-3 border-b border-[var(--line-soft)] bg-[var(--bg)] flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[var(--card)] rounded-xl border border-[var(--line-soft)] focus-within:border-blue-400 focus-within:shadow-sm transition-all">
                  <Search className="w-4 h-4 text-[var(--ink-4)] flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search exams, topics…"
                    className="flex-1 text-sm outline-none bg-transparent text-[var(--ink-1)] placeholder-[var(--ink-4)]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-[var(--ink-4)] hover:text-[var(--ink-2)]">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Quick links */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {[
                    { label: "Courses",              href: "/courses/all",    icon: FileText,  color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50" },
                    { label: "Previous Year Papers", href: "/pyq/all",        icon: Zap,       color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50" },
                  ].map(({ label, href, icon: Icon, color }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Search results overlay */}
              <AnimatePresence>
                {searchResults !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="absolute inset-x-0 top-[57px] bg-[var(--card)] z-10 border-t border-[var(--line-soft)] max-h-72 overflow-y-auto"
                  >
                    {searchResults.length === 0 ? (
                      <div className="py-10 text-center text-[var(--ink-4)] text-sm">No exams found for "{searchQuery}"</div>
                    ) : (
                      <div className="p-3 grid grid-cols-2 gap-1.5">
                        {searchResults.map((exam) => (
                          <Link
                            key={exam.href}
                            href={exam.href}
                            className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg bg-[var(--bg)] flex items-center justify-center text-sm flex-shrink-0 mt-0.5 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                              {categories.find((c) => c.id === exam.categoryId)?.emoji}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-[var(--ink-1)] group-hover:text-blue-600 truncate">{exam.name}</div>
                              <div className="text-xs text-[var(--ink-4)] truncate">{exam.category}</div>
                            </div>
                            {exam.tag && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${exam.tag.color}`}>
                                {exam.tag.label}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main body: category sidebar + exam grid */}
              <div className="flex h-[340px]">

                {/* Left sidebar — category list */}
                <div className="w-44 border-r border-[var(--line-soft)] py-2 flex-shrink-0 overflow-y-auto">
                  {categories.map((cat) => {
                    const isActive = cat.id === activeCategory;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onMouseEnter={() => setActiveCategory(cat.id)}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all duration-150 ${
                          isActive
                            ? `${cat.color} ${cat.textColor} border-r-2 border-blue-500`
                            : "text-[var(--ink-3)] hover:bg-[var(--bg)]"
                        }`}
                      >
                        <span className="text-lg leading-none">{cat.emoji}</span>
                        <span className={`text-sm font-semibold ${isActive ? cat.textColor : ""}`}>{cat.label}</span>
                        {isActive && (
                          <ArrowRight className="w-3 h-3 ml-auto opacity-60" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right panel — exam cards */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCategory}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Category header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{activeCat.emoji}</span>
                        <h3 className={`text-sm font-bold ${activeCat.textColor}`}>{activeCat.label}</h3>
                        <span className="text-xs text-[var(--ink-4)] ml-1">{activeCat.exams.length} exams</span>
                      </div>

                      {/* Exam grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {activeExams.map((exam) => (
                          <Link
                            key={exam.href}
                            href={exam.href}
                            className="group flex items-start gap-2.5 p-3 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50/60 transition-all duration-150"
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-sm transition-colors ${activeCat.color}`}>
                              {activeCat.emoji}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-1.5">
                                <span className="text-sm font-semibold text-[var(--ink-1)] group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-snug">
                                  {exam.name}
                                </span>
                                {exam.tag && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${exam.tag.color}`}>
                                    {exam.tag.label}
                                  </span>
                                )}
                              </div>
                              {exam.desc && (
                                <p className="text-xs text-[var(--ink-4)] mt-0.5 leading-snug">{exam.desc}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--line-soft)] bg-[var(--bg)]/50">
                <p className="text-xs text-[var(--ink-4)]">
                  <span className="font-semibold text-[var(--ink-3)]">{allExams.length}+ exams</span> across {categories.length} categories
                </p>
                <Link
                  href="/exams"
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Browse all exams
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
