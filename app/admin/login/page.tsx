"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiAdminLogin, apiGoogleAuth, ApiError } from "@/lib/api";

declare const google: any;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Render Google Sign-In button
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || typeof google === "undefined" || !googleBtnRef.current) return;

    const tryInit = () => {
      if (typeof google === "undefined" || !googleBtnRef.current) {
        setTimeout(tryInit, 500);
        return;
      }
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
          auto_select: false,
        });
        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: googleBtnRef.current.offsetWidth || 340,
          text: "signin_with",
          shape: "rectangular",
        });
      } catch (e) {
        console.warn("Google Sign-In init error:", e);
      }
    };

    tryInit();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGoogleCallback(response: { credential: string }) {
    setError("");
    setLoading(true);
    try {
      const data = await apiGoogleAuth(response.credential);
      if (data.user.role !== "ADMIN" && data.user.role !== "SUPERADMIN") {
        setError("Access denied. Admin or superadmin account required.");
        return;
      }
      router.push("/admin");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setError("Access denied. Admin or superadmin account required.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiAdminLogin(email, password);
      if (data.user.role !== "ADMIN" && data.user.role !== "SUPERADMIN") {
        setError("You do not have admin access.");
        return;
      }
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl p-8" style={{ background: "var(--card)", boxShadow: "var(--shadow-md)" }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--blue)" }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "var(--ink-1)" }}>ExamNurture Admin</h1>
              <p className="text-sm" style={{ color: "var(--ink-3)" }}>Sign in to manage content</p>
            </div>
          </div>

          {/* Google Sign-In */}
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            <div className="mb-6">
              <div ref={googleBtnRef} className="w-full flex justify-center" />
              {loading && (
                <p className="text-xs text-center mt-2" style={{ color: "var(--ink-3)" }}>Verifying…</p>
              )}
            </div>
          ) : null}

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
            <span className="text-xs" style={{ color: "var(--ink-4)" }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink-2)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="info@examnurture.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid var(--line)",
                  background: "var(--bg)",
                  color: "var(--ink-1)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--blue)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink-2)" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid var(--line)",
                  background: "var(--bg)",
                  color: "var(--ink-1)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--blue)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
              />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl text-sm" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: "var(--blue)" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
