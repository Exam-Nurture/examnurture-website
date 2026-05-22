"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GraduationCap, ArrowRight, ChevronRight, SlidersHorizontal, X, Check } from "lucide-react";
import { apiGetBoards, type ApiBoard } from "@/lib/api";

/* ── Emoji map: presentation-only, state names come from the backend ── */
const STATE_EMOJI: Record<string, string> = {
  "Central Government": "🏛",
  "Jharkhand":          "🌿",
  "Bihar":              "🏺",
  "Uttar Pradesh":      "⚡",
  "Rajasthan":          "🏜",
  "Madhya Pradesh":     "🦁",
  "Maharashtra":        "🌊",
  "Karnataka":          "🌸",
  "Tamil Nadu":         "🏯",
  "Gujarat":            "🦚",
  "West Bengal":        "🎭",
  "Andhra Pradesh":     "🌾",
  "Telangana":          "💎",
  "Kerala":             "🌴",
  "Punjab":             "🌾",
  "Haryana":            "🌻",
  "Himachal Pradesh":   "🏔",
  "Uttarakhand":        "🏔",
  "Odisha":             "🎪",
  "Assam":              "🍵",
  "Chhattisgarh":       "🌿",
  "Goa":                "🏖",
  "Delhi":              "🗼",
};

function emojiFor(name: string) {
  return STATE_EMOJI[name] ?? "📋";
}

/* ── Group boards by their state (or "Other" if no state linked) ── */
interface StateGroup {
  id: number | null;
  name: string;
  boards: ApiBoard[];
}

function groupByState(boards: ApiBoard[]): StateGroup[] {
  const map = new Map<string, StateGroup>();

  for (const board of boards) {
    const key  = board.state ? String(board.state.id) : "__none__";
    const name = board.state?.name ?? "Other";
    if (!map.has(key)) map.set(key, { id: board.state?.id ?? null, name, boards: [] });
    map.get(key)!.boards.push(board);
  }

  // Sort: real states alphabetically first, "Other" last
  return [...map.values()].sort((a, b) => {
    if (a.id === null) return 1;
    if (b.id === null) return -1;
    return a.name.localeCompare(b.name);
  });
}

export default function AllExamsPage() {
  const [search, setSearch]             = useState("");
  const [selectedStates, setSelectedStates] = useState<Array<number | null>>([]);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [boards, setBoards]   = useState<ApiBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetBoards()
      .then(data => { if (!cancelled) setBoards(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  /* Derive state groups + all exams once boards are loaded */
  const stateGroups = useMemo(() => groupByState(boards), [boards]);
  const allExams    = useMemo(() => boards.flatMap(b => (b.exams ?? []).map(e => ({ ...e, board: b }))), [boards]);

  const toggleState = (id: number | null) =>
    setSelectedStates(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const toggleBoard = (id: string) =>
    setSelectedBoards(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);

  const isAllActive = selectedStates.length === 0;

  /* Search: client-side filter over all exams */
  const filteredExams = search.trim()
    ? allExams.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.shortName.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  /* Browse mode: which state groups to show */
  const visibleGroups = selectedStates.length > 0
    ? stateGroups.filter(g => selectedStates.includes(g.id))
    : stateGroups;

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg)" }}>

      {/* ── HERO ── */}
      <section className="border-b pt-16 pb-20 relative overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full opacity-5 blur-[120px] pointer-events-none" style={{ background: "#0D287E" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight" style={{ color: "var(--ink-1)" }}>
            Find Your Target Exam
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--ink-2)" }}>
            Explore our comprehensive catalogue of government and competitive exams. Get access to syllabus, important dates, mock tests, and previous year papers.
          </p>
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5" style={{ color: "var(--ink-4)" }} />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 sm:text-lg border-2 rounded-2xl focus:outline-none transition-all"
              style={{ background: "var(--bg)", borderColor: "var(--line-soft)", color: "var(--ink-1)" }}
              placeholder="Search for an exam (e.g., SSC CGL, IBPS PO)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 relative">

        {search.trim() && filteredExams ? (
          /* ── SEARCH RESULTS ── */
          <div className="space-y-6">
            <h2 className="text-xl font-bold" style={{ color: "var(--ink-1)" }}>
              Search results for &ldquo;{search}&rdquo;
            </h2>
            {filteredExams.length === 0 ? (
              <div className="border rounded-3xl p-12 text-center" style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}>
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "var(--ink-4)" }} />
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--ink-1)" }}>No exams found</h3>
                <p style={{ color: "var(--ink-3)" }}>Try adjusting your search terms or browse by state below.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExams.map((exam, idx) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Link
                      href={`/exams/${exam.id}`}
                      className="block border rounded-3xl p-6 transition-all hover:-translate-y-0.5 group"
                      style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
                    >
                      <span
                        className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block mb-3"
                        style={{ background: `${exam.board.tint}18`, color: exam.board.tint || "#0D287E" }}
                      >
                        {exam.board.shortName}
                      </span>
                      <h3 className="text-xl font-bold mb-2" style={{ color: "var(--ink-1)" }}>{exam.name}</h3>
                      <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>
                        {[exam.hasTests && "Tests available", exam.hasPYQ && "PYQs available"].filter(Boolean).join(" · ") || "Coming soon"}
                      </p>
                      <div className="flex items-center text-sm font-bold" style={{ color: "#0D287E" }}>
                        View Details <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        ) : loading ? (
          /* ── SKELETON ── */
          <div className="space-y-8">
            <div className="flex gap-3">
              {[100, 160, 120, 100, 140].map((w, i) => (
                <div key={i} className="h-11 rounded-xl animate-pulse" style={{ width: w, background: "var(--card)" }} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 rounded-3xl animate-pulse" style={{ background: "var(--card)" }} />
              ))}
            </div>
          </div>

        ) : (
          /* ── BROWSE BY STATE ── */
          <div className="space-y-12">

            {/* State tabs + Filter button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-1">
                {/* All Exams */}
                <button
                  onClick={() => { setSelectedStates([]); setSelectedBoards([]); }}
                  className="shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all"
                  style={
                    isAllActive
                      ? { background: "#0D287E", color: "#fff" }
                      : { background: "var(--card)", color: "var(--ink-2)", border: "1.5px solid var(--line-soft)" }
                  }
                >
                  All Exams
                </button>

                {/* One tab per state, derived from boards data */}
                {stateGroups.filter(g => g.id !== null).map(group => (
                  <button
                    key={group.id}
                    onClick={() => { setSelectedStates([group.id]); setSelectedBoards([]); }}
                    className="shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2"
                    style={
                      selectedStates.includes(group.id)
                        ? { background: "#0D287E", color: "#fff" }
                        : { background: "var(--card)", color: "var(--ink-2)", border: "1.5px solid var(--line-soft)" }
                    }
                  >
                    <span>{emojiFor(group.name)}</span> {group.name}
                  </button>
                ))}
              </div>

              {/* Filter button */}
              <button
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all"
                style={
                  selectedBoards.length > 0
                    ? { background: "#0D287E", color: "#fff" }
                    : { background: "var(--card)", color: "var(--ink-2)", border: "1.5px solid var(--line-soft)" }
                }
                onClick={() => setIsFilterOpen(true)}
              >
                <SlidersHorizontal size={16} />
                Filters
                {selectedBoards.length > 0 && (
                  <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-xs">{selectedBoards.length}</span>
                )}
              </button>
            </div>

            {/* State → Board → Exams */}
            <div className="space-y-16">
              {visibleGroups.map(group => {
                const groupBoards = group.boards.filter(b =>
                  selectedBoards.length === 0 || selectedBoards.includes(b.id)
                );
                if (groupBoards.length === 0) return null;

                return (
                  <div key={group.id ?? "__none__"} className="space-y-8">
                    {/* State header */}
                    {group.id !== null && (
                      <div className="flex items-center gap-4 border-b pb-4" style={{ borderColor: "var(--line-soft)" }}>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "var(--card)" }}>
                          {emojiFor(group.name)}
                        </div>
                        <h2 className="text-2xl font-bold" style={{ color: "var(--ink-1)" }}>{group.name}</h2>
                      </div>
                    )}

                    {/* Boards grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {groupBoards.map(board => {
                        const boardExams = board.exams ?? [];
                        if (boardExams.length === 0) return null;
                        return (
                          <div
                            key={board.id}
                            className="border rounded-3xl overflow-hidden flex flex-col"
                            style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
                          >
                            {/* Board header */}
                            <div
                              className="p-5 border-b flex items-center gap-4"
                              style={{ borderColor: "var(--line-soft)", background: `${board.tint}08` }}
                            >
                              <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                                style={{ backgroundColor: board.tint || "#0D287E" }}
                              >
                                {board.shortName.slice(0, 2)}
                              </div>
                              <div>
                                <h3 className="font-bold text-base leading-tight" style={{ color: "var(--ink-1)" }}>
                                  {board.name}
                                </h3>
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: board.tint || "#0D287E" }}>
                                  {board.shortName}
                                </span>
                              </div>
                            </div>

                            {/* Exams list */}
                            <div className="p-2 flex-1">
                              {boardExams.map(exam => (
                                <Link
                                  key={exam.id}
                                  href={`/exams/${exam.id}`}
                                  className="flex items-center justify-between p-4 rounded-2xl transition-all group hover:bg-[var(--bg)]"
                                >
                                  <div>
                                    <h4 className="font-bold" style={{ color: "var(--ink-1)" }}>
                                      {exam.name}
                                    </h4>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--ink-4)" }}>
                                      {[exam.hasTests && "Tests", exam.hasPYQ && "PYQs"].filter(Boolean).join(" · ") || "Coming soon"}
                                    </p>
                                  </div>
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:bg-[#0D287E] group-hover:text-white"
                                    style={{ background: "var(--bg)", color: "var(--ink-3)" }}
                                  >
                                    <ChevronRight size={16} />
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {visibleGroups.every(g => g.boards.every(b => (b.exams ?? []).length === 0)) && (
                <div className="border-2 border-dashed rounded-3xl p-16 text-center" style={{ borderColor: "var(--line-soft)" }}>
                  <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "var(--ink-4)" }} />
                  <p className="font-medium" style={{ color: "var(--ink-3)" }}>No exams match the selected filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FILTER DRAWER ── */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full max-w-sm shadow-2xl z-[101] flex flex-col"
                style={{ background: "var(--card)" }}
              >
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--line-soft)" }}>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--ink-1)" }}>Filters</h2>
                    <p className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>Refine your exam discovery</p>
                  </div>
                  <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-full transition-colors" style={{ color: "var(--ink-3)" }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                  {/* State filter */}
                  {stateGroups.filter(g => g.id !== null).length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>State / Region</h3>
                      <div className="flex flex-col gap-2">
                        {stateGroups.filter(g => g.id !== null).map(group => {
                          const isSel = selectedStates.includes(group.id);
                          return (
                            <button
                              key={group.id}
                              onClick={() => toggleState(group.id)}
                              className="flex items-center justify-between p-3 rounded-xl border transition-all text-left"
                              style={
                                isSel
                                  ? { border: "1px solid #0D287E", background: "rgba(13,40,126,0.08)", color: "#0D287E" }
                                  : { borderColor: "var(--line-soft)", color: "var(--ink-2)", background: "var(--bg)" }
                              }
                            >
                              <span className="flex items-center gap-2 font-medium">
                                {emojiFor(group.name)} {group.name}
                              </span>
                              {isSel && <Check size={16} style={{ color: "#0D287E" }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Board filter */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>Exam Board</h3>
                    <div className="flex flex-col gap-2">
                      {(selectedStates.length > 0
                        ? stateGroups.filter(g => selectedStates.includes(g.id)).flatMap(g => g.boards)
                        : boards
                      ).map(board => {
                        const isSel = selectedBoards.includes(board.id);
                        return (
                          <button
                            key={board.id}
                            onClick={() => toggleBoard(board.id)}
                            className="flex items-center justify-between p-3 rounded-xl border text-left transition-all"
                            style={
                              isSel
                                ? { border: `1px solid ${board.tint}`, background: `${board.tint}12`, color: board.tint }
                                : { borderColor: "var(--line-soft)", color: "var(--ink-2)", background: "var(--bg)" }
                            }
                          >
                            <span className="text-sm font-semibold">{board.name}</span>
                            {isSel && <Check size={16} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t grid grid-cols-2 gap-4" style={{ borderColor: "var(--line-soft)", background: "var(--bg)" }}>
                  <button
                    onClick={() => { setSelectedStates([]); setSelectedBoards([]); }}
                    className="px-4 py-3 border rounded-xl text-sm font-bold"
                    style={{ borderColor: "var(--line-soft)", color: "var(--ink-3)", background: "var(--card)" }}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: "#0D287E" }}
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
