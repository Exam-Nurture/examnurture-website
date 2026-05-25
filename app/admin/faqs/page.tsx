"use client";

import { useEffect, useState } from "react";
import {
  apiAdminGetFAQs, apiAdminCreateFAQ, apiAdminUpdateFAQ, apiAdminDeleteFAQ, AdminFAQ,
  apiAdminGetFAQCategories, AdminFAQCategory
} from "@/lib/api";
import { AdminTable, Modal, Field } from "@/components/admin/AdminTable";

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<AdminFAQ[]>([]);
  const [categories, setCategories] = useState<AdminFAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<AdminFAQ | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [categoryId, setCategoryId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [faqRes, catRes] = await Promise.all([
        apiAdminGetFAQs(),
        apiAdminGetFAQCategories({ page: 1 }) // Get all categories ideally
      ]);
      setFaqs(faqRes.items || []);
      setCategories(catRes.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setCategoryId(categories.length > 0 ? categories[0].id : "");
    setQuestion("");
    setAnswer("");
    setSortOrder("0");
    setIsActive(true);
    setModal("create");
  }

  function openEdit(f: AdminFAQ) {
    setEditing(f);
    setCategoryId(f.categoryId);
    setQuestion(f.question);
    setAnswer(f.answer);
    setSortOrder(String(f.sortOrder));
    setIsActive(f.isActive);
    setModal("edit");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) return alert("Please select a category");
    
    setSaving(true);
    try {
      const payload = {
        categoryId,
        question,
        answer,
        sortOrder: parseInt(sortOrder) || 0,
        isActive
      };
      
      if (modal === "create") {
        await apiAdminCreateFAQ(payload);
      } else if (modal === "edit" && editing) {
        await apiAdminUpdateFAQ(editing.id, payload);
      }
      setModal(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(f: AdminFAQ) {
    if (!confirm(`Delete FAQ: "${f.question}"?`)) return;
    await apiAdminDeleteFAQ(f.id);
    load();
  }

  const cols = [
    { 
      key: "category", 
      label: "Category",
      render: (f: AdminFAQ) => <span>{f.category?.name || "Unknown"}</span>
    },
    { key: "question", label: "Question" },
    { key: "sortOrder", label: "Order" },
    { 
      key: "isActive", 
      label: "Status",
      render: (f: AdminFAQ) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${f.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {f.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Manage FAQs</h1>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue)" }}>
          + Add FAQ
        </button>
      </div>

      <AdminTable columns={cols} data={faqs} loading={loading} onEdit={openEdit} onDelete={handleDelete} />

      {modal && (
        <Modal title={modal === "create" ? "Add FAQ" : "Edit FAQ"} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="px-3 py-2 rounded-lg bg-transparent text-sm w-full outline-none"
                style={{ border: "1px solid var(--line)", color: "var(--ink-1)" }}
                required
              >
                <option value="" disabled>Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <Field name="question" label="Question" value={question} onChange={setQuestion} required placeholder="e.g. How does this work?" />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>Answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="px-3 py-2 rounded-lg bg-transparent text-sm w-full outline-none resize-y min-h-[100px]"
                style={{ border: "1px solid var(--line)", color: "var(--ink-1)" }}
                required
                placeholder="Detailed answer..."
              />
            </div>

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
