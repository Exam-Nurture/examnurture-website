import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Test Series — Full-Length Mock Tests for Government Exams",
  description:
    "Practice with full-length mock test series for JPSC, SBI PO, IBPS PO, SSC CGL, Railway NTPC, RBI Grade B and more. CBT-style interface, auto-timer, detailed solutions.",
  alternates: { canonical: "/series/all" },
  openGraph: {
    title: "All Test Series — ExamNurture",
    description: "Full-length mock test series for every major government competitive exam in India.",
    url: "/series/all",
  },
};

export default function SeriesAllLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
