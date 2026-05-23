import type { Metadata } from "next";
import { apiGetBlogBySlug } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://examnurture.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await apiGetBlogBySlug(slug);
    const canonicalUrl = `${BASE}/blog/${slug}`;
    const description = post.excerpt ?? `Read "${post.title}" on ExamNurture — expert articles for competitive exam preparation.`;

    return {
      title: `${post.title} — ExamNurture Blog`,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: post.title,
        description,
        url: canonicalUrl,
        type: "article",
        siteName: "ExamNurture",
        ...(post.coverUrl ? { images: [{ url: post.coverUrl }] } : {}),
        ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      },
      twitter: {
        card: post.coverUrl ? "summary_large_image" : "summary",
        title: post.title,
        description,
        ...(post.coverUrl ? { images: [post.coverUrl] } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default function BlogSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
