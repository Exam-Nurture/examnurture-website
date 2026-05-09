"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, Bookmark, BookmarkCheck,
  Share2, BookOpen, Zap, RotateCcw, TrendingUp, Check,
  Play, ExternalLink, ArrowRight, Calendar, Lock,
  FlaskConical, Sparkles, RefreshCw, Target, ChevronRight,
  Hash, ChevronDown, Sun, BookOpenCheck, Moon, Coffee,
  Lightbulb, AlertTriangle, ClipboardList, Info, Download,
  CheckSquare, Square, Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ARTICLES, TYPE_META, DIFF_COLOR, ARTICLE_POPULARITY,
  getExamTags, type ContentBlock, type Article,
} from "../data";
import { useAuth } from "@/lib/auth-context";

/* ─── Cover gradients ─── */
const COVER_GRADIENTS: Record<Article["type"], string> = {
  Concept:  "linear-gradient(135deg,#1E40AF 0%,#0891B2 100%)",
  Formula:  "linear-gradient(135deg,#6D28D9 0%,#BE185D 100%)",
  Revision: "linear-gradient(135deg,#92400E 0%,#D97706 100%)",
  Strategy: "linear-gradient(135deg,#065F46 0%,#059669 100%)",
};

const COVER_ICONS_LG: Record<Article["type"], React.ReactNode> = {
  Concept:  <BookOpen  size={120} strokeWidth={1} />,
  Formula:  <Zap       size={120} strokeWidth={1} />,
  Revision: <RefreshCw size={120} strokeWidth={1} />,
  Strategy: <Target    size={120} strokeWidth={1} />,
};

const TYPE_ICONS_SM: Record<Article["type"], React.ReactNode> = {
  Concept:  <BookOpen   size={12} />,
  Formula:  <Zap        size={12} />,
  Revision: <RotateCcw  size={12} />,
  Strategy: <TrendingUp size={12} />,
};

/* ─── Helpers ─── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function toId(text: string) { return text.replace(/\s+/g, "-").toLowerCase(); }

/* ─────────────────────────────────────────────
   CONTENT SECTIONS — group blocks by h2
───────────────────────────────────────────── */
interface Section {
  heading: string;
  id: string;
  blocks: ContentBlock[];
  isPhase: boolean;
  phaseNum?: number;
}

function groupIntoSections(content: ContentBlock[]) {
  const preamble: ContentBlock[] = [];
  const sections: Section[] = [];

  let current: Section | null = null;
  for (const block of content) {
    if (block.type === "h2") {
      if (current) sections.push(current);
      const isPhase = /phase\s*\d/i.test(block.text);
      const phaseMatch = block.text.match(/phase\s*(\d+)/i);
      current = {
        heading: block.text,
        id: toId(block.text),
        blocks: [],
        isPhase,
        phaseNum: phaseMatch ? parseInt(phaseMatch[1]) : undefined,
      };
    } else if (current) {
      current.blocks.push(block);
    } else {
      preamble.push(block);
    }
  }
  if (current) sections.push(current);
  return { preamble, sections };
}

/* Count checkable items in a section */
function countCheckable(blocks: ContentBlock[]) {
  return blocks.reduce((n, b) => n + (b.type === "ul" || b.type === "ol" ? (b as any).items.length : 0), 0);
}

/* ─────────────────────────────────────────────
   CONTEXTUAL CALLOUT
───────────────────────────────────────────── */
const CALLOUT_STYLES: Record<string, { bg: string; border: string; labelColor: string; icon: React.ReactNode }> = {
  "pro-tip":      { bg: "rgba(245,158,11,0.08)", border: "#F59E0B", labelColor: "#D97706", icon: <Lightbulb size={14} /> },
  "tip":          { bg: "rgba(245,158,11,0.08)", border: "#F59E0B", labelColor: "#D97706", icon: <Lightbulb size={14} /> },
  "warning":      { bg: "rgba(239,68,68,0.07)",  border: "#EF4444", labelColor: "#DC2626", icon: <AlertTriangle size={14} /> },
  "caution":      { bg: "rgba(239,68,68,0.07)",  border: "#EF4444", labelColor: "#DC2626", icon: <AlertTriangle size={14} /> },
  "task":         { bg: "rgba(79,70,229,0.07)",  border: "#6366F1", labelColor: "#4F46E5", icon: <ClipboardList size={14} /> },
  "download":     { bg: "rgba(79,70,229,0.07)",  border: "#6366F1", labelColor: "#4F46E5", icon: <Download size={14} /> },
  "key insight":  { bg: "rgba(139,92,246,0.08)", border: "#8B5CF6", labelColor: "#7C3AED", icon: <Sparkles size={14} /> },
  "insight":      { bg: "rgba(139,92,246,0.08)", border: "#8B5CF6", labelColor: "#7C3AED", icon: <Sparkles size={14} /> },
  "before you begin": { bg: "rgba(59,130,246,0.08)", border: "#3B82F6", labelColor: "#2563EB", icon: <Info size={14} /> },
  "practice rule": { bg: "rgba(16,185,129,0.08)", border: "#10B981", labelColor: "#059669", icon: <Trophy size={14} /> },
};

function getCalloutStyle(label?: string) {
  if (!label) return CALLOUT_STYLES["key insight"];
  const key = label.toLowerCase().trim();
  for (const k of Object.keys(CALLOUT_STYLES)) {
    if (key.includes(k)) return CALLOUT_STYLES[k];
  }
  return { bg: "rgba(59,130,246,0.08)", border: "#3B82F6", labelColor: "#2563EB", icon: <Info size={14} /> };
}

function SmartCallout({ label, text }: { label?: string; text: string }) {
  const s = getCalloutStyle(label);
  return (
    <aside
      className="my-6 flex gap-3 p-4 rounded-2xl"
      style={{ background: s.bg, borderLeft: `3px solid ${s.border}` }}
    >
      <span className="mt-0.5 shrink-0" style={{ color: s.border }}>{s.icon}</span>
      <div className="min-w-0">
        {label && (
          <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: s.labelColor }}>
            {label}
          </p>
        )}
        <p className="text-[14px] leading-[1.75]" style={{ color: "var(--ink-2)" }}>{text}</p>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   VISUAL TIMELINE TABLE
───────────────────────────────────────────── */
function getTimeIcon(time: string) {
  const h = parseInt(time.split(":")[0] ?? "12");
  if (h >= 5  && h < 9)  return <Sun     size={14} className="text-amber-400" />;
  if (h >= 9  && h < 13) return <BookOpen size={14} className="text-blue-500" />;
  if (h >= 13 && h < 17) return <Coffee  size={14} className="text-orange-400" />;
  if (h >= 17 && h < 20) return <BookOpen size={14} className="text-indigo-500" />;
  return <Moon size={14} className="text-violet-400" />;
}

function TimelineTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const isTimeBased = headers[0]?.toLowerCase() === "time";
  if (!isTimeBased) {
    /* Standard table */
    return (
      <div className="my-6 overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--line-soft)" }}>
        <table className="w-full text-[14px] border-collapse">
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-wider"
                  style={{ color: "var(--ink-3)", borderBottom: "1px solid var(--line-soft)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--line-soft)" : "none" }}
                className="transition-colors hover:bg-[var(--bg)]">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 leading-relaxed"
                    style={{ color: j === 0 ? "var(--ink-1)" : "var(--ink-3)" }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* Icon-based vertical timeline */
  return (
    <div className="my-6 flex flex-col gap-0">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-4 items-stretch">
          {/* Time + icon column */}
          <div className="flex flex-col items-center w-[90px] shrink-0">
            <div className="flex flex-col items-center gap-1 pt-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "var(--bg)", border: "1.5px solid var(--line-soft)" }}>
                {getTimeIcon(row[0] ?? "")}
              </div>
              <p className="text-[10px] font-bold text-center leading-tight" style={{ color: "var(--ink-4)" }}>
                {row[0]}
              </p>
            </div>
            {i < rows.length - 1 && (
              <div className="w-px flex-1 mt-1 mb-0" style={{ background: "var(--line-soft)", minHeight: 24 }} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 py-3 pb-5">
            <div className="p-3.5 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}>
              <p className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>{row[1]}</p>
              {row[2] && (
                <p className="text-[12px] mt-1 flex items-center gap-1" style={{ color: "var(--ink-4)" }}>
                  <Clock size={10} /> {row[2]}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   INTERACTIVE CHECKLIST
───────────────────────────────────────────── */
function ChecklistBlock({
  items, listKey, checked, onToggle, isOrdered,
}: {
  items: string[];
  listKey: string;
  checked: Set<string>;
  onToggle: (id: string) => void;
  isOrdered?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      {items.map((item, i) => {
        const id = `${listKey}_${i}`;
        const done = checked.has(id);
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className="flex items-start gap-3 text-left p-3 rounded-xl transition-all hover:bg-[var(--bg)] group"
            style={{ border: `1px solid ${done ? "rgba(34,197,94,0.3)" : "var(--line-soft)"}`, background: done ? "rgba(34,197,94,0.04)" : "transparent" }}
          >
            <span className="mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors"
              style={{ background: done ? "var(--green)" : "var(--bg)", border: `1.5px solid ${done ? "var(--green)" : "var(--line)"}` }}>
              {done && <Check size={11} className="text-white" strokeWidth={2.5} />}
            </span>
            <span className="flex-1 text-[14px] leading-[1.7] transition-colors"
              style={{ color: done ? "var(--ink-4)" : "var(--ink-2)", textDecoration: done ? "line-through" : "none" }}>
              {isOrdered && (
                <span className="font-bold mr-1.5" style={{ color: done ? "var(--ink-4)" : "var(--blue)" }}>
                  {i + 1}.
                </span>
              )}
              {item}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CONTENT BLOCK RENDERER
───────────────────────────────────────────── */
function RenderBlock({
  block, blockKey, checked, onToggle,
}: {
  block: ContentBlock;
  blockKey: string;
  checked: Set<string>;
  onToggle: (id: string) => void;
}) {
  switch (block.type) {
    case "h3":
      return (
        <h3 className="text-[16px] font-bold mt-7 mb-2.5" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
          {block.text}
        </h3>
      );
    case "p":
      return <p className="text-[16px] leading-[1.9] mb-5" style={{ color: "var(--ink-2)" }}>{block.text}</p>;
    case "ul":
      return (
        <ChecklistBlock
          items={block.items}
          listKey={blockKey}
          checked={checked}
          onToggle={onToggle}
        />
      );
    case "ol":
      return (
        <ChecklistBlock
          items={block.items}
          listKey={blockKey}
          checked={checked}
          onToggle={onToggle}
          isOrdered
        />
      );
    case "callout":
      return <SmartCallout label={block.label} text={block.text} />;
    case "formula":
      return (
        <div className="my-5 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--line-soft)" }}>
          <div className="px-5 py-4 font-mono text-[14px] leading-[1.75]" style={{ background: "var(--bg)", color: "var(--ink-1)" }}>
            {block.text}
          </div>
          {block.note && (
            <div className="px-5 py-2.5 text-[12px]" style={{ background: "var(--card)", color: "var(--ink-4)", borderTop: "1px solid var(--line-soft)" }}>
              ↳ {block.note}
            </div>
          )}
        </div>
      );
    case "table":
      return <TimelineTable headers={block.headers} rows={block.rows} />;
    case "video": {
      const youtubeId = getYouTubeId(block.url);
      return (
        <div className="my-6">
          {youtubeId ? (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--line-soft)", aspectRatio: "16/9" }}>
              <iframe src={`https://www.youtube.com/embed/${youtubeId}`} title={block.title ?? "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen className="w-full h-full" />
            </div>
          ) : (
            <a href={block.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:border-[var(--blue)]"
              style={{ border: "1px solid var(--line-soft)", background: "var(--card)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--red)" }}>
                <Play size={16} className="text-white ml-0.5" fill="white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ink-1)" }}>{block.title ?? "Watch video"}</p>
                <p className="text-[11px] truncate" style={{ color: "var(--ink-4)" }}>{block.source ?? "External video"}</p>
              </div>
              <ExternalLink size={14} style={{ color: "var(--ink-4)" }} />
            </a>
          )}
          {block.title && youtubeId && (
            <p className="text-[12px] mt-2 italic" style={{ color: "var(--ink-4)" }}>↳ {block.title}</p>
          )}
        </div>
      );
    }
    case "link-article": {
      const linked = ARTICLES.find((a) => a.slug === block.slug);
      if (!linked) return null;
      const meta = TYPE_META[linked.type];
      return (
        <Link href={`/blog/${linked.slug}`}
          className="my-5 flex items-center gap-3 p-4 rounded-2xl group transition-all hover:border-[var(--blue)]"
          style={{ border: "1px solid var(--line-soft)", background: "var(--card)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg, color: meta.color }}>
            {TYPE_ICONS_SM[linked.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--ink-4)" }}>{block.note ?? "Related article"}</p>
            <p className="text-[14px] font-semibold leading-snug group-hover:text-[var(--blue)] transition-colors line-clamp-1" style={{ color: "var(--ink-1)" }}>
              {linked.title}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-4)" }}>{linked.subject_tags[0]} · {linked.readTime}</p>
          </div>
          <ArrowRight size={15} className="shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" style={{ color: "var(--blue)" }} />
        </Link>
      );
    }
    case "external-link":
      return (
        <a href={block.url} target="_blank" rel="noopener noreferrer"
          className="my-5 flex items-center gap-3 p-4 rounded-2xl transition-all hover:border-[var(--blue)] group"
          style={{ border: "1px solid var(--line-soft)", background: "var(--card)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--bg)", color: "var(--ink-3)" }}>
            <ExternalLink size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--ink-4)" }}>External Resource</p>
            <p className="text-[14px] font-semibold group-hover:text-[var(--blue)] transition-colors line-clamp-1" style={{ color: "var(--ink-1)" }}>{block.title}</p>
            {block.note && <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--ink-4)" }}>{block.note}</p>}
          </div>
          <ArrowRight size={15} className="shrink-0 -rotate-45 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: "var(--blue)" }} />
        </a>
      );
    case "divider":
      return (
        <div className="my-10 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
          <div className="flex gap-1.5">{[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-full" style={{ background: "var(--line)" }} />)}</div>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
      );
    default: return null;
  }
}

/* ─────────────────────────────────────────────
   SECTION ACCORDION
───────────────────────────────────────────── */
const PHASE_GRADIENTS = [
  "linear-gradient(135deg,#1E40AF,#0891B2)",
  "linear-gradient(135deg,#6D28D9,#BE185D)",
  "linear-gradient(135deg,#065F46,#059669)",
];

function SectionAccordion({
  section, sectionIdx, isOpen, onToggle, checked, onCheckToggle, articleType,
}: {
  section: Section;
  sectionIdx: number;
  isOpen: boolean;
  onToggle: () => void;
  checked: Set<string>;
  onCheckToggle: (id: string) => void;
  articleType: Article["type"];
}) {
  const total   = countCheckable(section.blocks);
  const done    = total > 0 ? section.blocks.reduce((n, b, bi) => {
    if (b.type !== "ul" && b.type !== "ol") return n;
    const items = (b as any).items as string[];
    return n + items.filter((_, ii) => checked.has(`${section.id}_${bi}_${ii}`)).length;
  }, 0) : 0;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  const gradient = section.isPhase
    ? PHASE_GRADIENTS[(section.phaseNum ?? 1) - 1] ?? COVER_GRADIENTS[articleType]
    : COVER_GRADIENTS[articleType];

  return (
    <div
      className="mb-4 rounded-2xl overflow-hidden transition-all"
      style={{ border: `1px solid ${allDone ? "rgba(34,197,94,0.35)" : "var(--line-soft)"}` }}
      id={section.id}
    >
      {/* Header — click to toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
        style={{ background: isOpen ? "var(--bg)" : "var(--card)" }}
      >
        {/* Gradient accent dot */}
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: gradient }} />

        <h2
          className="flex-1 text-[17px] font-bold leading-snug scroll-mt-24"
          style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}
        >
          {section.heading}
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          {/* Progress badge */}
          {total > 0 && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: allDone ? "rgba(34,197,94,0.12)" : "var(--bg)",
                color: allDone ? "var(--green)" : "var(--ink-4)",
                border: `1px solid ${allDone ? "rgba(34,197,94,0.3)" : "var(--line-soft)"}`,
              }}
            >
              {allDone ? <><Check size={10} /> Done</> : <>{done}/{total}</>}
            </span>
          )}

          {/* Completion ring */}
          {total > 0 && !allDone && (
            <div className="relative w-7 h-7 shrink-0">
              <svg viewBox="0 0 28 28" className="w-full h-full -rotate-90">
                <circle cx="14" cy="14" r="11" fill="none" stroke="var(--line-soft)" strokeWidth="2.5" />
                <circle cx="14" cy="14" r="11" fill="none" stroke={gradient.includes("065F46") ? "#059669" : "#3B82F6"}
                  strokeWidth="2.5" strokeDasharray={`${2 * Math.PI * 11}`}
                  strokeDashoffset={`${2 * Math.PI * 11 * (1 - pct / 100)}`}
                  strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold" style={{ color: "var(--ink-3)" }}>
                {pct}%
              </span>
            </div>
          )}

          <ChevronDown
            size={16}
            className="transition-transform duration-200"
            style={{ color: "var(--ink-4)", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
          />
        </div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-5 pb-5 pt-2">
              {section.blocks.map((block, bi) => (
                <RenderBlock
                  key={bi}
                  block={block}
                  blockKey={`${section.id}_${bi}`}
                  checked={checked}
                  onToggle={onCheckToggle}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOC
───────────────────────────────────────────── */
function buildTOC(content: ContentBlock[]) {
  return content
    .filter((b): b is Extract<ContentBlock, { type: "h2" }> => b.type === "h2")
    .map((b) => ({ text: b.text, id: toId(b.text) }));
}

/* ─────────────────────────────────────────────
   RELATED CARD (enhanced with reason label)
───────────────────────────────────────────── */
function RelatedCard({ article, currentArticle }: { article: Article; currentArticle: Article }) {
  const meta = TYPE_META[article.type];
  const sharedSubjects = article.subject_tags.filter(s => currentArticle.subject_tags.includes(s));
  const sharedExams    = getExamTags(article.boardIds).filter(e => getExamTags(currentArticle.boardIds).includes(e));

  let reasonLabel = "Continue Reading";
  let reasonDetail = "";
  if (article.type === "Concept" && currentArticle.type === "Strategy") {
    reasonLabel = "Recommended Next";
    reasonDetail = `Build the concepts behind your strategy`;
  } else if (article.type === "Revision") {
    reasonLabel = "Quick Revision";
    reasonDetail = "High-yield, short revision note";
  } else if (sharedExams.length > 0) {
    reasonLabel = `Also for ${sharedExams[0]}`;
    reasonDetail = sharedSubjects[0] ?? "";
  } else if (sharedSubjects.length > 0) {
    reasonLabel = "Same Subject";
    reasonDetail = sharedSubjects[0];
  }

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
    >
      <div className="relative h-[68px] flex items-center justify-center overflow-hidden shrink-0"
        style={{ background: COVER_GRADIENTS[article.type] }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="opacity-60 text-white">
          {article.type === "Concept"  && <BookOpen  size={20} strokeWidth={1.5} />}
          {article.type === "Formula"  && <Zap       size={20} strokeWidth={1.5} />}
          {article.type === "Revision" && <RefreshCw size={20} strokeWidth={1.5} />}
          {article.type === "Strategy" && <Target    size={20} strokeWidth={1.5} />}
        </div>
        {/* Reason chip */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
          <p className="text-[9.5px] font-bold text-white uppercase tracking-wider truncate">{reasonLabel}</p>
        </div>
      </div>
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full w-fit"
          style={{ background: meta.bg, color: meta.color }}>
          {TYPE_ICONS_SM[article.type]} {meta.label}
        </span>
        <p className="text-[13px] font-semibold leading-snug line-clamp-2 flex-1 group-hover:text-[var(--blue)] transition-colors"
          style={{ color: "var(--ink-1)" }}>
          {article.title}
        </p>
        {reasonDetail && (
          <p className="text-[11px] italic" style={{ color: "var(--ink-4)" }}>{reasonDetail}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1 text-[11px]" style={{ color: "var(--ink-4)" }}>
          <Clock size={10} /> {article.readTime}
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   CHECKLIST localStorage helpers
───────────────────────────────────────────── */
function loadChecked(slug: string): Set<string> {
  try { return new Set<string>(JSON.parse(localStorage.getItem(`en_check_${slug}`) ?? "[]")); }
  catch { return new Set(); }
}
function saveChecked(slug: string, set: Set<string>) {
  try { localStorage.setItem(`en_check_${slug}`, JSON.stringify([...set])); } catch { /* ignore */ }
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router   = useRouter();
  const { user } = useAuth();

  const article = ARTICLES.find((a) => a.slug === slug);
  const isPaid  = !!(user as any)?.subscription;

  const [isBookmarked,   setIsBookmarked]   = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [activeHeading,  setActiveHeading]  = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isRead,         setIsRead]         = useState(false);
  const [showReadBanner, setShowReadBanner] = useState(false);
  const [openSections,   setOpenSections]   = useState<Set<number>>(new Set([0])); // first section open
  const [checked,        setChecked]        = useState<Set<string>>(new Set());
  const [showMobileTOC,  setShowMobileTOC]  = useState(false);
  const markedRef = useRef(false);

  const { preamble, sections } = article ? groupIntoSections(article.content) : { preamble: [], sections: [] };

  /* Load persisted state */
  useEffect(() => {
    if (!article) return;
    try {
      const bm = localStorage.getItem("library-bookmarks");
      if (bm) setIsBookmarked(new Set<string>(JSON.parse(bm)).has(article.id));
      const rd = localStorage.getItem("en_lib_read");
      if (rd) {
        const set = new Set<string>(JSON.parse(rd));
        if (set.has(article.slug)) { setIsRead(true); markedRef.current = true; }
      }
    } catch { /* ignore */ }
    setChecked(loadChecked(article.slug));
    // Default: open section 0; for non-strategy, open all
    if (article.type !== "Strategy") setOpenSections(new Set(sections.map((_, i) => i)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.slug]);

  const handleCheckToggle = useCallback((id: string) => {
    if (!article) return;
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveChecked(article.slug, next);
      return next;
    });
  }, [article]);

  const toggleSection = useCallback((idx: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback(() => {
    if (!article) return;
    setIsBookmarked(prev => {
      try {
        const saved = localStorage.getItem("library-bookmarks");
        const set = new Set<string>(saved ? JSON.parse(saved) : []);
        if (prev) set.delete(article.id); else set.add(article.id);
        localStorage.setItem("library-bookmarks", JSON.stringify([...set]));
      } catch { /* ignore */ }
      return !prev;
    });
  }, [article]);

  const handleShare = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const markRead = useCallback(() => {
    if (!article || markedRef.current) return;
    markedRef.current = true;
    setIsRead(true);
    setShowReadBanner(true);
    setTimeout(() => setShowReadBanner(false), 4000);
    try {
      const raw = localStorage.getItem("en_lib_read");
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      set.add(article.slug);
      localStorage.setItem("en_lib_read", JSON.stringify([...set]));
    } catch { /* ignore */ }
  }, [article]);

  useEffect(() => {
    if (!article) return;
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActiveHeading(e.target.id); }); },
      { rootMargin: "-10% 0px -75% 0px" }
    );
    document.querySelectorAll("[id]").forEach((el) => {
      if (sections.some(s => s.id === el.id)) observer.observe(el);
    });
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct   = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0;
      setScrollProgress(pct);
      if (pct >= 80) markRead();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { observer.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, [article, markRead, sections]);

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <BookOpen size={40} style={{ color: "var(--ink-4)" }} />
        <h1 className="text-[20px] font-bold" style={{ color: "var(--ink-1)" }}>Article not found</h1>
        <Link href="/blog" className="text-[13px] font-semibold" style={{ color: "var(--blue)" }}>← Back to Blog</Link>
      </div>
    );
  }

  const meta    = TYPE_META[article.type];
  const toc     = buildTOC(article.content);
  const related = ARTICLES
    .filter((a) => a.slug !== article.slug && (a.type === article.type || a.subject_tags.some(s => article.subject_tags.includes(s))))
    .slice(0, 3);

  /* Total checklist progress */
  const totalCheckable = sections.reduce((n, s) => n + countCheckable(s.blocks), 0);
  const totalDone = totalCheckable > 0 ? [...checked].filter(id => sections.some(s => id.startsWith(s.id + "_"))).length : 0;
  const overallPct = totalCheckable > 0 ? Math.round((totalDone / totalCheckable) * 100) : 0;

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-50">
        <div className="h-full transition-all duration-100"
          style={{ width: `${scrollProgress}%`, background: COVER_GRADIENTS[article.type] }} />
      </div>

      {/* Auto-read toast */}
      <AnimatePresence>
        {showReadBanner && (
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl"
            style={{ transform: "translateX(-50%)", background: "var(--card)", border: "1px solid rgba(34,197,94,0.25)", boxShadow: "0 12px 40px -8px rgba(0,0,0,0.25)" }}
          >
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--green)" }}>
              <Check size={14} className="text-white" />
            </span>
            <div>
              <p className="text-[13px] font-bold" style={{ color: "var(--ink-1)" }}>Article marked as read ✓</p>
              <p className="text-[11px]" style={{ color: "var(--ink-4)" }}>Progress saved automatically</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile TOC sheet */}
      <AnimatePresence>
        {showMobileTOC && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowMobileTOC(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 38 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6"
              style={{ background: "var(--card)", maxHeight: "70vh", overflowY: "auto" }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--line)" }} />
              <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-4)" }}>Jump to section</p>
              <nav className="flex flex-col gap-1">
                {toc.map(item => (
                  <a key={item.id} href={`#${item.id}`} onClick={() => setShowMobileTOC(false)}
                    className="py-3 px-4 rounded-xl text-[14px] font-medium transition-colors"
                    style={{ color: "var(--ink-2)", background: "var(--bg)" }}>
                    {item.text}
                  </a>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fade-up" style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* Back + mobile TOC button */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:text-[var(--ink-1)]"
            style={{ color: "var(--ink-4)" }}>
            <ArrowLeft size={14} /> Blog
          </button>
          {toc.length > 1 && (
            <button
              onClick={() => setShowMobileTOC(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              style={{ background: "var(--card)", color: "var(--ink-3)", border: "1px solid var(--line-soft)" }}
            >
              <Hash size={12} /> Jump to section
            </button>
          )}
        </div>

        {/* Hero cover */}
        <div className="relative w-full rounded-3xl overflow-hidden mb-8"
          style={{ background: COVER_GRADIENTS[article.type], minHeight: 240 }}>
          <div className="absolute inset-0"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.12] text-white pointer-events-none">
            {COVER_ICONS_LG[article.type]}
          </div>
          <div className="relative z-10 flex flex-col justify-between p-7 sm:p-8 min-h-[240px]">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)" }}>
                {TYPE_ICONS_SM[article.type]} {meta.label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.9)" }} />
                {article.difficulty}
              </span>
              {isRead && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.3)", color: "#d1fae5", backdropFilter: "blur(8px)" }}>
                  <Check size={11} /> Completed
                </span>
              )}
              {/* Overall checklist progress */}
              {totalCheckable > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full ml-auto"
                  style={{ background: "rgba(255,255,255,0.15)", color: "#fff", backdropFilter: "blur(8px)" }}>
                  <CheckSquare size={11} /> {overallPct}% complete
                </span>
              )}
            </div>

            {/* Title */}
            <div className="mt-auto pt-5">
              <h1 className="text-[26px] sm:text-[32px] font-extrabold leading-[1.2] tracking-tight text-white mb-2.5"
                style={{ fontFamily: "var(--font-sora)", textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                {article.title}
              </h1>
              <p className="text-[14px] leading-[1.5] font-light" style={{ color: "rgba(255,255,255,0.8)" }}>
                {article.description}
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-10 items-start">

          {/* ── Article column ── */}
          <article className="flex-1 min-w-0" style={{ maxWidth: 700 }}>

            {/* Meta strip */}
            <div className="flex items-center gap-3 flex-wrap mb-7 pb-5 text-[12px]"
              style={{ borderBottom: "1px solid var(--line-soft)", color: "var(--ink-4)" }}>
              <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(article.publishedAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-1.5"><Clock size={12} /> {article.readTime} read</span>
              {getExamTags(article.boardIds).length > 0 && (
                <>
                  <span>·</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {getExamTags(article.boardIds).slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "var(--bg)", color: "var(--ink-3)", border: "1px solid var(--line-soft)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <div className="flex-1" />
              {/* Mobile-friendly action buttons */}
              <button onClick={toggleBookmark}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all min-w-[80px] justify-center sm:min-w-0"
                style={{
                  background: isBookmarked ? "var(--blue-soft)" : "var(--bg)",
                  color: isBookmarked ? "var(--blue)" : "var(--ink-3)",
                  border: "1px solid var(--line-soft)",
                }}>
                {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                <span className="font-semibold">{isBookmarked ? "Saved" : "Save"}</span>
              </button>
              <button onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all min-w-[80px] justify-center sm:min-w-0"
                style={{ background: "var(--bg)", color: "var(--ink-3)", border: "1px solid var(--line-soft)" }}>
                <Share2 size={13} />
                <span className="font-semibold">{copied ? "Copied!" : "Share"}</span>
              </button>
            </div>

            {/* Topic tags */}
            {article.topic_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-7">
                {article.topic_tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "var(--bg)", color: "var(--ink-3)", border: "1px solid var(--line-soft)" }}>
                    <Hash size={9} /> {t}
                  </span>
                ))}
              </div>
            )}

            {/* Preamble (before first h2) */}
            {preamble.map((block, i) => (
              <RenderBlock key={i} block={block} blockKey={`preamble_${i}`} checked={checked} onToggle={handleCheckToggle} />
            ))}

            {/* Sections — accordions */}
            {sections.length > 0 && (
              <div className="mt-6">
                {/* "Expand all / Collapse all" for strategy articles */}
                {article.type === "Strategy" && sections.length > 1 && (
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px] font-semibold" style={{ color: "var(--ink-4)" }}>
                      {sections.length} sections · {totalDone}/{totalCheckable} tasks done
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setOpenSections(new Set(sections.map((_, i) => i)))}
                        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all"
                        style={{ color: "var(--blue)", background: "var(--blue-soft)" }}>
                        Expand all
                      </button>
                      <button onClick={() => setOpenSections(new Set())}
                        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:bg-[var(--bg)]"
                        style={{ color: "var(--ink-4)", background: "var(--card)", border: "1px solid var(--line-soft)" }}>
                        Collapse all
                      </button>
                    </div>
                  </div>
                )}

                {sections.map((section, i) => (
                  <SectionAccordion
                    key={section.id}
                    section={section}
                    sectionIdx={i}
                    isOpen={openSections.has(i)}
                    onToggle={() => toggleSection(i)}
                    checked={checked}
                    onCheckToggle={handleCheckToggle}
                    articleType={article.type}
                  />
                ))}
              </div>
            )}

            {/* Footer CTA */}
            <footer className="mt-14 pt-7 space-y-4" style={{ borderTop: "1px solid var(--line-soft)" }}>
              {isPaid ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl"
                  style={{ background: "linear-gradient(135deg, var(--blue-soft), rgba(139,92,246,0.06))", border: "1px solid rgba(59,130,246,0.18)" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--blue)", color: "#fff" }}>
                    <FlaskConical size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold" style={{ color: "var(--ink-1)" }}>Test your understanding</p>
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-3)" }}>Take a quick quiz based on this article.</p>
                  </div>
                  <button
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[14px] font-bold text-white transition-all hover:brightness-110"
                    style={{ background: "var(--blue)" }}
                    onClick={() => alert("Article test — coming soon!")}>
                    <FlaskConical size={15} /> Take Test
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl"
                  style={{ background: "var(--bg)", border: "1px solid var(--line-soft)" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--card)", color: "var(--ink-4)", border: "1px solid var(--line-soft)" }}>
                    <Lock size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold" style={{ color: "var(--ink-2)" }}>Test your understanding</p>
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-4)" }}>Article quizzes available for Pro users.</p>
                  </div>
                  <Link href="/dashboard/plans"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[14px] font-bold text-white transition-all hover:brightness-110"
                    style={{ background: "linear-gradient(135deg, var(--blue), var(--cyan))" }}>
                    <Sparkles size={14} /> Upgrade to Pro
                  </Link>
                </div>
              )}

              {/* Save / Share — large mobile targets */}
              <div className="flex gap-3">
                <button onClick={toggleBookmark}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold transition-all"
                  style={{
                    background: isBookmarked ? "var(--blue-soft)" : "var(--bg)",
                    color: isBookmarked ? "var(--blue)" : "var(--ink-2)",
                    border: "1.5px solid var(--line-soft)",
                  }}>
                  {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  {isBookmarked ? "Saved" : "Save for later"}
                </button>
                <button onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold transition-all"
                  style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1.5px solid var(--line-soft)" }}>
                  <Share2 size={16} /> {copied ? "Link copied!" : "Share"}
                </button>
              </div>
            </footer>

            {/* Related articles */}
            {related.length > 0 && (
              <section className="mt-14 pt-7" style={{ borderTop: "1px solid var(--line-soft)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[15px] font-bold" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
                    Continue your preparation
                  </h2>
                  <Link href="/blog" className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: "var(--ink-4)" }}>
                    All posts <ChevronRight size={13} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {related.map(a => <RelatedCard key={a.slug} article={a} currentArticle={article} />)}
                </div>
              </section>
            )}

            <div className="h-20" />
          </article>

          {/* ── Sticky sidebar ── */}
          <aside className="hidden lg:flex flex-col gap-4 w-52 shrink-0 sticky top-20">

            {/* Reading progress */}
            <div className="p-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>Reading</p>
                <span className="text-[11px] font-bold tabular-nums" style={{ color: "var(--blue)" }}>{Math.round(scrollProgress)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${scrollProgress}%`, background: COVER_GRADIENTS[article.type] }} />
              </div>
              {isRead && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  <Check size={11} style={{ color: "var(--green)" }} />
                  <span className="text-[11px] font-semibold" style={{ color: "var(--green)" }}>Completed</span>
                </div>
              )}
            </div>

            {/* Checklist progress */}
            {totalCheckable > 0 && (
              <div className="p-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>Tasks</p>
                  <span className="text-[11px] font-bold" style={{ color: overallPct === 100 ? "var(--green)" : "var(--blue)" }}>
                    {totalDone}/{totalCheckable}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${overallPct}%`, background: overallPct === 100 ? "var(--green)" : COVER_GRADIENTS[article.type] }} />
                </div>
                {overallPct === 100 && (
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <Trophy size={11} style={{ color: "var(--amber)" }} />
                    <span className="text-[11px] font-semibold" style={{ color: "var(--amber)" }}>All done!</span>
                  </div>
                )}
              </div>
            )}

            {/* TOC */}
            {toc.length > 1 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: "var(--ink-4)" }}>On this page</p>
                <nav className="flex flex-col gap-0.5">
                  {toc.map(item => (
                    <a key={item.id} href={`#${item.id}`}
                      className="text-[12px] leading-snug py-1.5 px-3 rounded-lg transition-all block"
                      style={{
                        color: activeHeading === item.id ? "var(--blue)" : "var(--ink-4)",
                        background: activeHeading === item.id ? "var(--blue-soft)" : "transparent",
                        fontWeight: activeHeading === item.id ? 600 : 400,
                        borderLeft: `2px solid ${activeHeading === item.id ? "var(--blue)" : "var(--line-soft)"}`,
                      }}>
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex flex-col gap-2">
              <button onClick={toggleBookmark}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all w-full"
                style={{
                  background: isBookmarked ? "var(--blue-soft)" : "var(--card)",
                  color: isBookmarked ? "var(--blue)" : "var(--ink-3)",
                  border: "1px solid var(--line-soft)",
                }}>
                {isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {isBookmarked ? "Saved" : "Save article"}
              </button>
              <button onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all w-full"
                style={{ background: "var(--card)", color: "var(--ink-3)", border: "1px solid var(--line-soft)" }}>
                <Share2 size={13} /> {copied ? "Link copied!" : "Share"}
              </button>
            </div>

            <Link href="/blog"
              className="flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-[var(--blue)] px-1"
              style={{ color: "var(--ink-4)" }}>
              <ArrowLeft size={13} /> All blog posts
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}
