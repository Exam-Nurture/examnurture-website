"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSpinner } from "@/components/app/AppPage";

export default function TestRedirect() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (testId) router.replace(`/exam/${testId}`);
  }, [testId, router]);

  return <AppSpinner label="Opening test" />;
}
