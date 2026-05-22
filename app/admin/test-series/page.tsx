"use client";

import { useEffect, useState } from "react";
import {
  apiAdminGetTestSeries, apiAdminCreateTestSeries, apiAdminUpdateTestSeries, apiAdminDeleteTestSeries,
  apiAdminGetExams, AdminTestSeries, AdminExam,
} from "@/lib/api";
import { AdminTable, Pagination, Modal, Field, SelectField, Toggle } from "@/components/admin/AdminTable";

const empty = (): Partial<AdminTestSeries> => ({
  examId: "", title: "", description: "", totalTests: 0,
  isPaid: false, isFeatured: false, isActive: true,
  price: 0,
});

export default function AdminTestSeriesPage() {
  const [data, setData] = useState<{ items: AdminTestSeries[]; total: number } | null>(null);
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<AdminTestSeries>>(empty());
  const [saving, setSaving] = useState(false);

  async function load(p = page) {
    setLoading(true);
    try { setData(await apiAdminGetTestSeries({ page: p, limit: 20 })); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    apiAdminGetExams({ page: 1, limit: 200 }).then((r) => setExams(r.items));
    load();
  }, []);

  useEffect(() => { load(); }, [page]);

  function set(key: keyof AdminTestSeries, val: unknown) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), totalTests: Number(form.totalTests) };
      if (modal === "create") await apiAdminCreateTestSeries(payload);
      else await apiAdminUpdateTestSeries(form.id!, payload);
      setModal(null);
      load();
    } finally { setSaving(false); }
  }

  async function handleDelete(s: AdminTestSeries) {
    if (!confirm(`Delete series "${s.title}"?`)) return;
    await apiAdminDeleteTestSeries(s.id);
    load();
  }

  const cols = [
    { key: "title", label: "Title" },
    { 
      key: "examId", 
      label: "Exam", 
      render: (s: AdminTestSeries) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
          {exams.find(e => e.id === s.examId)?.shortName || s.examId}
        </span>
      )
    },
    { key: "totalTests", label: "Tests" },
    { key: "price", label: "Price", render: (s: AdminTestSeries) => s.isPaid ? `₹${s.price}` : "Free" },
    {
      key: "isActive", label: "Active",
      render: (s: AdminTestSeries) => <span style={{ color: s.isActive ? "var(--green)" : "var(--red)" }}>{s.isActive ? "Yes" : "No"}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setForm(empty()); setModal("create"); }} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue)" }}>
          + Add Series
        </button>
      </div>

      <AdminTable columns={cols} data={data?.items ?? []} loading={loading}
        onEdit={(s) => { setForm({ ...s }); setModal("edit"); }}
        onDelete={handleDelete}
      />
      <Pagination page={page} total={data?.total ?? 0} limit={20} onChange={setPage} />

      {modal && (
        <Modal title={modal === "create" ? "Add Test Series" : `Edit — ${form.title}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            <SelectField label="Exam" name="examId" value={form.examId ?? ""} onChange={(v) => set("examId", v)}
              options={exams.map((e) => ({ value: e.id, label: e.name }))} required />
            <Field label="Title" name="title" value={form.title ?? ""} onChange={(v) => set("title", v)} required />
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--ink-2)" }}>Description</label>
              <textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)}
                rows={2} className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: "1.5px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Toggle label="Is Paid" checked={form.isPaid ?? false} onChange={(v) => set("isPaid", v)} />
              <Toggle label="Featured" checked={form.isFeatured ?? false} onChange={(v) => set("isFeatured", v)} />
              <Toggle label="Active" checked={form.isActive ?? true} onChange={(v) => set("isActive", v)} />
            </div>
            {form.isPaid && (
              <Field label="Price (₹)" name="price" type="number" value={form.price ?? 0} onChange={(v) => set("price", parseFloat(v))} />
            )}
            <Field label="Banner URL" name="bannerUrl" value={(form as Record<string, unknown>).bannerUrl as string ?? ""} onChange={(v) => set("bannerUrl" as keyof AdminTestSeries, v)} />
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--blue)" }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
