import type { Metadata } from "next";
import { ARTICLES } from "../data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://examnurture.in";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return {};

  const canonicalUrl = `${BASE}/blog/${slug}`;
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: article.title,
      description: article.description,
      url: canonicalUrl,
      type: "article",
      siteName: "ExamNurture",
    },
    twitter: {
      card: "summary",
      title: article.title,
      description: article.description,
    },
  };
}

export default function BlogSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
