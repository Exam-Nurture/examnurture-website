"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LogIn, LayoutDashboard, LogOut, Smartphone, ChevronDown,
  Search, Library, X,
  User, FileText, TrendingUp, CreditCard,
  GraduationCap, Users, Mail, BarChart3,
  Home, MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/auth/AuthModal";
import MegaMenu from "@/components/layout/MegaMenu";

const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=com.kvebrk.rwwkrt";

/* ── Nav data ── */
const examsNav = [
  { name: "Browse Exams", href: "/exams",      icon: GraduationCap, desc: "Explore exams by category" },
  { name: "Test Series",  href: "/series/all", icon: BarChart3,     desc: "Full mock test series"     },
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
  const isLibraryActive = pathname.startsWith("/blog");
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
            isActive || show ? "text-blue-600 bg-blue-50/80" : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/60"
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
              className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100/80 overflow-hidden z-50 py-2 ${wide ? "w-72" : "w-64"}`}
            >
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href.split("?")[0]);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-start gap-3 px-4 py-3 group/item transition-colors ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 group-hover/item:bg-blue-100 group-hover/item:text-blue-600"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${active ? "text-blue-600" : "text-gray-900"}`}>{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
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
          active ? "text-blue-600 bg-blue-50/80" : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/60"
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
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-blue-50 text-blue-700 border-blue-200";
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileTab(null)}
              className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-semibold transition-all ${
                active
                  ? activeClasses
                  : "bg-gray-50/80 text-gray-700 border-gray-100 hover:bg-gray-100"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                active
                  ? accent === "amber" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                  : "bg-white text-gray-400 shadow-sm"
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
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      >
        {/* Glass background */}
        <div className={`absolute inset-0 transition-all duration-500 ${
          isScrolled
            ? "bg-white/85 backdrop-blur-xl border-b border-gray-200/60 shadow-lg shadow-gray-200/40"
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
                <span className="text-gray-900">Exam</span>
                <span className="text-blue-600">Nurture</span>
              </span>
            </Link>

            {/* Desktop nav pill */}
            <div className="hidden lg:flex flex-1 justify-center">
              <div className={`flex items-center gap-0.5 transition-all duration-500 ${
                isScrolled
                  ? "px-0"
                  : "px-4 py-2 rounded-full bg-gray-100/70 backdrop-blur-lg border border-gray-200/60 shadow-md shadow-gray-200/40"
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

              {/* Expandable search — desktop */}
              <div className="relative hidden md:block">
                <AnimatePresence mode="wait">
                  {showSearch ? (
                    <motion.div key="open"
                      initial={{ width: 36, opacity: 0 }}
                      animate={{ width: 220, opacity: 1 }}
                      exit={{ width: 36, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 backdrop-blur-md border border-blue-200 shadow-md"
                    >
                      <Search className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <input
                        ref={searchRef}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search exams…"
                        className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400 min-w-0"
                        onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                      />
                      {searchQuery && <button onClick={() => setSearchQuery("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
                    </motion.div>
                  ) : (
                    <motion.button key="closed"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => setShowSearch(true)}
                      title="Search (⌘K)"
                      className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-white/70 transition-all"
                    >
                      <Search className="w-[18px] h-[18px]" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile search button */}
              <button
                onClick={() => setShowSearch(s => !s)}
                className="md:hidden p-2 rounded-full text-gray-600 hover:bg-white/70 backdrop-blur-sm transition-all"
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
                <div className="w-20 h-9 rounded-full bg-gray-200/60 animate-pulse hidden md:block" />
              ) : user ? (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 py-1 pl-1 pr-2.5 rounded-full transition-all hover:bg-white/80 border border-white/60 bg-white/40 backdrop-blur-sm shadow-sm"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-blue-600 to-cyan-500">
                        {initials}
                      </span>
                    )}
                    <span className="text-[13px] font-semibold text-gray-900 hidden sm:block">{displayName.split(" ")[0]}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 mb-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 uppercase tracking-wide">{planLabel}</span>
                        </div>
                        {[
                          { icon: LayoutDashboard, label: "Dashboard",    href: "/dashboard" },
                          { icon: FileText,        label: "My Tests",     href: "/dashboard/series"    },
                          { icon: TrendingUp,      label: "Performance",  href: "/dashboard/analytics" },
                          { icon: CreditCard,      label: "Upgrade Plan", href: "/dashboard/plans"     },
                          { icon: User,            label: "Profile",      href: "/dashboard/profile"   },
                        ].map(({ icon: Icon, label, href }) => (
                          <Link key={href} href={href} onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                          >
                            <Icon className="w-4 h-4 text-gray-400" />{label}
                          </Link>
                        ))}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-white/60 rounded-full transition-all"
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
              className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-gray-100/80 px-4 py-3"
            >
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search exams, tests, topics…"
                  className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
                />
                {searchQuery
                  ? <button onClick={() => setSearchQuery("")}><X className="w-4 h-4 text-gray-400" /></button>
                  : <button onClick={() => setShowSearch(false)}><X className="w-4 h-4 text-gray-400" /></button>
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
              className="mb-3 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 p-4 pointer-events-auto"
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
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
              className="mb-3 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 p-4 pointer-events-auto"
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
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
              className="mb-3 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 p-4 pointer-events-auto"
            >
              {user ? (
                <>
                  {/* User card */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 mb-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-600 to-cyan-500">{initials}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 uppercase tracking-wide">{planLabel}</span>
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
                        className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-gray-100 bg-gray-50/80 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all"
                      >
                        <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        {label}
                      </Link>
                    ))}
                  </div>
                  <button onClick={() => { handleLogout(); setMobileTab(null); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-600 bg-red-50 border border-red-100"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-3 text-center">Sign in to track your progress</p>
                  <button
                    onClick={() => { setMobileTab(null); setShowAuthModal(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/25"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── The floating bottom tab bar ── */}
        <div className="relative pointer-events-auto bg-white/75 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-black/10 rounded-2xl px-2 py-1.5 flex items-center justify-around">

          {/* Home */}
          <Link
            href="/"
            onClick={() => setMobileTab(null)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              pathname === "/" ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "text-gray-500"
            }`}>
              <Home className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold ${pathname === "/" ? "text-blue-600" : "text-gray-400"}`}>Home</span>
          </Link>

          {/* Exams */}
          <button
            onClick={() => toggleMobileTab("exams")}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              mobileTab === "exams" || (mobileTab === null && isExamsActive)
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                : "text-gray-500"
            }`}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold ${
              mobileTab === "exams" || (mobileTab === null && isExamsActive) ? "text-blue-600" : "text-gray-400"
            }`}>Exams</span>
          </button>

          {/* Blog */}
          <Link
            href="/blog"
            onClick={() => setMobileTab(null)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isLibraryActive ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "text-gray-500"
            }`}>
              <Library className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold ${
              isLibraryActive ? "text-blue-600" : "text-gray-400"
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
                : "text-gray-500"
            }`}>
              <MoreHorizontal className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold ${
              mobileTab === "more" || (mobileTab === null && isMoreActive) ? "text-slate-700" : "text-gray-400"
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
                  mobileTab === "account" ? "bg-blue-600 text-white" : "text-gray-500"
                }`}>
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
            <span className={`text-[10px] font-semibold ${mobileTab === "account" ? "text-blue-600" : "text-gray-400"}`}>
              {user ? displayName.split(" ")[0] || "Me" : "Sign In"}
            </span>
          </button>

        </div>
      </div>
    </>
  );
}
