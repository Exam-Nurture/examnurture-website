"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGetProfile, apiLogout } from "@/lib/api";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type NavItem = { label: string; href: string; icon: string };
type NavGroup = { group: string; items: NavItem[] } | NavItem;

const NAV: NavGroup[] = [
  { label: "Dashboard", href: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Users", href: "/admin/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  {
    group: "Catalog",
    items: [
      { label: "States", href: "/admin/states", icon: "M9 20l-5.447-2.724A2 2 0 013 15.488V5.512a2 2 0 011.553-1.932l5.447 2.724m0 13.696V6.304m0 13.696l5.447-2.724A2 2 0 0021 14.512V4.512a2 2 0 00-1.553-1.932L14 5.304" },
      { label: "Exam Categories", href: "/admin/exam-categories", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" },
      { label: "Boards", href: "/admin/boards", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
      { label: "Exams", href: "/admin/exams", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ],
  },
  {
    group: "Tests",
    items: [
      { label: "Test Series", href: "/admin/test-series", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
      { label: "Tests", href: "/admin/tests", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    ],
  },
  { label: "PYQ Papers", href: "/admin/pyq", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { label: "Study Materials", href: "/admin/study-materials", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { label: "Blogs", href: "/admin/blogs", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h6" },
  { label: "Team", href: "/admin/team", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { label: "Contact", href: "/admin/contact", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { label: "Orders", href: "/admin/orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { label: "Coupons", href: "/admin/coupons", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" },
];

function allNavItems(nav: NavGroup[]): NavItem[] {
  return nav.flatMap((e) => ("group" in e ? e.items : [e]));
}

function NavLink({ item, pathname, onClose }: { item: NavItem; pathname: string; onClose: () => void }) {
  const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative"
      style={{
        color: active ? "var(--blue)" : "var(--ink-2)",
        background: active ? "var(--blue-soft)" : "transparent",
        fontWeight: active ? 600 : 500,
      }}
    >
      {active && (
        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full" style={{ background: "var(--blue)" }} />
      )}
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
      </svg>
      {item.label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") return;

    apiGetProfile()
      .then((u) => {
        if (u.role !== "ADMIN" && u.role !== "SUPERADMIN") {
          router.replace("/admin/login");
        } else {
          setAdminName(u.name);
        }
      })
      .catch(() => router.replace("/admin/login"));
  }, [pathname, router]);

  async function handleLogout() {
    await apiLogout();
    router.push("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 flex flex-col transition-transform duration-200 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--card)", borderRight: "1px solid var(--line)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--blue)" }}>
            <span className="text-white text-xs font-bold">EN</span>
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--ink-1)" }}>Admin Panel</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map((entry) => {
            if ("group" in entry) {
              return (
                <div key={entry.group} className="mt-3 mb-1">
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ink-4)" }}>
                    {entry.group}
                  </p>
                  <div className="space-y-0.5">
                    {entry.items.map((item) => <NavLink key={item.href} item={item} pathname={pathname} onClose={() => setSidebarOpen(false)} />)}
                  </div>
                </div>
              );
            }
            return <NavLink key={entry.href} item={entry} pathname={pathname} onClose={() => setSidebarOpen(false)} />;
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--blue)" }}>
              {adminName[0]?.toUpperCase()}
            </div>
            <span className="text-xs font-medium truncate" style={{ color: "var(--ink-2)" }}>{adminName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: "var(--red)", background: "var(--red-soft)" }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-56">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2.5 border-b" style={{ background: "var(--card)", borderColor: "var(--line)" }}>
          <button className="md:hidden p-1.5 rounded-lg" style={{ color: "var(--ink-2)" }} onClick={() => setSidebarOpen(true)}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>
            {allNavItems(NAV).find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)))?.label ?? "Admin"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--ink-3)", background: "var(--bg)" }}>
              View site →
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
