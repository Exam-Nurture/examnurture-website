"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Phone, Pencil, Loader2, ChevronRight, ReceiptText, Bookmark, BookOpen, Sparkles, LogOut } from "lucide-react";
import AppPage from "@/components/app/AppPage";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { apiUpdateProfile, ApiError } from "@/lib/api";

const display = { fontFamily: "var(--font-sora)" } as const;

const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)] disabled:opacity-60";
const btnSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] px-5 text-sm font-semibold text-[var(--ink-1)] hover:bg-[var(--brand-soft)] disabled:opacity-60";
const input =
  "min-h-11 w-full rounded-[12px] bg-[var(--bg-secondary)] px-4 text-[15px] text-[var(--ink-1)] outline-none focus:ring-2 focus:ring-[var(--brand-line)]";

const links = [
  { href: "/dashboard/my-purchases", label: "Purchases", icon: ReceiptText },
  { href: "/dashboard/saved-blogs", label: "Saved articles", icon: Bookmark },
  { href: "/dashboard/guides", label: "Guides", icon: BookOpen },
  { href: "/pricing", label: "Plans", icon: Sparkles },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [signingOut, setSigningOut] = useState(false);

  const startEdit = () => {
    setEditName(user?.name ?? "");
    setEditPhone(user?.phone ?? "");
    setSaveError("");
    setEditing(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      await apiUpdateProfile({ name: editName, phone: editPhone || undefined });
      await refreshUser();
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      router.push("/");
    }
  };

  const displayName = user?.name ?? "Student";
  const initials = displayName.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "";

  const stats = [
    { label: "Tests done", val: user?.stats?.attempts ?? 0 },
    { label: "Day streak", val: user?.stats?.streakCurrent ?? 0, time: true },
    { label: "Best streak", val: user?.stats?.streakLongest ?? 0, time: true },
    { label: "Test series", val: user?.stats?.attendedTestSeries ?? 0 },
    { label: "Past papers", val: user?.stats?.attendedPYQ ?? 0 },
    { label: "Bookmarks", val: user?.stats?.bookmarks ?? 0 },
  ];

  return (
    <AppPage title="Me" subtitle="Your profile and account." width="narrow">
      <section aria-labelledby="profile-title" className="en-card en-rise p-6">
        <h2 id="profile-title" className="sr-only">Profile</h2>
        <div className="flex items-start gap-4">
          {user?.avatarUrl ? (
            <Image src={user.avatarUrl} alt="" width={64} height={64} unoptimized className="h-16 w-16 shrink-0 rounded-full object-cover" />
          ) : (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xl font-bold text-[var(--brand)]"
              style={display}
              aria-hidden="true"
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {editing ? (
              <form onSubmit={saveEdit} className="flex flex-col gap-4">
                {saveError && (
                  <p role="alert" className="rounded-[12px] bg-[var(--red-soft)] px-4 py-3 text-sm text-[var(--ink-1)]">{saveError}</p>
                )}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="p-name" className="text-sm font-medium text-[var(--ink-2)]">Full name</label>
                  <input id="p-name" value={editName} onChange={(e) => setEditName(e.target.value)} autoComplete="name" className={input} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="p-phone" className="text-sm font-medium text-[var(--ink-2)]">Mobile number</label>
                  <input
                    id="p-phone"
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    className={input}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className={btnPrimary}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Save
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className={btnSecondary}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-xl font-bold text-[var(--ink-1)]" style={display}>{displayName}</p>
                {memberSince && <p className="mt-0.5 text-sm text-[var(--ink-3)]">Member since {memberSince}</p>}
                <ul className="mt-3 flex flex-col gap-1.5 text-sm text-[var(--ink-2)]">
                  <li className="flex items-center gap-2 break-all">
                    <Mail className="h-4 w-4 shrink-0 text-[var(--ink-3)]" aria-hidden="true" /> {user?.email ?? "Not set"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-[var(--ink-3)]" aria-hidden="true" /> {user?.phone ?? "Not set"}
                  </li>
                </ul>
              </>
            )}
          </div>

          {!editing && (
            <button type="button" onClick={startEdit} className={`${btnSecondary} shrink-0 !px-4`}>
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
            </button>
          )}
        </div>
      </section>

      <section aria-label="Your numbers" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div key={s.label} className="reveal en-card p-5" style={{ transitionDelay: `${i * 40}ms` }}>
            <p className={`text-2xl font-bold tabular-nums ${s.time ? "text-[var(--accent-ink)]" : "text-[var(--ink-1)]"}`} style={display}>{s.val}</p>
            <p className="mt-0.5 text-xs text-[var(--ink-3)]">{s.label}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="account-title" className="flex flex-col gap-3">
        <h2 id="account-title" className="text-lg font-semibold text-[var(--ink-1)]" style={display}>Your account</h2>
        <div className="reveal flex flex-col gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="en-card en-card-link flex min-h-14 items-center gap-3 px-5 py-3 text-[var(--ink-1)]"
            >
              <Icon className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
              <span className="flex-1 font-medium">{label}</span>
              <ChevronRight className="h-4 w-4 text-[var(--ink-3)]" aria-hidden="true" />
            </Link>
          ))}
          <div className="en-card flex min-h-14 items-center justify-between gap-3 px-5 py-2">
            <span className="font-medium text-[var(--ink-1)]">Dark mode</span>
            <ThemeToggle />
          </div>
        </div>
      </section>

      <div>
        <button type="button" onClick={signOut} disabled={signingOut} className={btnSecondary}>
          {signingOut ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
          Sign out
        </button>
      </div>
    </AppPage>
  );
}
