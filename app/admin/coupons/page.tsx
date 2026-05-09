"use client";

import { useEffect, useState } from "react";
import {
  apiAdminGetCoupons,
  apiAdminCreateCoupon,
  apiAdminUpdateCoupon,
  apiAdminDeleteCoupon,
  type Coupon,
} from "@/lib/api";

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const EMPTY_FORM = {
  code: "",
  type: "PERCENT" as "FLAT" | "PERCENT",
  value: "",
  maxUses: "",
  maxUsesPerUser: "1",
  validFrom: "",
  validUntil: "",
  applicableTo: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await apiAdminGetCoupons();
      setCoupons(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate() {
    if (!form.code || !form.value) { setError("Code and value are required"); return; }
    setSaving(true);
    setError("");
    try {
      const applicableTo = form.applicableTo
        ? form.applicableTo.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;

      await apiAdminCreateCoupon({
        code: form.code,
        type: form.type,
        value: parseInt(form.value, 10),
        maxUses: form.maxUses ? parseInt(form.maxUses, 10) : undefined,
        maxUsesPerUser: parseInt(form.maxUsesPerUser || "1", 10),
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
        applicableTo,
      });
      setForm(EMPTY_FORM);
      setFormOpen(false);
      load();
    } catch (e: any) {
      setError(e.message || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(coupon: Coupon) {
    try {
      await apiAdminUpdateCoupon(coupon.id, { isActive: !coupon.isActive });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiAdminDeleteCoupon(deleteId);
      setDeleteId(null);
      load();
    } catch (e: any) {
      setError(e.message || "Failed to delete coupon");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold flex-1" style={{ color: "var(--ink-1)" }}>Coupons</h1>
        <span className="text-sm" style={{ color: "var(--ink-3)" }}>{total} total</span>
        <button
          onClick={() => { setFormOpen(true); setError(""); }}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--blue)" }}
        >
          + New Coupon
        </button>
      </div>

      {error && <div className="px-4 py-3 rounded-lg text-sm mb-4" style={{ background: "var(--red-soft)", color: "var(--red)" }}>{error}</div>}

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
              {["Code", "Type / Value", "Uses", "Valid Until", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: "var(--ink-3)" }}>Loading…</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: "var(--ink-3)" }}>No coupons yet</td></tr>
            ) : coupons.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < coupons.length - 1 ? "1px solid var(--line)" : "none", background: "var(--card)" }}>
                <td className="px-4 py-3 font-mono font-semibold" style={{ color: "var(--ink-1)" }}>{c.code}</td>
                <td className="px-4 py-3" style={{ color: "var(--ink-2)" }}>
                  {c.type === "PERCENT" ? `${c.value}% off` : `₹${(c.value / 100).toFixed(0)} off`}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--ink-3)" }}>
                  {c.usedCount}{c.maxUses !== null && c.maxUses !== undefined ? ` / ${c.maxUses}` : ""}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--ink-3)" }}>
                  {c.validUntil ? fmtDate(c.validUntil) : "No expiry"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(c)}
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: c.isActive ? "var(--green)" : "var(--ink-3)",
                      background: c.isActive ? "var(--green-soft)" : "var(--bg)",
                      border: "1px solid currentColor",
                    }}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: "var(--red)", background: "var(--red-soft)" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold" style={{ color: "var(--ink-1)" }}>New Coupon</h2>
              <button onClick={() => setFormOpen(false)} style={{ color: "var(--ink-3)" }}>✕</button>
            </div>

            <div className="space-y-4">
              <FormField label="Code *">
                <input value={form.code} onChange={(e) => setField("code", e.target.value.toUpperCase())} placeholder="SAVE20" className="input-base" />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Type *">
                  <select value={form.type} onChange={(e) => setField("type", e.target.value as any)} className="input-base">
                    <option value="PERCENT">Percent (%)</option>
                    <option value="FLAT">Flat (₹)</option>
                  </select>
                </FormField>
                <FormField label={form.type === "PERCENT" ? "Value (%) *" : "Value (paise) *"}>
                  <input type="number" value={form.value} onChange={(e) => setField("value", e.target.value)} placeholder={form.type === "PERCENT" ? "20" : "2000"} className="input-base" />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Max Uses (total)">
                  <input type="number" value={form.maxUses} onChange={(e) => setField("maxUses", e.target.value)} placeholder="Unlimited" className="input-base" />
                </FormField>
                <FormField label="Max Uses / User">
                  <input type="number" value={form.maxUsesPerUser} onChange={(e) => setField("maxUsesPerUser", e.target.value)} placeholder="1" className="input-base" />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Valid From">
                  <input type="datetime-local" value={form.validFrom} onChange={(e) => setField("validFrom", e.target.value)} className="input-base" />
                </FormField>
                <FormField label="Valid Until">
                  <input type="datetime-local" value={form.validUntil} onChange={(e) => setField("validUntil", e.target.value)} className="input-base" />
                </FormField>
              </div>

              <FormField label="Applicable To (comma-separated, e.g. TEST_SERIES or TEST_SERIES:abc123)">
                <input value={form.applicableTo} onChange={(e) => setField("applicableTo", e.target.value)} placeholder="Leave blank for all" className="input-base" />
              </FormField>
            </div>

            {error && <p className="text-xs mt-3" style={{ color: "var(--red)" }}>{error}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setFormOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--blue)" }}>
                {saving ? "Creating…" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--card)" }}>
            <h2 className="font-bold mb-2" style={{ color: "var(--ink-1)" }}>Delete Coupon?</h2>
            <p className="text-sm mb-5" style={{ color: "var(--ink-3)" }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--red)" }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-base {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          border: 1px solid var(--line);
          background: var(--bg);
          color: var(--ink-1);
          outline: none;
        }
      `}</style>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink-2)" }}>{label}</label>
      {children}
    </div>
  );
}
