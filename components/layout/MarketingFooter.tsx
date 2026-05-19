import Link from "next/link";

const footerLinks = {
  explore: [
    { name: "All Exams",          href: "/exams"                },
    { name: "All Test Series",    href: "/series/all"           },
    { name: "All PYQ Papers",     href: "/pyq/all"              },
    { name: "Nurture Library",    href: "/library"              },
    { name: "All Courses",        href: "/courses/all"          },
    { name: "Mentorship",         href: "/mentorship"           },
  ],
  account: [
    { name: "Dashboard",          href: "/dashboard"            },
    { name: "My Library",         href: "/dashboard/my-library" },
    { name: "Analytics",          href: "/dashboard/analytics"  },
    { name: "Subscription Plans", href: "/dashboard/plans"      },
  ],
  company: [
    { name: "About Us",           href: "/about"                },
    { name: "Contact",            href: "/contact"              },
    { name: "Careers",            href: "/careers"              },
  ],
  legal: [
    { name: "Privacy Policy",     href: "/privacy"              },
    { name: "Terms of Service",   href: "/terms"                },
    { name: "Refund Policy",      href: "/refund"               },
  ],
};

const socialLinks: { href: string; label: string; external: boolean; svg: React.ReactNode }[] = [
  {
    href: "https://linkedin.com/company/examnurture",
    label: "LinkedIn",
    external: true,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
  {
    href: "https://twitter.com/examnurture2025",
    label: "X / Twitter",
    external: true,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: "https://youtube.com/@examnurture",
    label: "YouTube",
    external: true,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    href: "https://instagram.com/examnurture",
    label: "Instagram",
    external: true,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    href: "mailto:support@examnurture.com",
    label: "Email",
    external: false,
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

export default function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--bg)] border-t border-[var(--line-soft)] text-[var(--ink-3)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 hover:opacity-85 transition-opacity w-fit">
              <img src="/examnurture-logo.jpg" alt="ExamNurture" className="h-10 w-10 rounded-xl object-cover" />
              <span className="font-bold text-[17px] tracking-tight text-[var(--ink-1)]">
                Exam<span className="text-blue-600">Nurture</span>
              </span>
            </Link>

            <p className="text-sm text-[var(--ink-4)] leading-relaxed max-w-xs mb-6">
              India's most comprehensive competitive exam preparation platform. Crack JPSC, Banking, SSC, Railway and more with AI-powered practice.
            </p>

            <div className="flex items-center gap-3">
              {socialLinks.map(({ svg, href, label, external }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="w-9 h-9 rounded-lg bg-[var(--bg)] hover:bg-blue-600 border border-[var(--line-soft)] flex items-center justify-center transition-colors text-[var(--ink-4)] hover:text-white"
                >
                  {svg}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-[var(--ink-1)] font-semibold text-sm mb-4 uppercase tracking-wider">Explore</h3>
            <ul className="space-y-2.5">
              {footerLinks.explore.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-[var(--ink-4)] hover:text-blue-600 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-[var(--ink-1)] font-semibold text-sm mb-4 uppercase tracking-wider">Account</h3>
            <ul className="space-y-2.5">
              {footerLinks.account.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-[var(--ink-4)] hover:text-blue-600 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-[var(--ink-1)] font-semibold text-sm mb-4 uppercase tracking-wider">Company</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-[var(--ink-4)] hover:text-blue-600 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[var(--ink-1)] font-semibold text-sm mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-[var(--ink-4)] hover:text-blue-600 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--line-soft)] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--ink-4)]">
            &copy; {currentYear} ExamNurture. All rights reserved.
          </p>
          <p className="text-sm text-[var(--ink-4)]">
            Built for India's competitive exam aspirants 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
