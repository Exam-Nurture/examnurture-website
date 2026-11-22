"use client";

import React, { useEffect, useState } from "react";
import { Globe, Mail } from "lucide-react";
import PageHero, { SectionTitle } from "@/components/marketing/PageHero";
import { API_BASE } from "@/lib/config";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const API_URL = API_BASE;

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

  const showTeam = !loading && !error && teamMembers.length > 0;
  const heading = { fontFamily: "var(--font-sora)" } as const;
  const iconLink =
    "flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--ink-2)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-line)]";

  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="Built for India's aspirants."
        subtitle="Quality exam preparation, within reach of every student."
        align="center"
      />

      {/* Mission + Vision */}
      <section className="reveal mx-auto max-w-[1180px] px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              label: "Mission",
              title: "Empower every student",
              body: "Give every student in India accessible, high-quality test series, courses and study material, so they can prepare with confidence.",
            },
            {
              label: "Vision",
              title: "India's most trusted platform",
              body: "Become the online learning platform students trust most, across every exam discipline.",
            },
          ].map((c, i) => (
            <div key={c.label} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
              <article className="en-card h-full p-7 sm:p-9">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--brand)]">{c.label}</p>
                <h2 className="mb-3 text-2xl font-bold text-[var(--ink-1)]" style={heading}>{c.title}</h2>
                <p className="leading-relaxed text-[var(--ink-2)]">{c.body}</p>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* What we offer */}
      <section className="en-band-soft">
        <div className="reveal mx-auto max-w-[1180px] px-4 py-16 sm:px-6 lg:py-20">
          <SectionTitle>What we offer</SectionTitle>
          <ul className="grid gap-5 sm:grid-cols-3">
            {[
              { title: "Test series", desc: "Mock tests and past papers that mirror the real exam." },
              { title: "Courses", desc: "Structured lessons for each exam, in English and Hindi." },
              { title: "Study material", desc: "Clear notes and practice to revise from." },
            ].map((o, i) => (
              <li key={o.title} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
                <div className="en-card h-full p-6">
                  <h3 className="mb-2 text-lg font-bold text-[var(--ink-1)]" style={heading}>{o.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--ink-2)]">{o.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Values */}
      <section className="reveal mx-auto max-w-[1180px] px-4 py-16 sm:px-6 lg:py-20">
        <SectionTitle>What we stand for</SectionTitle>
        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Excellence", desc: "High standards in everything we build." },
            { title: "Accessibility", desc: "Good education for everyone, wherever they live." },
            { title: "Innovation", desc: "We keep improving to serve students better." },
            { title: "Integrity", desc: "Honest, transparent, and fair." },
            { title: "Impact", desc: "Success is student results." },
            { title: "Community", desc: "A supportive place for every learner." },
          ].map((v) => (
            <li key={v.title} className="flex gap-3">
              <span className="mt-2 h-2 w-2 flex-none rounded-full bg-[var(--brand)]" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-[var(--ink-1)]">{v.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--ink-2)]">{v.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Team (hidden quietly while loading, on error, or when empty) */}
      {showTeam && (
        <section className="en-band-soft">
          <div className="reveal mx-auto max-w-[1180px] px-4 py-16 sm:px-6 lg:py-20">
            <SectionTitle>Our team</SectionTitle>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member, i) => (
                <li key={member.id} className="reveal" style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
                  <div className="en-card flex h-full flex-col items-center p-6 text-center">
                    {member.photo_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.photo_image_url} alt={member.name} className="h-24 w-24 rounded-full object-cover" />
                    ) : (
                      <div
                        className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--brand-soft)] text-3xl font-bold text-[var(--brand)]"
                        style={heading}
                        aria-hidden="true"
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3 className="mt-4 font-semibold text-[var(--ink-1)]">{member.name}</h3>
                    <p className="text-sm text-[var(--ink-2)]">{member.role}</p>
                    {member.bio && <p className="mt-2 line-clamp-3 text-sm text-[var(--ink-3)]">{member.bio}</p>}
                    <div className="mt-auto flex items-center gap-2 pt-4">
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noreferrer" className={iconLink} aria-label={`${member.name} on LinkedIn`}>
                          <LinkedInIcon className="h-4 w-4" />
                        </a>
                      )}
                      {member.github_url && (
                        <a href={member.github_url} target="_blank" rel="noreferrer" className={iconLink} aria-label={`${member.name} on GitHub`}>
                          <GithubIcon className="h-4 w-4" />
                        </a>
                      )}
                      {member.website_url && (
                        <a href={member.website_url} target="_blank" rel="noreferrer" className={iconLink} aria-label={`${member.name}'s website`}>
                          <Globe className="h-4 w-4" aria-hidden="true" />
                        </a>
                      )}
                      {member.twitter_url && (
                        <a href={member.twitter_url} target="_blank" rel="noreferrer" className={iconLink} aria-label={`${member.name} on X`}>
                          <Mail className="h-4 w-4" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
