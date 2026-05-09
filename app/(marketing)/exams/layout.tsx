import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Competitive Exams — State PSC, Banking, SSC, Railway & More",
  description:
    "Explore exam preparation resources for JPSC, SBI PO, IBPS PO, SSC CGL, Railway NTPC, RBI Grade B, Daroga SI and all major government competitive exams in India. Syllabus, mock tests, PYQ papers.",
  alternates: { canonical: "/exams" },
  openGraph: {
    title: "All Competitive Exams — ExamNurture",
    description: "Find mock tests, PYQ papers, and study material for every major government exam in India.",
    url: "/exams",
  },
};

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
