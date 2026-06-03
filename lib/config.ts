/**
 * Shared runtime configuration — single source of truth.
 *
 * The backend API base URL was previously copy-pasted across lib/api.ts and
 * every marketing page. That duplication let one copy drift (apiAdminExportTest
 * dropped NEXT_PUBLIC_BACKEND_API_URL and hit localhost in prod). Resolve it
 * once, here, and import everywhere.
 *
 * NEXT_PUBLIC_* vars are inlined at build time by Next, so this works in both
 * server and client components.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api/v1";
