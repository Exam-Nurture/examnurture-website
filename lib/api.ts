/**
 * ExamNurture API client
 *
 * - Stores access token in a JS-readable cookie `en_token` (readable by middleware)
 * - Refresh token is httpOnly (set/cleared by backend automatically)
 * - Auto-refreshes on 401 and retries the original request once
 */

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const TOKEN_COOKIE = "en_token";

/* ── HTTP status helpers ────────────────────────── */

function statusDescription(status: number): string {
  const map: Record<number, string> = {
    400: "Bad request",
    401: "Unauthorised",
    403: "Access denied",
    404: "Not found",
    409: "Conflict",
    422: "Validation error",
    429: "Too many requests",
    500: "Server error",
    502: "Bad gateway",
    503: "Service unavailable",
  };
  return map[status] ?? `HTTP ${status}`;
}

/* ── Token helpers ──────────────────────────────── */

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Cookie domain helper.
 * Scopes the access-token cookie to `.examnurture.com` in production so it's
 * readable by both `examnurture.com` (main site) and `test.examnurture.com`
 * (test portal). On localhost, omit Domain so the browser uses the bare host
 * (which is shared across ports).
 */
function cookieDomainAttr(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "";
  if (host.endsWith(".examnurture.com") || host === "examnurture.com") {
    return "; Domain=.examnurture.com";
  }
  return "";
}

export function setToken(token: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const domain = cookieDomainAttr();
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${2 * 24 * 60 * 60}; SameSite=Lax${domain}${secure}`;
}

export function clearToken() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const domain = cookieDomainAttr();
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax${domain}${secure}`;
}

/* ── Core fetch wrapper ─────────────────────────── */

let refreshing: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    setToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Public helper used by the AuthProvider on cold-load.
 * Returns true if the silent refresh (via httpOnly cookie) succeeded.
 */
export async function tryRefreshSession(): Promise<boolean> {
  if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
  return refreshing;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && retry) {
    if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
    const ok = await refreshing;
    if (ok) return apiFetch<T>(path, options, false);
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = `/?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new Error("Session expired");
  }

  if (!res.ok) {
    // Handle multiple backend error formats:
    // - CoreAPI (FastAPI):   { detail: "..." }
    // - Test_Backend (Express): { message: "..." } or { error: { message: "..." } }
    let body: { error?: { message?: string }; detail?: string | { msg?: string }[]; message?: string } = {};
    try { body = await res.json(); } catch { /* empty */ }

    let msg: string | undefined;
    
    // User-friendly error messages based on status codes
    const FRIENDLY_MESSAGES: Record<number, string> = {
      400: "There was a problem with your request. Please check and try again.",
      401: "Please sign in to access this feature.",
      403: "You don't have permission to perform this action.",
      404: "We couldn't find what you were looking for.",
      408: "The request took too long. Please check your connection and try again.",
      422: "Please check the information provided and try again.",
      429: "You're doing that too fast. Please wait a moment and try again.",
      500: "Oops! Something went wrong on our end. Please try again later.",
      502: "We're experiencing temporary server issues. Please try again soon.",
      503: "Service is temporarily unavailable. We're working on it!",
      504: "The server took too long to respond. Please try again."
    };

    if (res.status >= 500) {
      // Never show backend stack traces or internal errors to users
      msg = FRIENDLY_MESSAGES[res.status] || "Something went wrong on our end. Please try again later.";
    } else {
      if (typeof body?.detail === "string") {
        msg = body.detail;
      } else if (Array.isArray(body?.detail) && body.detail[0]?.msg) {
        // FastAPI validation errors: [{ loc: [...], msg: "...", type: "..." }]
        msg = body.detail.map((d) => d.msg).filter(Boolean).join("; ");
      } else if (body?.error?.message) {
        msg = body.error.message;
      } else if (typeof body?.message === "string") {
        msg = body.message;
      }

      // If the extracted message looks like a technical developer error, sanitize it
      if (msg && (
        msg.includes('TypeError') || 
        msg.includes('Exception') || 
        msg.includes('traceback') || 
        msg.includes('undefined') ||
        msg.includes('prisma') ||
        msg.includes('SQL')
      )) {
        msg = FRIENDLY_MESSAGES[res.status] || "An unexpected error occurred.";
      }
    }

    const fallback = FRIENDLY_MESSAGES[res.status] || res.statusText || statusDescription(res.status);
    throw new ApiError(res.status, msg || fallback, path);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public path?: string) {
    super(message || statusDescription(status));
    this.name = "ApiError";
  }
}

/* ── Auth endpoints ─────────────────────────────── */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  isVerified: boolean;
  role: "STUDENT" | "ADMIN" | "SUPERADMIN";
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, false);
  setToken(data.accessToken);
  return data;
}

export async function apiRegister(body: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  }, false);
  setToken(data.accessToken);
  return data;
}

export async function apiLogout(): Promise<void> {
  try {
    const token = getToken();
    await fetch(`${BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } finally {
    clearToken();
  }
}

/* ── User endpoints ─────────────────────────────── */

export interface UserProfile extends AuthUser {
  phone?: string;
  hasGoogle?: boolean;

  stats: {
    attempts: number;
    bookmarks: number;
    streakCurrent: number;
    streakLongest: number;
    attendedTestSeries: number;
    attendedPYQ: number;
  };
}

export async function apiGoogleAuth(credential: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  }, false);
  setToken(data.accessToken);
  return data;
}

export async function apiFirebaseLogin(idToken: string, phone: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/auth/firebase", {
    method: "POST",
    body: JSON.stringify({ idToken, phone }),
  }, false);
  setToken(data.accessToken);
  return data;
}

export async function apiUpdateProfile(body: {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}): Promise<UserProfile> {
  return apiFetch("/user/profile", { method: "PATCH", body: JSON.stringify(body) });
}

export async function apiGetProfile(): Promise<UserProfile> {
  return apiFetch("/user/profile");
}

export interface DashboardData {
  streak: { current: number; longest: number };
  dailyPractice: { available: boolean; count: number };
  upcomingTests: { id: string; title: string; scheduledAt: string; durationSec: number }[];
  recentAttempts: {
    id: string;
    score: number;
    totalMarks: number;
    timeTakenSec: number;
    completedAt: string;
    test: { id: string; title: string; totalMarks: number };
  }[];
  liveEvents: {
    id: string;
    title: string;
    host: string;
    scheduledAt: string;
    durationMin: number;
    isLive: boolean;
    registeredCount: number;
  }[];
}

export async function apiGetDashboard(): Promise<DashboardData> {
  return apiFetch("/user/dashboard");
}

export interface AnalyticsData {
  weakTopics: { topicName: string; examId: string; strength: number; status: string }[];
  attemptHistory: { id: string; score: number; totalMarks: number; completedAt: string }[];
  scoreProgress: { date: string; score: number; totalMarks: number }[];
  examBreakdown: Record<string, { count: number; avgScore: number }>;
}

export async function apiGetAnalytics(): Promise<AnalyticsData> {
  return apiFetch("/user/analytics");
}



/* ── Exams / Boards ─────────────────────────────── */

export interface ApiExamCategory {
  id: number; name: string; slug: string; icon?: string; colorTint?: string; sortOrder?: number;
}

export async function apiGetExamCategories(): Promise<ApiExamCategory[]> {
  return apiFetch<ApiExamCategory[]>("/exam-categories");
}

export interface ApiExamSubject {
  id: number; name: string; slug: string;
}

export async function apiGetExamSubjects(examId?: string): Promise<ApiExamSubject[]> {
  const qs = examId ? `?examId=${examId}` : "";
  return apiFetch<ApiExamSubject[]>(`/exam-subjects${qs}`);
}

export interface ApiBoardExam {
  id: string; name: string; shortName: string; hasTests: boolean; hasPYQ: boolean; tier: number;
}

export interface ApiBoard {
  id: string; name: string; shortName: string; tint: string; colorSoft?: string;
  state?: { id: number; name: string } | null;
  exams?: ApiBoardExam[];
}

export interface ApiState {
  id: number; name: string;
  boards: Pick<ApiBoard, "id" | "name" | "shortName" | "tint" | "colorSoft">[];
}

export async function apiGetStates(): Promise<ApiState[]> {
  return apiFetch<ApiState[]>("/states");
}

export async function apiGetBoards(params?: { tier?: number }): Promise<ApiBoard[]> {
  const qs = params?.tier ? `?tier=${params.tier}` : "";
  return apiFetch<ApiBoard[]>(`/boards${qs}`);
}

export async function apiGetExams(params?: { board?: string; tier?: number }) {
  const qs = new URLSearchParams();
  if (params?.board) qs.set("board", params.board);
  if (params?.tier) qs.set("tier", String(params.tier));
  const s = qs.toString();
  return apiFetch<any[]>(`/exams${s ? `?${s}` : ""}`);
}

export async function apiGetExamById(id: string): Promise<any> {
  return apiFetch<any>(`/exams/${id}`);
}

/* ── Tests ─────────────────────────────────────── */

export async function apiGetTestSeries(params?: { examId?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.examId) qs.set("examId", params.examId);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return apiFetch(`/test-series${s ? `?${s}` : ""}`);
}

export async function apiGetTest(testId: string) {
  return apiFetch(`/tests/${testId}`);
}

export async function apiStartAttempt(testId: string) {
  return apiFetch(`/attempts/start`, {
    method: "POST",
    body: JSON.stringify({ testId }),
  });
}

export async function apiSubmitAttempt(
  testId: string,
  answers: Record<string, number>,
  timeTakenSec: number,
) {
  return apiFetch(`/attempts/${testId}/submit`, {
    method: "POST",
    body: JSON.stringify({ testId, answers, timeTakenSec }),
  });
}

export async function apiGetAttemptResult(attemptId: string) {
  return apiFetch(`/attempts/${attemptId}/result`);
}

/* ── Email Report ────────────────────────────────
 * POST /reports/email — backend sends a beautiful HTML report
 * to the user's registered email for the given attempt.
 * `kind` distinguishes test-series, PYQ, and daily-quiz attempts.
 */
export async function apiEmailReport(params: { attemptId: string; kind: "test" | "pyq" | "daily-quiz" }) {
  return apiFetch(`/reports/email`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/* ── PYQ Papers ─────────────────────────────────── */

export async function apiGetPYQPapers(params?: { examId?: string; year?: number; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.examId) qs.set("examId", params.examId);
  if (params?.year) qs.set("year", String(params.year));
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return apiFetch(`/pyq${s ? `?${s}` : ""}`);
}

export async function apiGetPYQPaperById(paperId: string) {
  return apiFetch(`/pyq/${paperId}`);
}

export async function apiGetPYQQuestions(paperId: string) {
  return apiFetch(`/pyq/${paperId}/questions`);
}

export async function apiStartPYQAttempt(paperId: string) {
  return apiFetch(`/pyq/attempts/start`, {
    method: "POST",
    body: JSON.stringify({ paperId }),
  });
}

export async function apiSubmitPYQAttempt(paperId: string, answers: Record<string, number>, timeTakenSec: number) {
  return apiFetch(`/pyq/attempts/${paperId}/submit`, {
    method: "POST",
    body: JSON.stringify({ paperId, answers, timeTakenSec }),
  });
}

export async function apiGetPYQAttempts() {
  return apiFetch("/pyq/attempts");
}

export async function apiGetPYQAttemptResult(attemptId: string) {
  return apiFetch(`/pyq/attempts/${attemptId}/result`);
}

/* ── Daily Practice ─────────────────────────────── */

export async function apiGetDailyPractice() {
  return apiFetch("/daily-practice");
}

export async function apiSubmitDailyPractice(answers: Record<string, number>) {
  return apiFetch("/daily-practice/submit", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

/* ── Bookmarks ──────────────────────────────────── */

export async function apiGetBookmarks() { return apiFetch("/bookmarks"); }
export async function apiAddBookmark(questionId: string) {
  return apiFetch("/bookmarks", { method: "POST", body: JSON.stringify({ questionId }) });
}
export async function apiRemoveBookmark(questionId: string) {
  return apiFetch(`/bookmarks/${questionId}`, { method: "DELETE" });
}

/* ── Events ─────────────────────────────────────── */

export async function apiGetEvents(upcoming = true) {
  return apiFetch(`/events${upcoming ? "?upcoming=true" : ""}`);
}

/* ── Admin ──────────────────────────────────────── */

export interface AdminLoginResponse {
  accessToken: string;
  user: AuthUser;
}

export async function apiAdminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const data = await apiFetch<AdminLoginResponse>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, false);
  setToken(data.accessToken);
  return data;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages?: number;
}

function buildQS(params: Record<string, string | number | boolean | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

interface AdminPaymentRow {
  id: string; amountPaise: number; status: string; createdAt: string;
  user?: { name: string; email: string };
}

// Dashboard
export async function apiAdminDashboard() {
  return apiFetch<{
    stats: Record<string, number>;
    recentUsers: AuthUser[];
    recentPayments: AdminPaymentRow[];
  }>("/admin/dashboard");
}

// Users
export async function apiAdminGetUsers(params?: { page?: number; limit?: number; search?: string }) {
  return apiFetch<PaginatedResponse<AuthUser>>(`/admin/users${buildQS(params ?? {})}`);
}
export async function apiAdminUpdateUser(id: string, body: Record<string, unknown>) {
  return apiFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function apiAdminDeleteUser(id: string) {
  return apiFetch(`/admin/users/${id}`, { method: "DELETE" });
}

// States
export async function apiAdminGetStates() {
  return apiFetch<PaginatedResponse<{ id: number; name: string }>>("/admin/states");
}
export async function apiAdminCreateState(name: string) {
  return apiFetch("/admin/states", { method: "POST", body: JSON.stringify({ name }) });
}
export async function apiAdminDeleteState(id: number) {
  return apiFetch(`/admin/states/${id}`, { method: "DELETE" });
}

// Exam Categories
export async function apiAdminGetExamCategories() {
  return apiFetch<{ id: number; name: string; _count?: { exams: number } }[]>("/admin/exam-categories");
}
export async function apiAdminCreateExamCategory(name: string) {
  return apiFetch("/admin/exam-categories", { method: "POST", body: JSON.stringify({ name }) });
}
export async function apiAdminUpdateExamCategory(id: number, name: string) {
  return apiFetch(`/admin/exam-categories/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
}
export async function apiAdminDeleteExamCategory(id: number) {
  return apiFetch(`/admin/exam-categories/${id}`, { method: "DELETE" });
}

// Boards
export interface AdminBoard {
  id: string; name: string; shortName: string; description: string;
  tint: string; colorSoft: string; minTier: number; stateId?: number;
  logoUrl?: string; website?: string; isActive: boolean;
}
export async function apiAdminGetBoards(params?: { page?: number; limit?: number }) {
  return apiFetch<PaginatedResponse<AdminBoard>>(`/admin/boards${buildQS(params ?? {})}`);
}
export async function apiAdminCreateBoard(body: Partial<AdminBoard>) {
  return apiFetch("/admin/boards", { method: "POST", body: JSON.stringify(body) });
}
export async function apiAdminUpdateBoard(id: string, body: Partial<AdminBoard>) {
  return apiFetch(`/admin/boards/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function apiAdminDeleteBoard(id: string) {
  return apiFetch(`/admin/boards/${id}`, { method: "DELETE" });
}

// Exams
export interface AdminExam {
  id: string; boardId: string; name: string; shortName: string; fullName?: string;
  tier: number; eligibility: string; pattern: string; subjects: string;
  hasTests: boolean; hasPYQ: boolean; hasGuide: boolean; isFeatured: boolean; isActive: boolean;
  upcomingDate?: string; applicationFee?: string; notificationUrl?: string;
}
export async function apiAdminGetExams(params?: { page?: number; limit?: number; boardId?: string }) {
  return apiFetch<PaginatedResponse<AdminExam>>(`/admin/exams${buildQS(params ?? {})}`);
}
export async function apiAdminCreateExam(body: Partial<AdminExam>) {
  return apiFetch("/admin/exams", { method: "POST", body: JSON.stringify(body) });
}
export async function apiAdminUpdateExam(id: string, body: Partial<AdminExam>) {
  return apiFetch(`/admin/exams/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function apiAdminDeleteExam(id: string) {
  return apiFetch(`/admin/exams/${id}`, { method: "DELETE" });
}

// Test Series
export interface AdminTestSeries {
  id: string; examId: string; title: string; description?: string;
  totalTests: number; isPaid: boolean; isFeatured: boolean;
  isActive: boolean; price: number; discountedPrice?: number;
}
export async function apiAdminGetTestSeries(params?: { page?: number; limit?: number; examId?: string }) {
  return apiFetch<PaginatedResponse<AdminTestSeries>>(`/admin/test-series${buildQS(params ?? {})}`);
}
export async function apiAdminCreateTestSeries(body: Partial<AdminTestSeries>) {
  return apiFetch("/admin/test-series", { method: "POST", body: JSON.stringify(body) });
}
export async function apiAdminUpdateTestSeries(id: string, body: Partial<AdminTestSeries>) {
  return apiFetch(`/admin/test-series/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function apiAdminDeleteTestSeries(id: string) {
  return apiFetch(`/admin/test-series/${id}`, { method: "DELETE" });
}

// Tests
export interface AdminTest {
  id: string; seriesId: string; title: string; description?: string;
  testType: string; subjects?: string; durationSec: number;
  totalMarks: number; negMarks: number;
  isLocked: boolean; isActive: boolean;
}
export async function apiAdminGetTests(params?: { page?: number; seriesId?: string }) {
  return apiFetch<PaginatedResponse<AdminTest>>(`/admin/tests${buildQS(params ?? {})}`);
}
export async function apiAdminCreateTest(body: Partial<AdminTest>) {
  return apiFetch("/admin/tests", { method: "POST", body: JSON.stringify(body) });
}
export async function apiAdminUpdateTest(id: string, body: Partial<AdminTest>) {
  return apiFetch(`/admin/tests/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function apiAdminDeleteTest(id: string) {
  return apiFetch(`/admin/tests/${id}`, { method: "DELETE" });
}
export async function apiAdminExportTest(id: string, format: "json" | "zip" = "json"): Promise<Blob> {
  const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await fetch(`${BASE}/admin/tests/${id}/export?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res.blob();
}
export async function apiAdminBulkUploadQuestions(testId: string, questions: Record<string, unknown>[]) {
  return apiFetch<{ added: number; testId: string }>(
    `/admin/tests/${testId}/questions/bulk`,
    { method: "POST", body: JSON.stringify(questions) }
  );
}
export async function apiAdminBulkUploadPYQQuestions(paperId: string, questions: Record<string, unknown>[]) {
  return apiFetch<{ added: number; paperId: string }>(
    `/admin/pyq/${paperId}/questions/bulk`,
    { method: "POST", body: JSON.stringify(questions) }
  );
}

// Questions
export interface AdminQuestion {
  id: string; text: string; textHindi?: string; options: string; correctIndex: number;
  explanation?: string; subjectSuperset?: string; subject?: string; chapter?: string;
  topic?: string; difficulty: string; language: string; source?: string; year?: number; examId?: string;
}
export async function apiAdminGetQuestions(params?: { page?: number; limit?: number; subject?: string; examId?: string }) {
  return apiFetch<PaginatedResponse<AdminQuestion>>(`/admin/questions${buildQS(params ?? {})}`);
}
export async function apiAdminCreateQuestion(body: Partial<AdminQuestion>) {
  return apiFetch("/admin/questions", { method: "POST", body: JSON.stringify(body) });
}
export async function apiAdminUpdateQuestion(id: string, body: Partial<AdminQuestion>) {
  return apiFetch(`/admin/questions/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function apiAdminDeleteQuestion(id: string) {
  return apiFetch(`/admin/questions/${id}`, { method: "DELETE" });
}

// PYQ Papers
export interface AdminPYQPaper {
  id: string; examId: string; title: string; year: number; shift?: string;
  totalQs: number; durationMin: number; pdfUrl?: string; type: string;
  hasSolutions: boolean; isActive: boolean;
}
export async function apiAdminGetPYQ(params?: { page?: number; limit?: number; examId?: string }) {
  return apiFetch<PaginatedResponse<AdminPYQPaper>>(`/admin/pyq${buildQS(params ?? {})}`);
}
export async function apiAdminCreatePYQ(body: Partial<AdminPYQPaper>) {
  return apiFetch("/admin/pyq", { method: "POST", body: JSON.stringify(body) });
}
export async function apiAdminUpdatePYQ(id: string, body: Partial<AdminPYQPaper>) {
  return apiFetch(`/admin/pyq/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function apiAdminDeletePYQ(id: string) {
  return apiFetch(`/admin/pyq/${id}`, { method: "DELETE" });
}

export async function apiAdminCreatePYQBulk(body: { paper: Partial<AdminPYQPaper>; questions: Record<string, unknown>[] }) {
  return apiFetch("/admin/pyq-bulk", { method: "POST", body: JSON.stringify(body) });
}

// Study Materials
export interface AdminStudyMaterialExam {
  examId: string;
  exam: { id: string; name: string; shortName: string };
}
export interface AdminStudyMaterial {
  id: string;
  title: string;
  subject: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  buyLink?: string;
  language: string;
  pageCount: number;
  coverUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  exams: AdminStudyMaterialExam[];
}
export interface AdminStudyMaterialPayload extends Omit<AdminStudyMaterial, 'id' | 'exams'> {
  examIds: string[];
}
export async function apiAdminGetStudyMaterials(params?: { page?: number; limit?: number; examId?: string }) {
  return apiFetch<PaginatedResponse<AdminStudyMaterial>>(`/admin/study-materials${buildQS(params ?? {})}`);
}
export async function apiAdminCreateStudyMaterial(body: Partial<AdminStudyMaterialPayload>) {
  return apiFetch("/admin/study-materials", { method: "POST", body: JSON.stringify(body) });
}
export async function apiAdminUpdateStudyMaterial(id: string, body: Partial<AdminStudyMaterialPayload>) {
  return apiFetch(`/admin/study-materials/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function apiAdminDeleteStudyMaterial(id: string) {
  return apiFetch(`/admin/study-materials/${id}`, { method: "DELETE" });
}

// Blog Posts
export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverUrl?: string;
  author: string;
  category: string;
  tags: string;
  isPublished: boolean;
  publishedAt?: string;
  readTimeMin: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
export interface AdminBlogPayload {
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverUrl?: string;
  author?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
  publishedAt?: string | null;
  readTimeMin?: number;
}
export async function apiAdminGetBlogs(params?: { page?: number; limit?: number; published?: boolean }) {
  return apiFetch<PaginatedResponse<AdminBlogPost>>(`/admin/blogs${buildQS(params ?? {})}`);
}
export async function apiAdminCreateBlog(body: AdminBlogPayload) {
  return apiFetch("/admin/blogs", { method: "POST", body: JSON.stringify(body) });
}
export async function apiAdminUpdateBlog(id: string, body: Partial<AdminBlogPayload>) {
  return apiFetch(`/admin/blogs/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function apiAdminDeleteBlog(id: string) {
  return apiFetch(`/admin/blogs/${id}`, { method: "DELETE" });
}

// Live Events
export interface AdminLiveEvent {
  id: string; title: string; description?: string; host: string; hostRole: string;
  scheduledAt: string; durationMin: number; isLive: boolean;
  meetUrl?: string; isActive: boolean;
}
export async function apiAdminGetEvents(params?: { page?: number }) {
  return apiFetch<PaginatedResponse<AdminLiveEvent>>(`/admin/events${buildQS(params ?? {})}`);
}
export async function apiAdminCreateEvent(body: Partial<AdminLiveEvent>) {
  return apiFetch("/admin/events", { method: "POST", body: JSON.stringify(body) });
}
export async function apiAdminUpdateEvent(id: string, body: Partial<AdminLiveEvent>) {
  return apiFetch(`/admin/events/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function apiAdminDeleteEvent(id: string) {
  return apiFetch(`/admin/events/${id}`, { method: "DELETE" });
}

// Team Members
export interface AdminTeamMember {
  id: string; name: string; role: string; photoUrl?: string; bio?: string;
  linkedinUrl?: string; twitterUrl?: string; email?: string;
  displayOrder: number; isActive: boolean;
}
export async function apiAdminGetTeam(params?: { page?: number }) {
  return apiFetch<PaginatedResponse<AdminTeamMember>>(`/admin/team${buildQS(params ?? {})}`);
}
export async function apiAdminCreateTeamMember(body: Partial<AdminTeamMember>) {
  return apiFetch("/admin/team", { method: "POST", body: JSON.stringify(body) });
}
export async function apiAdminUpdateTeamMember(id: string, body: Partial<AdminTeamMember>) {
  return apiFetch(`/admin/team/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}
export async function apiAdminDeleteTeamMember(id: string) {
  return apiFetch(`/admin/team/${id}`, { method: "DELETE" });
}

export async function apiAdminUploadImage(file: File): Promise<{ url: string; key: string }> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/admin/upload/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Upload failed (${res.status})`);
  }
  return res.json();
}

/* ── Public contact form ────────────────────────── */

export async function apiGetCourses(params?: { featured?: boolean }) {
  const qs = params?.featured ? "?featured=true" : "";
  return apiFetch<any[]>(`/courses${qs}`);
}

export async function apiSubmitContact(body: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let err = { error: { message: "" } };
    try { err = await res.json(); } catch { /* empty */ }
    throw new ApiError(res.status, err?.error?.message ?? "Failed to send message");
  }
  return res.json();
}

// Contact Messages
export interface AdminContactMessage {
  id: string; name: string; email: string; subject: string; message: string;
  isResolved: boolean; resolvedAt?: string; createdAt: string;
}
export async function apiAdminGetContact(params?: { page?: number; unresolved?: boolean }) {
  return apiFetch<PaginatedResponse<AdminContactMessage>>(`/admin/contact${buildQS(params ?? {})}`);
}
export async function apiAdminResolveContact(id: string) {
  return apiFetch(`/admin/contact/${id}/resolve`, { method: "PATCH" });
}
export async function apiAdminDeleteContact(id: string) {
  return apiFetch(`/admin/contact/${id}`, { method: "DELETE" });
}


export async function apiAdminGetPayments(params?: { page?: number }) {
  return apiFetch<PaginatedResponse<unknown>>(`/admin/payments${buildQS(params ?? {})}`);
}



// ── Order & Payment System ────────────────────────────────────────────────────

export interface PriceBreakdown {
  baseAmountPaise: number;
  discountPaise: number;
  gstPaise: number;
  finalAmountPaise: number;
  couponCode?: string;
}

export interface Order {
  id: string;
  userId: string;
  idempotencyKey: string;
  contentType: string;
  contentId: string;
  billingCycle?: string;
  durationDays?: number;
  couponCode?: string;
  baseAmountPaise: number;
  discountPaise: number;
  gstPaise: number;
  finalAmountPaise: number;
  currency: string;
  status: string;
  razorpayOrderId?: string;
  createdAt: string;
  invoices?: Invoice[];
}

export interface Entitlement {
  id: string;
  userId: string;
  orderId?: string;
  contentType: string;
  contentId: string;
  source: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  userId: string;
  amountPaise: number;
  gstPaise: number;
  totalPaise: number;
  pdfUrl?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'FLAT' | 'PERCENT';
  value: number;
  maxUses?: number;
  maxUsesPerUser: number;
  usedCount: number;
  validFrom: string;
  validUntil?: string;
  applicableTo?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CouponValidation {
  valid: boolean;
  reason?: string;
  discountPaise?: number;
  couponId?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  keyId: string;
  breakdown: PriceBreakdown;
  isExisting: boolean;
}

// Create an order (idempotent via idempotencyKey)
export async function apiCreateOrder(data: {
  contentType: string;
  contentId: string;
  billingCycle?: string;
  durationDays?: number;
  couponCode?: string;
  idempotencyKey: string;
}): Promise<CreateOrderResponse> {
  return apiFetch('/orders', { method: 'POST', body: JSON.stringify(data) });
}

// Preview price without creating order
export async function apiPreviewPrice(data: {
  contentType: string;
  contentId: string;
  billingCycle?: string;
  couponCode?: string;
}): Promise<{ breakdown: PriceBreakdown }> {
  return apiFetch('/orders/preview', { method: 'POST', body: JSON.stringify(data) });
}

// Validate coupon
export async function apiValidateCoupon(data: {
  code: string;
  contentType: string;
  contentId: string;
  baseAmountPaise: number;
}): Promise<CouponValidation> {
  return apiFetch('/orders/coupon/validate', { method: 'POST', body: JSON.stringify(data) });
}

// Verify payment and activate entitlement
export async function apiVerifyOrder(data: {
  orderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  method?: string;
}): Promise<{ success: boolean }> {
  return apiFetch('/orders/verify', { method: 'POST', body: JSON.stringify(data) });
}

// List user orders
export async function apiGetOrders(params?: { page?: number; limit?: number }): Promise<{
  items: Order[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}> {
  return apiFetch(`/orders${buildQS(params ?? {})}`);
}

// Get single order
export async function apiGetOrder(orderId: string): Promise<{ order: Order }> {
  return apiFetch(`/orders/${orderId}`);
}

// Get user entitlements
export async function apiGetEntitlements(): Promise<{ entitlements: Entitlement[] }> {
  return apiFetch('/orders/entitlements');
}

// Get user invoices
export async function apiGetInvoices(): Promise<{ invoices: Invoice[] }> {
  return apiFetch('/orders/invoices');
}

// Get single invoice
export async function apiGetInvoice(invoiceNumber: string): Promise<{ invoice: Invoice }> {
  return apiFetch(`/orders/invoices/${invoiceNumber}`);
}

// ── Admin — Orders ────────────────────────────────────────────────────────────

export async function apiAdminGetOrders(params?: { page?: number; status?: string }) {
  return apiFetch<PaginatedResponse<Order>>(`/admin/orders${buildQS(params ?? {})}`);
}

export async function apiAdminGetOrder(id: string) {
  return apiFetch<{ order: Order }>(`/admin/orders/${id}`);
}

export async function apiAdminInitiateRefund(orderId: string, data: {
  amountPaise?: number;
  reason?: string;
}) {
  return apiFetch(`/admin/orders/${orderId}/refund`, { method: 'POST', body: JSON.stringify(data) });
}

// ── Admin — Coupons ───────────────────────────────────────────────────────────

export async function apiAdminGetCoupons(params?: { page?: number }) {
  return apiFetch<PaginatedResponse<Coupon>>(`/admin/coupons${buildQS(params ?? {})}`);
}

export async function apiAdminCreateCoupon(data: {
  code: string;
  type: 'FLAT' | 'PERCENT';
  value: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  validFrom?: string;
  validUntil?: string;
  applicableTo?: string[];
}) {
  return apiFetch<{ coupon: Coupon }>('/admin/coupons', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiAdminUpdateCoupon(id: string, data: {
  isActive?: boolean;
  maxUses?: number | null;
  validUntil?: string | null;
}) {
  return apiFetch<{ coupon: Coupon }>(`/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiAdminDeleteCoupon(id: string) {
  return apiFetch(`/admin/coupons/${id}`, { method: 'DELETE' });
}

// ── Admin — Entitlements ──────────────────────────────────────────────────────

export async function apiAdminGetEntitlements(params?: { page?: number; userId?: string }) {
  return apiFetch<PaginatedResponse<Entitlement>>(`/admin/entitlements${buildQS(params ?? {})}`);
}

export async function apiAdminGrantEntitlement(data: {
  userId: string;
  contentType: string;
  contentId: string;
  durationDays: number;
}) {
  return apiFetch('/admin/entitlements/grant', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiAdminRevokeEntitlement(id: string) {
  return apiFetch(`/admin/entitlements/${id}`, { method: 'DELETE' });
}

// ── Public Blog (server + client safe) ───────────────────────────────────────

export interface PublicBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverUrl?: string;
  author: string;
  category: string;
  tags: string;
  readTimeMin: number;
  viewCount: number;
  publishedAt?: string;
}

export interface PublicBlogPostFull extends PublicBlogPost {
  content: string;
  createdAt: string;
  updatedAt: string;
}

async function publicFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { next: { revalidate: 60 }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (err as { message?: string }).message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function apiGetBlogs(params?: { page?: number; limit?: number; category?: string }) {
  return publicFetch<PaginatedResponse<PublicBlogPost>>(`/blogs${buildQS(params ?? {})}`);
}

export async function apiGetBlogBySlug(slug: string) {
  return publicFetch<PublicBlogPostFull>(`/blogs/${slug}`);
}
