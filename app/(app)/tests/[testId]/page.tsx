"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

const PORTAL = process.env.NEXT_PUBLIC_TEST_PORTAL_URL || "http://localhost:3002";

export default function TestRedirect() {
  const { testId } = useParams<{ testId: string }>();

  useEffect(() => {
    if (testId) {
      window.location.replace(`${PORTAL}/exam/${testId}`);
    }
  }, [testId]);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium" style={{ color: "var(--ink-3)" }}>
          Opening exam in Test Portal…
        </p>
      </div>
    </div>
  );
}
