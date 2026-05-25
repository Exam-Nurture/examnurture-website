"use client";

import { useEffect, useState } from "react";
import { apiAdminGetUsers, apiAdminUpdateUser, apiAdminDeleteUser, AuthUser } from "@/lib/api";
import { AdminTable, Pagination, Modal, Field, SelectField } from "@/components/admin/AdminTable";

export default function AdminUsersPage() {
  const [data, setData] = useState<{ items: AuthUser[]; total: number; page: number; limit: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<AuthUser | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; role: string; isVerified: string }>({ name: "", role: "STUDENT", isVerified: "false" });
  const [saving, setSaving] = useState(false);

  async function load(p = page, s = search) {
    setLoading(true);
    try {
      const res = await apiAdminGetUsers({ page: p, limit: 20, search: s || undefined });
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load(1, search);
  }

  function openEdit(user: AuthUser) {
    setEditUser(user);
    setEditForm({ name: user.name, role: user.role, isVerified: String((user as unknown as Record<string, unknown>).isVerified ?? false) });
  }

  async function handleSave() {
    if (!editUser) return;
    setSaving(true);
    try {
      await apiAdminUpdateUser(editUser.id, {
        name: editForm.name,
        role: editForm.role,
        isVerified: editForm.isVerified === "true",
      });
      setEditUser(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: AuthUser) {
    if (!confirm(`Delete user ${user.name}? This cannot be undone.`)) return;
    await apiAdminDeleteUser(user.id);
    load();
  }

  const cols = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone", render: (u: AuthUser) => (u as unknown as Record<string, unknown>).phone as string ?? "—" },
    {
      key: "role", label: "Role",
      render: (u: AuthUser) => (
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{
          background: (u.role === "ADMIN" || u.role === "SUPERADMIN") ? "var(--violet-soft)" : "var(--blue-soft)",
          color: (u.role === "ADMIN" || u.role === "SUPERADMIN") ? "var(--violet)" : "var(--blue)",
        }}>{u.role}</span>
      ),
    },
    {
      key: "isVerified", label: "Verified",
      render: (u: AuthUser) => {
        const v = (u as unknown as Record<string, unknown>).isVerified as boolean;
        return <span style={{ color: v ? "var(--green)" : "var(--red)" }}>{v ? "Yes" : "No"}</span>;
      },
    },
    {
      key: "lastLoginAt", label: "Last Login",
      render: (u: AuthUser) => {
        const d = (u as unknown as Record<string, unknown>).lastLoginAt as string | undefined;
        return d ? new Date(d).toLocaleDateString() : "Never";
      },
    },
    {
      key: "createdAt", label: "Joined",
      render: (u: AuthUser) => {
        const d = (u as unknown as Record<string, unknown>).createdAt as string | undefined;
        return d ? new Date(d).toLocaleDateString() : "—";
      },
    },
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
          style={{ border: "1.5px solid var(--line)", background: "var(--card)", color: "var(--ink-1)" }}
        />
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--blue)" }}>
          Search
        </button>
      </form>

      <AdminTable
        columns={cols}
        data={data?.items ?? []}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <Pagination page={page} total={data?.total ?? 0} limit={20} onChange={setPage} />

      {editUser && (
        <Modal title={`Edit User — ${editUser.name}`} onClose={() => setEditUser(null)}>
          <div className="space-y-3">
            <Field label="Name" name="name" value={editForm.name} onChange={(v) => setEditForm((f) => ({ ...f, name: v }))} required />
            <SelectField
              label="Role"
              name="role"
              value={editForm.role}
              onChange={(v) => setEditForm((f) => ({ ...f, role: v }))}
              options={[{ value: "STUDENT", label: "Student" }, { value: "ADMIN", label: "Admin" }, { value: "SUPERADMIN", label: "Super Admin" }]}
            />
            <SelectField
              label="Verified"
              name="isVerified"
              value={editForm.isVerified}
              onChange={(v) => setEditForm((f) => ({ ...f, isVerified: v }))}
              options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]}
            />
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--blue)" }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditUser(null)} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
