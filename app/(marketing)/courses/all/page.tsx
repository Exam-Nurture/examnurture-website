"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiGetCourses } from "@/lib/api";
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
  Trophy,
  Target,
  FileText
} from "lucide-react";

/* ── Premium Mesh Background ── */
function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none dark:hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 90% 55% at -5%  45%, rgba(59,130,246,0.12)  0%, transparent 60%)",
            "radial-gradient(ellipse 70% 45% at 105% 5%,  rgba(34,211,238,0.10)  0%, transparent 55%)",
            "radial-gradient(ellipse 55% 55% at 50%  50%, rgba(255,255,255,0.7) 0%, transparent 70%)",
            "#ffffff",
          ].join(", "),
        }}
      />
    </div>
  );
}

export default function AllCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetCourses().then(setCourses).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
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
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                <GraduationCap className="w-3 h-3" />
                Exam-Wise Courses
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                Complete Preparation <br />
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  For Every Major Exam
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Choose your target exam and get instant access to full-length mock tests, 
                previous year solved papers, and structured study materials designed by experts.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Course Grid */}
        <section className="relative pb-24 lg:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-[400px] rounded-3xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">No courses available yet</h3>
                <p className="text-gray-400 dark:text-gray-500 mt-2">We are adding new exam courses every week!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((exam, idx) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="group relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col overflow-hidden"
                  >
                    {/* Header / Banner Area */}
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                       <div 
                         className="absolute inset-0 opacity-20" 
                         style={{ background: exam.board?.tint || "var(--blue)" }} 
                       />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl font-black text-white/40 select-none uppercase tracking-widest">{exam.shortName}</span>
                       </div>
                       <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-blue-700 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-widest shadow-sm">
                        {exam.board?.shortName || "Exam"}
                      </div>
                      {exam.isFeatured && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-amber-400 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/20">
                          Popular
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {exam.name}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {exam.subjects.split(',').slice(0, 3).map((sub: string) => (
                          <span key={sub} className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-[10px] font-bold text-gray-500 dark:text-gray-400 rounded-md border border-gray-100 dark:border-gray-700 uppercase tracking-tight">
                            {sub.trim()}
                          </span>
                        ))}
                        {exam.subjects.split(',').length > 3 && (
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">+{exam.subjects.split(',').length - 3} more</span>
                        )}
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Pattern: <span className="text-gray-900 dark:text-gray-200">{exam.pattern || "CBT"}</span></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium">Eligibility: <span className="text-gray-900 dark:text-gray-200 line-clamp-1">{exam.eligibility}</span></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                           <FileText className="w-4 h-4 text-purple-500" />
                           <span className="font-medium">Resources: </span>
                           <div className="flex gap-1.5 ml-auto">
                              {exam.hasTests && <Zap aria-label="Test Series" className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                              {exam.hasPYQ && <BookOpen aria-label="PYQs" className="w-3.5 h-3.5 text-blue-500" />}
                              {exam.hasGuide && <Users aria-label="Guide" className="w-3.5 h-3.5 text-emerald-500" />}
                           </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                         <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tier {exam.tier}+ Access</div>
                         <Link 
                            href={`/series?exam=${exam.id}`}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                          >
                            Explore Course
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">What's Inside Every Course?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Test Series", icon: Zap, desc: "Real exam interface with auto-timer." },
                { title: "Subject Tests", icon: BookOpen, desc: "Focus on individual topics and subjects." },
                { title: "Previous Papers", icon: FileText, desc: "Last 10 years solved papers with explanations." },
                { title: "Performance AI", icon: Star, desc: "Detailed analysis of your weak areas." }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white text-left">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-blue-100 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
