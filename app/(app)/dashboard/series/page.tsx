"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Search, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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

type FilterOpt = { id: string; label: string };

function FilterSection({
  title, options, selectedId, onChange,
}: {
  title: string;
  options: FilterOpt[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <p
        className="text-[10px] font-bold tracking-widest uppercase mb-2.5"
        style={{ color: "var(--ink-4)" }}
      >
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className="px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-150"
            style={{
              background: selectedId === opt.id ? "var(--blue-soft)" : "var(--bg)",
              color: selectedId === opt.id ? "var(--blue)" : "var(--ink-3)",
              border: `1px solid ${selectedId === opt.id ? "var(--blue)" : "var(--line)"}`,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: "var(--blue-soft)", color: "var(--blue)", border: "1px solid var(--blue)" }}
    >
      {label}
      <button type="button" onClick={onRemove} className="hover:opacity-70 transition-opacity leading-none">
        <X size={10} />
      </button>
    </span>
  );
}

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQ, setSearchQ] = useState("");

  // Filter drawer state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStateId, setFilterStateId] = useState("__all__");
  const [filterBoardId, setFilterBoardId] = useState("__all__");
  const [filterExamId, setFilterExamId] = useState("__all__");

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

  // ── Hierarchy options ──────────────────────────────────────────────────────

  const stateOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    seriesList.forEach((s) => {
      const stId = String(s.exam?.board?.state?.id ?? "__national__");
      const stName = s.exam?.board?.state?.name || "National";
      map.set(stId, stName);
    });
    const sorted = Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) =>
        a.label === "National" ? 1 : b.label === "National" ? -1 : a.label.localeCompare(b.label)
      );
    return [{ id: "__all__", label: "All" }, ...sorted];
  }, [seriesList]);

  const boardOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    seriesList.forEach((s) => {
      const stId = String(s.exam?.board?.state?.id ?? "__national__");
      if (filterStateId !== "__all__" && stId !== filterStateId) return;
      if (s.exam?.board?.id) map.set(s.exam.board.id, s.exam.board.shortName || s.exam.board.name);
    });
    const sorted = Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ id: "__all__", label: "All" }, ...sorted];
  }, [seriesList, filterStateId]);

  const examOptions = useMemo<FilterOpt[]>(() => {
    const map = new Map<string, string>();
    seriesList.forEach((s) => {
      const stId = String(s.exam?.board?.state?.id ?? "__national__");
      if (filterStateId !== "__all__" && stId !== filterStateId) return;
      if (filterBoardId !== "__all__" && s.exam?.board?.id !== filterBoardId) return;
      if (s.exam?.id) map.set(s.exam.id, s.exam.shortName || s.exam.name);
    });
    const sorted = Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ id: "__all__", label: "All" }, ...sorted];
  }, [seriesList, filterStateId, filterBoardId]);

  // ── Cascade handlers ───────────────────────────────────────────────────────

  function handleStateChange(stId: string) {
    setFilterStateId(stId);
    setFilterBoardId("__all__");
    setFilterExamId("__all__");
  }

  function handleBoardChange(boardId: string) {
    setFilterBoardId(boardId);
    setFilterExamId("__all__");
  }

  function clearAllFilters() {
    setFilterStateId("__all__");
    setFilterBoardId("__all__");
    setFilterExamId("__all__");
  }

  const activeFilterCount = [filterStateId, filterBoardId, filterExamId].filter(
    (f) => f !== "__all__"
  ).length;

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return seriesList.filter((s) => {
      const catOk = activeTab === "All" || s.exam?.shortName === activeTab;
      const searchOk =
        !q || [s.title, s.exam?.name, s.description].join(" ").toLowerCase().includes(q);
      const stId = String(s.exam?.board?.state?.id ?? "__national__");
      const stateOk = filterStateId === "__all__" || stId === filterStateId;
      const boardOk = filterBoardId === "__all__" || s.exam?.board?.id === filterBoardId;
      const examOk = filterExamId === "__all__" || s.exam?.id === filterExamId;
      return catOk && searchOk && stateOk && boardOk && examOk;
    });
  }, [seriesList, activeTab, searchQ, filterStateId, filterBoardId, filterExamId]);

  const stateLabel = stateOptions.find((o) => o.id === filterStateId)?.label;
  const boardLabel = boardOptions.find((o) => o.id === filterBoardId)?.label;
  const examLabel = examOptions.find((o) => o.id === filterExamId)?.label;

  return (
    <div className="flex flex-col gap-5 fade-up pb-10">

      {/* ── Header ── */}
      <div className="pt-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center flex-wrap gap-2.5 mb-2">
              <h1
                className="text-[28px] leading-none"
                style={{ fontWeight: 300, letterSpacing: "-0.96px", color: "var(--ink-1)" }}
              >
                My Test Series
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
              Your purchased and free test series. Practice with full-length mocks.
            </p>
          </div>
          <Link
            href="/series/all"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold border transition-all hover:bg-[var(--blue)] hover:text-white hover:border-[var(--blue)]"
            style={{ color: "var(--ink-2)", borderColor: "var(--line)" }}
          >
            Browse All Series <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filterStateId !== "__all__" && stateLabel && (
            <FilterChip label={stateLabel} onRemove={() => handleStateChange("__all__")} />
          )}
          {filterBoardId !== "__all__" && boardLabel && (
            <FilterChip label={boardLabel} onRemove={() => handleBoardChange("__all__")} />
          )}
          {filterExamId !== "__all__" && examLabel && (
            <FilterChip label={examLabel} onRemove={() => setFilterExamId("__all__")} />
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[11px] font-medium underline"
            style={{ color: "var(--ink-4)" }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Layout: left sidebar + right content ── */}
      <div className="flex gap-5 items-start">

        {/* Left category sidebar */}
        <aside className="hidden md:block w-[190px] shrink-0 rounded-[16px] border border-[var(--line-soft)] bg-[var(--card)] p-3.5 sticky top-20">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--ink-3)] mb-3 px-1">
            Category
          </p>
          <div className="flex flex-col gap-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
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

          {/* Search bar + filter button */}
          <div className="flex items-center gap-2">
            <div
              className="flex flex-1 items-center gap-3 rounded-2xl border px-4 py-2.5 transition-all"
              style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
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

            {/* Filter icon */}
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="relative flex items-center justify-center rounded-2xl border transition-all duration-150 shrink-0"
              style={{
                width: 44, height: 44,
                background: activeFilterCount > 0 ? "var(--blue-soft)" : "var(--card)",
                borderColor: activeFilterCount > 0 ? "var(--blue)" : "var(--line-soft)",
                color: activeFilterCount > 0 ? "var(--blue)" : "var(--ink-3)",
              }}
              title="Filter by state, board or exam"
            >
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white"
                  style={{ background: "var(--blue)" }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Result count */}
          {!loading && (
            <p className="text-[12px] px-0.5" style={{ color: "var(--ink-4)" }}>
              {filtered.length} {filtered.length === 1 ? "series" : "series"} found
            </p>
          )}

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
            <div
              className="flex flex-col items-center justify-center py-20 text-center"
              style={{ color: "var(--ink-4)" }}
            >
              <FileText size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No series found matching your criteria.</p>
              <button
                type="button"
                onClick={() => { setActiveTab("All"); setSearchQ(""); clearAllFilters(); }}
                className="mt-3 text-xs font-semibold underline"
                style={{ color: "var(--blue)" }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.04 } },
              }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filtered.map((s) => (
                <motion.div
                  key={s.id}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                >
                  <SeriesCard series={s} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Filter Drawer ── */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end"
          >
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex flex-col w-80 max-w-[85vw] h-full overflow-hidden"
              style={{
                background: "var(--card)",
                borderLeft: "1px solid var(--line)",
                boxShadow: "-8px 0 32px rgba(0,0,0,.12)",
              }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-5 py-4 shrink-0"
                style={{ borderBottom: "1px solid var(--line)" }}
              >
                <span className="text-[15px] font-semibold" style={{ color: "var(--ink-1)" }}>
                  Filters
                </span>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-[12px] font-medium"
                      style={{ color: "var(--blue)" }}
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--bg)]"
                    style={{ color: "var(--ink-3)" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
                {stateOptions.length > 2 && (
                  <FilterSection
                    title="State"
                    options={stateOptions}
                    selectedId={filterStateId}
                    onChange={handleStateChange}
                  />
                )}
                {boardOptions.length > 1 && (
                  <FilterSection
                    title="Board"
                    options={boardOptions}
                    selectedId={filterBoardId}
                    onChange={handleBoardChange}
                  />
                )}
                {examOptions.length > 1 && (
                  <FilterSection
                    title="Exam"
                    options={examOptions}
                    selectedId={filterExamId}
                    onChange={setFilterExamId}
                  />
                )}
                {stateOptions.length <= 2 && boardOptions.length <= 1 && examOptions.length <= 1 && (
                  <p className="text-[13px] text-center py-8" style={{ color: "var(--ink-4)" }}>
                    No filter options available yet.
                  </p>
                )}
              </div>

              {/* Drawer footer */}
              <div
                className="px-5 py-4 shrink-0"
                style={{ borderTop: "1px solid var(--line)" }}
              >
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="w-full py-2.5 rounded-full text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
                  style={{ background: "var(--ink-1)" }}
                >
                  Show {filtered.length} results
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SeriesCard({ series: s }: { series: any }) {
  const seed = seedFrom(s.id || s.title || "x");
  const [from, to] = BANNER_GRADIENTS[seed % BANNER_GRADIENTS.length];
  const totalTests = s.totalTests ?? s.tests?.length ?? 0;
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
        <p className="text-white font-bold text-[22px] leading-tight opacity-90 drop-shadow-sm line-clamp-2">
          {s.exam?.shortName || s.exam?.name?.split(" ").slice(0, 2).join(" ") || "Series"}
        </p>
        {!s.isPaid && (
          <span className="absolute top-3 left-3 rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 shadow-sm">
            FREE
          </span>
        )}
        {s.isFeatured && (
          <span className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[10px] font-semibold px-2.5 py-1">
            Featured
          </span>
        )}
        <span className="absolute bottom-3 right-3 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5">
          {totalTests} tests
        </span>
      </div>

      {/* Card content */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <p className="text-[11px] font-medium" style={{ color: "var(--ink-3)" }}>
          {s.exam?.name || "General"}
        </p>
        <h3
          className="text-[13px] font-semibold leading-snug line-clamp-2"
          style={{ color: "var(--ink-1)" }}
        >
          {s.title}
        </h3>
        {s.description && (
          <p
            className="text-[12px] leading-relaxed line-clamp-2 mt-0.5"
            style={{ color: "var(--ink-4)" }}
          >
            {s.description}
          </p>
        )}

        <div className="flex-1" />

        <p className="text-[13px] font-bold mt-1.5" style={{ color: "var(--ink-2)" }}>
          {price ? `₹${price}` : "FREE"}
        </p>

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
