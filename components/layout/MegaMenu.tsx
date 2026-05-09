"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
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
    color: "bg-blue-50",
    textColor: "text-blue-700",
    exams: [
      { name: "JPSC Prelims", href: "/series/all?exam=jpsc", tag: { label: "Popular", color: "bg-amber-100 text-amber-700" }, desc: "Jharkhand Public Service" },
      { name: "JPSC Mains", href: "/series/all?exam=jpsc-mains", desc: "Jharkhand Public Service" },
      { name: "BPSC", href: "/series/all?exam=bpsc", tag: { label: "Hot", color: "bg-red-100 text-red-600" }, desc: "Bihar Public Service" },
      { name: "UPPSC", href: "/series/all?exam=uppsc", desc: "Uttar Pradesh PSC" },
      { name: "MPSC", href: "/series/all?exam=mpsc", desc: "Maharashtra PSC" },
    ],
  },
  {
    id: "banking",
    label: "Banking",
    emoji: "🏦",
    color: "bg-emerald-50",
    textColor: "text-emerald-700",
    exams: [
      { name: "SBI PO", href: "/series/all?exam=sbi-po", tag: { label: "🔥 Hot", color: "bg-red-100 text-red-600" }, desc: "State Bank of India PO" },
      { name: "IBPS PO", href: "/series/all?exam=ibps-po", tag: { label: "Popular", color: "bg-amber-100 text-amber-700" }, desc: "Institute of Banking Personnel" },
      { name: "IBPS Clerk", href: "/series/all?exam=ibps-clerk", desc: "IBPS Clerical Cadre" },
      { name: "SBI Clerk", href: "/series/all?exam=sbi-clerk", desc: "SBI Junior Associates" },
      { name: "RBI Grade B", href: "/series/all?exam=rbi-grade-b", tag: { label: "Hard", color: "bg-purple-100 text-purple-700" }, desc: "Reserve Bank of India" },
      { name: "NABARD Grade A", href: "/series/all?exam=nabard", desc: "National Bank Agriculture" },
    ],
  },
  {
    id: "ssc",
    label: "SSC",
    emoji: "📋",
    color: "bg-purple-50",
    textColor: "text-purple-700",
    exams: [
      { name: "SSC CGL", href: "/series/all?exam=ssc-cgl", tag: { label: "⭐ Popular", color: "bg-amber-100 text-amber-700" }, desc: "Combined Graduate Level" },
      { name: "SSC CHSL", href: "/series/all?exam=ssc-chsl", tag: { label: "Popular", color: "bg-amber-100 text-amber-700" }, desc: "Combined Higher Sec. Level" },
      { name: "SSC MTS", href: "/series/all?exam=ssc-mts", desc: "Multi Tasking Staff" },
      { name: "SSC GD Constable", href: "/series/all?exam=ssc-gd", desc: "General Duty Constable" },
      { name: "SSC CPO", href: "/series/all?exam=ssc-cpo", desc: "Central Police Organisation" },
    ],
  },
  {
    id: "railway",
    label: "Railway",
    emoji: "🚆",
    color: "bg-amber-50",
    textColor: "text-amber-700",
    exams: [
      { name: "RRB NTPC", href: "/series/all?exam=rrb-ntpc", tag: { label: "🔥 Hot", color: "bg-red-100 text-red-600" }, desc: "Non-Technical Popular Cat." },
      { name: "RRB Group D", href: "/series/all?exam=rrb-group-d", tag: { label: "Popular", color: "bg-amber-100 text-amber-700" }, desc: "Railway Group D Posts" },
      { name: "RRB ALP", href: "/series/all?exam=rrb-alp", desc: "Assistant Loco Pilot" },
      { name: "RRB JE", href: "/series/all?exam=rrb-je", desc: "Junior Engineer" },
    ],
  },
  {
    id: "police",
    label: "Police & Defence",
    emoji: "🛡️",
    color: "bg-rose-50",
    textColor: "text-rose-700",
    exams: [
      { name: "Jharkhand Daroga SI", href: "/series/all?exam=daroga", tag: { label: "⭐ Popular", color: "bg-amber-100 text-amber-700" }, desc: "Sub Inspector Recruitment" },
      { name: "UP Police Constable", href: "/series/all?exam=up-police", tag: { label: "Hot", color: "bg-red-100 text-red-600" }, desc: "UP Police Recruitment" },
      { name: "CRPF", href: "/series/all?exam=crpf", desc: "Central Reserve Police" },
      { name: "CDS", href: "/series/all?exam=cds", tag: { label: "Hard", color: "bg-purple-100 text-purple-700" }, desc: "Combined Defence Services" },
      { name: "NDA", href: "/series/all?exam=nda", desc: "National Defence Academy" },
    ],
  },
  {
    id: "teaching",
    label: "Teaching",
    emoji: "👨‍🏫",
    color: "bg-cyan-50",
    textColor: "text-cyan-700",
    exams: [
      { name: "CTET", href: "/series/all?exam=ctet", tag: { label: "Popular", color: "bg-amber-100 text-amber-700" }, desc: "Central Teacher Eligibility" },
      { name: "STET (Jharkhand)", href: "/series/all?exam=stet", desc: "State Teacher Eligibility" },
      { name: "KVS PGT/TGT", href: "/series/all?exam=kvs", desc: "Kendriya Vidyalaya" },
      { name: "DSSSB", href: "/series/all?exam=dsssb", desc: "Delhi Subordinate Services" },
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
            ? "text-blue-600 bg-blue-50"
            : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/70"
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
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-100 shadow-sm rounded-sm" />

            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

              {/* Top bar: search */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 focus-within:border-blue-400 focus-within:shadow-sm transition-all">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search exams, topics…"
                    className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
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
                    className="absolute inset-x-0 top-[57px] bg-white z-10 border-t border-gray-100 max-h-72 overflow-y-auto"
                  >
                    {searchResults.length === 0 ? (
                      <div className="py-10 text-center text-gray-400 text-sm">No exams found for "{searchQuery}"</div>
                    ) : (
                      <div className="p-3 grid grid-cols-2 gap-1.5">
                        {searchResults.map((exam) => (
                          <Link
                            key={exam.href}
                            href={exam.href}
                            className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 group transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5 group-hover:bg-blue-100">
                              {categories.find((c) => c.id === exam.categoryId)?.emoji}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 truncate">{exam.name}</div>
                              <div className="text-xs text-gray-400 truncate">{exam.category}</div>
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
                <div className="w-44 border-r border-gray-100 py-2 flex-shrink-0 overflow-y-auto">
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
                            : "text-gray-600 hover:bg-gray-50"
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
                        <span className="text-xs text-gray-400 ml-1">{activeCat.exams.length} exams</span>
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
                                <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 leading-snug">
                                  {exam.name}
                                </span>
                                {exam.tag && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${exam.tag.color}`}>
                                    {exam.tag.label}
                                  </span>
                                )}
                              </div>
                              {exam.desc && (
                                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{exam.desc}</p>
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
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-600">{allExams.length}+ exams</span> across {categories.length} categories
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
