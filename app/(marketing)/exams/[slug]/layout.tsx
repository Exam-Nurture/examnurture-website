import type { Metadata } from "next";
import { apiGetExamById } from "@/lib/api";
import Script from "next/script";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://examnurture.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const exam = await apiGetExamById(slug);
    const title = `${exam.name} Preparation — Test Series, PYQ & Study Material`;
    const subjectsList = typeof exam.subjects === "string" ? exam.subjects.split(",").map((s: string) => s.trim()) : [];
    const description = `Prepare for ${exam.name} with full-length mock tests, previous year papers, and AI analytics on ExamNurture. ${exam.pattern || ''}. Subjects: ${subjectsList.slice(0, 4).join(", ")}.`;
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
  } catch (err) {
    console.error("Error generating metadata for exam slug:", err);
    return {};
  }
}

export default async function ExamSlugLayout({ children, params }: { children: React.ReactNode, params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let exam: any = null;
  let board: any = null;

  try {
    exam = await apiGetExamById(slug);
    board = exam?.board;
  } catch (err) {
    console.error("Error fetching exam in layout:", err);
  }

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
