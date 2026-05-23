"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiAdminDashboard, AuthUser } from "@/lib/api";

const STAT_LABELS: Record<string, string> = {
  users: "Total Users",
  boards: "Boards",
  exams: "Exams",
  testSeries: "Test Series",
  tests: "Tests",
  pyqPapers: "PYQ Papers",
  events: "Live Events",
  payments: "Payments",

  contactMessages: "Contact Msgs",
};

const STAT_COLORS: Record<string, string> = {
  users: "var(--blue)",
  boards: "var(--violet)",
  exams: "var(--cyan)",
  testSeries: "var(--green)",
  tests: "var(--indigo)",
};

export default function AdminDashboard() {
  const [data, setData] = useState<{
    stats: Record<string, number>;
    recentUsers: AuthUser[];
    recentPayments: { id: string; amountPaise: number; status: string; createdAt: string; user?: { name: string; email: string } }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiAdminDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--line)", borderTopColor: "var(--blue)" }} />
      </div>
    );
  }

  const stats = data?.stats ?? {};

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="rounded-xl p-4" style={{ background: "var(--card)", boxShadow: "var(--shadow)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--ink-3)" }}>{STAT_LABELS[key] ?? key}</p>
            <p className="text-2xl font-bold" style={{ color: STAT_COLORS[key] ?? "var(--ink-1)" }}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent users */}
        <div className="rounded-xl" style={{ background: "var(--card)", boxShadow: "var(--shadow)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--line)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>Recent Users</h2>
            <Link href="/admin/users" className="text-xs font-medium" style={{ color: "var(--blue)" }}>View all</Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--line)" }}>
            {(data?.recentUsers ?? []).slice(0, 6).map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ background: "var(--blue)" }}>
                  {u.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--ink-1)" }}>{u.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--ink-3)" }}>{u.email}</p>
                </div>
                {u.role === "ADMIN" && (
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: "var(--violet-soft)", color: "var(--violet)" }}>Admin</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div className="rounded-xl" style={{ background: "var(--card)", boxShadow: "var(--shadow)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--line)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>Recent Payments</h2>
            <Link href="/admin/users" className="text-xs font-medium" style={{ color: "var(--blue)" }}>View all</Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--line)" }}>
            {(data?.recentPayments as { id: string; amountPaise: number; status: string; createdAt: string; user?: { name: string } }[] ?? []).slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--ink-1)" }}>{p.user?.name ?? "Unknown"}</p>
                  <p className="text-xs" style={{ color: "var(--ink-3)" }}>₹{(p.amountPaise / 100).toFixed(0)}</p>
                </div>
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: p.status === "SUCCESS" ? "var(--green-soft)" : p.status === "FAILED" ? "var(--red-soft)" : "var(--amber-soft)",
                    color: p.status === "SUCCESS" ? "var(--green)" : p.status === "FAILED" ? "var(--red)" : "var(--amber)",
                  }}
                >
                  {p.status}
                </span>
              </div>
            ))}
            {(data?.recentPayments ?? []).length === 0 && (
              <p className="px-4 py-4 text-sm" style={{ color: "var(--ink-3)" }}>No payments yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-xl p-4" style={{ background: "var(--card)", boxShadow: "var(--shadow)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-1)" }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Add Board", href: "/admin/boards" },
            { label: "Add Exam", href: "/admin/exams" },
            { label: "Add Test Series", href: "/admin/test-series" },
            { label: "Add PYQ Paper", href: "/admin/pyq" },
            { label: "Add Study Material", href: "/admin/study-materials" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
