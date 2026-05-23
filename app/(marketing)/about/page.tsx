"use client";

import React, { useEffect, useState } from "react";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface TeamMember {
  id: string | number;
  name: string;
  role: string;
  photo_image_url: string | null;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  twitter_url?: string;
  bio?: string;
}

export default function AboutPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/team`)
      .then((r) => {
        if (!r.ok) throw new Error("API failure");
        return r.json();
      })
      .then((data) => {
        const members = Array.isArray(data) ? data : data.items || data.results || [];
        const mappedMembers = members.map((m: any) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          photo_image_url: m.photo_image_url || m.photoUrl || m.photo_url || null,
          linkedin_url: m.linkedin_url || m.linkedinUrl || null,
          github_url: m.github_url || m.githubUrl || null,
          website_url: m.website_url || m.websiteUrl || null,
          twitter_url: m.twitter_url || m.twitterUrl || null,
          bio: m.bio,
        }));
        setTeamMembers(mappedMembers);
      })
      .catch((err) => {
        console.error("Error fetching team members:", err);
        setError("Could not load team members");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink-1">

      {/* Hero */}
      <section className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-bg">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-normal uppercase mb-5 text-ink-3"
             style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>
            Our Story
          </p>
          <h1 className="text-[40px] sm:text-[56px] lg:text-[64px] leading-[1.10] text-ink-1 mb-6"
              style={{ fontWeight: 300, letterSpacing: "-0.96px" }}>
            Building India's Future<br />of Education
          </h1>
          <p className="text-[18px] leading-[1.45] text-ink-2 max-w-2xl mx-auto"
             style={{ fontWeight: 300, letterSpacing: "-0.26px" }}>
            We're on a mission to empower students with world-class learning experiences and mentorship to excel in competitive exams.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="w-full flex justify-center">
              <div className="rounded-[16px] overflow-hidden border border-line w-full">
                <img
                  alt="Our Mission"
                  src="/mission.jpg"
                  className="w-full h-full object-cover"
                  style={{ minHeight: "400px" }}
                />
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[11px] font-normal uppercase text-ink-3"
                 style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>
                Our Mission
              </p>
              <h2 className="text-[32px] sm:text-[40px] leading-[1.10] text-ink-1"
                  style={{ fontWeight: 300, letterSpacing: "-0.96px" }}>
                Empower Every Student
              </h2>
              <p className="text-[18px] leading-[1.45] text-ink-2"
                 style={{ fontWeight: 300, letterSpacing: "-0.26px" }}>
                To provide every student in India with comprehensive, accessible, and high-quality test series, courses, mentorship, and study materials — enabling them to excel in competitive exams with confidence and clarity.
              </p>
              <div className="pt-2 flex items-center gap-2 text-ink-1 font-medium text-[15px]">
                <span>Transforming education</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-bg">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="md:order-1 space-y-6">
              <p className="text-[11px] font-normal uppercase text-ink-3"
                 style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>
                Our Vision
              </p>
              <h2 className="text-[32px] sm:text-[40px] leading-[1.10] text-ink-1"
                  style={{ fontWeight: 300, letterSpacing: "-0.96px" }}>
                India's Most Trusted Platform
              </h2>
              <p className="text-[18px] leading-[1.45] text-ink-2"
                 style={{ fontWeight: 300, letterSpacing: "-0.26px" }}>
                To become the most trusted and innovative online education platform in India, dedicated to transforming learning experiences and fostering lifelong success for students across all exam disciplines.
              </p>
              <div className="pt-2 flex items-center gap-2 text-ink-1 font-medium text-[15px]">
                <span>Building the future</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="md:order-2 w-full flex justify-center">
              <div className="rounded-[16px] overflow-hidden border border-line w-full">
                <img
                  alt="Our Vision"
                  src="/vision.jpg"
                  className="w-full h-full object-cover"
                  style={{ minHeight: "400px" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-5 bg-bg">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-bg-secondary rounded-none sm:rounded-[24px] px-5 pt-14 pb-14">
            <div className="text-center mb-12">
              <p className="text-[11px] font-normal uppercase mb-5 text-ink-3"
                 style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>
                What We Stand For
              </p>
              <h2 className="text-[32px] sm:text-[40px] leading-[1.10] text-ink-1"
                  style={{ fontWeight: 300, letterSpacing: "-0.96px" }}>
                Our Core Values
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: "✨", title: "Excellence", desc: "We pursue the highest standards in everything we do, ensuring quality in every interaction." },
                { icon: "🌍", title: "Accessibility", desc: "Quality education should be available to everyone, regardless of background or location." },
                { icon: "🚀", title: "Innovation", desc: "We constantly evolve and adapt to serve students better with cutting-edge solutions." },
                { icon: "🤝", title: "Integrity", desc: "We build trust through transparency, honesty, and ethical practices in all dealings." },
                { icon: "🎯", title: "Impact", desc: "We measure success by student achievement and real-world outcomes." },
                { icon: "❤️", title: "Community", desc: "Together, we create a supportive ecosystem where every student can thrive and succeed." },
              ].map((value, idx) => (
                <div
                  key={idx}
                  className="bg-card rounded-[8px] p-7 border border-line hover:border-ink-1 transition-colors duration-200"
                >
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-[18px] font-semibold text-ink-1 mb-2">{value.title}</h3>
                  <p className="text-[15px] text-ink-2 leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-normal uppercase mb-5 text-ink-3"
               style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>
              The People
            </p>
            <h2 className="text-[32px] sm:text-[40px] leading-[1.10] text-ink-1 mb-4"
                style={{ fontWeight: 300, letterSpacing: "-0.96px" }}>
              Meet Our Team
            </h2>
            <p className="text-[18px] text-ink-2" style={{ fontWeight: 300 }}>
              Passionate educators and technologists building the future
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-ink-1 mx-auto" />
              <p className="text-ink-2 mt-4 text-sm">Loading team members...</p>
            </div>
          ) : error || teamMembers.length === 0 ? (
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-[12px] bg-bg-secondary border border-line overflow-hidden">
                    <div className="aspect-square bg-surface-hover flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-surface-hover flex items-center justify-center border border-line">
                        <svg className="w-10 h-10 text-ink-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-surface-hover rounded w-3/4" />
                      <div className="h-3 bg-surface-hover rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-bg/80 backdrop-blur-sm rounded-[16px]">
                <div className="text-center px-6 py-8">
                  <div className="w-14 h-14 bg-bg-secondary rounded-[12px] flex items-center justify-center mx-auto mb-4 border border-line">
                    <svg className="w-7 h-7 text-ink-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-[18px] font-semibold text-ink-1 mb-2">Team Directory Coming Soon</h3>
                  <p className="text-ink-2 text-sm max-w-xs mx-auto">Our amazing team will be introduced here shortly!</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="rounded-[12px] bg-bg-secondary border border-line overflow-hidden hover:border-ink-1 transition-colors duration-200"
                >
                  <div className="relative overflow-hidden aspect-square bg-surface-hover">
                    {member.photo_image_url ? (
                      <img src={member.photo_image_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl font-bold text-ink-2">{member.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div>
                      <h3 className="text-[15px] font-semibold text-ink-1">{member.name}</h3>
                      <p className="text-[13px] text-ink-2">{member.role}</p>
                    </div>
                    {member.bio && <p className="text-[13px] text-ink-2 line-clamp-2">{member.bio}</p>}
                    <div className="flex items-center gap-2 pt-1">
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-[6px] bg-card border border-line text-ink-2 hover:text-ink-1 hover:border-ink-1 transition-colors">
                          <LinkedInIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {member.github_url && (
                        <a href={member.github_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-[6px] bg-card border border-line text-ink-2 hover:text-ink-1 hover:border-ink-1 transition-colors">
                          <GithubIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {member.website_url && (
                        <a href={member.website_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-[6px] bg-card border border-line text-ink-2 hover:text-ink-1 hover:border-ink-1 transition-colors">
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {member.twitter_url && (
                        <a href={member.twitter_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-[6px] bg-card border border-line text-ink-2 hover:text-ink-1 hover:border-ink-1 transition-colors">
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

