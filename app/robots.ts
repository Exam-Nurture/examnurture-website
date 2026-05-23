import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://examnurture.com";
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
          "/blogs",
          "/blogs/",
          "/about",
          "/contact",
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
