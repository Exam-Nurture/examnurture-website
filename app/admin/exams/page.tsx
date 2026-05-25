"use client";

import { useEffect, useState } from "react";
import {
  apiAdminGetExams, apiAdminCreateExam, apiAdminUpdateExam, apiAdminDeleteExam,
  apiAdminGetBoards, apiAdminGetExamCategories, AdminExam, AdminBoard, ApiExamCategory
} from "@/lib/api";
import { AdminTable, Pagination, Modal, Field, SelectField, Toggle } from "@/components/admin/AdminTable";

const empty = (): Partial<AdminExam> => ({
  id: "", boardId: "", name: "", shortName: "", fullName: "",
  eligibility: "", pattern: "", subjects: '["GK","Reasoning","Math"]',
  hasTests: false, hasPYQ: false, hasGuide: false, isFeatured: false, isActive: true,
  examCategoryId: null,
});

export default function AdminExamsPage() {
  const [data, setData] = useState<{ items: AdminExam[]; total: number } | null>(null);
  const [boards, setBoards] = useState<AdminBoard[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [filterBoard, setFilterBoard] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<AdminExam>>(empty());
  const [saving, setSaving] = useState(false);

  async function load(p = page) {
    setLoading(true);
    try { 
      setData(await apiAdminGetExams({ 
        page: p, 
        limit: 20, 
        boardId: filterBoard || undefined,
        examCategoryId: filterCategory ? Number(filterCategory) : undefined
      })); 
    }
    finally { setLoading(false); }
  }

  useEffect(() => {
    apiAdminGetBoards({ page: 1, limit: 100 }).then((r) => setBoards(r.items));
    apiAdminGetExamCategories().then(setCategories);
    load();
  }, []);

  useEffect(() => { load(); }, [page, filterBoard, filterCategory]);

  function set(key: keyof AdminExam, val: unknown) { setForm((f) => ({ ...f, [key]: val })); }

  function openCreate() { setForm(empty()); setModal("create"); }
  function openEdit(e: AdminExam) { setForm({ ...e }); setModal("edit"); }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        examCategoryId: form.examCategoryId ? Number(form.examCategoryId) : null,
        notificationUrl: form.notificationUrl || undefined,
        bannerUrl: (form as any).bannerUrl || undefined,
      };
      if (modal === "create") await apiAdminCreateExam(payload);
      else await apiAdminUpdateExam(form.id!, payload);
      setModal(null);
      load();
    } finally { setSaving(false); }
  }

  async function handleDelete(e: AdminExam) {
    if (!confirm(`Delete exam "${e.name}"?`)) return;
    await apiAdminDeleteExam(e.id);
    load();
  }

  const cols = [
    { key: "id", label: "ID", width: "100px" },
    { key: "name", label: "Name" },
    { 
      key: "boardId", 
      label: "Board", 
      render: (e: AdminExam) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase">
          {boards.find(b => b.id === e.boardId)?.shortName || e.boardId}
        </span>
      )
    },
    { key: "shortName", label: "Short" },

    {
      key: "hasTests", label: "Flags",
      render: (e: AdminExam) => (
        <div className="flex gap-1 flex-wrap">
          {e.hasTests && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--green-soft)", color: "var(--green)" }}>Tests</span>}
          {e.hasPYQ && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>PYQ</span>}
          {e.isFeatured && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>Featured</span>}
        </div>
      ),
    },
    {
      key: "isActive", label: "Active",
      render: (e: AdminExam) => <span style={{ color: e.isActive ? "var(--green)" : "var(--red)" }}>{e.isActive ? "Yes" : "No"}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ border: "1.5px solid var(--line)", background: "var(--card)", color: "var(--ink-2)" }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filterBoard}
          onChange={(e) => { setFilterBoard(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ border: "1.5px solid var(--line)", background: "var(--card)", color: "var(--ink-2)" }}
        >
          <option value="">All Boards</option>
          {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button onClick={openCreate} className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue)" }}>
          + Add Exam
        </button>
      </div>

      <AdminTable columns={cols} data={data?.items ?? []} loading={loading} onEdit={openEdit} onDelete={handleDelete} />
      <Pagination page={page} total={data?.total ?? 0} limit={20} onChange={setPage} />

      {modal && (
        <Modal title={modal === "create" ? "Add Exam" : `Edit — ${form.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            {modal === "create" && (
              <Field label="ID (slug)" name="id" value={form.id ?? ""} onChange={(v) => set("id", v)} required placeholder="ssc-cgl" />
            )}
            <SelectField
              label="Board"
              name="boardId"
              value={form.boardId ?? ""}
              onChange={(v) => set("boardId", v)}
              options={boards.map((b) => ({ value: b.id, label: b.name }))}
              required
            />
            <SelectField
              label="Exam Category"
              name="examCategoryId"
              value={form.examCategoryId ? String(form.examCategoryId) : ""}
              onChange={(v) => set("examCategoryId", v ? Number(v) : null)}
              options={[{ value: "", label: "None" }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
            />
            <Field label="Name" name="name" value={form.name ?? ""} onChange={(v) => set("name", v)} required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Short Name" name="shortName" value={form.shortName ?? ""} onChange={(v) => set("shortName", v)} required />

            </div>
            <Field label="Full Name" name="fullName" value={form.fullName ?? ""} onChange={(v) => set("fullName", v)} />
            <Field label="Eligibility" name="eligibility" value={form.eligibility ?? ""} onChange={(v) => set("eligibility", v)} />
            <Field label="Pattern" name="pattern" value={form.pattern ?? ""} onChange={(v) => set("pattern", v)} />
            <Field label='Subjects (JSON, e.g. ["GK","Math"])' name="subjects" value={form.subjects ?? ""} onChange={(v) => set("subjects", v)} />
            <Field label="Banner URL" name="bannerUrl" value={(form as Record<string, unknown>).bannerUrl as string ?? ""} onChange={(v) => set("bannerUrl" as keyof AdminExam, v)} />
            <Field label="Notification URL" name="notificationUrl" value={form.notificationUrl ?? ""} onChange={(v) => set("notificationUrl", v)} />
            <Field label="Application Fee" name="applicationFee" value={form.applicationFee ?? ""} onChange={(v) => set("applicationFee", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Toggle label="Has Tests" checked={form.hasTests ?? false} onChange={(v) => set("hasTests", v)} />
              <Toggle label="Has PYQ" checked={form.hasPYQ ?? false} onChange={(v) => set("hasPYQ", v)} />
              <Toggle label="Has Guide" checked={form.hasGuide ?? false} onChange={(v) => set("hasGuide", v)} />
              <Toggle label="Featured" checked={form.isFeatured ?? false} onChange={(v) => set("isFeatured", v)} />
              <Toggle label="Active" checked={form.isActive ?? true} onChange={(v) => set("isActive", v)} />
            </div>
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
