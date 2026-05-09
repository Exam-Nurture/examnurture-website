"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiGetMentorshipPrograms } from "@/lib/api";
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  Star, 
  Clock, 
  Zap, 
  CheckCircle,
  GraduationCap,
  Calendar,
  ShieldCheck,
  Award,
  Sparkles,
  MessageCircle,
  Target
} from "lucide-react";

/* ── Mesh Background ── */
function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 90% 55% at -5%  45%, rgba(139,92,246,0.08)  0%, transparent 60%)",
            "radial-gradient(ellipse 70% 45% at 105% 5%,  rgba(236,72,153,0.06)  0%, transparent 55%)",
            "radial-gradient(ellipse 55% 55% at 50%  50%, rgba(255,255,255,0.7) 0%, transparent 70%)",
            "#ffffff",
          ].join(", "),
        }}
      />
    </div>
  );
}

export default function MentorshipPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetMentorshipPrograms().then(setPrograms).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 relative">
        <MeshBackground />

        {/* Hero Section */}
        <section className="relative pt-20 pb-12 lg:pt-32 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full text-purple-600 text-xs font-bold uppercase tracking-widest mb-6">
                <Sparkles className="w-3 h-3" />
                1-on-1 Expert Guidance
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                Learn from the <br />
                <span className="bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
                  Best Minds & Toppers
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Our mentorship programs provide personalized strategies, direct doubt resolution, 
                and a roadmap to success designed by those who have already conquered the exams.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Programs Grid */}
        <section className="relative pb-24 lg:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[500px] rounded-3xl bg-gray-50 animate-pulse" />
                ))}
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-20 bg-purple-50/30 rounded-3xl border border-dashed border-purple-100">
                <Users className="w-16 h-16 text-purple-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600">No mentorship programs available</h3>
                <p className="text-gray-400 mt-2">New mentorship batches are starting soon. Stay tuned!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {programs.map((prog, idx) => (
                  <motion.div
                    key={prog.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 flex flex-col overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                      {prog.thumbnailUrl ? (
                        <img src={prog.thumbnailUrl} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-200">
                           <Award className="w-16 h-16 opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md text-purple-700 text-[10px] font-bold rounded-full shadow-sm">
                        {prog.exam?.shortName || "General"}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-1 mb-3">
                         <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                         <span className="text-xs font-bold text-gray-700">Highly Rated Mentorship</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
                        {prog.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                        {prog.description || "Get 1-on-1 guidance and a personalized roadmap to crack your dream exam with confidence."}
                      </p>

                      <div className="mt-auto space-y-4">
                        {/* Mentor Info */}
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                           <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden">
                                {prog.mentorImageUrl ? <img src={prog.mentorImageUrl} className="w-full h-full object-cover" /> : <Users className="w-full h-full p-2.5 text-purple-400" />}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-gray-900">{prog.mentorName}</div>
                                <div className="text-[10px] text-gray-500">{prog.mentorTitle || "Lead Mentor"}</div>
                              </div>
                           </div>
                           <p className="text-[11px] text-gray-500 italic line-clamp-2">"{prog.mentorBio || "Helping students achieve their goals through structured learning and strategy."}"</p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                           <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {prog.courseDurationWeeks} Weeks</div>
                           <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Limited Seats</div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                           <div>
                              <div className="text-[10px] font-bold text-gray-400 line-through">₹{prog.price}</div>
                              <div className="text-2xl font-black text-gray-900">₹{prog.discountedPrice}</div>
                           </div>
                           <a 
                             href={prog.buyUrl || "#"} 
                             target="_blank" rel="noopener noreferrer"
                             className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center gap-2"
                           >
                             Join Batch
                             <ArrowRight className="w-4 h-4" />
                           </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Experience the Difference <br /> with Dedicated Mentors</h2>
                    <div className="space-y-6">
                       {[
                         { icon: MessageCircle, t: "Direct 1-on-1 Support", d: "Get your doubts resolved on WhatsApp or over calls directly." },
                         { icon: Target, t: "Weekly Strategy Sessions", d: "Stay on track with weekly live sessions on planning and strategy." },
                         { icon: ShieldCheck, t: "Exclusive Study Resources", d: "Access hand-written notes and curated question banks." }
                       ].map((b, i) => (
                         <div key={i} className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                               <b.icon className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                               <h4 className="font-bold mb-1">{b.t}</h4>
                               <p className="text-sm text-gray-400">{b.d}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="relative">
                    <div className="aspect-video rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center relative overflow-hidden">
                       <div className="absolute inset-0 flex items-center justify-center">
                          <Users className="w-24 h-24 text-purple-500/20" />
                       </div>
                       <div className="relative z-10 text-center p-8">
                          <div className="text-3xl font-black mb-2">500+</div>
                          <div className="text-gray-400 text-sm font-medium">Students Mentored to Success</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
