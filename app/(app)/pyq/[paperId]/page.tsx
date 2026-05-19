"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

const PORTAL = process.env.NEXT_PUBLIC_TEST_PORTAL_URL || "http://localhost:3002";

export default function PYQRedirect() {
  const { paperId } = useParams<{ paperId: string }>();

  useEffect(() => {
    if (paperId) {
      window.location.replace(`${PORTAL}/pyq/${paperId}`);
    }
  }, [paperId]);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium" style={{ color: "var(--ink-3)" }}>
          Opening paper in Test Portal…
        </p>
      </div>
    </div>
  );
}
