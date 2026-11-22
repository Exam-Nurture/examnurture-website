"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import AppPage from "@/components/app/AppPage";
import {
  apiGetOrders,
  apiGetEntitlements,
  apiGetInvoices,
  type Order,
  type Entitlement,
  type Invoice,
} from "@/lib/api";

const display = { fontFamily: "var(--font-sora)" } as const;

function rupees(p: number) {
  return `₹${(p / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function pillClass(status: string) {
  switch (status) {
    case "PAID":
    case "ACTIVE":
      return "bg-[var(--green-soft)] text-[var(--green)]";
    case "PENDING":
      return "bg-[var(--amber-soft)] text-[var(--amber)]";
    case "FAILED":
    case "REFUNDED":
    case "REVOKED":
      return "bg-[var(--red-soft)] text-[var(--red)]";
    default:
      return "bg-[var(--bg-secondary)] text-[var(--ink-3)]";
  }
}

function StatusPill({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${pillClass(status)}`}>{label(status)}</span>;
}

const seePlans =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]";

export default function MyPurchasesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [ordersRes, entRes, invRes] = await Promise.all([
          apiGetOrders({ limit: 50 }),
          apiGetEntitlements(),
          apiGetInvoices(),
        ]);
        // fall back to empty lists so an unexpected response never crashes the page
        setOrders(ordersRes?.items ?? []);
        setEntitlements(entRes?.entitlements ?? []);
        setInvoices(invRes?.invoices ?? []);
      } catch {
        setError("Couldn't load your purchases. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = entitlements.filter((e) => e.status === "ACTIVE");
  const empty = !loading && !error && orders.length === 0 && active.length === 0 && invoices.length === 0;

  return (
    <AppPage title="Purchases" subtitle="Your access, orders and invoices." back={{ href: "/dashboard/profile", label: "Me" }} width="narrow">
      {error && (
        <p role="alert" className="rounded-[12px] bg-[var(--red-soft)] px-4 py-3 text-sm text-[var(--ink-1)]">
          {error}
        </p>
      )}

      {loading && (
        <div className="flex flex-col gap-3" role="status" aria-label="Loading purchases">
          {[1, 2, 3].map((i) => (
            <div key={i} className="en-card h-20 animate-pulse" />
          ))}
        </div>
      )}

      {empty && (
        <div className="en-card flex flex-col items-start gap-4 p-6">
          <p className="text-[var(--ink-2)]">No purchases yet.</p>
          <Link href="/pricing" className={seePlans}>See plans</Link>
        </div>
      )}

      {!loading && active.length > 0 && (
        <section aria-labelledby="access-title" className="flex flex-col gap-3">
          <h2 id="access-title" className="text-lg font-semibold text-[var(--ink-1)]" style={display}>Active access</h2>
          {active.map((e) => (
            <div key={e.id} className="en-card flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="font-medium text-[var(--ink-1)]">{label(e.contentType)}</p>
                <p className="mt-1 text-sm text-[var(--ink-3)]">Expires {fmtDate(e.expiresAt)}</p>
                {e.contentType === "TEST_SERIES" && (
                  <Link href={`/dashboard/series/${e.contentId}`} className="mt-1 inline-flex min-h-9 items-center text-sm font-semibold text-[var(--brand)] hover:underline">
                    Open tests
                  </Link>
                )}
              </div>
              <StatusPill status={e.status} />
            </div>
          ))}
        </section>
      )}

      {!loading && orders.length > 0 && (
        <section aria-labelledby="orders-title" className="flex flex-col gap-3">
          <h2 id="orders-title" className="text-lg font-semibold text-[var(--ink-1)]" style={display}>Orders</h2>
          {orders.map((o) => (
            <div key={o.id} className="en-card flex items-start justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="font-medium text-[var(--ink-1)]">
                  {label(o.contentType)}
                  {o.billingCycle ? ` · ${label(o.billingCycle)}` : ""}
                </p>
                <p className="mt-1 text-sm text-[var(--ink-3)]">
                  {fmtDate(o.createdAt)} · Ref {o.id.slice(-6).toUpperCase()}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <p className="font-bold tabular-nums text-[var(--ink-1)]" style={display}>{rupees(o.finalAmountPaise)}</p>
                <StatusPill status={o.status} />
              </div>
            </div>
          ))}
        </section>
      )}

      {!loading && invoices.length > 0 && (
        <section aria-labelledby="invoices-title" className="flex flex-col gap-3">
          <h2 id="invoices-title" className="text-lg font-semibold text-[var(--ink-1)]" style={display}>Invoices</h2>
          {invoices.map((inv) => (
            <div key={inv.id} className="en-card flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="font-medium text-[var(--ink-1)]">{inv.invoiceNumber}</p>
                <p className="mt-0.5 text-sm text-[var(--ink-3)]">{fmtDate(inv.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="font-bold tabular-nums text-[var(--ink-1)]" style={display}>{rupees(inv.totalPaise)}</p>
                  <p className="text-xs text-[var(--ink-3)]">incl. GST {rupees(inv.gstPaise)}</p>
                </div>
                {inv.pdfUrl && (
                  <a
                    href={inv.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Download invoice ${inv.invoiceNumber}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] text-[var(--ink-1)] hover:bg-[var(--brand-soft)]"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {!loading && !empty && (
        <p className="text-center text-sm">
          <Link href="/pricing" className="inline-flex min-h-11 items-center font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]">
            See plans
          </Link>
        </p>
      )}
    </AppPage>
  );
}
