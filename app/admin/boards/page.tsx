"use client";

import { useEffect, useState } from "react";
import {
  apiAdminGetBoards, apiAdminCreateBoard, apiAdminUpdateBoard, apiAdminDeleteBoard,
  apiAdminGetStates,
  AdminBoard,
} from "@/lib/api";
import { AdminTable, Pagination, Modal, Field, SelectField, Toggle } from "@/components/admin/AdminTable";

const empty = (): Partial<AdminBoard> => ({
  id: "", name: "", shortName: "", description: "", tint: "#2563EB", colorSoft: "#EFF6FF",
  logoUrl: "", website: "", isActive: true, stateId: undefined,
});

export default function AdminBoardsPage() {
  const [data, setData] = useState<{ items: AdminBoard[]; total: number } | null>(null);
  const [states, setStates] = useState<{ id: number; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<AdminBoard>>(empty());
  const [saving, setSaving] = useState(false);

  async function load(p = page) {
    setLoading(true);
    try {
      const [bData, sData] = await Promise.all([
        apiAdminGetBoards({ page: p, limit: 20 }),
        apiAdminGetStates()
      ]);
      setData(bData);
      setStates(Array.isArray(sData) ? sData : (sData as any).items || []);
    }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page]);

  function set(key: keyof AdminBoard, val: unknown) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function openCreate() { setForm(empty()); setModal("create"); }
  function openEdit(b: AdminBoard) { setForm({ ...b }); setModal("edit"); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        logoUrl: form.logoUrl || undefined,
        website: form.website || undefined,
        stateId: form.stateId || undefined,
      };
      if (modal === "create") await apiAdminCreateBoard(payload);
      else await apiAdminUpdateBoard(form.id!, payload);
      setModal(null);
      load();
    } finally { setSaving(false); }
  }

  async function handleDelete(b: AdminBoard) {
    if (!confirm(`Delete board "${b.name}"?`)) return;
    await apiAdminDeleteBoard(b.id);
    load();
  }

  const cols = [
    { key: "id", label: "ID", width: "100px" },
    { key: "name", label: "Name" },
    { 
      key: "stateId", 
      label: "State",
      render: (b: AdminBoard) => <span>{states.find(s => s.id === b.stateId)?.name || "Central"}</span>
    },
    { key: "shortName", label: "Short" },
    {
      key: "isActive", label: "Active",
      render: (b: AdminBoard) => <span style={{ color: b.isActive ? "var(--green)" : "var(--red)" }}>{b.isActive ? "Yes" : "No"}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue)" }}>
          + Add Board
        </button>
      </div>

      <AdminTable columns={cols} data={data?.items ?? []} loading={loading} onEdit={openEdit} onDelete={handleDelete} />
      <Pagination page={page} total={data?.total ?? 0} limit={20} onChange={setPage} />

      {modal && (
        <Modal title={modal === "create" ? "Add Board" : `Edit Board — ${form.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            {modal === "create" && (
              <Field label="ID (slug, e.g. ssc)" name="id" value={form.id ?? ""} onChange={(v) => set("id", v)} required placeholder="ssc" />
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" name="name" value={form.name ?? ""} onChange={(v) => set("name", v)} required />
              <Field label="Short Name" name="shortName" value={form.shortName ?? ""} onChange={(v) => set("shortName", v)} required />
            </div>
            
            <SelectField 
              name="stateId"
              label="State / Division" 
              value={form.stateId?.toString() || ""} 
              onChange={(v) => set("stateId", v ? parseInt(v) : null)}
              options={[
                { value: "", label: "Central / All India" },
                ...states.map(s => ({ value: s.id.toString(), label: s.name }))
              ]}
            />

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--ink-2)" }}>Description</label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: "1.5px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tint Color" name="tint" type="color" value={form.tint ?? "#2563EB"} onChange={(v) => set("tint", v)} />
              <Field label="Soft Color" name="colorSoft" type="color" value={form.colorSoft ?? "#EFF6FF"} onChange={(v) => set("colorSoft", v)} />
            </div>
            <Field label="Logo URL" name="logoUrl" value={form.logoUrl ?? ""} onChange={(v) => set("logoUrl", v)} placeholder="https://…" />
            <Field label="Website" name="website" value={form.website ?? ""} onChange={(v) => set("website", v)} placeholder="https://…" />
            <Toggle label="Active" checked={form.isActive ?? true} onChange={(v) => set("isActive", v)} />
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--blue)" }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
