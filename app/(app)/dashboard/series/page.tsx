"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Search, ShoppingCart, X } from "lucide-react";
import { motion } from "framer-motion";
import { apiGetTestSeries } from "@/lib/api";

const BANNER_GRADIENTS = [
  ["#1d4ed8", "#06b6d4"],
  ["#7c3aed", "#a855f7"],
  ["#059669", "#14b8a6"],
  ["#d97706", "#f97316"],
  ["#e11d48", "#ec4899"],
  ["#4f46e5", "#3b82f6"],
  ["#0284c7", "#22d3ee"],
  ["#be185d", "#a855f7"],
];

function seedFrom(text: string) {
  return text.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    setLoading(true);
    apiGetTestSeries({ limit: 100 })
      .then((data: any) => setSeriesList(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(seriesList.map((s) => s.exam?.shortName || "Other"))).sort()],
    [seriesList]
  );

  const uniqueExams = useMemo(
    () => new Set(seriesList.map((s) => s.exam?.name).filter(Boolean)).size,
    [seriesList]
  );

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return seriesList.filter((s) => {
      const catOk = activeTab === "All" || s.exam?.shortName === activeTab;
      const searchOk = !q || [s.title, s.exam?.name, s.description].join(" ").toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [seriesList, activeTab, searchQ]);

  return (
    <div className="flex flex-col gap-5 fade-up pb-10">

      {/* ── Header — keep heading; add count badges ── */}
      <div className="pt-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center flex-wrap gap-2.5 mb-2">
              <h1
                className="text-[28px] leading-none"
                style={{ fontWeight: 300, letterSpacing: "-0.96px", color: "var(--ink-1)" }}
              >
                Test Series
              </h1>
              {!loading && (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--blue-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--blue)]">
                    <FileText size={10} /> {seriesList.length} Series
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {uniqueExams} Exams
                  </span>
                </>
              )}
            </div>
            <p className="text-[14px] max-w-xl" style={{ color: "var(--ink-4)", lineHeight: "1.5" }}>
              Practice with full-length mock tests for your target exams.
            </p>
          </div>
        </div>
      </div>

      {/* ── Layout: left filter panel + right content ── */}
      <div className="flex gap-5 items-start">

        {/* Left category sidebar */}
        <aside className="w-[190px] shrink-0 rounded-[16px] border border-[var(--line-soft)] bg-[var(--card)] p-3.5 sticky top-20">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--ink-3)] mb-3 px-1">
            Test Series
          </p>
          <div className="flex flex-col gap-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className="w-full text-left px-3 py-2 rounded-[10px] text-[13px] transition-all duration-150"
                style={{
                  background: activeTab === cat ? "var(--blue-soft)" : "transparent",
                  color: activeTab === cat ? "var(--blue)" : "var(--ink-2)",
                  fontWeight: activeTab === cat ? 600 : 400,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        {/* Right content area */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Search bar */}
          <div
            className="flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition-all"
            style={{
              background: "var(--card)",
              borderColor: "var(--line-soft)",
            }}
          >
            <Search size={16} className="shrink-0" style={{ color: "var(--ink-4)" }} />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search by name…"
              className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:font-normal"
              style={{ color: "var(--ink-1)" }}
            />
            {searchQ && (
              <button
                type="button"
                onClick={() => setSearchQ("")}
                className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
                style={{ color: "var(--ink-4)" }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Cards grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-[16px] border border-[var(--line-soft)] overflow-hidden">
                  <div className="h-[140px] animate-pulse bg-[var(--bg-secondary)]" />
                  <div className="p-4 flex flex-col gap-2">
                    <div className="h-3 w-20 rounded animate-pulse bg-[var(--bg-secondary)]" />
                    <div className="h-4 w-full rounded animate-pulse bg-[var(--bg-secondary)]" />
                    <div className="h-3 w-3/4 rounded animate-pulse bg-[var(--bg-secondary)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center" style={{ color: "var(--ink-4)" }}>
              <FileText size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No series found matching your criteria.</p>
              <button
                type="button"
                onClick={() => { setActiveTab("All"); setSearchQ(""); }}
                className="mt-3 text-xs font-semibold underline"
                style={{ color: "var(--blue)" }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filtered.map((s) => (
                <motion.div key={s.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                  <SeriesCard series={s} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function SeriesCard({ series: s }: { series: any }) {
  const seed = seedFrom(s.id || s.title || "x");
  const [from, to] = BANNER_GRADIENTS[seed % BANNER_GRADIENTS.length];
  const totalTests = s.totalTests ?? 0;
  const price = s.isPaid ? (s.discountedPrice || s.price) : null;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-[16px] border border-[var(--line-soft)] bg-[var(--card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--blue)] group"
      style={{ boxShadow: "var(--shadow-xs, 0 1px 4px rgba(0,0,0,.06))" }}
    >
      {/* Banner */}
      <div
        className="relative h-[140px] flex items-end p-4"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {/* Watermark text on banner */}
        <p className="text-white font-bold text-[22px] leading-tight opacity-90 drop-shadow-sm line-clamp-2">
          {s.exam?.shortName || s.exam?.name?.split(" ").slice(0, 2).join(" ") || "Series"}
        </p>

        {/* FREE badge — top-left */}
        {!s.isPaid && (
          <span className="absolute top-3 left-3 rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 shadow-sm">
            FREE
          </span>
        )}

        {/* Featured / Status badge — top-right */}
        {s.isFeatured && (
          <span className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[10px] font-semibold px-2.5 py-1">
            Featured
          </span>
        )}

        {/* Tests count badge — bottom-right */}
        <span className="absolute bottom-3 right-3 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5">
          {totalTests} tests
        </span>
      </div>

      {/* Card content */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <p className="text-[11px] font-medium" style={{ color: "var(--ink-3)" }}>
          {s.exam?.name || "General"}
        </p>
        <h3 className="text-[13px] font-semibold leading-snug line-clamp-2" style={{ color: "var(--ink-1)" }}>
          {s.title}
        </h3>
        {s.description && (
          <p className="text-[12px] leading-relaxed line-clamp-2 mt-0.5" style={{ color: "var(--ink-4)" }}>
            {s.description}
          </p>
        )}

        <div className="flex-1" />

        {/* Price */}
        <p className="text-[13px] font-bold mt-1.5" style={{ color: "var(--ink-2)" }}>
          {price ? `₹${price}` : "FREE"}
        </p>

        {/* Action buttons */}
        <div className="flex gap-2 mt-2">
          {s.isPaid ? (
            <Link
              href={`/dashboard/checkout/${encodeURIComponent(`TEST_SERIES:${s.id}`)}`}
              className="flex flex-1 items-center justify-center gap-1.5 py-2 rounded-full border text-[12px] font-medium transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
              style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}
            >
              <ShoppingCart size={11} /> Buy
            </Link>
          ) : (
            <span
              className="flex flex-1 items-center justify-center py-2 rounded-full border text-[12px] font-medium"
              style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}
            >
              Free Access
            </span>
          )}
          <Link
            href={`/dashboard/series/${s.id}`}
            className="flex flex-1 items-center justify-center py-2 rounded-full text-[12px] font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: "var(--ink-1)" }}
          >
            Explore
          </Link>
        </div>
      </div>
    </div>
  );
}
