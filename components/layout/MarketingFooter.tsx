import Link from "next/link";

const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=com.examnurture";

const footerLinks = {
  explore: [
    { name: "All Exams",          href: "/exams"      },
    { name: "All Test Series",    href: "/series/all" },
    { name: "All PYQ Papers",     href: "/pyq/all"    },
    { name: "Nurture Library",    href: "/blog"    },
  ],
  account: [
    { name: "Dashboard",          href: "/dashboard"            },
    { name: "My Library",         href: "/dashboard/my-library" },
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
    href: "https://youtube.com/@examnurture",
    label: "YouTube",
    external: true,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    href: "https://instagram.com/examnurture",
    label: "Instagram",
    external: true,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    href: "https://twitter.com/examnurture2025",
    label: "X / Twitter",
    external: true,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: "https://facebook.com/examnurture",
    label: "Facebook",
    external: true,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    href: "https://t.me/examnurture",
    label: "Telegram",
    external: true,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    href: "https://linkedin.com/company/examnurture",
    label: "LinkedIn",
    external: true,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
];

export default function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--bg)] border-t border-[var(--line-soft)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-3">
            <Link href="/" className="flex items-center gap-2.5 mb-4 hover:opacity-85 transition-opacity w-fit">
              <img src="/examnurture-logo.jpg" alt="ExamNurture logo" className="h-10 w-10 rounded-xl object-cover" />
              <span className="font-bold text-[17px] tracking-tight text-[var(--ink-1)]">
                Exam<span className="text-[var(--blue)]">Nurture</span>
              </span>
            </Link>

            <p className="text-sm text-[var(--ink-3)] leading-relaxed max-w-[300px] mb-7">
              India's most comprehensive competitive exam preparation platform. Crack JPSC, Banking, SSC, Railway and more with AI-powered practice.
            </p>

            {/* Download the App */}
            <div className="mb-7">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-[var(--ink-3)] mb-3">
                Download the App
              </p>
              <div className="flex flex-wrap gap-2.5">
                {/* Google Play */}
                <a
                  href={PLAYSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-[#111113] dark:bg-[var(--card)] border border-transparent dark:border-[var(--line)] text-white rounded-[13px] pl-3.5 pr-4 py-2.5 hover:opacity-80 transition-opacity"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px] shrink-0">
                    <path d="M3.18 23.76a1.49 1.49 0 0 1-.73-.19 1.57 1.57 0 0 1-.82-1.42V1.85a1.57 1.57 0 0 1 .82-1.42 1.49 1.49 0 0 1 1.54.1l17.1 10.14a1.57 1.57 0 0 1 0 2.66L3.99 23.47a1.49 1.49 0 0 1-.81.29z" />
                  </svg>
                  <div>
                    <p className="text-[9px] leading-none opacity-60 mb-0.5">Get it on</p>
                    <p className="text-[13px] font-semibold leading-none">Google Play</p>
                  </div>
                </a>

                {/* App Store */}
                <a
                  href={PLAYSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-[#111113] dark:bg-[var(--card)] border border-transparent dark:border-[var(--line)] text-white rounded-[13px] pl-3.5 pr-4 py-2.5 hover:opacity-80 transition-opacity"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px] shrink-0">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.15 1.26-2.13 3.76.03 2.97 2.61 3.96 2.64 3.97l-.06.19c-.28.87-.71 1.72-1.2 2.6zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div>
                    <p className="text-[9px] leading-none opacity-60 mb-0.5">Download on the</p>
                    <p className="text-[13px] font-semibold leading-none">App Store</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Follow Us */}
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-[var(--ink-3)] mb-3">
                Follow Us
              </p>
              <div className="flex items-center gap-2">
                {socialLinks.map(({ svg, href, label, external }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="w-10 h-10 rounded-[10px] bg-[var(--bg-secondary)] hover:bg-[var(--blue)] border border-[var(--line-soft)] flex items-center justify-center transition-all duration-200 text-[var(--ink-3)] hover:text-white hover:border-transparent hover:scale-[1.05]"
                  >
                    {svg}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-8 lg:pt-1">
            {/* Explore */}
            <div>
              <h3 className="text-[var(--ink-2)] font-semibold text-[13px] mb-4">Explore</h3>
              <ul className="space-y-2.5">
                {footerLinks.explore.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-sm text-[var(--ink-3)] hover:text-[var(--blue)] transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-[var(--ink-2)] font-semibold text-[13px] mb-4">Account</h3>
              <ul className="space-y-2.5">
                {footerLinks.account.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-sm text-[var(--ink-3)] hover:text-[var(--blue)] transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-[var(--ink-2)] font-semibold text-[13px] mb-4">Company</h3>
              <ul className="space-y-2.5">
                {footerLinks.company.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-sm text-[var(--ink-3)] hover:text-[var(--blue)] transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-[var(--ink-2)] font-semibold text-[13px] mb-4">Legal</h3>
              <ul className="space-y-2.5">
                {footerLinks.legal.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-sm text-[var(--ink-3)] hover:text-[var(--blue)] transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--line-soft)] mt-12 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-[var(--ink-3)]">
            &copy; {currentYear} ExamNurture. All rights reserved.
          </p>
          <p className="text-sm text-[var(--ink-3)]">
            Built for India's competitive exam aspirants 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
