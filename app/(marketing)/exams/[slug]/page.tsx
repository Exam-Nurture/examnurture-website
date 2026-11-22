"use client";

import { use } from "react";
import ExamCourse from "@/components/course/ExamCourse";

/** Public exam course page. Metadata + JSON-LD live in ./layout.tsx. */
export default function ExamCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <ExamCourse slug={slug} />;
}
