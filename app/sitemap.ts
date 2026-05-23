import type { MetadataRoute } from "next";
import { apiGetExams, apiGetBlogs } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://examnurture.com";

function url(path: string, priority: number, freq: MetadataRoute.Sitemap[number]["changeFrequency"]): MetadataRoute.Sitemap[number] {
  return { url: `${BASE}${path}`, lastModified: new Date(), changeFrequency: freq, priority };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let examUrls: MetadataRoute.Sitemap = [];
  try {
    const exams = await apiGetExams();
    examUrls = exams.map((exam: any) =>
      url(`/exams/${exam.id}`, 0.8, "weekly")
    );
  } catch (error) {
    console.error("Failed to fetch exams for sitemap:", error);
  }

  let blogUrls: MetadataRoute.Sitemap = [];
  try {
    const res = await apiGetBlogs({ limit: 1000 });
    blogUrls = res.items.map((article) =>
      url(`/blog/${article.slug}`, 0.7, "monthly")
    );
  } catch (error) {
    console.error("Failed to fetch blogs for sitemap:", error);
  }

  return [
    url("/",            1.0, "daily"),
    url("/exams",       0.9, "weekly"),
    url("/series/all",  0.9, "daily"),
    url("/pyq/all",     0.9, "daily"),
    url("/blogs",        0.9, "daily"),
    url("/about",   0.5, "monthly"),
    url("/contact", 0.4, "monthly"),
    url("/privacy", 0.3, "yearly"),
    url("/terms",       0.3, "yearly"),
    url("/refund",      0.3, "yearly"),
    ...examUrls,
    ...blogUrls,
  ];
}
