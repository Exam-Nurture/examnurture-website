import type { Metadata } from "next";
import { findExam, getBoardForExam } from "@/lib/data/examCatalogue";
import Script from "next/script";

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

export default async function ExamSlugLayout({ children, params }: { children: React.ReactNode, params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = findExam(slug);
  const board = exam ? getBoardForExam(exam) : undefined;

  const jsonLd = exam ? {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": exam.name,
    "description": exam.description || `Preparation course for ${exam.name}`,
    "provider": {
      "@type": "Organization",
      "name": "ExamNurture",
      "sameAs": BASE
    },
    "about": {
      "@type": "Thing",
      "name": board?.fullName || exam.conductingBody || "Government Exam"
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <Script
          id="exam-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
