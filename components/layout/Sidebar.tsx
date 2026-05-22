"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, BookOpen, FileText,
  Library, Menu,
  User, Zap, GraduationCap, BookMarked
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/* ── Main nav items ── */
const NAV_ITEMS = [
  { href: "/dashboard",             label: "Dashboard",            icon: LayoutDashboard },
  { href: "/exams",                 label: "Browse Exams",         icon: GraduationCap   },
  { href: "/dashboard/series",      label: "Test Series",          icon: BookOpen        },
  { href: "/dashboard/pyq",         label: "Previous Year Papers", icon: FileText        },
  { href: "/blog",                  label: "Blog",                 icon: Library         },
  { href: "/dashboard/my-blog",     label: "My Library",           icon: BookMarked      },
];

const BOTTOM_ITEMS = [
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const SIDEBAR_KEY     = "en_sidebar_collapsed";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  });



  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  }, [collapsed]);



  /* ── Standard nav link ── */
  function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all group
          ${active
            ? "bg-[var(--blue-soft)] text-[var(--blue)]"
            : "text-[var(--ink-3)] hover:bg-[var(--bg)] hover:text-[var(--ink-1)]"
          }
          ${collapsed ? "justify-center" : ""}
        `}
      >
        <Icon size={17} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
        {!collapsed && (
          <span className="text-[13px] font-medium truncate leading-none">{label}</span>
        )}
        {collapsed && active && (
          <span className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--blue)" }} />
        )}
        {collapsed && (
          <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium whitespace-nowrap
            opacity-0 pointer-events-none group-hover:opacity-100 z-50 shadow-lg transition-opacity duration-150"
            style={{ background: "var(--card)", border: "1px solid var(--line-soft)", color: "var(--ink-1)" }}>
            {label}
          </span>
        )}
      </Link>
    );
  }



  return (
    <>
      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 hidden md:flex"
        style={{
          width: collapsed ? 64 : 232,
          background: "var(--card)",
          borderRight: "1px solid var(--line-soft)",
        }}
      >
        {/* Logo + hamburger */}
        <div className="flex items-center h-14 px-3 shrink-0 overflow-hidden"
          style={{ borderBottom: "1px solid var(--line-soft)" }}>
          {collapsed ? (
            <button onClick={() => setCollapsed(false)}
              className="w-full flex items-center justify-center h-8 rounded-[8px] transition-all hover:bg-[var(--bg)]"
              style={{ color: "var(--ink-3)" }} title="Expand sidebar">
              <Menu size={18} />
            </button>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity overflow-hidden">
                <img src="/examnurture-logo.jpg" alt="ExamNurture"
                  className="w-8 h-8 rounded-lg object-cover shrink-0" />
                <span className="font-bold text-[15px] tracking-tight whitespace-nowrap"
                  style={{ fontFamily: "var(--font-sora)" }}>
                  <span style={{ color: "var(--ink-1)" }}>Exam</span>
                  <span style={{ color: "var(--cyan)" }}>Nurture</span>
                </span>
              </Link>
              <button onClick={() => setCollapsed(true)}
                className="ml-1 w-8 h-8 flex items-center justify-center rounded-[8px] shrink-0 transition-all hover:bg-[var(--bg)]"
                style={{ color: "var(--ink-4)" }} title="Collapse sidebar">
                <Menu size={16} />
              </button>
            </>
          )}
        </div>

        {/* Scrollable nav area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 flex flex-col gap-0.5"
          style={{ scrollbarWidth: "none" }}>
          <div className="h-1" />

          {/* Main nav items */}
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}



          <div className="h-2" />
        </nav>

        {/* Bottom: profile + upgrade */}
        <div className="px-2 py-3 flex flex-col gap-0.5 shrink-0"
          style={{ borderTop: "1px solid var(--line-soft)" }}>
          {BOTTOM_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
          {!collapsed && !user?.subscription && (
            <Link href="/dashboard/plans"
              className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-[10px] transition-all"
              style={{ background: "linear-gradient(135deg, var(--blue), var(--cyan))" }}>
              <Zap size={14} className="text-white shrink-0" />
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-white leading-none">Upgrade to Pro</p>
                <p className="text-[10px] text-white/70 mt-0.5 leading-none">Unlock all features</p>
              </div>
            </Link>
          )}
        </div>
      </aside>

      {/* Spacer */}
      <div className="hidden md:block shrink-0 transition-all duration-300"
        style={{ width: collapsed ? 64 : 232 }} aria-hidden="true" />
    </>
  );
}
