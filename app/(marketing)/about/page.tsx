"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Globe, Mail } from "lucide-react";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
import Link from "next/link";

const CONTENT_API = process.env.NEXT_PUBLIC_CONTENT_API_URL || "http://localhost:8000";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  photo_image_url: string | null;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  twitter_url?: string;
  bio?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AboutPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${CONTENT_API}/api/team/`)
      .then((r) => r.json())
      .then((data) => {
        const members = Array.isArray(data) ? data : data.results || [];
        setTeamMembers(members);
      })
      .catch(() => setError("Could not load team members"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--bg)]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="pointer-events-none absolute top-20 right-10 w-72 h-72 bg-blue-100/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 left-10 w-96 h-96 bg-blue-200/10 dark:bg-blue-400/5 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 1, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-[var(--ink-1)] mb-6 leading-tight">
              Building India's
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Future of Education
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-[var(--ink-3)] leading-relaxed max-w-2xl mx-auto">
              We're on a mission to empower students with world-class learning experiences and mentorship to excel in competitive exams.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full flex justify-center"
            >
              <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-[var(--line)] w-full">
                <img
                  alt="Our Mission"
                  src="/mission.jpg"
                  className="w-full h-full object-cover"
                  style={{ minHeight: "400px" }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Our Mission</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-[var(--ink-1)] leading-tight">
                Empower Every Student
              </h2>
              <p className="text-lg text-gray-600 dark:text-[var(--ink-3)] leading-relaxed">
                To provide every student in India with comprehensive, accessible, and high-quality test series, courses, mentorship, and study materials — enabling them to excel in competitive exams with confidence and clarity.
              </p>
              <div className="pt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                <span>Transforming education</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-[var(--card)]/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:order-1 space-y-6"
            >
              <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Our Vision</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-[var(--ink-1)] leading-tight">
                India's Most Trusted Platform
              </h2>
              <p className="text-lg text-gray-600 dark:text-[var(--ink-3)] leading-relaxed">
                To become the most trusted and innovative online education platform in India, dedicated to transforming learning experiences and fostering lifelong success for students across all exam disciplines.
              </p>
              <div className="pt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                <span>Building the future</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:order-2 w-full flex justify-center"
            >
              <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-[var(--line)] w-full">
                <img
                  alt="Our Vision"
                  src="/vision.jpg"
                  className="w-full h-full object-cover"
                  style={{ minHeight: "400px" }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-[var(--bg)] dark:via-[var(--card)]/30 dark:to-[var(--bg)]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-900 dark:text-[var(--ink-1)] mb-4">Our Core Values</h2>
            <div className="w-12 h-1 bg-blue-500 rounded-full mx-auto mb-6" />
            <p className="text-lg text-gray-600 dark:text-[var(--ink-3)]">The principles that drive everything we do</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {[
              { icon: "✨", title: "Excellence", desc: "We pursue the highest standards in everything we do, ensuring quality in every interaction.", color: "from-blue-500/10 to-blue-400/5" },
              { icon: "🌍", title: "Accessibility", desc: "Quality education should be available to everyone, regardless of background or location.", color: "from-emerald-500/10 to-emerald-400/5" },
              { icon: "🚀", title: "Innovation", desc: "We constantly evolve and adapt to serve students better with cutting-edge solutions.", color: "from-cyan-500/10 to-cyan-400/5" },
              { icon: "🤝", title: "Integrity", desc: "We build trust through transparency, honesty, and ethical practices in all dealings.", color: "from-purple-500/10 to-purple-400/5" },
              { icon: "🎯", title: "Impact", desc: "We measure success by student achievement and real-world outcomes.", color: "from-orange-500/10 to-orange-400/5" },
              { icon: "❤️", title: "Community", desc: "Together, we create a supportive ecosystem where every student can thrive and succeed.", color: "from-rose-500/10 to-rose-400/5" },
            ].map((value, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`group relative p-8 bg-gradient-to-br ${value.color} rounded-2xl border border-gray-200 dark:border-[var(--line)] hover:border-gray-300 dark:hover:border-[var(--line-soft)] transition-all duration-300 overflow-hidden`}
              >
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/40 dark:bg-white/5 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
                <div className="relative mb-4 text-5xl">{value.icon}</div>
                <div className="relative">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-[var(--ink-1)] mb-3">{value.title}</h3>
                  <p className="text-gray-600 dark:text-[var(--ink-3)] leading-relaxed text-sm">{value.desc}</p>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 w-0 group-hover:w-full transition-all duration-500" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-[var(--card)]/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-[var(--ink-1)] mb-4">
              Meet Our{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Team</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-[var(--ink-3)]">Passionate educators and technologists building the future</p>
          </motion.div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-200 dark:border-blue-900 border-t-blue-600 mx-auto" />
              <p className="text-gray-600 dark:text-[var(--ink-3)] mt-4 font-medium">Loading team members...</p>
            </div>
          ) : error || teamMembers.length === 0 ? (
            <motion.div initial={{ opacity: 1, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-[var(--card)] dark:to-[var(--bg)] border border-gray-200 dark:border-[var(--line)] overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-blue-100/50 to-blue-50/30 dark:from-blue-900/20 dark:to-blue-800/10 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-200/60 to-blue-100/40 dark:from-blue-800/40 dark:to-blue-900/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-300 dark:text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200/60 dark:bg-[var(--line)]/60 rounded-full w-3/4" />
                      <div className="h-3 bg-blue-100/60 dark:bg-blue-900/30 rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[var(--bg)]/80 backdrop-blur-sm rounded-2xl">
                <div className="text-center px-6 py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-[var(--ink-1)] mb-2">Team Directory Coming Soon</h3>
                  <p className="text-gray-600 dark:text-[var(--ink-3)] max-w-sm mx-auto">Our amazing team will be introduced here shortly!</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {teamMembers.map((member) => (
                <motion.div
                  key={member.id}
                  variants={itemVariants}
                  className="group rounded-xl bg-white dark:bg-[var(--card)] border border-gray-200 dark:border-[var(--line)] overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg dark:hover:shadow-blue-900/20 transition-all duration-300"
                >
                  <div className="relative overflow-hidden aspect-square bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/10">
                    {member.photo_image_url ? (
                      <img src={member.photo_image_url} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl font-bold text-blue-200 dark:text-blue-700">{member.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-[var(--ink-1)]">{member.name}</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{member.role}</p>
                    </div>
                    {member.bio && <p className="text-sm text-gray-600 dark:text-[var(--ink-3)] line-clamp-2">{member.bio}</p>}
                    <div className="flex items-center gap-2 pt-2">
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--line-soft)] hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-700 dark:text-[var(--ink-3)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <LinkedInIcon className="w-4 h-4" />
                        </a>
                      )}
                      {member.github_url && (
                        <a href={member.github_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--line-soft)] hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-700 dark:text-[var(--ink-3)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <GithubIcon className="w-4 h-4" />
                        </a>
                      )}
                      {member.website_url && (
                        <a href={member.website_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--line-soft)] hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-700 dark:text-[var(--ink-3)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      {member.twitter_url && (
                        <a href={member.twitter_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--line-soft)] hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-700 dark:text-[var(--ink-3)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>


    </div>
  );
}
