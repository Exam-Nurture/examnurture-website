"use client";

import { useEffect, useState } from "react";
import { apiAdminGetOrders, apiAdminGetOrder, apiAdminInitiateRefund, type Order } from "@/lib/api";

function paise(p: number) { return `₹${(p / 100).toFixed(2)}`; }
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "var(--green)",
  PENDING: "#d97706",
  FAILED: "var(--red)",
  REFUNDED: "var(--ink-3)",
  CANCELLED: "var(--ink-3)",
};

const STATUSES = ["", "PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"];

interface AdminOrder extends Order {
  user?: { name: string; email: string };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundOrder, setRefundOrder] = useState<AdminOrder | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await apiAdminGetOrders({ page, status: status || undefined });
      setOrders(res.items as AdminOrder[]);
      setTotal(res.total);
      setPages(res.pages ?? 1);
    } catch (e: any) {
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, status]);

  async function openDetail(id: string) {
    try {
      const res = await apiAdminGetOrder(id);
      setDetail(res.order);
      setDetailOpen(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleRefund() {
    if (!refundOrder) return;
    setRefunding(true);
    try {
      await apiAdminInitiateRefund(refundOrder.id, { reason: refundReason });
      setRefundOpen(false);
      setRefundReason("");
      setRefundOrder(null);
      load();
    } catch (e: any) {
      setError(e.message || "Refund failed");
    } finally {
      setRefunding(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold flex-1" style={{ color: "var(--ink-1)" }}>Orders</h1>
        <span className="text-sm" style={{ color: "var(--ink-3)" }}>{total} total</span>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="text-sm px-3 py-1.5 rounded-lg border"
          style={{ background: "var(--bg)", borderColor: "var(--line)", color: "var(--ink-1)" }}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || "All Status"}</option>)}
        </select>
      </div>

      {error && <div className="px-4 py-3 rounded-lg text-sm mb-4" style={{ background: "var(--red-soft)", color: "var(--red)" }}>{error}</div>}

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
              {["User", "Content", "Amount", "Status", "Date", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: "var(--ink-3)" }}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: "var(--ink-3)" }}>No orders found</td></tr>
            ) : orders.map((o, i) => (
              <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? "1px solid var(--line)" : "none", background: "var(--card)" }}>
                <td className="px-4 py-3">
                  <div className="font-medium" style={{ color: "var(--ink-1)" }}>{o.user?.name ?? "—"}</div>
                  <div className="text-xs" style={{ color: "var(--ink-3)" }}>{o.user?.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-semibold uppercase" style={{ color: "var(--ink-3)" }}>{o.contentType.replace(/_/g, " ")}</div>
                  <div className="text-xs truncate max-w-[120px]" style={{ color: "var(--ink-2)" }}>{o.contentId}</div>
                </td>
                <td className="px-4 py-3 font-semibold" style={{ color: "var(--ink-1)" }}>{paise(o.finalAmountPaise)}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: STATUS_COLORS[o.status] ?? "var(--ink-3)", background: `color-mix(in srgb, ${STATUS_COLORS[o.status] ?? "var(--ink-3)"} 15%, transparent)` }}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--ink-3)" }}>{fmtDate(o.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openDetail(o.id)} className="text-xs px-2 py-1 rounded" style={{ color: "var(--blue)", background: "var(--blue-soft)" }}>Details</button>
                    {o.status === "PAID" && (
                      <button
                        onClick={() => { setRefundOrder(o); setRefundOpen(true); }}
                        className="text-xs px-2 py-1 rounded"
                        style={{ color: "var(--red)", background: "var(--red-soft)" }}
                      >Refund</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded text-sm disabled:opacity-40" style={{ background: "var(--card)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>Prev</button>
          <span className="text-sm" style={{ color: "var(--ink-3)" }}>{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded text-sm disabled:opacity-40" style={{ background: "var(--card)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>Next</button>
        </div>
      )}

      {/* Order Detail Modal */}
      {detailOpen && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ color: "var(--ink-1)" }}>Order Details</h2>
              <button onClick={() => setDetailOpen(false)} style={{ color: "var(--ink-3)" }}>✕</button>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ["ID", detail.id],
                ["User", `${detail.user?.name} (${detail.user?.email})`],
                ["Content", `${detail.contentType} → ${detail.contentId}`],
                ["Billing", detail.billingCycle ?? `${detail.durationDays}d`],
                ["Base", paise(detail.baseAmountPaise)],
                ["Discount", paise(detail.discountPaise)],
                ["GST", paise(detail.gstPaise)],
                ["Total", paise(detail.finalAmountPaise)],
                ["Status", detail.status],
                ["Razorpay Order", detail.razorpayOrderId ?? "—"],
                ["Created", fmtDate(detail.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-32 shrink-0 font-medium" style={{ color: "var(--ink-3)" }}>{k}</dt>
                  <dd style={{ color: "var(--ink-1)" }}>{v}</dd>
                </div>
              ))}
            </dl>
            {detail.invoices?.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
                <div className="font-medium text-sm mb-2" style={{ color: "var(--ink-2)" }}>Invoices</div>
                {detail.invoices.map((inv: any) => (
                  <div key={inv.id} className="text-xs" style={{ color: "var(--ink-3)" }}>{inv.invoiceNumber} — {paise(inv.totalPaise)}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundOpen && refundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--card)" }}>
            <h2 className="font-bold mb-1" style={{ color: "var(--ink-1)" }}>Initiate Refund</h2>
            <p className="text-sm mb-4" style={{ color: "var(--ink-3)" }}>
              Full refund of {paise(refundOrder.finalAmountPaise)} for order {refundOrder.id.slice(-8)}
            </p>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink-2)" }}>Reason (optional)</label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm border resize-none mb-4"
              style={{ background: "var(--bg)", borderColor: "var(--line)", color: "var(--ink-1)" }}
            />
            <div className="flex gap-3">
              <button onClick={() => setRefundOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>Cancel</button>
              <button onClick={handleRefund} disabled={refunding} className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 text-white" style={{ background: "var(--red)" }}>
                {refunding ? "Processing…" : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
