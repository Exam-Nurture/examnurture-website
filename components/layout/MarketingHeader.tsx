"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LogIn, LayoutDashboard, LogOut, Smartphone, ChevronDown,
  Search, Library, X, Zap, Newspaper, BookMarked,
  User, FileText, TrendingUp, CreditCard,
  GraduationCap, Users, Mail, BarChart3,
  Home, MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/auth/AuthModal";
import MegaMenu from "@/components/layout/MegaMenu";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=com.kvebrk.rwwkrt";

/* ── Nav data ── */
const examsNav = [
  { name: "Browse Exams", href: "/exams",      icon: GraduationCap, desc: "Explore exams by category" },
  { name: "Test Series",  href: "/series/all", icon: BarChart3,     desc: "Full mock test series"     },
];

const learnNav = [
  { name: "Current News",    href: "/library?tab=news",    icon: Newspaper,  desc: "Daily current affairs digest"       },
  { name: "Daily Quiz",      href: "/daily-quiz",          icon: Zap,        desc: "5-question daily practice set"      },
  { name: "Nurture Library", href: "/library",             icon: Library,    desc: "Full study library & notes"         },
  { name: "Books & Magazine",href: "/library?tab=books",   icon: BookMarked, desc: "Recommended books & magazines"      },
];

const moreNav = [
  { name: "Contact",              href: "/contact",     icon: Mail,          desc: "Get in touch with us" },
  { name: "Courses",              href: "/courses/all", icon: GraduationCap, desc: "Structured exam-wise courses" },
  { name: "Mentorship",           href: "/mentorship",  icon: Users,         desc: "Personal guidance for preparation" },
];

/* ── Inner component that safely reads searchParams ── */
function SearchParamsReader({ onNext }: { onNext: (next: string | null) => void }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  useEffect(() => { onNext(next); }, [next, onNext]);
  return null;
}

/* ── "Learn ✦Free✦" label ── */
function LearnFreeLabel() {
  return (
    <span className="relative inline-flex items-center justify-center">
      <span className="absolute -top-[14px] left-1/2 -translate-x-1/2 flex items-center gap-[2px] whitespace-nowrap pointer-events-none select-none">
        <svg className="w-2 h-2 text-amber-400 shrink-0 animate-[spin_4s_linear_infinite]" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0l1.6 5.6L16 8l-6.4 2.4L8 16l-1.6-5.6L0 8l6.4-2.4z"/>
        </svg>
        <span className="text-[8px] font-bold tracking-wide text-amber-500 leading-none">Free</span>
        <svg className="w-2 h-2 text-amber-400 shrink-0 animate-[spin_4s_linear_infinite_reverse]" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0l1.6 5.6L16 8l-6.4 2.4L8 16l-1.6-5.6L0 8l6.4-2.4z"/>
        </svg>
      </span>
      <span>Learn</span>
    </span>
  );
}

export default function MarketingHeader() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isScrolled,     setIsScrolled]     = useState(false);
  const [isHidden,       setIsHidden]       = useState(false);
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const [showExamsMenu,  setShowExamsMenu]  = useState(false);
  const [showMoreMenu,   setShowMoreMenu]   = useState(false);
  const [showSearch,     setShowSearch]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [showAuthModal,  setShowAuthModal]  = useState(false);
  const [nextParam,      setNextParam]      = useState("/dashboard");

  // Mobile bottom nav state — which panel is open (null = closed)
  const [mobileTab,      setMobileTab]      = useState<"exams" | "more" | "account" | null>(null);

  const searchRef    = useRef<HTMLInputElement>(null);
  const lastScrollY  = useRef(0);
  const modalDismissed = useRef(false);

  const displayName = user?.name ?? "";
  const initials    = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";
  const planLabel   = user?.subscription ? `Tier ${user.subscription.tierLevel}` : "Free";

  const handleNextParam = useCallback((next: string | null) => {
    if (next && !modalDismissed.current) {
      setNextParam(next);
      if (!user && !loading) setShowAuthModal(true);
    }
  }, [user, loading]);

  const handleCloseAuthModal = () => {
    modalDismissed.current = true;
    setShowAuthModal(false);
  };

  useEffect(() => {
    const handle = () => {
      const y = window.scrollY;
      setIsScrolled(y > 10);
      setIsHidden(y > lastScrollY.current && y > 100);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  useEffect(() => {
    setShowUserMenu(false);
    setShowSearch(false);
    setShowExamsMenu(false);
    setShowMoreMenu(false);
    setMobileTab(null);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowSearch(true); }
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowUserMenu(false);
        setShowMoreMenu(false);
        setMobileTab(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handleOpenSearch = () => setShowSearch(true);
    window.addEventListener("open-search", handleOpenSearch);
    return () => window.removeEventListener("open-search", handleOpenSearch);
  }, []);

  useEffect(() => { if (showSearch) searchRef.current?.focus(); }, [showSearch]);

  const handleLogout = async () => { await logout(); router.push("/"); };

  const isExamsActive = pathname === "/exams" || pathname.startsWith("/exams/");
  const isLibraryActive = pathname.startsWith("/blog") || pathname.startsWith("/library");
  const isMoreActive  = moreNav.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"));

  const toggleMobileTab = (tab: typeof mobileTab) =>
    setMobileTab(prev => prev === tab ? null : tab);

  /* ── Shared dropdown shell (desktop) ── */
  function NavDropdown({
    trigger, items, isActive, show, onEnter, onLeave, wide,
  }: {
    trigger: React.ReactNode;
    items: { name: string; href: string; icon: React.ElementType; desc: string }[];
    isActive: boolean;
    show: boolean;
    onEnter: () => void;
    onLeave: () => void;
    wide?: boolean;
  }) {
    return (
      <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
        <button
          type="button"
          className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
            isActive || show 
              ? "text-blue-600 bg-blue-50/80 dark:bg-blue-900/20" 
              : "text-[var(--ink-2)] hover:text-blue-600 hover:bg-blue-50/60 dark:hover:bg-blue-900/10"
          }`}
        >
          {trigger}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${show ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" as const }}
              className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-[var(--card)] backdrop-blur-xl rounded-2xl shadow-xl border border-[var(--line-soft)] overflow-hidden z-50 py-2 ${wide ? "w-72" : "w-64"}`}
            >
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href.split("?")[0]);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-start gap-3 px-4 py-3 group/item transition-colors ${active ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-[var(--bg)]"}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      active ? "bg-blue-600 text-white" : "bg-[var(--bg)] text-[var(--ink-4)] group-hover/item:bg-blue-100 dark:group-hover/item:bg-blue-900/40 group-hover/item:text-blue-600"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${active ? "text-blue-600" : "text-[var(--ink-1)]"}`}>{item.name}</p>
                      <p className="text-xs text-[var(--ink-4)] mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ── Simple nav link (desktop) ── */
  function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
          active 
            ? "text-blue-600 bg-blue-50/80 dark:bg-blue-900/20" 
            : "text-[var(--ink-2)] hover:text-blue-600 hover:bg-blue-50/60 dark:hover:bg-blue-900/10"
        }`}
      >
        {children}
      </Link>
    );
  }

  /* ── Mobile panel grid of nav items ── */
  function MobileNavGrid({
    items, accent = "blue",
  }: {
    items: { name: string; href: string; icon: React.ElementType; desc: string }[];
    accent?: "blue" | "amber";
  }) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href.split("?")[0]);
          const activeClasses = accent === "amber"
            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
            : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileTab(null)}
              className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-semibold transition-all ${
                active
                  ? activeClasses
                  : "bg-[var(--bg)]/80 text-[var(--ink-2)] border-[var(--line-soft)] hover:bg-[var(--bg)]"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                active
                  ? accent === "amber" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-[var(--card)] text-[var(--ink-4)] shadow-sm"
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="leading-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsReader onNext={handleNextParam} />
      </Suspense>

      {showAuthModal && <AuthModal onClose={handleCloseAuthModal} next={nextParam} />}

      {/* ── Main Header ── */}
      <motion.header
        animate={{ y: isHidden ? -100 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" as const }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        {/* Glass background */}
        <div className={`absolute inset-0 transition-all duration-500 ${
          isScrolled
            ? "bg-[var(--glass)] backdrop-blur-2xl border-b border-[var(--line-soft)] shadow-lg shadow-black/10 dark:shadow-blue-950/20"
            : "bg-transparent"
        }`} />

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className={`flex items-center justify-between gap-3 transition-all duration-500 ${
            isScrolled ? "h-16 lg:h-[62px]" : "h-16 lg:h-20"
          }`}>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity flex-shrink-0">
              <img src="/examnurture-logo.jpg" alt="ExamNurture" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
              <span className="font-bold text-[17px] tracking-tight hidden sm:block" style={{ fontFamily: "var(--font-sora, sans-serif)" }}>
                <span className="text-[var(--ink-1)]">Exam</span>
                <span className="text-blue-600">Nurture</span>
              </span>
            </Link>

            {/* Desktop nav pill */}
            <div className="hidden lg:flex flex-1 justify-center">
              <div className={`flex items-center gap-0.5 transition-all duration-500 ${
                isScrolled
                  ? "px-0"
                  : "px-4 py-2 rounded-full bg-[var(--card)]/80 backdrop-blur-lg border border-[var(--line-soft)] shadow-md shadow-black/5"
              }`}>

                <NavLink href="/">Home</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/series/all">Test Series</NavLink>

                <MegaMenu
                  show={showExamsMenu}
                  onMouseEnter={() => setShowExamsMenu(true)}
                  onMouseLeave={() => setShowExamsMenu(false)}
                />

                <NavLink href="/pyq/all">Previous Year Papers</NavLink>
                <NavLink href="/blog">Blog</NavLink>
                <NavDropdown
                  trigger="More"
                  items={moreNav}
                  isActive={isMoreActive}
                  show={showMoreMenu}
                  onEnter={() => setShowMoreMenu(true)}
                  onLeave={() => setShowMoreMenu(false)}
                  wide
                />

              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Expandable search — desktop */}
              <div className="relative hidden md:block">
                <AnimatePresence mode="wait">
                  {showSearch ? (
                    <motion.div key="open"
                      initial={{ width: 36, opacity: 0 }}
                      animate={{ width: 220, opacity: 1 }}
                      exit={{ width: 36, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--card)] backdrop-blur-md border border-blue-400 shadow-md"
                    >
                      <Search className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <input
                        ref={searchRef}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search exams…"
                        className="flex-1 text-sm outline-none bg-transparent text-[var(--ink-1)] placeholder-[var(--ink-4)] min-w-0"
                        onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                      />
                      {searchQuery && <button onClick={() => setSearchQuery("")}><X className="w-3.5 h-3.5 text-[var(--ink-4)]" /></button>}
                    </motion.div>
                  ) : (
                    <motion.button key="closed"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => setShowSearch(true)}
                      title="Search (⌘K)"
                      className="p-2 rounded-full text-[var(--ink-3)] hover:text-blue-600 hover:bg-[var(--card)] transition-all"
                    >
                      <Search className="w-[18px] h-[18px]" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile search button */}
              <button
                onClick={() => setShowSearch(s => !s)}
                className="md:hidden p-2 rounded-full text-[var(--ink-3)] hover:bg-[var(--bg)] transition-all"
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              {/* Get App — desktop only */}
              <a href={PLAYSTORE_URL} target="_blank" rel="noopener noreferrer"
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] transition-all"
              >
                <Smartphone className="w-4 h-4" />
                Get App
              </a>

              {/* Auth — desktop only */}
              {loading ? (
                <div className="w-20 h-9 rounded-full bg-[var(--bg)] animate-pulse hidden md:block" />
              ) : user ? (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 py-1 pl-1 pr-2.5 rounded-full transition-all hover:bg-[var(--bg)] border border-[var(--line-soft)] bg-[var(--bg)]/40 backdrop-blur-sm shadow-sm"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-blue-600 to-cyan-500">
                        {initials}
                      </span>
                    )}
                    <span className="text-[13px] font-semibold text-[var(--ink-1)] hidden sm:block">{displayName.split(" ")[0]}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--ink-4)] transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-[var(--card)] backdrop-blur-xl rounded-2xl shadow-2xl border border-[var(--line-soft)] overflow-hidden py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-[var(--line-soft)] mb-1">
                          <p className="text-sm font-bold text-[var(--ink-1)] truncate">{displayName}</p>
                          <p className="text-[10px] text-[var(--ink-4)] uppercase tracking-wider font-bold mt-0.5">{planLabel} Plan</p>
                        </div>
                        {[
                          { icon: LayoutDashboard, label: "Dashboard",    href: "/dashboard" },
                          { icon: FileText,        label: "My Tests",     href: "/dashboard/series"    },
                          { icon: TrendingUp,      label: "Performance",  href: "/dashboard/analytics" },
                          { icon: CreditCard,      label: "Upgrade Plan", href: "/dashboard/plans"     },
                          { icon: User,            label: "Profile",      href: "/dashboard/profile"   },
                        ].map(({ icon: Icon, label, href }) => (
                          <Link key={href} href={href} onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--ink-2)] hover:bg-[var(--bg)] transition-colors"
                          >
                            <Icon className="w-4 h-4 text-[var(--ink-4)]" />{label}
                          </Link>
                        ))}
                        <div className="border-t border-[var(--line-soft)] mt-1 pt-1">
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center">
                  <button onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[var(--ink-2)] hover:text-blue-600 hover:bg-[var(--bg)]/60 rounded-full transition-all"
                  >
                    <LogIn className="w-4 h-4" />Sign In
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Mobile search bar (expands below header) */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden bg-[var(--bg)]/95 backdrop-blur-xl border-t border-[var(--line-soft)] px-4 py-3"
            >
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line-soft)]">
                <Search className="w-4 h-4 text-[var(--ink-4)] shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search exams, tests, topics…"
                  className="flex-1 text-sm outline-none bg-transparent text-[var(--ink-1)] placeholder-[var(--ink-4)]"
                />
                {searchQuery
                  ? <button onClick={() => setSearchQuery("")}><X className="w-4 h-4 text-[var(--ink-4)]" /></button>
                  : <button onClick={() => setShowSearch(false)}><X className="w-4 h-4 text-[var(--ink-4)]" /></button>
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ════════════════════════════════════════
          MOBILE FLOATING BOTTOM NAV  (lg:hidden)
          ════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pointer-events-none">

        {/* Backdrop dim when a panel is open */}
        <AnimatePresence>
          {mobileTab && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto"
              onClick={() => setMobileTab(null)}
            />
          )}
        </AnimatePresence>

        {/* ── Upward expanding panels ── */}
        <AnimatePresence>
          {mobileTab === "exams" && (
            <motion.div
              key="exams-panel"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" as const }}
              className="mb-3 bg-[var(--card)]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[var(--line-soft)] p-4 pointer-events-auto"
            >
              <p className="text-[10px] font-bold text-[var(--ink-4)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <GraduationCap className="w-3 h-3" /> Exams
              </p>
              <MobileNavGrid items={examsNav} accent="blue" />
            </motion.div>
          )}

          {mobileTab === "more" && (
            <motion.div
              key="more-panel"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" as const }}
              className="mb-3 bg-[var(--card)]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[var(--line-soft)] p-4 pointer-events-auto"
            >
              <p className="text-[10px] font-bold text-[var(--ink-4)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <MoreHorizontal className="w-3 h-3" /> More
              </p>
              <MobileNavGrid items={moreNav} accent="blue" />
              {/* Get App button */}
              <a href={PLAYSTORE_URL} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25"
                onClick={() => setMobileTab(null)}
              >
                <Smartphone className="w-4 h-4" /> Get App
              </a>
            </motion.div>
          )}

          {mobileTab === "account" && (
            <motion.div
              key="account-panel"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" as const }}
              className="mb-3 bg-[var(--card)]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[var(--line-soft)] p-4 pointer-events-auto"
            >
              {user ? (
                <>
                  {/* User card */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-xl border border-blue-500/20 mb-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-600 to-cyan-500">{initials}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--ink-1)] truncate">{displayName}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 uppercase tracking-wide">{planLabel}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
                      { icon: FileText,        label: "My Tests",  href: "/dashboard/series"    },
                      { icon: TrendingUp,      label: "Analytics", href: "/dashboard/analytics" },
                      { icon: User,            label: "Profile",   href: "/dashboard/profile"   },
                    ].map(({ icon: Icon, label, href }) => (
                      <Link key={href} href={href} onClick={() => setMobileTab(null)}
                        className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-[var(--line-soft)] bg-[var(--bg)] text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--card)] transition-all"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[var(--card)] shadow-sm flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-[var(--ink-4)]" />
                        </div>
                        {label}
                      </Link>
                    ))}
                  </div>
                  <button onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600/10 text-red-600 text-sm font-bold border border-red-600/20"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <div className="p-2 space-y-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-[var(--ink-1)]">Not Signed In</p>
                    <p className="text-xs text-[var(--ink-4)] mt-1">Sign in to track your progress and access all tests</p>
                  </div>
                  <button onClick={() => setShowAuthModal(true)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20"
                  >
                    <LogIn className="w-4 h-4" /> Sign In / Sign Up
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile Navigation Bar ── */}
        <div className="bg-[var(--glass)] backdrop-blur-2xl border border-[var(--line-soft)] rounded-[24px] shadow-2xl flex items-center justify-around p-1.5 ring-1 ring-black/5 pointer-events-auto">
          
          {/* Home */}
          <Link
            href="/"
            onClick={() => setMobileTab(null)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              pathname === "/" ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "text-[var(--ink-4)]"
            }`}>
              <Home className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold ${pathname === "/" ? "text-blue-600" : "text-[var(--ink-4)]"}`}>Home</span>
          </Link>

          {/* Exams */}
          <button
            onClick={() => toggleMobileTab("exams")}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              mobileTab === "exams" || (mobileTab === null && isExamsActive)
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                : "text-[var(--ink-4)]"
            }`}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold ${
              mobileTab === "exams" || (mobileTab === null && isExamsActive) ? "text-blue-600" : "text-[var(--ink-4)]"
            }`}>Exams</span>
          </button>

          {/* Blog */}
          <Link
            href="/blog"
            onClick={() => setMobileTab(null)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isLibraryActive ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "text-[var(--ink-4)]"
            }`}>
              <Library className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold ${
              isLibraryActive ? "text-blue-600" : "text-[var(--ink-4)]"
            }`}>Blog</span>
          </Link>

          {/* More */}
          <button
            onClick={() => toggleMobileTab("more")}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              mobileTab === "more" || (mobileTab === null && isMoreActive)
                ? "bg-slate-700 text-white shadow-md shadow-slate-700/30"
                : "text-[var(--ink-4)]"
            }`}>
              <MoreHorizontal className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold ${
              mobileTab === "more" || (mobileTab === null && isMoreActive) ? "text-slate-700" : "text-[var(--ink-4)]"
            }`}>More</span>
          </button>

          {/* Account */}
          <button
            onClick={() => toggleMobileTab("account")}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all overflow-hidden ${
              mobileTab === "account"
                ? "ring-2 ring-blue-500 ring-offset-1"
                : ""
            }`}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={displayName} className="w-8 h-8 rounded-xl object-cover" />
              ) : user ? (
                <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-blue-600 to-cyan-500">
                  {initials}
                </span>
              ) : (
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  mobileTab === "account" ? "bg-blue-600 text-white" : "text-[var(--ink-4)]"
                }`}>
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
            <span className={`text-[10px] font-semibold ${mobileTab === "account" ? "text-blue-600" : "text-[var(--ink-4)]"}`}>
              {user ? displayName.split(" ")[0] || "Me" : "Sign In"}
            </span>
          </button>

        </div>
      </div>
    </>
  );
}
