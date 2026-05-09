"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, Search, LogOut, ChevronDown,
  Sparkles, ClipboardList, FileText, BookOpen, Library,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MegaMenu from "@/components/layout/MegaMenu";

const FREE_ITEMS = [
  {
    label: "Free Test Series",
    href:  "/dashboard/series?filter=free",
    icon:  ClipboardList,
    desc:  "Full mock tests at zero cost",
    color: "text-blue-600",
    bg:    "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    label: "Free Previous Year Papers",
    href:  "/dashboard/pyq?filter=free",
    icon:  FileText,
    desc:  "Solved PYQs, completely free",
    color: "text-violet-600",
    bg:    "bg-violet-50 dark:bg-violet-900/20",
  },
  {
    label: "Free Courses",
    href:  "/dashboard/series?filter=free",
    icon:  BookOpen,
    desc:  "Structured courses, no paywall",
    color: "text-emerald-600",
    bg:    "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    label: "Free Study Material",
    href:  "/blog?filter=free",
    icon:  Library,
    desc:  "Notes, PDFs & topic resources",
    color: "text-amber-600",
    bg:    "bg-amber-50 dark:bg-amber-900/20",
  },
];

const NAV_BEFORE_EXAMS = [
  { href: "/dashboard", label: "Dashboard"   },
  { href: "/dashboard/series",    label: "Test Series" },
];

const NAV_AFTER_EXAMS = [
  { href: "/dashboard/pyq",        label: "Previous Year Papers" },
  { href: "/dashboard/mentorship-guidance", label: "Mentorship"           },
];

/** Map routes → human-readable page titles for breadcrumb */
const PAGE_TITLES: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/dashboard/series":     "Test Series",
  "/dashboard/pyq":        "Previous Year Papers",
  "/dashboard/mentorship-guidance": "Mentorship",
  "/dashboard/analytics":  "Analytics",
  "/dashboard/schedule":   "Schedule",
  "/exams":      "Browse Exams",
  "/blog":    "Nurture Library",
  "/dashboard/plans":      "Upgrade Plan",
  "/dashboard/profile":    "My Profile",
};

function getPageTitle(pathname: string): string {
  for (const [key, val] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || pathname.startsWith(key + "/")) return val;
  }
  return "ExamNurture";
}

export default function Topbar({ hideSidebarItems = false }: { hideSidebarItems?: boolean }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const [showMenu,      setShowMenu]      = useState(false);
  const [showFree,      setShowFree]      = useState(false);
  const [showExamsMenu, setShowExamsMenu] = useState(false);
  const freeRef = useRef<HTMLDivElement>(null);

  const displayName = user?.name ?? "Student";
  const initials    = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const planLabel   = user?.subscription ? `Tier ${user.subscription.tierLevel}` : "Free Plan";

  const handleLogout = async () => { await logout(); router.push("/"); };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (freeRef.current && !freeRef.current.contains(e.target as Node))
        setShowFree(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setShowFree(false);
    setShowMenu(false);
    setShowExamsMenu(false);
  }, [pathname]);

  const isFreeActive = FREE_ITEMS.some(i => pathname.startsWith(i.href.split("?")[0]));

  return (
    <header
      className="sticky top-0 h-14 z-30 flex items-center justify-between px-4 md:px-5 shrink-0"
      style={{
        background: "var(--card)",
        borderBottom: "1px solid var(--line-soft)",
      }}
    >
      {/* ── Left ── */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Logo — only on mobile (sidebar has it on desktop) OR when no sidebar */}
        {(!hideSidebarItems) && (
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
            <img src="/examnurture-logo.jpg" alt="ExamNurture" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-bold text-[15px] tracking-tight hidden sm:block" style={{ fontFamily: "var(--font-sora)" }}>
              <span style={{ color: "var(--ink-1)" }}>Exam</span>
              <span style={{ color: "var(--cyan)" }}>Nurture</span>
            </span>
          </Link>
        )}

        {/* Mobile logo when sidebar is hidden on mobile */}
        {hideSidebarItems && (
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0 md:hidden">
            <img src="/examnurture-logo.jpg" alt="ExamNurture" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-bold text-[15px] tracking-tight" style={{ fontFamily: "var(--font-sora)" }}>
              <span style={{ color: "var(--ink-1)" }}>Exam</span>
              <span style={{ color: "var(--cyan)" }}>Nurture</span>
            </span>
          </Link>
        )}

        {/* Page title breadcrumb — desktop, when sidebar is present */}
        {hideSidebarItems && (
          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span
              className="text-[14px] font-semibold truncate"
              style={{ color: "var(--ink-1)" }}
            >
              {getPageTitle(pathname)}
            </span>
          </div>
        )}

        {/* Horizontal nav — only when no sidebar (standalone topbar mode) */}
        {!hideSidebarItems && (
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV_BEFORE_EXAMS.map((item) => {
              const isActive = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[var(--blue-soft)] text-[var(--blue)]"
                      : "text-[var(--ink-3)] hover:bg-[var(--bg)] hover:text-[var(--ink-1)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <MegaMenu
              show={showExamsMenu}
              onMouseEnter={() => setShowExamsMenu(true)}
              onMouseLeave={() => setShowExamsMenu(false)}
            />

            {NAV_AFTER_EXAMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[var(--blue-soft)] text-[var(--blue)]"
                      : "text-[var(--ink-3)] hover:bg-[var(--bg)] hover:text-[var(--ink-1)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Free dropdown */}
            <div className="relative" ref={freeRef}>
              <button
                onClick={() => setShowFree(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold transition-all whitespace-nowrap ${
                  showFree || isFreeActive
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                    : "text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20"
                }`}
              >
                <svg className="w-3 h-3 shrink-0 animate-[spin_4s_linear_infinite]" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0l1.6 5.6L16 8l-6.4 2.4L8 16l-1.6-5.6L0 8l6.4-2.4z"/>
                </svg>
                Free
                <ChevronDown size={12} className={`transition-transform duration-200 ${showFree ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showFree && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 top-full mt-2 w-72 rounded-2xl shadow-2xl overflow-hidden z-50 py-2"
                    style={{ background: "var(--card)", border: "1px solid var(--line-soft)", boxShadow: "0 8px 32px -4px rgba(0,0,0,0.12)" }}
                  >
                    <div className="px-4 py-2.5 mb-1 flex items-center gap-2 border-b" style={{ borderColor: "var(--line-soft)" }}>
                      <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Sparkles size={13} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold" style={{ color: "var(--ink-1)" }}>Free Resources</p>
                        <p className="text-[10px]" style={{ color: "var(--ink-4)" }}>No subscription needed — completely free</p>
                      </div>
                    </div>
                    {FREE_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = pathname.startsWith(item.href.split("?")[0]);
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setShowFree(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors group ${active ? "bg-[var(--bg)]" : "hover:bg-[var(--bg)]"}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
                            <Icon size={15} className={item.color} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold leading-none truncate" style={{ color: "var(--ink-1)" }}>{item.label}</p>
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--ink-4)" }}>{item.desc}</p>
                          </div>
                          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
                            FREE
                          </span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        )}
      </div>

      {/* ── Right: Search + Bell + Avatar ── */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-[10px] w-52 transition-all"
          style={{ background: "var(--bg)", border: "1px solid var(--line-soft)" }}
        >
          <Search size={13} style={{ color: "var(--ink-4)" }} />
          <input
            placeholder="Search exams, topics, PYQs…"
            className="flex-1 border-none outline-none bg-transparent text-[12px]"
            style={{ color: "var(--ink-1)" }}
          />
          <kbd
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]"
            style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink-4)" }}
          >⌘K</kbd>
        </div>

        <ThemeToggle />

        <button
          className="relative w-8 h-8 rounded-[8px] flex items-center justify-center transition-all hover:bg-[var(--bg)]"
          style={{ color: "var(--ink-3)" }}
          aria-label="Notifications"
        >
          <Bell size={15} strokeWidth={1.8} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--red)", boxShadow: "0 0 0 2px var(--card)" }}
          />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center gap-2 py-1 pl-0.5 pr-2.5 rounded-[10px] transition-all hover:bg-[var(--bg)]"
            style={{ border: "1px solid var(--line-soft)" }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="w-7 h-7 rounded-[7px] object-cover" />
            ) : (
              <span
                className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white text-[11px] font-bold"
                style={{ background: "linear-gradient(135deg, var(--blue), var(--cyan))" }}
              >
                {initials}
              </span>
            )}
            <div className="text-left hidden sm:block">
              <div className="text-[12px] font-semibold leading-tight" style={{ color: "var(--ink-1)" }}>
                {displayName.split(" ")[0]}{displayName.split(" ")[1]?.[0] ? " " + displayName.split(" ")[1][0] + "." : ""}
              </div>
              <div className="text-[10px] leading-tight" style={{ color: "var(--ink-4)" }}>{planLabel}</div>
            </div>
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50"
              style={{ background: "var(--card)", border: "1px solid var(--line-soft)" }}
            >
              <Link href="/dashboard/profile" onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--ink-2)] hover:bg-[var(--bg)] transition-colors"
              >
                My Profile
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
