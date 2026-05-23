"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import {
  apiAdminGetTeam, apiAdminCreateTeamMember, apiAdminUpdateTeamMember, apiAdminDeleteTeamMember,
  apiAdminUploadImage, AdminTeamMember,
} from "@/lib/api";
import { AdminTable, Pagination, Modal, Field, Toggle } from "@/components/admin/AdminTable";

const empty = (): Partial<AdminTeamMember> => ({
  name: "", role: "", photoUrl: "", bio: "", linkedinUrl: "", twitterUrl: "",
  email: "", displayOrder: 0, isActive: true,
});

export default function AdminTeamPage() {
  const [data, setData] = useState<{ items: AdminTeamMember[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<AdminTeamMember>>(empty());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function load(p = page) {
    setLoading(true);
    try { setData(await apiAdminGetTeam({ page: p })); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page]);

  function set(key: keyof AdminTeamMember, val: unknown) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      // Empty strings fail URL/email validation — send undefined instead
      const payload = {
        ...form,
        displayOrder: Number(form.displayOrder),
        photoUrl: form.photoUrl?.trim() || undefined,
        linkedinUrl: form.linkedinUrl?.trim() || undefined,
        twitterUrl: form.twitterUrl?.trim() || undefined,
        email: form.email?.trim() || undefined,
      };
      if (modal === "create") await apiAdminCreateTeamMember(payload);
      else await apiAdminUpdateTeamMember(form.id!, payload);
      setModal(null);
      load();
    } finally { setSaving(false); }
  }

  async function handleDelete(m: AdminTeamMember) {
    if (!confirm(`Remove "${m.name}" from team?`)) return;
    await apiAdminDeleteTeamMember(m.id);
    load();
  }

  const cols = [
    { key: "displayOrder", label: "#", width: "40px" },
    {
      key: "name", label: "Name",
      render: (m: AdminTeamMember) => (
        <div className="flex items-center gap-2">
          {m.photoUrl
            ? <img src={m.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
            : <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--blue)" }}>{m.name[0]}</div>
          }
          {m.name}
        </div>
      ),
    },
    { key: "role", label: "Role" },
    { key: "email", label: "Email", render: (m: AdminTeamMember) => m.email ?? "—" },
    {
      key: "isActive", label: "Active",
      render: (m: AdminTeamMember) => <span style={{ color: m.isActive ? "var(--green)" : "var(--red)" }}>{m.isActive ? "Yes" : "No"}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setForm(empty()); setModal("create"); }} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue)" }}>
          + Add Member
        </button>
      </div>

      <AdminTable columns={cols} data={data?.items ?? []} loading={loading}
        onEdit={(m) => { setForm({ ...m }); setModal("edit"); }}
        onDelete={handleDelete}
      />
      <Pagination page={page} total={data?.total ?? 0} limit={20} onChange={setPage} />

      {modal && (
        <Modal title={modal === "create" ? "Add Team Member" : `Edit — ${form.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            <Field label="Name" name="name" value={form.name ?? ""} onChange={(v) => set("name", v)} required />
            <Field label="Role / Title" name="role" value={form.role ?? ""} onChange={(v) => set("role", v)} required />
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--ink-2)" }}>Bio</label>
              <textarea value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: "1.5px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }} />
            </div>
            <PhotoUploadField
              value={form.photoUrl ?? ""}
              onChange={(url) => set("photoUrl", url)}
              uploading={uploading}
              setUploading={setUploading}
              error={uploadError}
              setError={setUploadError}
            />
            <Field label="Email" name="email" type="email" value={form.email ?? ""} onChange={(v) => set("email", v)} />
            <Field label="LinkedIn URL" name="linkedinUrl" value={form.linkedinUrl ?? ""} onChange={(v) => set("linkedinUrl", v)} />
            <Field label="Twitter URL" name="twitterUrl" value={form.twitterUrl ?? ""} onChange={(v) => set("twitterUrl", v)} />
            <Field label="Display Order" name="displayOrder" type="number" value={form.displayOrder ?? 0} onChange={(v) => set("displayOrder", parseInt(v))} />
            <Toggle label="Active" checked={form.isActive ?? true} onChange={(v) => set("isActive", v)} />
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

function PhotoUploadField({
  value, onChange, uploading, setUploading, error, setError,
}: {
  value: string;
  onChange: (url: string) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  error: string;
  setError: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const { url } = await apiAdminUploadImage(file);
      onChange(url);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--ink-2)" }}>Photo</label>

      {/* Preview + remove */}
      {value ? (
        <div className="flex items-center gap-3 mb-2">
          <img src={value} alt="preview" className="w-14 h-14 rounded-full object-cover border" style={{ borderColor: "var(--line)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate" style={{ color: "var(--ink-3)" }}>{value}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1 rounded-md hover:bg-red-50"
            title="Remove photo"
          >
            <X size={14} className="text-red-400" />
          </button>
        </div>
      ) : null}

      {/* Drop zone */}
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-4 cursor-pointer hover:bg-[var(--bg)] transition-colors"
        style={{ borderColor: uploading ? "var(--blue)" : "var(--line)" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {uploading ? (
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--line)", borderTopColor: "var(--blue)" }} />
        ) : (
          <Upload size={16} style={{ color: "var(--ink-4)" }} />
        )}
        <p className="text-xs" style={{ color: "var(--ink-4)" }}>
          {uploading ? "Uploading…" : "Click or drag a photo (JPEG/PNG/WebP, max 5 MB)"}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && <p className="text-xs mt-1 text-red-500">{error}</p>}
    </div>
  );
}
