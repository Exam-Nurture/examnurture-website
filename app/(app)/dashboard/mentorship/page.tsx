"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { apiGetMentorshipPrograms } from "@/lib/api";
import {
  Users, Star, Clock, Award, ArrowRight, CheckCircle,
  Lock, ExternalLink, Sparkles, GraduationCap, MessageCircle,
  CalendarCheck, BookOpen, ShieldCheck,
} from "lucide-react";

interface Program {
  id: string;
  title: string;
  description?: string;
  mentorName: string;
  mentorTitle?: string;
  mentorBio?: string;
  mentorImageUrl?: string;
  thumbnailUrl?: string;
  price: number;
  discountedPrice?: number;
  buyUrl?: string;
  courseDurationWeeks: number;
  tierRequired?: number;
  exam?: { shortName?: string };
}

/* ── Purchased program card ── */
function MentorshipCard({ prog, idx }: { prog: Program; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: idx * 0.08 }}
      className="card overflow-hidden flex flex-col group"
    >
      {/* Active banner */}
      <div className="flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-purple-600 to-violet-500 text-white text-[10px] font-bold uppercase tracking-widest">
        <CheckCircle className="w-3 h-3" /> Active Mentorship
      </div>

      {/* Thumbnail */}
      <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
        {prog.thumbnailUrl ? (
          <img src={prog.thumbnailUrl} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--blue-soft)" }}>
            <Award className="w-14 h-14" style={{ color: "var(--blue)" }} />
          </div>
        )}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm" style={{ background: "var(--bg)", color: "var(--blue)" }}>
          {prog.exam?.shortName || "General"}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="text-[15px] font-bold mb-1" style={{ color: "var(--ink-1)" }}>{prog.title}</h3>
          <p className="text-[12px] leading-relaxed line-clamp-2" style={{ color: "var(--ink-4)" }}>
            {prog.description || "Get 1-on-1 guidance and a personalised roadmap to crack your dream exam."}
          </p>
        </div>

        {/* Mentor row */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--line-soft)" }}>
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0" style={{ background: "var(--blue-soft)" }}>
            {prog.mentorImageUrl
              ? <img src={prog.mentorImageUrl} className="w-full h-full object-cover" alt={prog.mentorName} />
              : <Users className="w-full h-full p-2" style={{ color: "var(--blue)" }} />}
          </div>
          <div>
            <div className="text-[12px] font-bold" style={{ color: "var(--ink-1)" }}>{prog.mentorName}</div>
            <div className="text-[10px]" style={{ color: "var(--ink-4)" }}>{prog.mentorTitle || "Lead Mentor"}</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-4)" }}>
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {prog.courseDurationWeeks} Weeks</div>
          <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Highly Rated</div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-3" style={{ borderTop: "1px solid var(--line-soft)" }}>
          <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
            <CheckCircle className="w-4 h-4" /> Enrolled
          </div>
          {prog.buyUrl && (
            <a href={prog.buyUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-3)" }}>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Page ── */
export default function DashboardMentorshipPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetMentorshipPrograms().then(setPrograms).finally(() => setLoading(false));
  }, []);

  const userTier = user?.subscription?.tierLevel ?? 0;
  const myPrograms = programs.filter(p => userTier > 0 && (p.tierRequired ?? 1) <= userTier);

  return (
    <div className="flex flex-col gap-10 fade-up">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
            My Mentorships
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--ink-4)" }}>
            Mentorship programs you have access to based on your plan.
          </p>
        </div>
        <Link href="/mentorship"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 shrink-0"
          style={{ background: "var(--blue)", color: "#fff" }}>
          <Sparkles className="w-4 h-4" /> Browse All Programs
        </Link>
      </div>

      {/* ── Purchased mentorships ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 rounded-2xl animate-pulse" style={{ background: "var(--bg)" }} />
          ))}
        </div>
      ) : myPrograms.length > 0 ? (
        <>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
              {myPrograms.length} Active
            </div>
            <span className="text-[12px]" style={{ color: "var(--ink-4)" }}>You have access to the following mentorship programs.</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {myPrograms.map((prog, idx) => (
              <MentorshipCard key={prog.id} prog={prog} idx={idx} />
            ))}
          </div>
        </>
      ) : (
        /* ── Empty state ── */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card flex flex-col items-center text-center py-16 px-6"
        >
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: "var(--blue-soft)" }}>
            <Lock className="w-9 h-9" style={{ color: "var(--blue)" }} />
          </div>
          <h2 className="text-xl font-extrabold mb-2" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
            No Mentorship Purchased
          </h2>
          <p className="text-[13px] leading-relaxed max-w-sm mb-8" style={{ color: "var(--ink-4)" }}>
            You don't have access to any mentorship program yet. Explore our expert-led programs and
            enroll to get personalised 1-on-1 guidance for your exam.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { icon: MessageCircle, label: "1-on-1 Sessions"      },
              { icon: CalendarCheck, label: "Weekly Reviews"        },
              { icon: BookOpen,      label: "Custom Study Plan"     },
              { icon: ShieldCheck,   label: "Till Selection Support"},
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-3)" }}>
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/mentorship"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 shadow-md"
              style={{ background: "var(--blue)", color: "#fff", boxShadow: "0 4px 14px var(--blue)30" }}>
              <Sparkles className="w-4 h-4" /> Browse Mentorship Programs
            </Link>
            <Link href="/mentorship#programs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-2)" }}>
              <GraduationCap className="w-4 h-4" /> See All Programs
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Promo strip (always visible, links back to marketing page) ── */}
      {myPrograms.length > 0 && (
        <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: "var(--blue-soft)", border: "1px solid var(--line-soft)" }}>
          <div>
            <h3 className="text-[14px] font-bold mb-1" style={{ color: "var(--ink-1)" }}>
              Looking to explore more programs?
            </h3>
            <p className="text-[12px]" style={{ color: "var(--ink-4)" }}>
              Browse all available mentorship batches and expand your learning.
            </p>
          </div>
          <Link href="/mentorship"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
            style={{ background: "var(--blue)", color: "#fff" }}>
            See All Programs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

    </div>
  );
}
