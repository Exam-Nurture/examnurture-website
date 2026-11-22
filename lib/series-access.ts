/**
 * Who can open which test in a series — mirrors the backend rule in
 * examnurture-backend/src/routes/tests.ts (GET /tests/:id):
 *   - free series: a test is open unless the test itself is marked isLocked
 *   - paid series: EVERY test needs an active TEST_SERIES entitlement
 * The /test-series/:id response doesn't know the viewer, so we apply this on
 * the client to avoid showing "Start" for tests the backend would refuse.
 */
import { apiGetEntitlements } from "@/lib/api";

interface SeriesLike {
  id: string;
  isPaid: boolean;
  tests?: { isLocked: boolean }[];
}

export async function withAccess<T extends SeriesLike>(series: T, signedIn: boolean): Promise<T & { hasAccess: boolean }> {
  if (!series.isPaid) return { ...series, hasAccess: true };
  let granted = false;
  if (signedIn) {
    try {
      const { entitlements } = await apiGetEntitlements();
      const now = Date.now();
      granted = entitlements.some(
        (e) => e.contentType === "TEST_SERIES" && e.contentId === series.id && e.status === "ACTIVE" && new Date(e.expiresAt).getTime() > now,
      );
    } catch {
      granted = false;
    }
  }
  return {
    ...series,
    hasAccess: granted,
    tests: series.tests?.map((t) => ({ ...t, isLocked: t.isLocked || !granted })),
  };
}
