import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Previous Year Papers — PYQ with Solutions for All Exams",
  description:
    "Access thousands of previous year question papers (PYQ) with detailed solutions for JPSC, SBI PO, IBPS PO, SSC CGL, Railway NTPC, RBI Grade B and more. Practice real exam questions.",
  alternates: { canonical: "/pyq/all" },
  openGraph: {
    title: "Previous Year Papers — ExamNurture",
    description: "Thousands of PYQ papers with detailed solutions for every major government exam in India.",
    url: "/pyq/all",
  },
};

export default function PYQAllLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
