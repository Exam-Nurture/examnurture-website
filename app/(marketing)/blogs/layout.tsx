import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & Study Material — Notes, Current Affairs & Exam Strategies",
  description:
    "Read expert articles, study notes, current affairs, exam strategies, and topic-wise resources for JPSC, Banking, SSC, Railway and all government competitive exams.",
  alternates: { canonical: "/blogs" },
  openGraph: {
    title: "Blog & Study Material — ExamNurture",
    description: "Expert articles, study notes, current affairs and exam strategies for all government competitive exams.",
    url: "/blogs",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
