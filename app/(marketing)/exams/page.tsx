"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, GraduationCap, ArrowRight, ChevronDown } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface Board {
  id: string;
  name: string;
  shortName: string;
  tint: string;
  exams: Exam[];
}

interface Exam {
  id: string;
  name: string;
  shortName: string;
  tier: number;
  subjects: string;
  hasTests: boolean;
  hasPYQ: boolean;
  isFeatured: boolean;
}

export default function AllExamsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedBoard, setExpandedBoard] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/boards`)
      .then(r => r.json())
      .then(async (boardList: Omit<Board, "exams">[]) => {
        // Fetch exams for each board in parallel
        const withExams = await Promise.all(
          boardList.map(async b => {
            const exams = await fetch(`${API_URL}/exams?board=${b.id}`).then(r => r.json());
            return { ...b, exams };
          })
        );
        setBoards(withExams);
        if (withExams.length > 0) setExpandedBoard(withExams[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const allExams = boards.flatMap(b => b.exams.map(e => ({ ...e, boardName: b.name })));
  const filtered = search
    ? allExams.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.shortName.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-16">

      {/* Header */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-bold uppercase tracking-widest mb-5">
          <GraduationCap className="w-3 h-3" /> All Exams
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          Browse All Exams
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl">
          Find your target exam, explore test series, PYQ papers, and study materials.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm mb-8 max-w-md">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exams (e.g. JPSC, SBI PO)…"
          className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : search && filtered ? (
        /* Search results — flat list */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <p className="text-gray-500 col-span-3 py-10 text-center">No exams found for "{search}"</p>
          ) : filtered.map((exam, idx) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
            >
              <p className="text-[11px] text-gray-400 font-semibold mb-1">{exam.boardName}</p>
              <h3 className="font-bold text-gray-900 mb-3">{exam.name}</h3>
              <div className="flex gap-2">
                {exam.hasTests && (
                  <Link href={`/series/all?exam=${exam.id}`} className="text-[11px] px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold">Test Series</Link>
                )}
                {exam.hasPYQ && (
                  <Link href={`/pyq/all?exam=${exam.id}`} className="text-[11px] px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg font-bold">PYQs</Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Board-grouped accordion */
        <div className="space-y-3">
          {boards.map(board => (
            <div key={board.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedBoard(prev => prev === board.id ? null : board.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black"
                    style={{ background: board.tint || "#2563EB" }}
                  >
                    {board.shortName.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{board.name}</p>
                    <p className="text-xs text-gray-400">{board.exams.length} exams</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedBoard === board.id ? "rotate-180" : ""}`}
                />
              </button>

              {expandedBoard === board.id && (
                <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-50">
                  {board.exams.map(exam => (
                    <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{exam.shortName}</p>
                        <p className="text-[11px] text-gray-400 line-clamp-1">{exam.name}</p>
                        <div className="flex gap-1.5 mt-1.5">
                          {exam.hasTests && <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold">Tests</span>}
                          {exam.hasPYQ && <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded font-bold">PYQs</span>}
                          {exam.isFeatured && <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded font-bold">Featured</span>}
                        </div>
                      </div>
                      <Link
                        href={`/series/all?exam=${exam.id}`}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
