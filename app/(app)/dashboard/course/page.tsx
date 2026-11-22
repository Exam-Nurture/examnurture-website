"use client";

/** My course: the chosen exam's course page, inside the student app. */

import { useState } from "react";
import { BookOpen } from "lucide-react";
import ExamCourse from "@/components/course/ExamCourse";
import ExamPicker from "@/components/app/ExamPicker";
import { useMyExam } from "@/lib/my-exam";

export default function MyCoursePage() {
  const { exam, ready, setExam } = useMyExam();
  const [picking, setPicking] = useState(false);

  if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;

  if (!exam) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-[16px] bg-[var(--brand-soft)] text-[var(--brand)]">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>Pick your exam first</h1>
        <p className="text-[var(--ink-3)]">Your course shows its past papers, mock tests and dates in one place.</p>
        <button type="button" onClick={() => setPicking(true)} className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--brand)] px-6 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]">
          Choose your exam
        </button>
        {picking && (
          <ExamPicker
            current={null}
            onClose={() => setPicking(false)}
            onPick={(e) => {
              setExam(e);
              setPicking(false);
            }}
          />
        )}
      </div>
    );
  }

  return <ExamCourse slug={exam.id} stickyClass="top-16 lg:top-0" />;
}
