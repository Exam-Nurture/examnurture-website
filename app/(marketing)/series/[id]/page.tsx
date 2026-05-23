"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, FileText, Lock, Play, AlertCircle,
  BookOpen, CheckCircle2, GraduationCap, Users, Trophy,
  Calendar, ChevronRight, Zap, Star,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/auth/AuthModal";

interface TestItem {
  id: string;
  title: string;
  durationSec: number;
  totalMarks: number;
  isLocked: boolean;
  scheduledAt?: string;
}

interface SeriesDetail {
  id: string;
  title: string;
  description?: string;
  totalTests: number;
  isPaid: boolean;
  isFeatured: boolean;
  price?: number;
  discountedPrice?: number;
  bannerUrl?: string;
  exam?: {
    id: string; name: string; shortName: string;
    board?: { id: string; name: string; shortName: string; tint?: string; colorSoft?: string };
  };
  tests?: TestItem[];
}

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch(`/test-series/${id}`)
      .then((data: any) => setSeries(data))
      .catch((e: any) => setError(e.message || "Failed to load series"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="h-8 w-32 rounded-lg bg-gray-100 animate-pulse mb-8" />
          <div className="h-48 rounded-3xl bg-gray-100 animate-pulse mb-8" />
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <div className="text-center max-w-sm mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg font-bold mb-2" style={{ color: "var(--ink-1)" }}>Series not found</p>
          <p className="text-sm mb-6" style={{ color: "var(--ink-4)" }}>{error || "This series doesn't exist or may have been removed."}</p>
          <Link
            href="/series/all"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
          >
            Browse All Series
          </Link>
        </div>
      </div>
    );
  }

  const tint = series.exam?.board?.tint ?? "#2563EB";
  const colorSoft = series.exam?.board?.colorSoft ?? "#DBEAFE";
  const freeTests = series.tests?.filter((t) => !t.isLocked).length ?? 0;
  const totalTests = series.tests?.length ?? series.totalTests ?? 0;

  return (
    <>
      <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>

        {/* Top Nav */}
        <div
          className="sticky top-0 z-30 border-b"
          style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
        >
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-blue-600 shrink-0"
              style={{ color: "var(--ink-3)" }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <ChevronRight size={14} style={{ color: "var(--ink-4)" }} />
            <Link href="/series/all" className="text-sm" style={{ color: "var(--ink-4)" }}>
              Test Series
            </Link>
            <ChevronRight size={14} style={{ color: "var(--ink-4)" }} />
            <span className="text-sm font-semibold truncate" style={{ color: "var(--ink-1)" }}>
              {series.title}
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Hero Banner */}
          <div
            className="relative overflow-hidden rounded-3xl mb-8 p-7 md:p-10"
            style={{
              background: `linear-gradient(135deg, ${tint}E6, ${tint}99)`,
              boxShadow: `0 20px 60px -10px ${tint}50`,
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full opacity-10" style={{ background: "white" }} />
            <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full opacity-10" style={{ background: "white" }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-white/20 text-white">
                  {series.exam?.shortName ?? "Test Series"}
                </span>
                {series.isFeatured && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-400/30 text-amber-50">
                    Featured
                  </span>
                )}
                {!series.isPaid ? (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-400/30 text-emerald-50">
                    Free
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-white/20 text-white">
                    Premium
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight" style={{ fontFamily: "var(--font-sora)" }}>
                {series.title}
              </h1>

              {series.description && (
                <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-2xl">
                  {series.description}
                </p>
              )}

              <div className="flex flex-wrap gap-5">
                <div className="flex items-center gap-2 text-white/90">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <FileText size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/60">Total Tests</p>
                    <p className="text-sm font-bold">{totalTests}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <Zap size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/60">Free Tests</p>
                    <p className="text-sm font-bold">{freeTests}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <GraduationCap size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/60">Exam</p>
                    <p className="text-sm font-bold">{series.exam?.name ?? "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Tests List */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: "var(--ink-1)", fontFamily: "var(--font-sora)" }}>
                  Tests in this Series
                </h2>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "var(--bg)", color: "var(--ink-3)" }}>
                  {totalTests} tests
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {series.tests?.map((test, idx) => (
                  <TestCard
                    key={test.id}
                    test={test}
                    index={idx + 1}
                    tint={tint}
                    user={user}
                    onLoginPrompt={() => setAuthOpen(true)}
                  />
                ))}

                {(!series.tests || series.tests.length === 0) && (
                  <div
                    className="py-16 text-center rounded-2xl border-2 border-dashed"
                    style={{ borderColor: "var(--line-soft)" }}
                  >
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "var(--ink-3)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--ink-4)" }}>
                      Tests will be added soon.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="flex flex-col gap-4">

              {/* CTA Card */}
              <div
                className="rounded-2xl p-5 border"
                style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
              >
                {series.isPaid ? (
                  <>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--ink-4)" }}>Get Full Access</p>
                    {series.discountedPrice != null && series.discountedPrice < (series.price ?? 0) ? (
                      <div className="mb-4">
                        <span className="text-2xl font-extrabold" style={{ color: "var(--ink-1)" }}>
                          ₹{series.discountedPrice}
                        </span>
                        <span className="text-sm line-through ml-2" style={{ color: "var(--ink-4)" }}>
                          ₹{series.price}
                        </span>
                        <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {Math.round(((series.price! - series.discountedPrice) / series.price!) * 100)}% off
                        </span>
                      </div>
                    ) : (
                      <p className="text-2xl font-extrabold mb-4" style={{ color: "var(--ink-1)" }}>
                        ₹{series.price ?? "—"}
                      </p>
                    )}
                    {user ? (
                      <button
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: tint }}
                      >
                        Buy Now
                      </button>
                    ) : (
                      <button
                        onClick={() => setAuthOpen(true)}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: tint }}
                      >
                        Login to Purchase
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--ink-4)" }}>Access</p>
                    <p className="text-xl font-extrabold mb-4 text-emerald-600">Free</p>
                    {user ? (
                      <Link
                        href={series.tests?.[0]?.id ? `/exam/${series.tests[0].id}` : "#"}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: tint }}
                      >
                        <Play size={13} fill="white" stroke="none" /> Start First Test
                      </Link>
                    ) : (
                      <button
                        onClick={() => setAuthOpen(true)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: tint }}
                      >
                        <Play size={13} fill="white" stroke="none" /> Start Free
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Series Info */}
              <div
                className="rounded-2xl p-5 border space-y-3.5"
                style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
              >
                <h3 className="text-sm font-bold" style={{ color: "var(--ink-1)" }}>Series Details</h3>
                <InfoRow label="Exam" value={series.exam?.name ?? "—"} />
                <InfoRow label="Conducting Body" value={series.exam?.board?.name ?? "—"} />
                <InfoRow label="Total Tests" value={`${totalTests} tests`} />
                <InfoRow label="Free Tests" value={`${freeTests} tests`} />
                <InfoRow label="Languages" value="English, Hindi" />
                <InfoRow label="Valid Till" value="31 Dec 2025" />
              </div>

              {/* Why practice? */}
              <div
                className="rounded-2xl p-5 border"
                style={{ background: colorSoft + "60", borderColor: colorSoft }}
              >
                <h3 className="text-sm font-bold mb-3" style={{ color: tint }}>Why Practice with ExamNurture?</h3>
                <ul className="space-y-2">
                  {[
                    "Real exam-pattern questions",
                    "Detailed solutions for every question",
                    "Performance analytics & rank",
                    "Both English & Hindi medium",
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs" style={{ color: "var(--ink-2)" }}>
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: tint }} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}

function TestCard({
  test, index, tint, user, onLoginPrompt,
}: {
  test: TestItem;
  index: number;
  tint: string;
  user: any;
  onLoginPrompt: () => void;
}) {
  const mins = Math.floor(test.durationSec / 60);
  const isScheduled = test.scheduledAt && new Date(test.scheduledAt) > new Date();

  return (
    <div
      className="group flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm"
      style={{ background: "var(--card)", borderColor: "var(--line-soft)" }}
    >
      {/* Index */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-colors group-hover:text-white"
        style={{ background: "var(--bg)", color: "var(--ink-3)" }}
      >
        {test.isLocked ? <Lock size={14} /> : index}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold truncate mb-1" style={{ color: "var(--ink-1)" }}>
          {test.title}
        </p>
        <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--ink-4)" }}>
          {mins > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={10} /> {mins} min
            </span>
          )}
          {test.totalMarks > 0 && (
            <span className="flex items-center gap-1">
              <FileText size={10} /> {test.totalMarks} marks
            </span>
          )}
          {test.scheduledAt && (
            <span className="flex items-center gap-1 text-blue-500">
              <Calendar size={10} /> {new Date(test.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {test.isLocked ? (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border"
            style={{ color: "var(--ink-4)", borderColor: "var(--line-soft)", background: "var(--bg)" }}
          >
            <Lock size={10} /> Locked
          </div>
        ) : isScheduled ? (
          <div className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
            Upcoming
          </div>
        ) : user ? (
          <Link
            href={`/exam/${test.id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: tint }}
          >
            <Play size={11} fill="white" stroke="none" /> Start
          </Link>
        ) : (
          <button
            onClick={onLoginPrompt}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: tint }}
          >
            <Play size={11} fill="white" stroke="none" /> Start
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--ink-4)" }}>{label}</span>
      <span className="text-xs font-semibold" style={{ color: "var(--ink-1)" }}>{value}</span>
    </div>
  );
}
