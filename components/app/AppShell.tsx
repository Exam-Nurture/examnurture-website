"use client";

/**
 * Student app shell (v2). Calm and minimal:
 *   desktop  — soft sidebar: logo, exam switcher, 4 sections, Me + sign out
 *   phone    — slim top bar (logo + exam switcher) and a 5-item bottom tab bar
 * Nothing else competes for attention; each page owns its content.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BookOpen, ChevronDown, Home, LogOut, PenLine, User } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import { useAuth } from "@/lib/auth-context";
import { useMyExam } from "@/lib/my-exam";
import ExamPicker from "@/components/app/ExamPicker";

const NAV = [
  { href: "/dashboard", label: "Today", short: "Today", icon: Home, exact: true },
  { href: "/dashboard/course", label: "My course", short: "Course", icon: BookOpen },
  { href: "/dashboard/daily-quiz", label: "Practice", short: "Practice", icon: PenLine },
  { href: "/dashboard/performance", label: "Performance", short: "Progress", icon: BarChart3 },
];
const ME = { href: "/dashboard/profile", label: "Me", short: "Me", icon: User };

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function ExamSwitch({ compact = false, onOpen }: { compact?: boolean; onOpen: () => void }) {
  const { exam, ready } = useMyExam();
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex items-center justify-between gap-2 rounded-[14px] bg-[var(--card)] text-left shadow-[0_1px_2px_rgba(22,26,51,.05),0_6px_16px_-10px_rgba(22,26,51,.18)] transition-colors hover:bg-[var(--brand-soft)] ${
        compact ? "min-h-10 max-w-[60vw] px-3" : "min-h-14 w-full px-3.5"
      }`}
      aria-label={exam ? `Preparing for ${exam.name}. Change exam` : "Choose your exam"}
    >
      <span className="min-w-0">
        {!compact && <span className="block text-[11px] text-[var(--ink-3)]">Preparing for</span>}
        <span className={`block truncate font-semibold ${exam ? "text-[var(--ink-1)]" : "text-[var(--brand)]"} ${compact ? "text-sm" : "text-[15px]"}`}>
          {!ready ? "…" : exam ? exam.name : "Choose your exam"}
        </span>
      </span>
      <ChevronDown className="h-4 w-4 flex-none text-[var(--ink-3)]" aria-hidden="true" />
    </button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { exam, setExam } = useMyExam();
  const [picking, setPicking] = useState(false);

  const signOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] lg:grid lg:grid-cols-[256px_1fr]">
      {/* ── Desktop sidebar ── */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-2 bg-[var(--bg-secondary)] px-4 py-5 lg:flex">
        <div className="px-2 pb-4"><BrandLogo size="md" /></div>
        <ExamSwitch onOpen={() => setPicking(true)} />
        <nav aria-label="Main" className="mt-4 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const on = isActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-[15px] transition-all ${
                  on
                    ? "bg-[var(--card)] font-semibold text-[var(--ink-1)] shadow-[0_1px_2px_rgba(22,26,51,.05),0_6px_16px_-10px_rgba(22,26,51,.2)]"
                    : "text-[var(--ink-2)] hover:bg-[var(--card)]/60 hover:text-[var(--ink-1)]"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${on ? "text-[var(--brand)]" : ""}`} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <Link
            href={ME.href}
            aria-current={isActive(pathname, ME.href) ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-[15px] transition-all ${
              isActive(pathname, ME.href) ? "bg-[var(--card)] font-semibold text-[var(--ink-1)]" : "text-[var(--ink-2)] hover:bg-[var(--card)]/60"
            }`}
          >
            <User className="h-[18px] w-[18px]" aria-hidden="true" /> Me
          </Link>
          <button type="button" onClick={signOut} className="flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-left text-sm text-[var(--ink-3)] transition-colors hover:bg-[var(--card)]/60 hover:text-[var(--ink-1)]">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex min-w-0 flex-col">
        {/* Phone top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-[var(--bg)]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <BrandLogo size="sm" />
          <ExamSwitch compact onOpen={() => setPicking(true)} />
        </header>

        <main className="flex-1 pb-28 lg:pb-12">{children}</main>
      </div>

      {/* ── Phone tab bar ── */}
      <nav
        aria-label="Main"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[22px] bg-[var(--card)]/95 p-1.5 shadow-[0_16px_40px_-12px_rgba(22,26,51,.35)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
      >
        {[...NAV, ME].map(({ href, short, icon: Icon, ...rest }) => {
          const on = isActive(pathname, href, (rest as { exact?: boolean }).exact);
          return (
            <Link key={href} href={href} aria-current={on ? "page" : undefined} className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[16px] text-[11px]">
              <span className={`grid h-8 w-10 place-items-center rounded-[12px] transition-colors ${on ? "bg-[var(--brand)] text-[var(--brand-ink)]" : "text-[var(--ink-3)]"}`}>
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className={on ? "font-semibold text-[var(--brand)]" : "text-[var(--ink-3)]"}>{short}</span>
            </Link>
          );
        })}
      </nav>

      {picking && (
        <ExamPicker
          current={exam}
          onClose={() => setPicking(false)}
          onPick={(e) => {
            setExam(e);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
