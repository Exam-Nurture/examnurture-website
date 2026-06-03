"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AuthModal from "@/components/auth/AuthModal";
import {
  ArrowRight,
  BookOpen,
  Star,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  MapPin,
  Library,
  ClipboardList,
  ScrollText,
  Building2,
  QrCode,
  Smartphone,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/lib/config";

const API_URL = API_BASE;
const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=com.kvebrk.rwwkrt";

/*
 * Figma Design System applied to ExamNurture landing page.
 *
 * Tokens used (DESIGN.md):
 *   figmaSans  → Plus Jakarta Sans  (var(--font-inter))
 *   figmaMono  → JetBrains Mono     (var(--font-mono))
 *   display-xl → 86px / weight 300  / ls -1.72px / lh 1.00
 *   display-lg → 64px / weight 300  / ls -0.96px / lh 1.10
 *   body-lg    → 20px / weight 330  / ls -0.14px / lh 1.40
 *   body       → 18px / weight 300  / ls -0.26px / lh 1.45
 *   button     → 20px / weight 500  / ls -0.10px / lh 1.40
 *   eyebrow    → mono · 11px · uppercase · ls +0.60px
 *   caption    → mono · 12px · uppercase · ls +0.60px
 *
 *   canvas         #ffffff   surface-soft  #f7f7f5   hairline  #e6e6e6
 *   primary        #000000   inverse       #1f1d3d
 *   block-lime     #dceeb1   block-cream   #f4ecd6
 *
 * Page rhythm: white hero → black marquee → white features →
 *              lime exam-categories block → cream testimonials block →
 *              navy CTA block
 */

const FEATURE_EMOJIS = ["📝", "📚", "📰", "🏛️"];

const features = [
  { icon: FileText,      title: "Full-Length Test Series", desc: "CBT-style exams with real exam interface, auto-timer, and question palette — just like the actual test.",          href: "/series/all"  },
  { icon: BookOpen,      title: "Previous Year Papers",    desc: "Thousands of PYQ papers with detailed solutions across JPSC, Banking, SSC, Railway, and more.",                   href: "/pyq/all"     },
  { icon: Library,       title: "Blogs",                   desc: "Expert articles, preparation tips, exam strategies, and latest updates on government exams.",                     href: "/blogs"  },
  { icon: GraduationCap, title: "Exams",                   desc: "Browse all exams — syllabus, exam pattern, eligibility, important dates, and preparation resources.",             href: "/exams" },
];



const planHighlights = [
  "Unlimited Test Series",
  "Full PYQ Access",
  "AI Weak Area Analysis",
  "Real-time Percentile",
  "Detailed Solutions",
];

/* ── Dynamic data hooks (fetch from Test_Backend, fallback to static) ── */

interface FeaturedExam {
  name: string; tag: string; slug: string | null; state: string | null;
  board: string | null; description: string | null; numTests: number; numPYQ: number;
}

function useFeaturedExams(): FeaturedExam[] {
  const [data, setData] = useState<FeaturedExam[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/featured-exams`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((items: FeaturedExam[]) => { if (items?.length) setData(items); })
      .catch(() => {});
  }, []);
  return data;
}

interface TestimonialData {
  name: string; role: string; initials: string; text: string;
  rating?: number; avatarUrl?: string | null;
}

function useTestimonials(): TestimonialData[] {
  const [data, setData] = useState<TestimonialData[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/testimonials`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((items: TestimonialData[]) => { if (items?.length) setData(items); })
      .catch(() => {});
  }, []);
  return data;
}

interface FAQData { question: string; answer: string; }

function useFAQs(): FAQData[] {
  const [data, setData] = useState<FAQData[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/faqs?category=landing-page`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((items) => { if (items) setData(items); })
      .catch(() => {});
  }, []);
  return data;
}

/* ── Stats ── */
interface PlatformStats {
  examBoards: number; exams: number; languages: number; tests: number;
  testSeries: number; pyqPapers: number; users: number; states: number; courses: number;
}

function useStats(): { stats: PlatformStats | null; loading: boolean } {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/stats`);
        if (!res.ok) throw new Error("Failed");
        setStats(await res.json());
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { stats, loading };
}

/* ─────────────────────────────────────────────────────────────
   Shared primitives
───────────────────────────────────────────────────────────── */

/* Eyebrow — figmaMono, uppercase, positive tracking */
function Eyebrow({ children, inverse = false }: { children: React.ReactNode; inverse?: boolean }) {
  return (
    <p
      className={`text-[11px] font-normal uppercase mb-5 ${inverse ? "text-white/50" : "text-[#8D8D8F] dark:text-[var(--ink-3)]"}`}
      style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}
    >
      {children}
    </p>
  );
}

/* Primary pill — black bg, white text */
function BtnPrimary({
  onClick, href, children, inverse = false,
}: { onClick?: () => void; href?: string; children: React.ReactNode; inverse?: boolean }) {
  const cls = `inline-flex items-center gap-2 px-5 py-[10px] rounded-full transition-colors text-[18px] leading-[1.40] ${
    inverse
      ? "bg-white text-[#0D287E] hover:bg-[#EAE8EC] dark:bg-[var(--ink-1)] dark:text-[var(--bg)] dark:hover:bg-[var(--ink-2)]"
      : "bg-[#0D287E] text-white hover:bg-[#0A2070] dark:bg-[var(--blue)] dark:text-white dark:hover:bg-[var(--blue-ink)]"
  }`;
  const sty = { fontWeight: 480, letterSpacing: "-0.10px" };
  if (href) return <Link href={href}><button className={cls} style={sty}>{children}</button></Link>;
  return <button onClick={onClick} className={cls} style={sty}>{children}</button>;
}

/* Secondary pill — white bg, hairline border */
function BtnSecondary({
  onClick, href, children, onDark = false,
}: { onClick?: () => void; href?: string; children: React.ReactNode; onDark?: boolean }) {
  const cls = `inline-flex items-center gap-2 px-[18px] py-[8px] pb-[10px] rounded-full transition-colors text-[18px] leading-[1.40] ${
    onDark
      ? "bg-transparent border border-white/30 text-white hover:bg-white/10"
      : "bg-white border border-[#EAE8EC] text-[#2C2C2E] hover:bg-[#EAE8EC] dark:bg-[var(--card)] dark:border-[var(--line-soft)] dark:text-[var(--ink-1)] dark:hover:bg-[var(--bg)]"
  }`;
  const sty = { fontWeight: 480, letterSpacing: "-0.10px" };
  if (href) return <Link href={href}><button className={cls} style={sty}>{children}</button></Link>;
  return <button onClick={onClick} className={cls} style={sty}>{children}</button>;
}

/* Split "Download App" pill — text + QR-code box with hover popup */
function DownloadAppBtn({ inverse = false }: { inverse?: boolean }) {
  const [showQR, setShowQR] = useState(false);

  /* Free QR code API — static URL, no deps needed */
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(PLAYSTORE_URL)}&bgcolor=ffffff&color=000000&margin=10&format=png`;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShowQR(true)}
      onMouseLeave={() => setShowQR(false)}
      onFocus={() => setShowQR(true)}
      onBlur={() => setShowQR(false)}
    >
      <a
        href={PLAYSTORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center rounded-full overflow-hidden transition-all duration-200 group ${
          inverse
            ? "border border-white/30 hover:border-white/60"
            : "border border-[#EAE8EC] hover:border-[#0D287E]"
        }`}
      >
        {/* Label */}
        <span
          className={`flex items-center gap-2 pl-5 pr-4 py-[10px] text-[18px] leading-[1.40] transition-colors ${
            inverse ? "text-white" : "text-[#2C2C2E]"
          }`}
          style={{ fontWeight: 480, letterSpacing: "-0.10px" }}
        >
          <Smartphone className="w-4 h-4 flex-shrink-0" />
          Download App
        </span>
        {/* QR icon — split box that fills on hover */}
        <span
          className={`flex items-center justify-center w-11 h-full py-[10px] border-l transition-colors ${
            inverse
              ? "border-white/20 bg-white/10 group-hover:bg-white/20"
              : `border-[#EAE8EC] bg-[#EAE8EC] ${showQR ? "bg-[#0D287E] border-[#0D287E]" : "group-hover:bg-[#0D287E] group-hover:border-[#0D287E]"}`
          }`}
        >
          <QrCode
            className={`w-5 h-5 transition-colors ${
              inverse
                ? "text-white/70"
                : showQR ? "text-white" : "text-[#2C2C2E] group-hover:text-white"
            }`}
          />
        </span>
      </a>

      {/* QR popup — appears above the button on hover */}
      {showQR && (
        <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div
            className="bg-white dark:bg-[var(--card)] rounded-[16px] p-4 border border-[#EAE8EC] dark:border-[var(--line-soft)] w-[192px]"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImgSrc}
              alt="Scan to download ExamNurture app"
              width={160}
              height={160}
              className="w-full rounded-[8px]"
            />
            <p
              className="text-center text-[10px] text-[#8D8D8F] mt-3 leading-none"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.5px", textTransform: "uppercase" }}
            >
              Scan to download
            </p>
          </div>
          {/* Caret arrow */}
          <div className="flex justify-center -mt-[7px]">
            <div className="w-3.5 h-3.5 bg-white border-r border-b border-[#EAE8EC] rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HERO — white canvas, display-xl, centered
───────────────────────────────────────────────────────────── */
function HeroSection({ onLogin, stats }: { onLogin: () => void; stats: PlatformStats | null }) {
  const { user, loading: authLoading } = useAuth();

  return (
    <section className="hero-atmospheric bg-white dark:bg-[var(--bg)] py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">


        {/* display-xl: 86px / weight 300 / ls -1.72px / lh 1.00 */}
        <h1
          className="text-[48px] sm:text-[64px] lg:text-[86px] leading-[1] text-[#2C2C2E] dark:text-[var(--ink-1)] mb-8"
          style={{ fontWeight: 300, letterSpacing: "-1.72px" }}
        >
          Master Any Exam.<br />Crack Your Dream Job.
        </h1>

        {/* body-lg: 20px / weight 330 / ls -0.14px */}
        <p
          className="text-[18px] sm:text-[20px] text-[#666872] dark:text-[var(--ink-2)] mb-12 max-w-xl mx-auto leading-[1.40]"
          style={{ fontWeight: 330, letterSpacing: "-0.14px" }}
        >
          Full-length mock tests, PYQ papers, and AI analytics — everything you need to crack JPSC, Banking, SSC, Railway and more.
        </p>

        {/* CTA pair: primary action + "Download App" split button */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 mb-16">
          {authLoading ? (
            <>
              <div className="h-12 w-48 rounded-full bg-[#EAE8EC] dark:bg-[var(--line-soft)] animate-pulse" />
              <div className="h-12 w-48 rounded-full bg-[#EAE8EC] dark:bg-[var(--line-soft)] animate-pulse" />
            </>
          ) : user ? (
            <>
              <BtnPrimary href="/dashboard">Go to Dashboard <ArrowRight className="w-5 h-5" /></BtnPrimary>
              <BtnSecondary href="/pyq/all"><FileText className="w-4 h-4 text-emerald-500" /> Free PYQ</BtnSecondary>
              <BtnSecondary href="/daily-quiz"><Sparkles className="w-4 h-4 text-amber-500" /> Free Daily Quiz</BtnSecondary>
              <DownloadAppBtn />
            </>
          ) : (
            <>
              <BtnPrimary onClick={onLogin}>Get Started Free <ArrowRight className="w-5 h-5" /></BtnPrimary>
              <BtnSecondary href="/pyq/all"><FileText className="w-4 h-4 text-emerald-500" /> Free PYQ</BtnSecondary>
              <BtnSecondary href="/daily-quiz"><Sparkles className="w-4 h-4 text-amber-500" /> Free Daily Quiz</BtnSecondary>
              <DownloadAppBtn />
            </>
          )}
        </div>

        {/* Stats row — display-lg numbers, figmaMono labels */}
        <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-16 pt-8 border-t border-[#EAE8EC] dark:border-[var(--line-soft)]">
          {[
            { value: stats?.users ? `${stats.users}+` : "0", label: "Students Preparing" },
            { value: stats?.exams ? `${stats.exams}+` : "0",  label: "Exams Covered"      },
            { value: stats?.pyqPapers ? `${stats.pyqPapers}+` : "0", label: "PYQ Papers"         },
            { value: stats?.testSeries ? `${stats.testSeries}+` : "0", label: "Test Series"        },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div
                className="text-[36px] sm:text-[48px] leading-none text-[#2C2C2E] dark:text-[var(--ink-1)] tabular-nums"
                style={{ fontWeight: 300, letterSpacing: "-0.96px" }}
              >
                {value}
              </div>
              <div
                className="mt-2 text-[11px] uppercase text-[#8D8D8F] dark:text-[var(--ink-3)]"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   MARQUEE STRIP — black ribbon (inverse-canvas)
   marquee-strip token: bg #000, text white, mono, 36px tall
───────────────────────────────────────────────────────────── */
function MarqueeStrip({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;
  const doubled = [...items, ...items, ...items, ...items];
  return (
    <div className="h-14 bg-black dark:bg-[#12151C] border-y border-black dark:border-[rgba(255,255,255,0.05)] overflow-hidden flex items-center select-none pointer-events-none" aria-hidden="true">
      <div className="en-marquee flex gap-16 whitespace-nowrap">
        {doubled.map((name, i) => (
          <span
            key={i}
            className="text-white text-[14px] uppercase font-bold"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "1px" }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FEATURE CARD ILLUSTRATIONS — minimal single-colour line art
───────────────────────────────────────────────────────────── */
function IllustrationTestSeries({ className = "" }: { className?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className}>
      <rect x="8" y="4" width="24" height="34" rx="3" stroke="currentColor" strokeWidth="1.75"/>
      <line x1="13" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      <line x1="13" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      <path d="M13 29.5l3.5 3.5 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IllustrationPYQ({ className = "" }: { className?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className}>
      <rect x="14" y="10" width="20" height="26" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="5" width="20" height="26" rx="2.5" stroke="currentColor" strokeWidth="1.75"/>
      <line x1="14" y1="13" x2="24" y2="13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      <line x1="14" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      <line x1="14" y1="23" x2="19" y2="23" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  );
}

function IllustrationBlog({ className = "" }: { className?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className}>
      <rect x="5" y="7" width="34" height="30" rx="3" stroke="currentColor" strokeWidth="1.75"/>
      <line x1="5" y1="15" x2="39" y2="15" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10.5" cy="11" r="1.5" fill="currentColor"/>
      <circle cx="15.5" cy="11" r="1.5" fill="currentColor"/>
      <circle cx="20.5" cy="11" r="1.5" fill="currentColor"/>
      <line x1="11" y1="21.5" x2="33" y2="21.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      <line x1="11" y1="26" x2="33" y2="26" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      <line x1="11" y1="30.5" x2="24" y2="30.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  );
}

function IllustrationExams({ className = "" }: { className?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className}>
      <path d="M22 8L39 16L22 24L5 16Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
      <path d="M13 21v9c0 3.5 4 6 9 6s9-2.5 9-6v-9" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
      <line x1="39" y1="16" x2="39" y2="27" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      <circle cx="39" cy="29" r="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

const FEATURE_ILLUSTRATIONS = [IllustrationTestSeries, IllustrationPYQ, IllustrationBlog, IllustrationExams];

const FEATURE_ACCENT = [
  { iconBg: "bg-[#EEF2FF] dark:bg-[rgba(79,70,229,0.12)]",  iconText: "text-[#3730A3] dark:text-[#818CF8]", tag: "CBT Interface",   hoverBgLight: "#EEF2FF", hoverBgDark: "rgba(79,70,229,0.06)",  spotlightRgb: "99,102,241"  },
  { iconBg: "bg-[#D1FAE5] dark:bg-[rgba(5,150,105,0.12)]",  iconText: "text-[#065F46] dark:text-[#34D399]", tag: "With Solutions",  hoverBgLight: "#ECFDF5", hoverBgDark: "rgba(5,150,105,0.06)",  spotlightRgb: "16,185,129"  },
  { iconBg: "bg-[#FEF3C7] dark:bg-[rgba(217,119,6,0.12)]",  iconText: "text-[#92400E] dark:text-[#FCD34D]", tag: "Expert Articles", hoverBgLight: "#FFFBEB", hoverBgDark: "rgba(217,119,6,0.06)",  spotlightRgb: "245,158,11"  },
  { iconBg: "bg-[#EDE9FE] dark:bg-[rgba(124,58,237,0.12)]", iconText: "text-[#5B21B6] dark:text-[#A78BFA]", tag: "50+ Exams",       hoverBgLight: "#F5F3FF", hoverBgDark: "rgba(124,58,237,0.06)", spotlightRgb: "139,92,246"  },
];

/* ─────────────────────────────────────────────────────────────
   SPOTLIGHT CARD — cursor-tracked border glow + inner radial
   design-taste: "Spotlight Border Card" pattern
───────────────────────────────────────────────────────────── */
function SpotlightCard({
  children,
  hoverBgLight,
  spotlightRgb,
  className = "",
}: {
  children: React.ReactNode;
  hoverBgLight: string;
  spotlightRgb: string;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos]       = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!outerRef.current) return;
    const r = outerRef.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  return (
    <div
      ref={outerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative p-px rounded-[26px] transition-all duration-300 ${className}`}
      style={{
        background: hovered
          ? `radial-gradient(380px at ${pos.x}px ${pos.y}px, rgba(${spotlightRgb},0.35), transparent 65%)`
          : "rgba(226,232,240,0.65)",
        transform: hovered ? "translateY(-10px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 28px 64px -12px rgba(${spotlightRgb},0.18), 0 10px 24px -8px rgba(${spotlightRgb},0.10)`
          : "0 20px 40px -15px rgba(0,0,0,0.04)",
      }}
    >
      {/* Card surface */}
      <div
        className="relative bg-white dark:bg-[var(--card)] rounded-[25px] h-full flex flex-col overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: hovered ? hoverBgLight : undefined }}
      >
        {/* Inner radial glow follows cursor */}
        <div
          className="absolute inset-0 rounded-[25px] pointer-events-none transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: `radial-gradient(300px at ${pos.x}px ${pos.y}px, rgba(${spotlightRgb},0.07), transparent 70%)`,
          }}
        />
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FEATURES — Marc Lou H2 + design-taste bento + spotlight cards
───────────────────────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#f9fafb] dark:bg-[var(--bg)]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">

        {/* Section header — Marc Lou badge + font-black H2 */}
        <div className="mb-16 max-w-2xl mx-auto text-center">

          {/* Marc Lou rule: font-black, leading-none, -0.03em */}
          <h2 className="text-[32px] sm:text-[48px] font-black leading-none tracking-[-0.03em] text-[#1d1d1b] dark:text-[var(--ink-1)] mb-5">
            One platform.<br />Complete prep.
          </h2>
          <p className="text-[17px] text-gray-500 dark:text-[var(--ink-3)] leading-relaxed max-w-[42ch] mx-auto">
            Tests, papers, insights, and exam guides — all in one place for serious aspirants.
          </p>
        </div>

        {/* Bento grid — staggered reveal + spotlight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
          {features.map((f, i) => {
            const Illus  = FEATURE_ILLUSTRATIONS[i];
            const accent = FEATURE_ACCENT[i];
            const isWide = i === 0 || i === 3;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                className={`group ${isWide ? "lg:col-span-3" : "lg:col-span-2"}`}
              >
                <Link href={f.href} className="block h-full">
                  <SpotlightCard
                    hoverBgLight={accent.hoverBgLight}
                    spotlightRgb={accent.spotlightRgb}
                    className="h-full"
                  >
                    <div className="p-7 lg:p-8 flex flex-col" style={{ minHeight: "240px" }}>

                      {/* Icon + tag row */}
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${accent.iconBg}`}>
                          <Illus className={accent.iconText} />
                        </div>
                        <span
                          className="text-[11px] px-2.5 py-1 rounded-full bg-white/70 dark:bg-[var(--bg)] text-gray-400 dark:text-[var(--ink-3)] border border-gray-200 dark:border-[var(--line-soft)] whitespace-nowrap transition-all duration-200 group-hover:text-[#0D287E] group-hover:border-[#0D287E]/25 dark:group-hover:text-[var(--blue)]"
                          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.3px" }}
                        >
                          {accent.tag}
                        </span>
                      </div>

                      {/* Title — design-taste: tracking-tight, bold */}
                      <h3 className="text-[19px] font-bold tracking-[-0.02em] text-[#1d1d1b] dark:text-[var(--ink-1)] mb-3 leading-[1.25]">
                        {f.title}
                      </h3>

                      {/* Description */}
                      <p className="text-[14.5px] text-gray-500 dark:text-[var(--ink-3)] leading-[1.68] flex-1">
                        {f.desc}
                      </p>

                      {/* CTA row — gap widens, arrow slides on hover */}
                      <div className="mt-7 pt-5 border-t border-gray-100 dark:border-[rgba(255,255,255,0.06)] flex items-center gap-1.5 group-hover:gap-3 text-[13px] font-semibold text-[#0D287E] dark:text-[var(--blue)] transition-all duration-200">
                        Explore
                        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </SpotlightCard>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   EXAM CATEGORIES — lime color-block section (#dceeb1)
   Rounded 24px on desktop · full-bleed below 768px
───────────────────────────────────────────────────────────── */
function ExamCategoriesSection({ examCategories }: { examCategories: FeaturedExam[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [trackX, setTrackX]       = useState(0);
  const viewportRef    = useRef<HTMLDivElement | null>(null);
  const tabContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs        = useRef<Record<number, HTMLButtonElement | null>>({});
  const activeIdxRef   = useRef(0);

  const GAP = 16;

  const computeX = useCallback((idx: number) => {
    if (!viewportRef.current) return 0;
    const W = viewportRef.current.clientWidth;
    return W * 0.08 - idx * (W * 0.84 + GAP);
  }, []);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(examCategories.length - 1, idx));
    activeIdxRef.current = clamped;
    setActiveIdx(clamped);
    setTrackX(computeX(clamped));
    const container = tabContainerRef.current;
    const tab = tabRefs.current[clamped];
    if (container && tab) {
      container.scrollTo({ left: tab.offsetLeft - container.clientWidth / 2 + tab.clientWidth / 2, behavior: "smooth" });
    }
  }, [computeX]);

  useEffect(() => {
    setTrackX(computeX(0));
    const onResize = () => setTrackX(computeX(activeIdxRef.current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [computeX]);

  if (examCategories.length === 0) {
    return (
      <section className="py-5 bg-white dark:bg-[var(--bg)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#E8EDF8] dark:bg-[#12151C] rounded-none sm:rounded-[28px] px-5 pt-10 pb-10 sm:px-10 lg:px-16 lg:pt-14 lg:pb-14 text-center">
            <Eyebrow>🏆 Popular Exams</Eyebrow>
            <h2 className="text-[38px] sm:text-[52px] leading-[1.10] text-[#2C2C2E] dark:text-[var(--ink-1)] mb-4" style={{ fontWeight: 300, letterSpacing: "-0.96px" }}>
              Exams Coming Soon
            </h2>
            <p className="text-[18px] text-[#666872] dark:text-[var(--ink-2)] max-w-xl mx-auto" style={{ fontWeight: 330 }}>
              We are adding exam preparation resources for JPSC, SSC, IBPS and more. Stay tuned.
            </p>
            <div className="mt-8">
              <BtnPrimary href="/exams">Browse All Exams <ArrowRight className="w-4 h-4" /></BtnPrimary>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    /* canvas pad → blue-tinted block with rounded corners */
    <section className="py-5 bg-white dark:bg-[var(--bg)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#E8EDF8] dark:bg-[#12151C] dark:border dark:border-[rgba(255,255,255,0.06)] rounded-none sm:rounded-[28px] px-5 pt-10 pb-10 sm:px-10 lg:px-16 lg:pt-14 lg:pb-14 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_8px_32px_rgba(0,0,0,0.5)]">

          <div className="mb-10">
            <Eyebrow>🏆 Popular Exams</Eyebrow>
            <h2
              className="text-[38px] sm:text-[52px] lg:text-[64px] leading-[1.10] text-[#2C2C2E] dark:text-[var(--ink-1)]"
              style={{ fontWeight: 300, letterSpacing: "-0.96px" }}
            >
              Prepare for<br />Any Exam
            </h2>
            <p
              className="mt-4 text-[18px] text-[#666872] dark:text-[var(--ink-2)] leading-[1.45] max-w-2xl"
              style={{ fontWeight: 330, letterSpacing: "-0.26px" }}
            >
              From state PSC to banking to central government — comprehensive coverage for all major competitive exams.
            </p>
          </div>

          {/* Pill tab bar — active = black (pricing-tab-selected), inactive = white */}
          <div ref={tabContainerRef} className="flex overflow-x-auto scrollbar-hide mb-8 justify-center">
            <div className="flex gap-2 py-1 flex-shrink-0">
              {examCategories.map((ex, idx) => (
                <button
                  key={ex.name}
                  ref={(el) => { tabRefs.current[idx] = el; }}
                  onClick={() => goTo(idx)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors duration-200 flex-shrink-0 text-[14px] ${
                    activeIdx === idx
                      ? "bg-[#0D287E] dark:bg-[var(--blue)] text-white"
                      : "bg-white dark:bg-[var(--card)] border border-[#EAE8EC] dark:border-[var(--line-soft)] text-[#2C2C2E] dark:text-[var(--ink-1)] hover:bg-[#EAE8EC] dark:hover:bg-[var(--bg)]"
                  }`}
                  style={{ fontWeight: activeIdx === idx ? 500 : 400 }}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          {/* Carousel */}
          <div ref={viewportRef} className="overflow-hidden">
            <motion.div
              className="flex"
              animate={{ x: trackX }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
            >
              {examCategories.map((exam, idx) => {
                const offset    = idx - activeIdx;
                const isActive  = offset === 0;
                const isAdjacent = Math.abs(offset) === 1;
                return (
                  <motion.div
                    key={exam.name}
                    className="flex-shrink-0 mr-4 cursor-pointer"
                    style={{ width: "84%" }}
                    animate={{
                      opacity: isActive ? 1 : isAdjacent ? 0.1 : 0,
                      scale:   isActive ? 1 : 0.97,
                    }}
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    onClick={() => !isActive && goTo(idx)}
                  >
                    {/* pricing-card style: white, rounded-lg, hairline border, subtle shadow */}
                    <div
                      className={`bg-white dark:bg-[var(--card)] rounded-[26px] p-7 lg:p-10 border border-[#EAE8EC] dark:border-[rgba(255,255,255,0.07)] transition-all duration-300 ${
                        isActive
                          ? "shadow-[0_4px_20px_rgba(44,44,46,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.7),_0_0_0_1px_rgba(255,255,255,0.06)_inset]"
                          : ""
                      }`}
                    >
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-5">
                        <span
                          className="text-[11px] px-3 py-1 rounded-full bg-[#0D287E] dark:bg-[var(--blue)] text-white uppercase"
                          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.4px", fontWeight: 500 }}
                        >
                          {exam.tag}
                        </span>
                        {exam.state && (
                          <span className="flex items-center gap-1 text-[12px] text-[#666872] dark:text-[var(--ink-2)] bg-[#EAE8EC] dark:bg-[var(--bg)] border border-[#CBCDD5] dark:border-[var(--line-soft)] px-2.5 py-1 rounded-full">
                            <MapPin className="w-3 h-3" /> {exam.state}
                          </span>
                        )}
                        {exam.board && (
                          <span className="flex items-center gap-1 text-[12px] text-[#666872] dark:text-[var(--ink-2)] bg-[#EAE8EC] dark:bg-[var(--bg)] border border-[#CBCDD5] dark:border-[var(--line-soft)] px-2.5 py-1 rounded-full">
                            <Building2 className="w-3 h-3" /> {exam.board}
                          </span>
                        )}
                      </div>

                      {/* display-lg headline */}
                      <h3
                        className="text-[32px] sm:text-[40px] lg:text-[48px] text-[#2C2C2E] dark:text-[var(--ink-1)] mb-3 leading-[1.10]"
                        style={{ fontWeight: 300, letterSpacing: "-0.96px" }}
                      >
                        {exam.name}
                      </h3>

                      <p
                        className="text-[18px] text-[#666872] dark:text-[var(--ink-2)] leading-[1.45] mb-8 max-w-2xl"
                        style={{ fontWeight: 330, letterSpacing: "-0.26px" }}
                      >
                        {exam.description || "Comprehensive preparation with full-length test series, previous year papers, and expert study materials."}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        {/* Stat tiles — surface-soft */}
                        <div className="flex gap-3">
                          <div className="bg-[#EAE8EC] dark:bg-[var(--bg)] rounded-[8px] px-4 py-3 border border-[#CBCDD5] dark:border-[var(--line-soft)] flex items-center gap-3">
                            <ClipboardList className="w-4 h-4 text-[#8D8D8F] dark:text-[var(--ink-3)] flex-shrink-0" />
                            <div>
                              <div className="text-[20px] text-[#2C2C2E] dark:text-[var(--ink-1)] leading-none" style={{ fontWeight: 700 }}>{exam.numTests}+</div>
                              <div className="text-[10px] text-[#8D8D8F] dark:text-[var(--ink-4)] mt-0.5 uppercase" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.4px" }}>Tests</div>
                            </div>
                          </div>
                          <div className="bg-[#EAE8EC] dark:bg-[var(--bg)] rounded-[8px] px-4 py-3 border border-[#CBCDD5] dark:border-[var(--line-soft)] flex items-center gap-3">
                            <ScrollText className="w-4 h-4 text-[#8D8D8F] dark:text-[var(--ink-3)] flex-shrink-0" />
                            <div>
                              <div className="text-[20px] text-[#2C2C2E] dark:text-[var(--ink-1)] leading-none" style={{ fontWeight: 700 }}>{exam.numPYQ}+</div>
                              <div className="text-[10px] text-[#8D8D8F] dark:text-[var(--ink-4)] mt-0.5 uppercase" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.4px" }}>PYQ Papers</div>
                            </div>
                          </div>
                        </div>

                        {/* CTA pair — black pill + white pill */}
                        <div className="flex gap-3 sm:ml-auto">
                          <BtnPrimary href={exam.slug ? `/exams/${exam.slug}` : "/exams"}>
                            Explore <ArrowRight className="w-4 h-4" />
                          </BtnPrimary>
                          <BtnSecondary href="/series/all">Start Tests</BtnSecondary>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Dots + prev/next arrows — centered */}
          <div className="flex items-center justify-center gap-4 mt-7">
            <button
              onClick={() => goTo(activeIdx - 1)}
              disabled={activeIdx === 0}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[var(--card)] border border-[#EAE8EC] dark:border-[var(--line-soft)] hover:bg-[#EAE8EC] dark:hover:bg-[var(--bg)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#2C2C2E] dark:text-[var(--ink-1)]" />
            </button>

            <div className="flex items-center gap-2">
              {examCategories.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    activeIdx === idx
                      ? "w-7 h-2 bg-[#0D287E] dark:bg-[var(--blue)]"
                      : "w-2 h-2 bg-[#CBCDD5] dark:bg-[var(--ink-4)] hover:bg-[#8D8D8F] dark:hover:bg-[var(--ink-3)]"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => goTo(activeIdx + 1)}
              disabled={activeIdx === examCategories.length - 1}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[var(--card)] border border-[#EAE8EC] dark:border-[var(--line-soft)] hover:bg-[#EAE8EC] dark:hover:bg-[var(--bg)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#2C2C2E] dark:text-[var(--ink-1)]" />
            </button>
          </div>

          <div className="mt-8 flex justify-center">
            <BtnSecondary href="/exams">Browse All Exams <ArrowRight className="w-4 h-4" /></BtnSecondary>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   TESTIMONIALS — cream color-block section (#f4ecd6)
───────────────────────────────────────────────────────────── */
function TestimonialsSection({ testimonials }: { testimonials: TestimonialData[] }) {
  if (testimonials.length === 0) return null;
  return (
    <section className="py-5 bg-white dark:bg-[var(--bg)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#EAE8EC] dark:bg-[#12151C] dark:border dark:border-[rgba(255,255,255,0.06)] rounded-none sm:rounded-[28px] px-5 pt-10 pb-10 sm:px-10 lg:px-16 lg:pt-14 lg:pb-14 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_8px_32px_rgba(0,0,0,0.5)]">

          <div className="mb-12">
            <Eyebrow>🌟 Student Success</Eyebrow>
            <h2
              className="text-[38px] sm:text-[52px] lg:text-[64px] leading-[1.10] text-[#2C2C2E] dark:text-[var(--ink-1)]"
              style={{ fontWeight: 300, letterSpacing: "-0.96px" }}
            >
              Toppers trust<br />ExamNurture
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white dark:bg-[var(--card)] rounded-[18px] p-6 flex flex-col border border-[#CBCDD5] dark:border-[rgba(255,255,255,0.07)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400 dark:text-amber-300 dark:fill-amber-300" />
                  ))}
                </div>
                <blockquote
                  className="text-[16px] text-[#666872] dark:text-[var(--ink-2)] leading-[1.45] mb-6 flex-1"
                  style={{ fontWeight: 330, letterSpacing: "-0.14px" }}
                >
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full bg-[#0D287E] dark:bg-[var(--blue)] flex items-center justify-center text-white text-[12px] flex-shrink-0"
                    style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-[15px] text-[#2C2C2E] dark:text-[var(--ink-1)]" style={{ fontWeight: 700 }}>{t.name}</p>
                    <p className="text-[11px] text-[#8D8D8F] dark:text-[var(--ink-4)] mt-0.5" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.3px" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   FAQ — white canvas, clean accordion (SuperKalam-style)
   Each item is a standalone rounded card with chevron toggle
───────────────────────────────────────────────────────────── */
/* FAQ_ITEMS is now fetched dynamically via useFAQs() hook */

function FAQSection({ faqItems }: { faqItems: FAQData[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (!faqItems || faqItems.length === 0) return null;

  return (
    <section className="py-20 lg:py-24 bg-white dark:bg-[var(--bg)] border-t border-[#EAE8EC] dark:border-[var(--line-soft)]">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Centered heading */}
        <div className="text-center mb-12">
          <h2
            className="text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.10] text-[#2C2C2E] dark:text-[var(--ink-1)]"
            style={{ fontWeight: 300, letterSpacing: "-0.96px" }}
          >
            Frequently Asked<br />Questions
          </h2>
        </div>

        {/* Accordion list */}
        <div className="flex flex-col gap-3">
          {faqItems.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`rounded-[16px] border overflow-hidden transition-colors duration-200 ${
                  isOpen
                    ? "border-[#0D287E] dark:border-[rgba(53,87,199,0.4)] bg-white dark:bg-[var(--card)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]"
                    : "border-[#EAE8EC] dark:border-[rgba(255,255,255,0.06)] bg-[#EAE8EC] dark:bg-[var(--card)] hover:bg-[#CBCDD5] dark:hover:bg-[rgba(255,255,255,0.03)] hover:border-[#CBCDD5] dark:hover:border-[rgba(255,255,255,0.09)]"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span
                    className="text-[17px] text-[#2C2C2E] dark:text-[var(--ink-1)] leading-[1.45] pr-4"
                    style={{ fontWeight: isOpen ? 600 : 400, letterSpacing: "-0.14px" }}
                  >
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#CBCDD5] dark:text-[var(--ink-4)] flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 !text-[#8D8D8F] dark:!text-[var(--ink-2)]" : ""}`}
                  />
                </button>

                {/* Answer — smooth CSS height transition */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <p
                    className="px-6 pb-6 text-[16px] text-[#8D8D8F] dark:text-[var(--ink-3)] leading-[1.60]"
                    style={{ fontWeight: 330, letterSpacing: "-0.14px" }}
                  >
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   CTA — navy color-block section (#1f1d3d) — the only dark
   surface above the footer (color-block-section-navy token)
───────────────────────────────────────────────────────────── */
function CTASection({ stats, loading }: { stats: PlatformStats | null; loading: boolean }) {
  const { user } = useAuth();

  const promptGoogleSignIn = () => {
    const google = (window as Window & {
      google?: { accounts?: { id?: { prompt?: () => void } } };
    }).google;
    google?.accounts?.id?.prompt?.();
  };

  return (
    <section className="py-5 pb-8 bg-white dark:bg-[var(--bg)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0D287E] dark:bg-[#12151C] dark:border dark:border-[rgba(255,255,255,0.07)] rounded-none sm:rounded-[28px] px-5 pt-12 pb-12 sm:px-10 lg:px-16 lg:pt-16 lg:pb-16 text-center dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_0_80px_-20px_rgba(32,62,144,0.4),0_16px_48px_rgba(0,0,0,0.7)] relative overflow-hidden">

          {/* Dark mode ambient glow orb */}
          <div className="hidden dark:block absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-[#0D287E] opacity-20 blur-[80px]" />
            <div className="absolute top-0 right-1/4 w-[200px] h-[200px] rounded-full bg-[#2A56C6] opacity-10 blur-[60px]" />
          </div>

          <Eyebrow inverse>⚡ Free to Start</Eyebrow>

          <h2
            className="text-[38px] sm:text-[52px] lg:text-[64px] leading-[1.10] text-white mb-6"
            style={{ fontWeight: 300, letterSpacing: "-0.96px" }}
          >
            Start Preparing Today.<br />Your Dream Job Awaits.
          </h2>

          <p
            className="text-[18px] sm:text-[20px] text-white/60 mb-10 max-w-xl mx-auto leading-[1.40]"
            style={{ fontWeight: 330, letterSpacing: "-0.14px" }}
          >
            Join{" "}
            {stats?.users !== undefined
              ? stats.users.toLocaleString()
              : loading ? "..." : "10,000+"}{" "}
            students already preparing smarter. Get access to mock tests, PYQ papers, and AI analytics — free.
          </p>

          {/* Plan highlights */}
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
            {planHighlights.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-[15px] text-white/60" style={{ fontWeight: 330 }}>
                <CheckCircle className="w-4 h-4 text-white/30 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          {/* White pill primary + Download App split button — both on dark */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <BtnPrimary href="/dashboard" inverse>Open Dashboard <ArrowRight className="w-5 h-5" /></BtnPrimary>
                <DownloadAppBtn inverse />
              </>
            ) : (
              <>
                <BtnPrimary onClick={promptGoogleSignIn} inverse>Get Started Free <ArrowRight className="w-5 h-5" /></BtnPrimary>
                <DownloadAppBtn inverse />
              </>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const openLogin = useCallback(() => setShowModal(true), []);
  const { stats, loading } = useStats();

  /* Dynamic marketing content — fetched from Test_Backend, falls back to static */
  const featuredExams = useFeaturedExams();
  const testimonials = useTestimonials();
  const faqItems = useFAQs();

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--bg)]">
      {showModal && <AuthModal onClose={() => setShowModal(false)} next="/dashboard" />}
      <HeroSection onLogin={openLogin} stats={stats} />
      <MarqueeStrip items={featuredExams.map(e => e.name)} />
      <FeaturesSection />
      <ExamCategoriesSection examCategories={featuredExams} />
      <TestimonialsSection testimonials={testimonials} />
      <FAQSection faqItems={faqItems} />
      <CTASection stats={stats} loading={loading} />
    </div>
  );
}
