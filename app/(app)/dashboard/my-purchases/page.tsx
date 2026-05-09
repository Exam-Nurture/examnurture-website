"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  apiGetOrders,
  apiGetEntitlements,
  apiGetInvoices,
  type Order,
  type Entitlement,
  type Invoice,
} from "@/lib/api";

function paise(p: number) {
  return `₹${(p / 100).toFixed(0)}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "var(--green)",
  PENDING: "var(--yellow, #d97706)",
  FAILED: "var(--red)",
  REFUNDED: "var(--ink-3)",
  CANCELLED: "var(--ink-3)",
  ACTIVE: "var(--green)",
  EXPIRED: "var(--ink-3)",
  REVOKED: "var(--red)",
};

type Tab = "orders" | "entitlements" | "invoices";

export default function MyPurchasesPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [ordersRes, entRes, invRes] = await Promise.all([
          apiGetOrders({ limit: 50 }),
          apiGetEntitlements(),
          apiGetInvoices(),
        ]);
        setOrders(ordersRes.items);
        setEntitlements(entRes.entitlements);
        setInvoices(invRes.invoices);
      } catch (e: any) {
        setError(e.message || "Failed to load purchases");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--ink-1)" }}>My Purchases</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        {(["orders", "entitlements", "invoices"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors"
            style={{
              background: tab === t ? "var(--blue)" : "transparent",
              color: tab === t ? "#fff" : "var(--ink-2)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm mb-4" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--card)" }} />
          ))}
        </div>
      ) : (
        <>
          {tab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 && (
                <EmptyState icon="🛒" title="No orders yet" desc="Purchase a plan or content to see orders here." />
              )}
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--ink-3)" }}>
                        {o.contentType.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm font-medium truncate" style={{ color: "var(--ink-1)" }}>
                        {o.contentId}
                        {o.billingCycle ? ` · ${o.billingCycle}` : ""}
                      </div>
                      <div className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>
                        {fmtDate(o.createdAt)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold" style={{ color: "var(--ink-1)" }}>
                        {paise(o.finalAmountPaise)}
                      </div>
                      <StatusBadge status={o.status} />
                      {o.invoices?.[0] && (
                        <div className="text-xs mt-1">
                          <span style={{ color: "var(--ink-3)" }}>Invoice: </span>
                          <span style={{ color: "var(--blue)" }}>{o.invoices[0].invoiceNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "entitlements" && (
            <div className="space-y-3">
              {entitlements.length === 0 && (
                <EmptyState icon="🔓" title="No active entitlements" desc="Complete a purchase to get access to content." />
              )}
              {entitlements.map((e) => (
                <div key={e.id} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--ink-3)" }}>
                        {e.contentType.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm font-medium" style={{ color: "var(--ink-1)" }}>{e.contentId}</div>
                      <div className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>
                        Expires {fmtDate(e.expiresAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={e.status} />
                      <div className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>{e.source}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "invoices" && (
            <div className="space-y-3">
              {invoices.length === 0 && (
                <EmptyState icon="🧾" title="No invoices yet" desc="Invoices are generated after successful payments." />
              )}
              {invoices.map((inv) => (
                <div key={inv.id} className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>{inv.invoiceNumber}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>{fmtDate(inv.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: "var(--ink-1)" }}>
                      {paise(inv.totalPaise)}
                    </div>
                    <div className="text-xs" style={{ color: "var(--ink-3)" }}>
                      GST: {paise(inv.gstPaise)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-8 text-center">
        <Link href="/dashboard/plans" className="text-sm font-medium" style={{ color: "var(--blue)" }}>
          Browse Plans →
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
      style={{
        background: `color-mix(in srgb, ${STATUS_COLORS[status] ?? "var(--ink-3)"} 15%, transparent)`,
        color: STATUS_COLORS[status] ?? "var(--ink-3)",
      }}
    >
      {status}
    </span>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-semibold text-sm mb-1" style={{ color: "var(--ink-2)" }}>{title}</div>
      <div className="text-xs" style={{ color: "var(--ink-3)" }}>{desc}</div>
    </div>
  );
}
