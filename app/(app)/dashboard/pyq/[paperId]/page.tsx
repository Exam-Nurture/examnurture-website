"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { AppSpinner } from "@/components/app/AppPage";

function PYQRedirectInner() {
  const { paperId } = useParams<{ paperId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!paperId) return;
    const attemptId = searchParams.get("attemptId");
    const dest = attemptId ? `/pyq/${paperId}?attemptId=${attemptId}` : `/pyq/${paperId}`;
    router.replace(dest);
  }, [paperId, searchParams, router]);

  return <AppSpinner label="Opening paper" />;
}

export default function PYQRedirect() {
  return (
    <Suspense fallback={<AppSpinner label="Opening paper" />}>
      <PYQRedirectInner />
    </Suspense>
  );
}
