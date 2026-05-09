"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GraduationCap, ArrowRight, ChevronRight, MapPin, Building2, Flame, SlidersHorizontal, X, Check } from "lucide-react";
import { STATES, BOARDS, getAllExams, CatalogueState, CatalogueBoard, CatalogueExam } from "@/lib/data/examCatalogue";

export default function AllExamsPage() {
  const [search, setSearch] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleState = (id: string) => {
    setSelectedStates(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleBoard = (id: string) => {
    setSelectedBoards(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const allExams = getAllExams();

  // Unified filtering logic
  const filteredExams = search
    ? allExams.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.shortName && e.shortName.toLowerCase().includes(search.toLowerCase()))
      )
    : null;

  // Derive activeState for the quick-tabs (highlighted if only one state is selected)
  const activeState = selectedStates.length === 1 ? selectedStates[0] : (selectedStates.length === 0 ? "all" : null);

  // Filter states based on multi-select
  const visibleStates = selectedStates.length > 0 
    ? STATES.filter(s => selectedStates.includes(s.id))
    : STATES;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      
      {/* ── HERO SECTION ── */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-16 pb-20 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <GraduationCap className="w-4 h-4" /> Exam Directory
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
            Find Your Target Exam
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Explore our comprehensive catalogue of government and competitive exams. Get access to detailed syllabus, important dates, mock tests, and previous year papers.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 sm:text-lg border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 focus:border-blue-500 transition-all shadow-sm"
              placeholder="Search for an exam (e.g., SSC CGL, IBPS PO)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 relative">
        
        {search && filteredExams ? (
          /* ── SEARCH RESULTS ── */
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Search Results for "{search}"
            </h2>
            {filteredExams.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-200 dark:border-gray-800">
                <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No exams found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search terms or browse by state below.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExams.map((exam, idx) => {
                  const board = BOARDS.find(b => b.id === exam.boardId);
                  const state = STATES.find(s => s.id === exam.stateId);
                  if (!board || !state) return null;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={exam.id}
                    >
                      <Link 
                        href={`/exams/${exam.id}`}
                        className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{state.abbr} · {board.name}</span>
                          {exam.popular && <Flame size={14} className="text-orange-500" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {exam.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                          {exam.eligibility} · {exam.testCount} Tests
                        </p>
                        <div className="flex items-center text-sm font-bold text-blue-600 dark:text-blue-400">
                          View Details <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── BROWSE BY STATE ── */
          <div className="space-y-12">
            
            {/* State Filter Tabs & Filter Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
              <div className="flex overflow-x-auto scrollbar-hide gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedStates([])}
                  className={`shrink-0 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeState === "all" 
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md" 
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  All Exams
                </button>
                {STATES.map(state => (
                  <button
                    key={state.id}
                    onClick={() => setSelectedStates([state.id])}
                    className={`shrink-0 px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      activeState === state.id 
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md" 
                        : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span>{state.emoji}</span> {state.name}
                  </button>
                ))}
              </div>
              <button 
                className={`w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all ${
                  selectedStates.length > 0 || selectedBoards.length > 0
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                }`}
                onClick={() => setIsFilterOpen(true)}
              >
                <SlidersHorizontal size={16} className={selectedStates.length > 0 || selectedBoards.length > 0 ? "text-white" : "text-orange-400"} /> 
                Filters {(selectedStates.length + selectedBoards.length) > 0 && `(${(selectedStates.length + selectedBoards.length)})`}
              </button>
            </div>

            {/* Render grouped by State -> Board -> Exams */}
            <div className="space-y-16">
              {visibleStates.map(state => {
                const stateBoards = BOARDS.filter(b => 
                  b.stateId === state.id && 
                  b.exams.length > 0 &&
                  (selectedBoards.length === 0 || selectedBoards.includes(b.id))
                );
                if (stateBoards.length === 0) return null;

                return (
                  <div key={state.id} className="space-y-8">
                    {/* State Header */}
                    <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: state.colorSoft }}>
                        {state.emoji}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {state.name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{state.description}</p>
                      </div>
                    </div>

                    {/* Boards Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {stateBoards.map(board => (
                        <div key={board.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                          
                          {/* Board Header */}
                          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4" style={{ backgroundColor: `${board.color}05` }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: board.color }}>
                              {board.name.slice(0, 2)}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{board.fullName}</h3>
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: board.color }}>
                                {board.name}
                              </span>
                            </div>
                          </div>

                          {/* Exams List */}
                          <div className="p-2 flex-1">
                            {board.exams.map(exam => (
                              <Link
                                key={exam.id}
                                href={`/exams/${exam.id}`}
                                className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                              >
                                <div>
                                  <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                    {exam.name}
                                    {exam.popular && <Flame size={14} className="text-orange-500" />}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {exam.testCount} Tests · {exam.pyqCount} PYQs
                                  </p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                  <ChevronRight size={16} />
                                </div>
                              </Link>
                            ))}
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FILTER DRAWER ── */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
              />

              {/* Drawer Content */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-[101] flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Refine your exam discovery</p>
                  </div>
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                  
                  {/* States Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Target States</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {STATES.map(state => {
                        const isSelected = selectedStates.includes(state.id);
                        return (
                          <button
                            key={state.id}
                            onClick={() => toggleState(state.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                              isSelected 
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                                : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{state.emoji}</span> {state.name}
                            </span>
                            {isSelected && <Check size={16} className="text-blue-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Boards Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Exam Boards</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {(selectedStates.length > 0 
                        ? BOARDS.filter(b => selectedStates.includes(b.stateId))
                        : BOARDS
                      ).filter(b => b.exams.length > 0).map(board => {
                        const isSelected = selectedBoards.includes(board.id);
                        return (
                          <button
                            key={board.id}
                            onClick={() => toggleBoard(board.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                              isSelected 
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300" 
                                : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            <span className="text-sm font-semibold">{board.name}</span>
                            {isSelected && <Check size={16} className="text-orange-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-900/50">
                  <button 
                    onClick={() => { setSelectedStates([]); setSelectedBoards([]); }}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-all"
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all"
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
