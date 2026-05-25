"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Loader2, Eye, EyeOff, Phone, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { auth } from "@/lib/firebase";
import BrandLogo from "@/components/ui/BrandLogo";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

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

function navigateAfterAuth(target: string, router: ReturnType<typeof useRouter>) {
  if (/^https?:\/\//i.test(target)) {
    window.location.replace(target);
  } else {
    router.replace(target);
  }
}

export default function AuthModal({ onClose, next = "/dashboard" }: Props) {
  const { login, loginWithGoogle, loginWithPhone } = useAuth();
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<"google" | "phone" | "email">("google");
  
  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Phone state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* Render Google button */
  useEffect(() => {
    if (tab !== "google") return;
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    setError("");
    
    try {
      // Gracefully prevent calling Firebase with dummy API credentials, raising a mapped error immediately
      if (auth?.app?.options?.apiKey?.includes("DummyKey") || auth?.app?.options?.apiKey?.includes("dummy")) {
        throw new Error("auth/api-key-not-valid");
      }

      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      (window as any).confirmationResult = confirmationResult;
      
      setOtpSent(true); 
    } catch (err) {
      console.error(err);
      let friendlyMessage = "We couldn't send the verification code. Please check your phone number and try again.";
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes("invalid-phone-number") || msg.includes("invalid phone")) {
          friendlyMessage = "Please enter a valid 10-digit phone number with country code (e.g. +91 9999999999).";
        } else if (msg.includes("too-many-requests") || msg.includes("quota")) {
          friendlyMessage = "For security, too many requests have been made. Please wait a few minutes before trying again.";
        } else if (msg.includes("recaptcha")) {
          friendlyMessage = "Security verification failed. Please refresh the page and try again.";
        } else if (msg.includes("api-key-not-valid") || msg.includes("invalid-api-key") || msg.includes("key-not-valid")) {
          friendlyMessage = "Phone OTP is currently disabled because Firebase environment variables are not configured. Please use the Google or Email login tabs above to sign in securely.";
        }
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError("");
    try {
      const confirmationResult = (window as any).confirmationResult;
      if (!confirmationResult) throw new Error("No OTP request found.");
      
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      
      await loginWithPhone(idToken, phone);
      
      onClose();
      navigateAfterAuth(next, router);
    } catch (err) {
      console.error(err);
      let friendlyMessage = "The verification code is incorrect. Please check the SMS and try again.";
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes("expired") || msg.includes("session-expired")) {
          friendlyMessage = "This verification code has expired. Please request a new code.";
        } else if (msg.includes("invalid-verification-code") || msg.includes("incorrect")) {
          friendlyMessage = "Incorrect code. Please double-check the 6-digit code sent to your phone.";
        }
      }
      setError(friendlyMessage);
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
      {/* Backdrop with rich blur */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        {/* Modal card - rounded 3xl, rich shadow depth, glowing inner border */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[400px] rounded-[24px] overflow-hidden transition-colors"
          style={{
            background: "var(--card)",
            border: "1px solid var(--line-soft)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.08) inset"
          }}
        >
          {/* Subtle background glow effect */}
          <div className="absolute -top-[120px] -left-[120px] w-[240px] h-[240px] rounded-full blur-[100px] opacity-15 pointer-events-none" style={{ background: "var(--cyan)" }} />
          <div className="absolute -bottom-[120px] -right-[120px] w-[240px] h-[240px] rounded-full blur-[100px] opacity-15 pointer-events-none" style={{ background: "var(--blue)" }} />

          {/* Close button with premium micro-interaction */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05, background: "var(--bg-secondary)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center border z-50 transition-colors"
            style={{ color: "var(--ink-4)", borderColor: "var(--line-soft)" }}
            aria-label="Close"
          >
            <X size={14} />
          </motion.button>

          {/* Header */}
          <div className="px-8 pt-8 pb-6 relative z-10">
            <div className="mb-5">
              <BrandLogo size="md" />
            </div>

            <h2 className="text-xl font-bold mb-1.5 tracking-tight" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
              Sign in to continue
            </h2>
            <p className="text-xs font-normal" style={{ color: "var(--ink-3)", lineHeight: "1.4" }}>
              Select your preferred method to securely access your competitive exam practice dashboard.
            </p>
          </div>

          {/* Premium Segmented Toggle with Fluid Sliding Background */}
          <div className="px-8 mb-6 relative z-10">
            <div
              className="relative flex rounded-2xl p-1 gap-1"
              style={{ background: "var(--bg)", border: "1px solid var(--line-soft)" }}
            >
              {(["google", "phone", "email"] as const).map((t) => {
                const isActive = tab === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTab(t); setError(""); setOtpSent(false); }}
                    className="relative flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-colors capitalize z-10"
                    style={{ color: isActive ? "var(--ink-1)" : "var(--ink-4)" }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-lg shadow-sm border"
                        style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      />
                    )}
                    <span className="relative z-20">{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animated Form body */}
          <div className="px-8 pb-8 relative z-10">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-4 py-3 rounded-xl text-xs font-semibold leading-relaxed"
                style={{ background: "var(--red-soft)", color: "var(--red)", border: "1px solid var(--red-soft)" }}
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {/* Google tab */}
                {tab === "google" && (
                  <div className="flex flex-col items-center gap-4">
                    {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                      <div ref={googleBtnRef} className="w-full flex justify-center" />
                    ) : (
                      <div
                        className="w-full py-3.5 rounded-xl text-xs text-center font-medium"
                        style={{ background: "var(--bg)", color: "var(--ink-4)", border: "1px solid var(--line)" }}
                      >
                        Google Client ID not configured
                      </div>
                    )}
                    <p className="text-[10px] text-center" style={{ color: "var(--ink-4)", lineHeight: "1.4" }}>
                      No password needed. We'll set up your learning account automatically on first sign-in.
                    </p>
                  </div>
                )}

                {/* Phone tab */}
                {tab === "phone" && (
                  <div className="flex flex-col gap-4">
                    {!otpSent ? (
                      <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold" style={{ color: "var(--ink-2)" }}>Phone Number</label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center" style={{ color: "var(--ink-4)" }}>
                              <Phone size={15} />
                            </div>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+91 9999999999"
                              required
                              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                              style={{ border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }}
                              onFocus={(e) => {
                                e.target.style.borderColor = "var(--blue)";
                                e.target.style.boxShadow = "0 0 0 3px var(--blue-soft)";
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = "var(--line)";
                                e.target.style.boxShadow = "none";
                              }}
                            />
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="submit"
                          disabled={loading || phone.length < 5}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                          style={{ background: "var(--blue)" }}
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <>Send OTP <ArrowRight size={14} /></>}
                        </motion.button>
                        {/* Placeholder for Firebase Recaptcha */}
                        <div id="recaptcha-container" className="mx-auto"></div>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold" style={{ color: "var(--ink-2)" }}>Enter OTP sent to {phone}</label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="123456"
                            required
                            className="w-full px-4 py-3.5 rounded-xl text-lg text-center outline-none transition-all tracking-[0.5em] font-mono"
                            style={{ border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "var(--blue)";
                              e.target.style.boxShadow = "0 0 0 3px var(--blue-soft)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "var(--line)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="submit"
                          disabled={loading || otp.length < 4}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
                          style={{ background: "var(--blue)" }}
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <>Verify OTP <ArrowRight size={14} /></>}
                        </motion.button>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-xs font-semibold hover:underline mt-1 self-center"
                          style={{ color: "var(--ink-4)" }}
                        >
                          Change Phone Number
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Email tab */}
                {tab === "email" && (
                  <form onSubmit={handleEmailLogin} className="flex flex-col gap-4.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold" style={{ color: "var(--ink-2)" }}>Email</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center" style={{ color: "var(--ink-4)" }}>
                          <Mail size={15} />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                          style={{ border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "var(--blue)";
                            e.target.style.boxShadow = "0 0 0 3px var(--blue-soft)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "var(--line)";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold" style={{ color: "var(--ink-2)" }}>Password</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center" style={{ color: "var(--ink-4)" }}>
                          <Lock size={15} />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Your password"
                          required
                          className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm outline-none transition-all"
                          style={{ border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "var(--blue)";
                            e.target.style.boxShadow = "0 0 0 3px var(--blue-soft)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "var(--line)";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center transition-colors hover:text-[var(--blue)]"
                          style={{ color: "var(--ink-4)" }}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-60 mt-2"
                      style={{ background: "var(--blue)" }}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign In <ArrowRight size={14} /></>}
                    </motion.button>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

