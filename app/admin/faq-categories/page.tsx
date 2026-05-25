"use client";

import { useEffect, useState } from "react";
import {
  apiAdminGetFAQCategories, apiAdminCreateFAQCategory, apiAdminUpdateFAQCategory, apiAdminDeleteFAQCategory, AdminFAQCategory
} from "@/lib/api";
import { AdminTable, Modal, Field } from "@/components/admin/AdminTable";

export default function AdminFAQCategoriesPage() {
  const [categories, setCategories] = useState<AdminFAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<AdminFAQCategory | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await apiAdminGetFAQCategories();
      setCategories(res.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setSortOrder("0");
    setIsActive(true);
    setModal("create");
  }

  function openEdit(c: AdminFAQCategory) {
    setEditing(c);
    setName(c.name);
    setSlug(c.slug);
    setSortOrder(String(c.sortOrder));
    setIsActive(c.isActive);
    setModal("edit");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        sortOrder: parseInt(sortOrder) || 0,
        isActive
      };
      
      if (modal === "create") {
        await apiAdminCreateFAQCategory(payload);
      } else if (modal === "edit" && editing) {
        await apiAdminUpdateFAQCategory(editing.id, payload);
      }
      setModal(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: AdminFAQCategory) {
    if (!confirm(`Delete category "${c.name}"? This will delete all associated FAQs!`)) return;
    await apiAdminDeleteFAQCategory(c.id);
    load();
  }

  const cols = [
    { key: "name", label: "Name" },
    { key: "slug", label: "Slug" },
    { key: "sortOrder", label: "Sort Order" },
    { 
      key: "isActive", 
      label: "Status",
      render: (c: AdminFAQCategory) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {c.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Manage FAQ Categories</h1>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue)" }}>
          + Add Category
        </button>
      </div>

      <AdminTable columns={cols} data={categories} loading={loading} onEdit={openEdit} onDelete={handleDelete} />

      {modal && (
        <Modal title={modal === "create" ? "Add Category" : "Edit Category"} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field name="name" label="Category Name" value={name} onChange={setName} required placeholder="e.g. Landing Page" />
            <Field name="slug" label="Slug" value={slug} onChange={setSlug} required placeholder="e.g. landing-page" />
            <Field name="sortOrder" label="Sort Order" type="number" value={sortOrder} onChange={setSortOrder} />
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isActive" 
                checked={isActive} 
                onChange={e => setIsActive(e.target.checked)} 
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>Active</label>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--blue)" }}>
                {saving ? "Saving..." : modal === "create" ? "Create" : "Update"}
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
