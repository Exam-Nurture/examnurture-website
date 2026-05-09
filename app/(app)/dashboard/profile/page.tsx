"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, BookOpen, Award, Check, ChevronDown, ChevronUp, ExternalLink, Edit2, Save, X, Loader2, FileText, Flame } from "lucide-react";
import { TIERS, EXAM_BOARDS } from "@/lib/data/examData";
import { useAuth } from "@/lib/auth-context";
import { apiUpdateProfile, ApiError } from "@/lib/api";

function getExclusiveExamNames(tierLevel: 1 | 2 | 3): string[] {
  return EXAM_BOARDS
    .filter((b) => TIERS.find((t) => t.id === tierLevel)!.exclusiveBoardIds.includes(b.id))
    .flatMap((b) => b.exams.map((e) => e.name));
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [openTier, setOpenTier] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [editName, setEditName] = useState(user?.name ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");

  const startEdit = () => {
    setEditName(user?.name ?? "");
    setEditPhone(user?.phone ?? "");
    setSaveError("");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await apiUpdateProfile({ name: editName, phone: editPhone || undefined });
      await refreshUser();
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.name ?? "Student";
  const initials = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const memberSince = user ? new Date(user.createdAt ?? Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "";
  const planLabel = user?.subscription
    ? `Tier ${user.subscription.tierLevel} — ${user.subscription.status}`
    : "Free Plan";
  const subColor = user?.subscription?.status === "ACTIVE" ? "var(--green)" : "var(--ink-4)";

  const stats = [
    { label: "Tests Done",       val: String(user?.stats?.attempts ?? 0),          icon: <BookOpen size={17} />,                   color: "var(--blue)"   },
    { label: "Day Streak",       val: String(user?.stats?.streakCurrent ?? 0),      icon: <Flame size={17} />,                      color: "var(--amber)"  },
    { label: "Test Series",      val: String(user?.stats?.attendedTestSeries ?? 0), icon: <FileText size={17} />,                   color: "var(--violet)" },
    { label: "PYQ Attempted",    val: String(user?.stats?.attendedPYQ ?? 0),        icon: <Award size={17} />,                      color: "var(--green)"  },
    { label: "Bookmarks",        val: String(user?.stats?.bookmarks ?? 0),          icon: <span className="text-base">🔖</span>,    color: "var(--cyan)"   },
    { label: "Best Streak",      val: String(user?.stats?.streakLongest ?? 0),      icon: <span className="text-base">🏆</span>,    color: "var(--amber)"  },
  ];

  return (
    <div className="flex flex-col gap-5 fade-up" style={{ maxWidth: 760 }}>
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
          Profile
        </h1>
        <p className="text-[12px] mt-1.5" style={{ color: "var(--ink-4)" }}>
          Your account, stats, and subscription
        </p>
      </div>

      {/* Avatar + info */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-[16px] object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-[16px] flex items-center justify-center text-white text-[24px] font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--violet), var(--blue))" }}
            >
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex flex-col gap-3">
                {saveError && (
                  <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                    {saveError}
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-[var(--ink-3)]">Full Name</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--line)] bg-[var(--bg)] text-[var(--ink-1)] outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-[var(--ink-3)]">Mobile Number</label>
                    <input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--line)] bg-[var(--bg)] text-[var(--ink-1)] outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[9px] text-sm font-semibold text-white transition-all"
                    style={{ background: "var(--blue)" }}
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[9px] text-sm font-medium transition-all hover:bg-[var(--bg)]"
                    style={{ border: "1px solid var(--line)", color: "var(--ink-3)" }}
                  >
                    <X size={13} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-[18px] font-bold" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
                  {displayName}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[13px]" style={{ color: subColor }}>{planLabel}</span>
                  {memberSince && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--line-soft)", color: "var(--ink-4)" }}>
                      Member since {memberSince}
                    </span>
                  )}
                  {user?.hasGoogle && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                      Google account
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
                    <Mail size={13} /> {user?.email ?? "—"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
                    <Phone size={13} /> {user?.phone ?? "Not set"}
                  </span>
                </div>
              </>
            )}
          </div>

          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all hover:bg-[var(--bg)] flex-shrink-0"
              style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}
            >
              <Edit2 size={13} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className="flex justify-center mb-1.5" style={{ color: s.color }}>{s.icon}</div>
            <div className="text-[22px] font-bold" style={{ color: s.color, fontFamily: "var(--font-sora)" }}>
              {s.val}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-4)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Subscription */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[16px] font-bold" style={{ fontFamily: "var(--font-sora)", color: "var(--ink-1)" }}>
              Subscription Plans
            </div>
            <div className="text-[12px] mt-1" style={{ color: "var(--ink-4)" }}>
              Tiers are cumulative — each tier includes all lower tiers
            </div>
          </div>
          <Link
            href="/dashboard/plans"
            className="flex items-center gap-1 text-[12px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--blue)" }}
          >
            Compare plans <ExternalLink size={12} />
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {/* Free Plan row */}
          {(() => {
            const isFree = !user?.subscription || user.subscription.status !== "ACTIVE";
            return (
              <div
                className="rounded-[12px] overflow-hidden"
                style={{
                  border: isFree ? "1.5px solid var(--green)" : "1px solid var(--line-soft)",
                  boxShadow: isFree ? "0 0 0 3px rgba(34,197,94,0.07)" : "none",
                }}
              >
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "var(--green)" }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>Free Plan</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "var(--green)" }}>
                          Always Free
                        </span>
                        {isFree && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--green)" }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-4)" }}>
                        Limited access — free forever, no credit card needed
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    {isFree ? (
                      <span className="px-4 py-2 rounded-[9px] text-[12px] font-semibold" style={{ background: "rgba(34,197,94,0.12)", color: "var(--green)" }}>
                        Current Plan
                      </span>
                    ) : (
                      <span className="text-[13px] font-semibold" style={{ color: "var(--ink-4)" }}>₹0</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {TIERS.map((tier) => {
            const isOpen = openTier === tier.id;
            const exclusiveExams = getExclusiveExamNames(tier.id);
            const isActive = user?.subscription?.tierLevel === tier.id && user?.subscription?.status === "ACTIVE";

            return (
              <div
                key={tier.id}
                className="rounded-[12px] overflow-hidden transition-all duration-200"
                style={{
                  border: isActive ? `1.5px solid ${tier.color}` : tier.highlight ? `1.5px solid ${tier.color}` : "1px solid var(--line-soft)",
                  boxShadow: isActive || tier.highlight ? `0 0 0 3px ${tier.color}12` : "none",
                }}
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-all duration-150 hover:bg-[var(--bg)]"
                  onClick={() => setOpenTier(isOpen ? null : tier.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tier.color }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>{tier.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: tier.colorSoft, color: tier.color }}>
                          {tier.badge}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: tier.color }}>
                            ACTIVE
                          </span>
                        )}
                        {!isActive && tier.highlight && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: tier.color }}>
                            POPULAR
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-4)" }}>{tier.qualification}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <div className="text-right">
                      <span className="text-[16px] font-bold" style={{ color: tier.color, fontFamily: "var(--font-sora)" }}>
                        ₹{tier.monthlyPrice}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--ink-4)" }}>/mo</span>
                    </div>
                    {isOpen ? <ChevronUp size={15} style={{ color: "var(--ink-4)" }} /> : <ChevronDown size={15} style={{ color: "var(--ink-4)" }} />}
                  </div>
                </button>

                <div className="overflow-hidden transition-all duration-200" style={{ maxHeight: isOpen ? 600 : 0 }}>
                  <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--line-soft)" }}>
                    <div className="flex flex-col gap-1.5 mt-3 mb-4">
                      <div className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: "var(--ink-4)" }}>
                        EXAMS UNLOCKED IN THIS TIER
                      </div>
                      {exclusiveExams.map((ex) => (
                        <div key={ex} className="flex items-center gap-2 text-[12px]" style={{ color: "var(--ink-2)" }}>
                          <Check size={13} style={{ color: tier.color, flexShrink: 0 }} />
                          {ex}
                        </div>
                      ))}
                      {tier.id > 1 && (
                        <div className="flex items-center gap-2 text-[11px] mt-1" style={{ color: "var(--ink-4)" }}>
                          <Check size={11} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
                          + all {tier.id === 2 ? "Tier 1" : "Tier 1 & Tier 2"} exams included
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--line-soft)" }}>
                      <span className="text-[11px]" style={{ color: "var(--ink-4)" }}>
                        ₹{tier.yearlyPrice.toLocaleString()}/year ·{" "}
                        <span style={{ color: tier.color, fontWeight: 600 }}>
                          Save {Math.round((1 - tier.yearlyPrice / (tier.monthlyPrice * 12)) * 100)}%
                        </span>
                      </span>
                      {isActive ? (
                        <span className="px-4 py-2 rounded-[9px] text-[12px] font-semibold" style={{ background: tier.colorSoft, color: tier.color }}>
                          Current Plan
                        </span>
                      ) : (
                        <Link
                          href="/dashboard/plans"
                          className="px-5 py-2 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-150 hover:brightness-110"
                          style={{ background: tier.color }}
                        >
                          Subscribe →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] mt-4 text-center" style={{ color: "var(--ink-4)" }}>
          Cancel anytime · Secure payment · No hidden charges
        </p>
      </div>
    </div>
  );
}
