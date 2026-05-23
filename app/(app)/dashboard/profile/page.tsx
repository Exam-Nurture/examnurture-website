"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, BookOpen, Award, Flame, FileText, Edit2, Save, X, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiUpdateProfile, ApiError } from "@/lib/api";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

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
  const planLabel = "Free Plan";
  const subColor = "var(--ink-4)";

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
          Your account and stats
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
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  {user?.createdAt && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--surface)", color: "var(--ink-3)" }}>
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


    </div>
  );
}
