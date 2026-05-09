"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiGetProfile, apiLogin, apiRegister, apiLogout, apiGoogleAuth, clearToken, type UserProfile } from "./api";

declare const google: any;

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function hasAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("en_token=");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasInitializedGoogle = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await apiGetProfile();
      setUser(profile);
    } catch {
      setUser(null);
      clearToken();
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const data = await apiGoogleAuth(credential);
    setUser(data.user as UserProfile);
  }, []);

  useEffect(() => {
    if (!hasAuthCookie()) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  // Global Google One Tap
  useEffect(() => {
    if (typeof window === "undefined" || hasInitializedGoogle.current) return;
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    hasInitializedGoogle.current = true; // Set early to prevent concurrent init calls

    const initGoogle = () => {
      if (typeof google === "undefined") {
        setTimeout(initGoogle, 500);
        return;
      }

      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            setLoading(true);
            try {
              await loginWithGoogle(response.credential);
              router.push('/dashboard');
            } catch (err) {
              console.error("Google Auth Error:", err);
            } finally {
              setLoading(false);
            }
          },
          auto_select: false,
        });
      } catch (e) {
        console.error("Google One Tap Init Error:", e);
        hasInitializedGoogle.current = false; // Reset on error
      }
    };

    initGoogle();
  }, [loginWithGoogle]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setUser(data.user as UserProfile);
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; phone?: string; password: string }) => {
      const res = await apiRegister(data);
      setUser(res.user as UserProfile);
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}
