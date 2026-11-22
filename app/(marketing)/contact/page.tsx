"use client";

import { useState } from "react";
import PageHero from "@/components/marketing/PageHero";
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, ArrowUpRight } from "lucide-react";
import { apiSubmitContact } from "@/lib/api";

const SUBJECTS = [
  "General Inquiry",
  "Test Series / Courses",
  "Technical Support",
  "Partnership / Collaboration",
  "Feedback",
  "Other",
];

const socials = [
  {
    label: "Instagram", href: "https://www.instagram.com/examnurture/",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  },
  {
    label: "YouTube", href: "https://www.youtube.com/@examnurture",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  },
  {
    label: "X", href: "https://x.com/ExamNurture2025",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    label: "LinkedIn", href: "https://www.linkedin.com/in/examnurture/",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  },
];

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm]     = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, name: user.name || "", email: user.email || "" }));
    }
  }, [user]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      await apiSubmitContact(form);
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const row = "flex items-center gap-4";
  const iconBox = "flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-[var(--brand-soft)] text-[var(--brand)]";
  const small = "text-xs font-medium uppercase tracking-[0.08em] text-[var(--ink-3)]";

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk."
        subtitle="Questions or partnerships. We reply within 24 hours."
        align="center"
      />

      <section className="mx-auto max-w-[1180px] px-4 pb-20 pt-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[5fr_7fr]">
          {/* Details */}
          <div className="en-card flex flex-col gap-6 p-7 sm:p-9">
            <a href="mailto:info@examnurture.com" className={`${row} group`}>
              <span className={iconBox}><Mail className="h-5 w-5" aria-hidden="true" /></span>
              <span>
                <span className={`${small} block`}>Email</span>
                <span className="font-medium text-[var(--ink-1)] group-hover:text-[var(--brand)]">info@examnurture.com</span>
              </span>
            </a>

            <a href="tel:+917050722933" className={`${row} group`}>
              <span className={iconBox}><Phone className="h-5 w-5" aria-hidden="true" /></span>
              <span>
                <span className={`${small} block`}>Phone</span>
                <span className="font-medium text-[var(--ink-1)] group-hover:text-[var(--brand)]">+91 70507 22933</span>
              </span>
            </a>

            <div className={row}>
              <span className={iconBox}><MapPin className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className={small}>Address</p>
                <p className="font-medium leading-relaxed text-[var(--ink-1)]">Kashyap Mohalla, Chainpur<br />Jharkhand — 822110</p>
              </div>
            </div>

            <a
              href="https://wa.me/917050722933" target="_blank" rel="noopener noreferrer"
              className="group flex min-h-11 items-center gap-3 rounded-[16px] bg-[var(--bg-secondary)] px-4 py-3 transition-colors hover:bg-[var(--brand-soft)]"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-[#25D366]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.524 5.845L.057 23.49a.75.75 0 00.906.978l5.808-1.524A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.745 9.745 0 01-5.195-1.495l-.372-.22-3.847 1.01 1.028-3.752-.242-.385A9.75 9.75 0 1112 21.75z"/>
                </svg>
              </span>
              <span className="min-w-0 flex-1 font-medium text-[var(--ink-1)]">Chat on WhatsApp</span>
              <ArrowUpRight className="h-4 w-4 flex-none text-[var(--ink-3)] group-hover:text-[var(--brand)]" aria-hidden="true" />
            </a>

            <ul className="flex flex-wrap gap-2">
              {socials.map(s => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--bg-secondary)] px-4 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]">
                    {s.icon}
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <div className="en-card p-7 sm:p-9">
            {status === "success" ? (
              <div role="status" className="flex h-full flex-col items-center justify-center py-16 text-center">
                <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--green-soft)] text-[var(--green)]">
                  <CheckCircle className="h-7 w-7" aria-hidden="true" />
                </span>
                <h2 className="mb-2 text-xl font-bold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>Message sent</h2>
                <p className="mb-6 max-w-xs text-sm text-[var(--ink-2)]">
                  Thanks. We will reply within 24 hours.
                </p>
                <button type="button" onClick={() => setStatus("idle")}
                  className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-5 text-sm font-semibold text-[var(--ink-1)] hover:bg-[var(--brand-soft)]">
                  Send another
                </button>
              </div>
            ) : (
              <>
                <h2 className="mb-6 text-2xl font-bold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>Send a message</h2>

                {status === "error" && (
                  <div role="alert" className="mb-5 flex items-start gap-3 rounded-[12px] bg-[color-mix(in_srgb,var(--red)_10%,transparent)] p-4 text-sm text-[var(--red)]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium text-[var(--ink-2)]">Name</label>
                      <input id="c-name" required value={form.name} onChange={set("name")} placeholder="Rahul Sharma" autoComplete="name"
                        className="w-full min-h-11 rounded-[12px] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--ink-1)] placeholder:text-[var(--ink-3)] outline-none focus:ring-2 focus:ring-[var(--brand-line)]" />
                    </div>
                    <div>
                      <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium text-[var(--ink-2)]">Email</label>
                      <input id="c-email" required type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" autoComplete="email"
                        className="w-full min-h-11 rounded-[12px] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--ink-1)] placeholder:text-[var(--ink-3)] outline-none focus:ring-2 focus:ring-[var(--brand-line)]" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="c-subject" className="mb-1.5 block text-sm font-medium text-[var(--ink-2)]">Subject</label>
                    <select id="c-subject" required value={form.subject} onChange={set("subject")}
                      className="w-full min-h-11 rounded-[12px] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--ink-1)] placeholder:text-[var(--ink-3)] outline-none focus:ring-2 focus:ring-[var(--brand-line)] cursor-pointer">
                      <option value="" disabled>Select a topic…</option>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="c-message" className="mb-1.5 block text-sm font-medium text-[var(--ink-2)]">Message</label>
                    <textarea id="c-message" required minLength={10} rows={5} value={form.message} onChange={set("message")} placeholder="Tell us how we can help…"
                      className="w-full min-h-11 rounded-[12px] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--ink-1)] placeholder:text-[var(--ink-3)] outline-none focus:ring-2 focus:ring-[var(--brand-line)] resize-none" />
                  </div>

                  <button type="submit" disabled={status === "sending"}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)] disabled:opacity-60">
                    {status === "sending" ? (
                      <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Sending…</>
                    ) : (
                      <><Send className="h-4 w-4" aria-hidden="true" />Send message</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
