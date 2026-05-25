"use client";

import { useState } from "react";
import Link from "next/link";
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
    icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  },
  {
    label: "YouTube", href: "https://www.youtube.com/@examnurture",
    icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  },
  {
    label: "X", href: "https://x.com/ExamNurture2025",
    icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    label: "LinkedIn", href: "https://www.linkedin.com/in/examnurture/",
    icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
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

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-5xl rounded-[24px] overflow-hidden border border-[var(--line)] flex flex-col lg:flex-row">

        {/* LEFT: Brand blue info panel */}
        <div className="lg:w-[42%] relative overflow-hidden p-10 flex flex-col justify-between"
             style={{ background: "linear-gradient(145deg, #0D287E 0%, #091E60 100%)" }}>

          {/* Decorative ambient circles */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
               style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full pointer-events-none"
               style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full pointer-events-none"
               style={{ background: "rgba(29,78,216,0.25)" }} />

          <div className="relative z-10">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2.5 mb-12">
              <img src="/examnurture-logo.jpg" alt="ExamNurture" className="w-9 h-9 rounded-[10px] object-cover" />
              <span className="font-semibold text-lg text-white">
                ExamNurture
              </span>
            </Link>

            <p className="text-[11px] font-normal uppercase mb-4 text-white/50"
               style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>
              Get In Touch
            </p>
            <h2 className="text-[32px] leading-[1.10] text-white mb-3"
                style={{ fontWeight: 300, letterSpacing: "-0.96px" }}>
              Let's talk
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed mb-10">
              Have a question or want to explore a partnership? We're here and reply within 24 hours.
            </p>

            {/* Contact rows */}
            <div className="space-y-5">
              <a href="mailto:info@examnurture.com" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-normal uppercase text-white/50 mb-0.5"
                     style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>Email</p>
                  <p className="text-sm font-medium text-white">info@examnurture.com</p>
                </div>
              </a>

              <a href="tel:+917050722933" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-normal uppercase text-white/50 mb-0.5"
                     style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>Phone</p>
                  <p className="text-sm font-medium text-white">+91 70507 22933</p>
                </div>
              </a>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-normal uppercase text-white/50 mb-0.5"
                     style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>Address</p>
                  <p className="text-sm font-medium text-white leading-relaxed">Kashyap Mohalla, Chainpur<br />Jharkhand — 822110</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: socials + WhatsApp */}
          <div className="mt-12 relative z-10">
            <div className="flex items-center gap-2 flex-wrap mb-5">
              {socials.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 text-white text-xs font-medium transition-colors hover:bg-white/20 border border-white/10">
                  {s.icon}
                  {s.label}
                </a>
              ))}
            </div>

            <a href="https://wa.me/917050722933" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-[16px] bg-white/10 border border-white/15 hover:bg-white/20 transition-colors group">
              <div className="w-9 h-9 rounded-[10px] bg-[#25D366] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.524 5.845L.057 23.49a.75.75 0 00.906.978l5.808-1.524A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.745 9.745 0 01-5.195-1.495l-.372-.22-3.847 1.01 1.028-3.752-.242-.385A9.75 9.75 0 1112 21.75z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Chat on WhatsApp</p>
                <p className="text-xs text-white/50">+91 70507 22933</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors shrink-0" />
            </a>
          </div>
        </div>

        {/* RIGHT: Form panel */}
        <div className="flex-1 bg-white dark:bg-[var(--bg-secondary)] p-10 flex flex-col justify-center">

          {status === "success" ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-5"
                   style={{ background: "linear-gradient(145deg, #0D287E, #091E60)" }}>
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-[20px] font-semibold text-[var(--ink-1)] mb-2">Message sent!</h3>
              <p className="text-[var(--ink-2)] text-sm max-w-xs mb-6">
                We'll reply within 24 hours. Keep an eye on your inbox.
              </p>
              <button onClick={() => setStatus("idle")}
                className="text-sm font-medium text-[var(--ink-1)] underline underline-offset-2 hover:no-underline">
                Send another →
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-[11px] font-normal uppercase mb-3 text-[var(--ink-2)]"
                   style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>
                  Contact Form
                </p>
                <h3 className="text-[28px] leading-[1.10] text-[var(--ink-1)]"
                    style={{ fontWeight: 300, letterSpacing: "-0.96px" }}>
                  Send a message
                </h3>
              </div>

              {status === "error" && (
                <div className="flex items-start gap-3 p-4 rounded-[12px] bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm mb-5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-normal uppercase text-[var(--ink-2)] mb-1.5"
                           style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>Name</label>
                    <input required value={form.name} onChange={set("name")} placeholder="Rahul Sharma"
                      className="w-full px-4 py-3 rounded-[10px] border border-[var(--line)] text-sm text-[var(--ink-1)] placeholder-[var(--ink-4)] outline-none focus:border-[#0D287E] dark:focus:border-blue-400 transition-colors bg-white dark:bg-[var(--bg)]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-normal uppercase text-[var(--ink-2)] mb-1.5"
                           style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>Email</label>
                    <input required type="email" value={form.email} onChange={set("email")} placeholder="you@email.com"
                      className="w-full px-4 py-3 rounded-[10px] border border-[var(--line)] text-sm text-[var(--ink-1)] placeholder-[var(--ink-4)] outline-none focus:border-[#0D287E] dark:focus:border-blue-400 transition-colors bg-white dark:bg-[var(--bg)]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-normal uppercase text-[var(--ink-2)] mb-1.5"
                         style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>Subject</label>
                  <select required value={form.subject} onChange={set("subject")}
                    className="w-full px-4 py-3 rounded-[10px] border border-[var(--line)] text-sm text-[var(--ink-1)] outline-none focus:border-[#0D287E] dark:focus:border-blue-400 transition-colors appearance-none cursor-pointer bg-white dark:bg-[var(--bg)]">
                    <option value="" disabled>Select a topic…</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-normal uppercase text-[var(--ink-2)] mb-1.5"
                         style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.6px" }}>Message</label>
                  <textarea required minLength={10} rows={5} value={form.message} onChange={set("message")} placeholder="Tell us how we can help…"
                    className="w-full px-4 py-3 rounded-[10px] border border-[var(--line)] text-sm text-[var(--ink-1)] placeholder-[var(--ink-4)] outline-none focus:border-[#0D287E] dark:focus:border-blue-400 transition-colors resize-none bg-white dark:bg-[var(--bg)]" />
                </div>

                <button type="submit" disabled={status === "sending"}
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-ink)] text-white font-medium text-[15px] transition-colors disabled:opacity-60 mt-2"
                  style={{ fontWeight: 480, letterSpacing: "-0.10px" }}>
                  {status === "sending" ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Sending…</>
                  ) : (
                    <><Send className="w-4 h-4" />Send Message</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
