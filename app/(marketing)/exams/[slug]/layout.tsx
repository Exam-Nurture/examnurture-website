import type { Metadata } from "next";
import { findExam, getBoardForExam } from "@/lib/data/examCatalogue";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://examnurture.in";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const exam = findExam(slug);
  if (!exam) return {};

  const board = getBoardForExam(exam);
  const title = `${exam.name} Preparation — Mock Tests, PYQ & Study Material`;
  const description = `Prepare for ${exam.name} with full-length mock tests, previous year papers, and AI analytics on ExamNurture. ${exam.pattern}. Subjects: ${exam.subjects.slice(0, 4).join(", ")}.`;
  const canonicalUrl = `${BASE}/exams/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "ExamNurture",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function ExamSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
