import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://examnurture.in";
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/exams",
          "/exams/",
          "/series/all",
          "/pyq/all",
          "/blog",
          "/blog/",
          "/about",
          "/contact",
          "/mentorship",
          "/privacy",
          "/terms",
          "/refund",
        ],
        disallow: [
          "/dashboard",
          "/exam/",
          "/results/",
          "/admin",
          "/api/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
