"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiGetMentorshipPrograms } from "@/lib/api";
import {
  ArrowRight, Users, Star, Clock, Award, Sparkles,
  MessageCircle, Target, ShieldCheck, CheckCircle,
  User, BarChart3, Mic, CalendarCheck, CheckCircle2,
  ChevronDown, ClipboardList, TrendingUp, BookOpen,
  Mail, Phone, ExternalLink, ShoppingCart,
} from "lucide-react";

/* ── Types ── */
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

/* ── Static data ── */
const STATS = [
  { value: "95%",  label: "Success Rate",      icon: TrendingUp },
  { value: "1:1",  label: "Personal Guidance", icon: User       },
  { value: "500+", label: "Students Mentored", icon: Users      },
  { value: "4.9",  label: "Avg. Rating",       icon: Star       },
];

const FEATURES = [
  { icon: User,          title: "Personal Academic Guide",        desc: "A dedicated mentor tracks your progress, clears doubts, and keeps you motivated throughout your preparation.",                  color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20"    },
  { icon: Target,        title: "Syllabus-to-Selection Roadmap",  desc: "Smart, personalised study plans with clear milestones — from day 1 of prep to final selection.",                              color: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-50 dark:bg-violet-900/20"  },
  { icon: Mic,           title: "1:1 Mentorship Sessions",        desc: "Weekly live 1:1 calls with your mentor for direct interaction, review, and guidance.",                                          color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { icon: BookOpen,      title: "Subject-Wise Guidance",          desc: "Step-by-step concept coverage for every subject — taught in order of your exam's actual syllabus.",                             color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-900/20"   },
  { icon: ClipboardList, title: "Career Support & Interview Prep",desc: "End-to-end guidance till final selection — including document verification, medical, and joining advice.",                    color: "text-cyan-600 dark:text-cyan-400",    bg: "bg-cyan-50 dark:bg-cyan-900/20"    },
  { icon: BarChart3,     title: "Weekly Performance Review",      desc: "Data-driven feedback on mock tests, weak areas, accuracy, and speed — reviewed every week.",                                   color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-900/20"    },
];

const STEPS = [
  { step: "01", title: "Enroll & Get Matched",        desc: "Choose a program and get paired with a dedicated mentor suited to your exam and current level.",             icon: Users        },
  { step: "02", title: "Personalised Study Plan",     desc: "Your mentor builds a custom roadmap — daily targets, weekly goals, and exam-day strategy.",                  icon: Target       },
  { step: "03", title: "Regular Mentorship Sessions", desc: "Weekly 1:1 calls to review performance, clear doubts, and adjust your plan as needed.",                      icon: CalendarCheck },
  { step: "04", title: "Achieve Your Goal",           desc: "With consistent support, mock reviews, and interview prep — walk into your exam with full confidence.",      icon: CheckCircle2 },
];

const TESTIMONIALS = [
  { name: "Priya Sharma",  exam: "IBPS PO 2024 — Selected",     text: "The weekly 1:1 sessions made all the difference. My mentor kept me accountable and improved my accuracy from 60% to 85% in just 3 months.", rating: 5, avatar: "PS", color: "from-violet-500 to-blue-500"  },
  { name: "Rahul Kumar",   exam: "SSC CGL 2024 — Selected",     text: "I had been failing for 2 years. With ExamNurture mentorship, I finally cracked SSC CGL. The personalised roadmap was a game-changer.",        rating: 5, avatar: "RK", color: "from-blue-500 to-cyan-500"    },
  { name: "Anjali Singh",  exam: "JPSC Prelims 2024 — Cleared", text: "My mentor understood the Jharkhand syllabus deeply. The subject-wise guidance helped me clear Prelims in my first attempt.",                   rating: 5, avatar: "AS", color: "from-emerald-500 to-teal-500" },
];

const FAQS = [
  { q: "How is this different from regular coaching?",   a: "Regular coaching is one-size-fits-all. Our mentorship is personalised — you get a dedicated mentor who knows your weaknesses, tracks your daily progress, and builds a plan just for you." },
  { q: "Can I choose my mentor?",                        a: "Yes! After enrollment you can browse mentor profiles and request a specific mentor. We match you based on your exam, location preference, and language." },
  { q: "What if I miss a session?",                      a: "No problem — every session is reschedulable. Simply inform your mentor 6 hours in advance and pick a new slot that works for both of you." },
  { q: "Is there a refund policy?",                      a: "We offer a 7-day satisfaction guarantee. If you feel the mentorship isn't right for you within the first week, reach out and we'll process a full refund." },
  { q: "Which exams do you support?",                    a: "SSC (CGL, CHSL, MTS), Banking (IBPS PO/Clerk, SBI), Railways (RRB NTPC, Group D), State PSCs (JPSC, BPSC, UPPSC), and Defence (Agniveer). More coming soon." },
];

/* ── Helpers ── */
function SectionHeader({ label, title, desc }: { label: string; title: string; desc: string }) {
  return (
    <div className="max-w-2xl">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-3">
        {label}
      </span>
      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Page ── */
export default function MentorshipPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    apiGetMentorshipPrograms().then(setPrograms).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-14 lg:pt-28 lg:pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none dark:hidden" aria-hidden>
          <div className="absolute inset-0" style={{
            background: [
              "radial-gradient(ellipse 90% 55% at -5% 45%, rgba(139,92,246,0.09) 0%, transparent 60%)",
              "radial-gradient(ellipse 70% 45% at 105% 5%, rgba(236,72,153,0.06) 0%, transparent 55%)",
              "radial-gradient(ellipse 55% 55% at 50% 50%, rgba(255,255,255,0.75) 0%, transparent 70%)",
            ].join(", "),
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800/50 rounded-full text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-3 h-3" /> 1-on-1 Expert Guidance
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-5 leading-tight">
              Learn from the{" "}
              <span className="bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
                Best Minds & Toppers
              </span>
            </h1>
            <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Personalised strategies, direct doubt resolution, and a roadmap to success designed
              by those who have already conquered the exams.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-purple-500" />
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-extrabold text-gray-900 dark:text-white leading-none">{s.value}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Programs ── */}
      <section id="programs" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <SectionHeader
              label="Programs"
              title="Choose Your Mentorship Program"
              desc="Expert-led programs tailored to your exam — limited seats, maximum personalisation."
            />
            <Link href="/dashboard/mentorship"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 text-sm font-bold transition-colors">
              My Mentorships <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <div key={i} className="h-[500px] rounded-3xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />)}
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-20 bg-purple-50/30 dark:bg-purple-900/10 rounded-3xl border border-dashed border-purple-100 dark:border-purple-800/40">
              <Users className="w-14 h-14 text-purple-200 dark:text-purple-800 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">No programs available right now</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">New mentorship batches are starting soon. Stay tuned!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {programs.map((prog, idx) => (
                <motion.div
                  key={prog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="group relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 flex flex-col overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    {prog.thumbnailUrl ? (
                      <img src={prog.thumbnailUrl} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30">
                        <Award className="w-16 h-16 text-purple-200 dark:text-purple-700" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-purple-700 dark:text-purple-400 text-[10px] font-bold rounded-full shadow-sm">
                      {prog.exam?.shortName || "General"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Highly Rated Mentorship</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                      {prog.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-5 leading-relaxed">
                      {prog.description || "Get 1-on-1 guidance and a personalised roadmap to crack your dream exam."}
                    </p>

                    <div className="mt-auto space-y-4">
                      {/* Mentor */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 overflow-hidden shrink-0">
                            {prog.mentorImageUrl
                              ? <img src={prog.mentorImageUrl} className="w-full h-full object-cover" alt={prog.mentorName} />
                              : <Users className="w-full h-full p-2.5 text-purple-400" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900 dark:text-white">{prog.mentorName}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{prog.mentorTitle || "Lead Mentor"}</div>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 italic line-clamp-2">
                          "{prog.mentorBio || "Helping students achieve their goals through structured learning."}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {prog.courseDurationWeeks} Weeks</div>
                        <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Limited Seats</div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div>
                          {prog.price && prog.discountedPrice && prog.price !== prog.discountedPrice && (
                            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 line-through">₹{prog.price.toLocaleString('en-IN')}</div>
                          )}
                          <div className="text-2xl font-black text-gray-900 dark:text-white">₹{(prog.discountedPrice ?? prog.price).toLocaleString('en-IN')}</div>
                        </div>
                        <Link
                          href={`/dashboard/checkout/MENTORSHIP:${prog.id}?title=${encodeURIComponent(prog.title)}&mentor=${encodeURIComponent(prog.mentorName)}&weeks=${prog.courseDurationWeeks}`}
                          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" /> Enroll Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <SectionHeader
            label="What You Get"
            title="More Than Coaching — Complete Career Mentorship"
            desc="Every aspect of your preparation is covered — from the syllabus to cracking the interview."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex gap-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.bg}`}>
                    <Icon size={18} className={f.color} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{f.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <SectionHeader
            label="How It Works"
            title="4 Steps to Your Dream Job"
            desc="A simple, structured process that takes you from enrollment to final selection."
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-4 overflow-hidden hover:shadow-md hover:border-purple-100 dark:hover:border-purple-900/50 transition-all"
                >
                  <div className="absolute -top-3 -right-2 text-[56px] font-black leading-none pointer-events-none select-none text-gray-50 dark:text-gray-800">
                    {s.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">{s.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="hidden xl:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight size={16} className="text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials + Benefits ── */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* Testimonials */}
          <div className="mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] font-bold uppercase tracking-widest mb-3">
              Success Stories
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Students Who Made It</h2>
            <p className="text-sm text-gray-400">Real results from real students — mentored by ExamNurture.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:bg-white/8 transition-all"
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={12} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed italic flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold bg-gradient-to-br ${t.color} shrink-0`}>
                    {t.avatar}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-[11px] text-emerald-400">{t.exam}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-10 border-t border-white/10">
            {[
              { icon: MessageCircle, t: "Direct 1-on-1 Support",    d: "Get your doubts resolved on WhatsApp or over calls directly with your mentor." },
              { icon: Target,        t: "Weekly Strategy Sessions",  d: "Stay on track with weekly live sessions on planning, performance, and strategy." },
              { icon: ShieldCheck,   t: "Exclusive Study Resources", d: "Access hand-written notes and curated question banks built by toppers." },
            ].map((b, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                  <b.icon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{b.t}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{b.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <SectionHeader
            label="FAQs"
            title="Frequently Asked Questions"
            desc="Everything you need to know before enrolling."
          />
          <div className="flex flex-col gap-2 max-w-3xl mt-8">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-purple-100 dark:hover:border-purple-900/50 transition-colors">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                >
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{faq.q}</span>
                  <ChevronDown size={16} className={`shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-800">
                        <div className="pt-3">{faq.a}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="rounded-3xl p-8 md:p-10 bg-gradient-to-br from-purple-600 to-indigo-600 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-purple-500/20">
            <div>
              <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2">
                Ready to start your mentorship journey?
              </h3>
              <p className="text-sm text-white/70">
                Join 500+ students already on their path to government job selection.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <a href="mailto:info@examnurture.com"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-purple-700 text-sm font-bold hover:bg-purple-50 transition-all shadow-md">
                <Mail size={14} /> Enroll Now
              </a>
              <a href="tel:+917050722933"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/15 border border-white/30 text-white text-sm font-semibold hover:bg-white/25 transition-all">
                <Phone size={14} /> Call Us
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
