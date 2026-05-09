"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, FileText, Users, Star, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGetTestSeries } from "@/lib/api";

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [freeOnly, setFreeOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGetTestSeries({ limit: 100 })
      .then((data: any) => setSeriesList(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = seriesList.filter((s) => {
    const catOk = activeTab === "All" || s.exam?.name.includes(activeTab) || s.exam?.shortName === activeTab;
    const freeOk = !freeOnly || !s.isPaid;
    return catOk && freeOk;
  });

  const categories = ["All", ...new Set(seriesList.map(s => s.exam?.shortName || "Other"))].slice(0, 8);

  return (
    <div className="flex flex-col gap-8 fade-up">

      {/* Header */}
      <div className="pt-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2"
              style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
              Test Series
            </h1>
            <p className="text-base max-w-xl" style={{ color: "var(--ink-4)", lineHeight: "1.6" }}>
              Practice with full-length mock tests for your target exams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/series/all"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-[var(--bg)]"
              style={{ color: "var(--blue)", borderColor: "var(--blue)", borderWidth: 1.5 }}
            >
              Browse All Series <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => setFreeOnly(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                freeOnly
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "text-[var(--ink-3)] border-[var(--line-soft)] hover:bg-[var(--bg)]"
              }`}
            >
              <Zap size={14} className={freeOnly ? "text-emerald-600" : "text-[var(--ink-4)]"} />
              Free Only
            </button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div
        className="flex gap-0.5 p-1 rounded-[10px] overflow-x-auto"
        style={{ background: "var(--bg)", border: "1px solid var(--line)", scrollbarWidth: "none" }}
      >
        {categories.map((cat: any) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className="whitespace-nowrap px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all flex-shrink-0"
            style={{
              background: activeTab === cat ? "var(--card)" : "transparent",
              color: activeTab === cat ? "var(--ink-1)" : "var(--ink-4)",
              boxShadow: activeTab === cat ? "var(--shadow-xs)" : "none",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--ink-4)" }}>
          <p className="text-sm font-medium">No series found matching your criteria.</p>
        </div>
      ) : (
        <motion.div
          initial="hidden" animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filtered.map(s => (
            <motion.div key={s.id} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
              <SeriesCard series={s} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function SeriesCard({ series: s }: { series: any }) {
  const tint = "#2563EB"; // Default

  return (
    <div className="card card-lift flex flex-col" style={{ padding: "20px 22px 18px" }}>
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[14px]" style={{ background: tint }} />

      <div className="flex items-center gap-1.5 mt-1 mb-3 flex-wrap">
        <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded bg-blue-50 text-blue-600">
          {s.exam?.shortName?.toUpperCase() || "EXAM"}
        </span>
        {s.isFeatured && (
          <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-600">
            FEATURED
          </span>
        )}
        {!s.isPaid && (
          <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">
            FREE
          </span>
        )}
      </div>

      <h3 className="text-[14px] font-semibold leading-snug mb-3 min-h-[40px]"
        style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
        {s.title}
      </h3>

      <div className="flex items-center gap-3 text-[11px] mb-4" style={{ color: "var(--ink-3)" }}>
        <span className="inline-flex items-center gap-1">
          <FileText size={11} /> {s.totalTests} tests
        </span>
        <span className="inline-flex items-center gap-1 ml-auto">
          <Star size={11} className="fill-amber-400 text-amber-400" /> 4.8
        </span>
      </div>

      <div className="flex-1" />

      <Link
        href={`/series/${s.id}`}
        className="mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: tint }}
      >
        View Tests →
      </Link>
    </div>
  );
}
