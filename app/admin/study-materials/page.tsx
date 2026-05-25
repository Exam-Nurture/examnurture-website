"use client";

import { useEffect, useState } from "react";
import {
  apiAdminGetStudyMaterials, apiAdminCreateStudyMaterial, apiAdminUpdateStudyMaterial,
  apiAdminDeleteStudyMaterial, apiAdminGetExams,
  AdminStudyMaterial, AdminStudyMaterialPayload, AdminExam,
} from "@/lib/api";
import { AdminTable, Pagination, Modal, Field, SelectField, Toggle } from "@/components/admin/AdminTable";

const FILE_TYPES = ["pdf", "docx", "pptx", "xlsx", "zip", "other"];

const emptyPayload = (): Partial<AdminStudyMaterialPayload> => ({
  examIds: [],
  subject: "",
  title: "",
  description: "",
  fileUrl: "",
  fileType: "pdf",
  buyLink: "",
  language: "ENGLISH",
  pageCount: 0,
  coverUrl: "",
  tierRequired: 0,
  isActive: true,
  isFeatured: false,
});

export default function AdminStudyMaterialsPage() {
  const [data, setData] = useState<{ items: AdminStudyMaterial[]; total: number } | null>(null);
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<AdminStudyMaterialPayload>>(emptyPayload());
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load(p = page) {
    setLoading(true);
    try { setData(await apiAdminGetStudyMaterials({ page: p })); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    apiAdminGetExams({ page: 1, limit: 200 }).then((r) => setExams(r.items));
    load();
  }, []);

  useEffect(() => { load(); }, [page]);

  function set<K extends keyof AdminStudyMaterialPayload>(key: K, val: AdminStudyMaterialPayload[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function toggleExamId(examId: string) {
    const ids = form.examIds ?? [];
    set("examIds", ids.includes(examId) ? ids.filter((id) => id !== examId) : [...ids, examId]);
  }

  function openCreate() {
    setForm(emptyPayload());
    setEditId(null);
    setModal("create");
  }

  function openEdit(m: AdminStudyMaterial) {
    setForm({
      examIds: m.exams.map((e) => e.examId),
      subject: m.subject,
      title: m.title,
      description: m.description ?? "",
      fileUrl: m.fileUrl ?? "",
      fileType: m.fileType ?? "pdf",
      buyLink: m.buyLink ?? "",
      language: m.language as AdminStudyMaterialPayload["language"],
      pageCount: m.pageCount,
      coverUrl: m.coverUrl ?? "",
      tierRequired: m.tierRequired,
      isActive: m.isActive,
      isFeatured: m.isFeatured,
    });
    setEditId(m.id);
    setModal("edit");
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, tierRequired: Number(form.tierRequired), pageCount: Number(form.pageCount) };
      if (modal === "create") await apiAdminCreateStudyMaterial(payload);
      else await apiAdminUpdateStudyMaterial(editId!, payload);
      setModal(null);
      load();
    } finally { setSaving(false); }
  }

  async function handleDelete(m: AdminStudyMaterial) {
    if (!confirm(`Delete "${m.title}"?`)) return;
    await apiAdminDeleteStudyMaterial(m.id);
    load();
  }

  const cols = [
    { key: "title", label: "Title" },
    {
      key: "exams", label: "Courses",
      render: (m: AdminStudyMaterial) => (
        <div className="flex flex-wrap gap-1">
          {m.exams.length === 0
            ? <span style={{ color: "var(--ink-3)" }}>—</span>
            : m.exams.map((e) => (
              <span key={e.examId} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                {e.exam.shortName}
              </span>
            ))}
        </div>
      ),
    },
    { key: "subject", label: "Subject" },
    {
      key: "fileUrl", label: "File",
      render: (m: AdminStudyMaterial) => m.fileUrl
        ? <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: "var(--blue)" }}>
            {m.fileType?.toUpperCase() ?? "File"}
          </a>
        : <span style={{ color: "var(--ink-3)" }}>—</span>,
    },
    { key: "language", label: "Lang" },
    {
      key: "isActive", label: "Active",
      render: (m: AdminStudyMaterial) => (
        <span style={{ color: m.isActive ? "var(--green)" : "var(--red)" }}>{m.isActive ? "Yes" : "No"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue)" }}>
          + Add Material
        </button>
      </div>

      <AdminTable columns={cols} data={data?.items ?? []} loading={loading} onEdit={openEdit} onDelete={handleDelete} />
      <Pagination page={page} total={data?.total ?? 0} limit={20} onChange={setPage} />

      {modal && (
        <Modal
          title={modal === "create" ? "Add Study Material" : `Edit — ${form.title}`}
          onClose={() => setModal(null)}
          wide
        >
          <form onSubmit={handleSave} className="space-y-3">
            <Field label="Title" name="title" value={form.title ?? ""} onChange={(v) => set("title", v)} required />
            <Field label="Subject" name="subject" value={form.subject ?? ""} onChange={(v) => set("subject", v)} required />

            {/* Linked Courses (multi-select) */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--ink-2)" }}>
                Linked Courses
              </label>
              <div className="max-h-36 overflow-y-auto border rounded-lg p-2 grid grid-cols-2 gap-1" style={{ borderColor: "var(--line)" }}>
                {exams.map((e) => {
                  const checked = (form.examIds ?? []).includes(e.id);
                  return (
                    <label key={e.id} className="flex items-center gap-1.5 cursor-pointer px-1 py-0.5 rounded hover:bg-opacity-80 text-xs" style={{ color: "var(--ink-1)" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleExamId(e.id)}
                        className="rounded"
                        style={{ accentColor: "var(--blue)" }}
                      />
                      <span className="truncate">{e.shortName}</span>
                    </label>
                  );
                })}
              </div>
              {(form.examIds ?? []).length > 0 && (
                <p className="text-[11px] mt-1" style={{ color: "var(--ink-3)" }}>
                  Selected: {(form.examIds ?? []).map((id) => exams.find((e) => e.id === id)?.shortName ?? id).join(", ")}
                </p>
              )}
            </div>

            {/* File upload URL + type */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Field label="File URL (PDF / Word / etc.)" name="fileUrl" value={form.fileUrl ?? ""} onChange={(v) => set("fileUrl", v)} placeholder="https://..." />
              </div>
              <SelectField label="File Type" name="fileType" value={form.fileType ?? "pdf"} onChange={(v) => set("fileType", v)}
                options={FILE_TYPES.map((t) => ({ value: t, label: t.toUpperCase() }))} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--ink-2)" }}>Description</label>
              <textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: "1.5px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Language" name="language" value={form.language ?? "ENGLISH"}
                onChange={(v) => set("language", v as AdminStudyMaterialPayload["language"])}
                options={["ENGLISH", "HINDI", "BILINGUAL"].map((l) => ({ value: l, label: l }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Page Count" name="pageCount" type="number" value={form.pageCount ?? 0}
                onChange={(v) => set("pageCount", parseInt(v) as unknown as AdminStudyMaterialPayload["pageCount"])} />
              <Field label="Cover Image URL" name="coverUrl" value={form.coverUrl ?? ""} onChange={(v) => set("coverUrl", v)} />
            </div>

            <Field label="Buy Link (optional)" name="buyLink" value={form.buyLink ?? ""} onChange={(v) => set("buyLink", v)} />

            <div className="flex gap-4 pt-1">
              <Toggle label="Active" checked={form.isActive ?? true} onChange={(v) => set("isActive", v)} />
              <Toggle label="Featured" checked={form.isFeatured ?? false} onChange={(v) => set("isFeatured", v)} />
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
