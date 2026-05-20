import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://examnurture.in";
const TITLE = "ExamNurture — India's Competitive Exam Preparation Platform";
const DESCRIPTION =
  "Crack JPSC, SBI PO, IBPS PO, RBI Grade B, SSC CGL, Railway NTPC, Daroga SI and more. Full-length mock tests, PYQ papers, AI analytics, real-time percentile ranking — one platform for all government competitive exams.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: TITLE,
    template: "%s | ExamNurture",
  },
  description: DESCRIPTION,
  keywords: [
    "JPSC Prelims mock test", "SBI PO preparation", "IBPS PO practice", "SSC CGL mock test",
    "Railway NTPC test series", "RBI Grade B", "Daroga SI mock test", "government exam preparation",
    "competitive exam India", "PYQ papers", "previous year papers",
  ],
  authors: [{ name: "ExamNurture", url: BASE }],
  creator: "ExamNurture",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE,
    siteName: "ExamNurture",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/examnurture-logo.jpg", width: 1200, height: 630, alt: "ExamNurture" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/examnurture-logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: BASE },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${sora.variable} ${jetbrainsMono.variable} h-full`}
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <body className="min-h-full bg-[var(--bg)] text-[var(--ink-1)]" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{
          __html: `(function() {
            try {
              var theme = localStorage.getItem('theme') || 'system';
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var isDark = theme === 'dark' || (theme === 'system' && prefersDark);
              var resolved = isDark ? 'dark' : 'light';
              document.documentElement.classList.add(resolved);
              document.documentElement.style.colorScheme = resolved;
            } catch (e) {}
          })();`
        }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ScrollReveal />
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
