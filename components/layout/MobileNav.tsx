"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, GraduationCap, BookOpen, FileText, Users } from "lucide-react";

const ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: Home          },
  { href: "/dashboard/series",     label: "Exams",      icon: GraduationCap },
  { href: "/dashboard/pyq",        label: "PYQ",        icon: FileText      },
  { href: "/dashboard/mentorship", label: "Mentorship", icon: Users         },
  { href: "/dashboard/profile",    label: "Profile",    icon: BookOpen      },
];

export default function MobileNav() {
  const pathname  = usePathname();
  const [visible, setVisible] = useState(true);
  const lastY     = useRef(0);

  /* Hide on scroll-down, reveal on scroll-up */
  useEffect(() => {
    const onScroll = () => {
      const y   = window.scrollY;
      const dir = y - lastY.current;
      if (Math.abs(dir) > 4) setVisible(dir < 0 || y < 60);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex md:hidden z-50 border-t"
      style={{
        background:    "var(--card)",
        borderColor:   "var(--line-soft)",
        paddingBottom: "env(safe-area-inset-bottom)",
        transform:     visible ? "translateY(0)" : "translateY(100%)",
        transition:    "transform 200ms ease",
      }}
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors duration-150"
            style={{ color: active ? "var(--blue)" : "var(--ink-4)" }}
          >
            <Icon size={18} strokeWidth={active ? 2 : 1.6} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
