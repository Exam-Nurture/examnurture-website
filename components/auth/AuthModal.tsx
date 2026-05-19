"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

declare const google: {
  accounts: {
    id: {
      initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, cfg: object) => void;
      prompt: () => void;
    };
  };
};

interface Props {
  onClose: () => void;
  next?: string;
}

/**
 * Navigate after auth.
 * - Internal path (e.g. "/dashboard") → router.replace (SPA navigation).
 * - Absolute URL (e.g. "http://localhost:3002/exam/X" from the Test Portal)
 *   → window.location.replace (full navigation across origins).
 */
function navigateAfterAuth(target: string, router: ReturnType<typeof useRouter>) {
  if (/^https?:\/\//i.test(target)) {
    window.location.replace(target);
  } else {
    router.replace(target);
  }
}

export default function AuthModal({ onClose, next = "/dashboard" }: Props) {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<"google" | "email">("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* Render Google button */
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || typeof google === "undefined" || !googleBtnRef.current) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        setLoading(true);
        setError("");
        try {
          await loginWithGoogle(credential);
          onClose();
          navigateAfterAuth(next, router);
        } catch {
          setError("Google sign-in failed. Please try again.");
        } finally {
          setLoading(false);
        }
      },
    });

    google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      width: "340",
      text: "signin_with",
      shape: "rectangular",
    });
  }, [loginWithGoogle, router, next, onClose, tab]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      onClose();
      navigateAfterAuth(next, router);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        {/* Modal card */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--bg)] z-10"
            style={{ color: "var(--ink-4)" }}
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-2.5 mb-6">
              <img src="/examnurture-logo.jpg" alt="ExamNurture" className="h-9 w-9 rounded-xl object-cover" />
              <span className="font-bold text-base" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
                Exam<span style={{ color: "var(--cyan)" }}>Nurture</span>
              </span>
            </div>

            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
              Sign in to continue
            </h2>
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>
              New here? We'll create your account automatically.
            </p>
          </div>

          {/* Tab toggle */}
          <div className="px-8 mb-5">
            <div
              className="flex rounded-xl p-1 gap-1"
              style={{ background: "var(--bg)", border: "1px solid var(--line-soft)" }}
            >
              {(["google", "email"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(""); }}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={
                    tab === t
                      ? { background: "var(--card)", color: "var(--ink-1)", boxShadow: "var(--shadow-xs)" }
                      : { color: "var(--ink-4)" }
                  }
                >
                  {t === "google" ? "Continue with Google" : "Email & Password"}
                </button>
              ))}
            </div>
          </div>

          <div className="px-8 pb-8">
            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: "var(--red-soft)", color: "var(--red)", border: "1px solid var(--red)" }}
              >
                {error}
              </div>
            )}

            {/* Google tab */}
            {tab === "google" && (
              <div className="flex flex-col items-center gap-4">
                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                  <div ref={googleBtnRef} className="w-full" />
                ) : (
                  <div
                    className="w-full py-3 rounded-xl text-sm text-center font-medium"
                    style={{ background: "var(--bg)", color: "var(--ink-4)", border: "1px solid var(--line)" }}
                  >
                    Google Client ID not configured
                  </div>
                )}
                <p className="text-xs text-center" style={{ color: "var(--ink-4)" }}>
                  No password needed. We'll set up your account on first sign-in.
                </p>
              </div>
            )}

            {/* Email tab */}
            {tab === "email" && (
              <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--blue)"; e.target.style.boxShadow = "0 0 0 3px var(--blue-soft)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--line)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      required
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                      style={{ border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--blue)"; e.target.style.boxShadow = "0 0 0 3px var(--blue-soft)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--line)"; e.target.style.boxShadow = "none"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--ink-4)" }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: "var(--blue)" }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign In <ArrowRight size={15} /></>}
                </button>

                <p className="text-xs text-center" style={{ color: "var(--ink-4)" }}>
                  Don't have a password?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("google")}
                    className="font-semibold hover:underline"
                    style={{ color: "var(--blue)" }}
                  >
                    Sign in with Google
                  </button>
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
