import type { MetadataRoute } from "next";
import { getAllExams } from "@/lib/data/examCatalogue";
import { ARTICLES } from "./(marketing)/blog/data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://examnurture.in";

function url(path: string, priority: number, freq: MetadataRoute.Sitemap[number]["changeFrequency"]): MetadataRoute.Sitemap[number] {
  return { url: `${BASE}${path}`, lastModified: new Date(), changeFrequency: freq, priority };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const examUrls = getAllExams().map((exam) =>
    url(`/exams/${exam.id}`, 0.8, "weekly")
  );

  const blogUrls = ARTICLES.map((article) =>
    url(`/blog/${article.slug}`, 0.7, "monthly")
  );

  return [
    url("/",            1.0, "daily"),
    url("/exams",       0.9, "weekly"),
    url("/series/all",  0.9, "daily"),
    url("/pyq/all",     0.9, "daily"),
    url("/blog",        0.9, "daily"),
    url("/blog/all",    0.8, "daily"),
    url("/about",       0.5, "monthly"),
    url("/contact",     0.4, "monthly"),
    url("/mentorship",  0.6, "monthly"),
    url("/courses/all", 0.7, "weekly"),
    url("/privacy",     0.3, "yearly"),
    url("/terms",       0.3, "yearly"),
    url("/refund",      0.3, "yearly"),
    ...examUrls,
    ...blogUrls,
  ];
}
