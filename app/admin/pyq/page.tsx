"use client";

import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  apiAdminGetPYQ, apiAdminCreatePYQ, apiAdminUpdatePYQ, apiAdminDeletePYQ,
  apiAdminGetExams, AdminPYQPaper, AdminExam, apiAdminCreatePYQBulk,
} from "@/lib/api";
import { AdminTable, Pagination, Modal, Field, SelectField, Toggle } from "@/components/admin/AdminTable";

const empty = (): Partial<AdminPYQPaper> => ({
  examId: "", title: "", year: new Date().getFullYear(), shift: "",
  totalQs: 0, durationMin: 0, pdfUrl: "", type: "OBJECTIVE",
  hasSolutions: false, tierRequired: 0, isActive: true,
});

export default function AdminPYQPage() {
  const [data, setData] = useState<{ items: AdminPYQPaper[]; total: number } | null>(null);
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<AdminPYQPaper>>(empty());
  const [saving, setSaving] = useState(false);
  
  // Bulk Upload State
  const [questions, setQuestions] = useState<any[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load(p = page) {
    setLoading(true);
    try { setData(await apiAdminGetPYQ({ page: p })); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    apiAdminGetExams({ page: 1, limit: 200 }).then((r) => setExams(r.items));
    load();
  }, []);

  useEffect(() => { load(); }, [page]);

  function set(key: keyof AdminPYQPaper, val: unknown) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith(".json")) {
        const text = await file.text();
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          setQuestions(json);
          set("totalQs", json.length);
        } else {
          setFileError("JSON must be an array of questions");
        }
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          setQuestions(data);
          set("totalQs", data.length);
        };
        reader.readAsBinaryString(file);
      } else {
        setFileError("Unsupported file format. Please use .json or .xlsx");
      }
    } catch (err) {
      setFileError("Failed to parse file. Check format.");
      console.error(err);
    }
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload = { 
        ...form, 
        year: Number(form.year), 
        totalQs: Number(form.totalQs), 
        durationMin: Number(form.durationMin), 
        tierRequired: Number(form.tierRequired) 
      };

      if (modal === "create") {
        if (questions.length > 0) {
          await apiAdminCreatePYQBulk({ paper: payload, questions });
        } else {
          await apiAdminCreatePYQ(payload);
        }
      } else {
        await apiAdminUpdatePYQ(form.id!, payload);
      }
      
      setModal(null);
      setQuestions([]);
      load();
    } catch (err: any) {
      alert(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: AdminPYQPaper) {
    if (!confirm(`Delete PYQ paper "${p.title}"?`)) return;
    await apiAdminDeletePYQ(p.id);
    load();
  }

  const cols = [
    { key: "title", label: "Title" },
    { key: "year", label: "Year" },
    { 
      key: "examId", 
      label: "Exam", 
      render: (p: AdminPYQPaper) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
          {exams.find(e => e.id === p.examId)?.shortName || p.examId}
        </span>
      )
    },
    { key: "totalQs", label: "Questions" },
    { key: "type", label: "Type" },
    { key: "tierRequired", label: "Tier", render: (p: AdminPYQPaper) => `Tier ${p.tierRequired}` },
    {
      key: "isActive", label: "Active",
      render: (p: AdminPYQPaper) => <span style={{ color: p.isActive ? "var(--green)" : "var(--red)" }}>{p.isActive ? "Yes" : "No"}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setForm(empty()); setQuestions([]); setModal("create"); }} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue)" }}>
          + Add PYQ Paper
        </button>
      </div>

      <AdminTable columns={cols} data={data?.items ?? []} loading={loading}
        onEdit={(p) => { setForm({ ...p }); setQuestions([]); setModal("edit"); }}
        onDelete={handleDelete}
      />
      <Pagination page={page} total={data?.total ?? 0} limit={20} onChange={setPage} />

      {modal && (
        <Modal title={modal === "create" ? "Add PYQ Paper" : `Edit — ${form.title}`} onClose={() => setModal(null)}>
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            
            {/* Bulk Upload Section */}
            {modal === "create" && (
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Bulk Upload Questions</h3>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">JSON / EXCEL</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Upload Questions File
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json,.xlsx,.xls" className="hidden" />
                </div>

                {fileError && <p className="text-[10px] text-red-500 font-medium">{fileError}</p>}
                
                {questions.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      {questions.length} questions loaded from file
                    </p>
                    <button onClick={() => setQuestions([])} className="ml-auto text-emerald-600 hover:text-emerald-800">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SelectField label="Exam" name="examId" value={form.examId ?? ""} onChange={(v) => set("examId", v)}
                  options={exams.map((e) => ({ value: e.id, label: e.name }))} required />
                <Field label="Title" name="title" value={form.title ?? ""} onChange={(v) => set("title", v)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Year" name="year" type="number" value={form.year ?? ""} onChange={(v) => set("year", parseInt(v))} required />
                <Field label="Shift" name="shift" value={form.shift ?? ""} onChange={(v) => set("shift", v)} placeholder="Morning / Evening" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Total Questions" name="totalQs" type="number" value={form.totalQs ?? 0} onChange={(v) => set("totalQs", parseInt(v))} />
                <Field label="Duration (min)" name="durationMin" type="number" value={form.durationMin ?? 0} onChange={(v) => set("durationMin", parseInt(v))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Type" name="type" value={form.type ?? "OBJECTIVE"}
                  onChange={(v) => set("type", v)}
                  options={["OBJECTIVE", "SUBJECTIVE", "MIXED"].map((t) => ({ value: t, label: t }))} />
                <SelectField label="Tier Required" name="tierRequired" value={String(form.tierRequired ?? 0)}
                  onChange={(v) => set("tierRequired", parseInt(v))}
                  options={[0, 1, 2, 3].map((n) => ({ value: n, label: n === 0 ? "Free" : `Tier ${n}` }))} />
              </div>

              <Field label="PDF URL (Optional)" name="pdfUrl" value={form.pdfUrl ?? ""} onChange={(v) => set("pdfUrl", v)} placeholder="https://..." />

              <div className="grid grid-cols-2 gap-3">
                <Toggle label="Has Solutions" checked={form.hasSolutions ?? false} onChange={(v) => set("hasSolutions", v)} />
                <Toggle label="Active" checked={form.isActive ?? true} onChange={(v) => set("isActive", v)} />
              </div>

              {/* Preview Section */}
              {questions.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Question Preview (First 3)</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Total: {questions.length}</span>
                  </div>
                  <div className="space-y-2 border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
                    {questions.slice(0, 3).map((q, i) => (
                      <div key={i} className="p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <div className="flex gap-3">
                          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{i + 1}</span>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-800 leading-relaxed">{q.question || q.text}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {['a', 'b', 'c', 'd'].map(opt => (
                                <p key={opt} className={`text-[10px] ${q.answer?.toLowerCase() === opt ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                                  {opt.toUpperCase()}: {q[`option_${opt}`] || q.options?.[['a','b','c','d'].indexOf(opt)]}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {questions.length > 3 && (
                      <div className="p-2 bg-slate-50 text-center">
                        <p className="text-[10px] text-slate-400 font-medium italic">... and {questions.length - 3} more questions</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 sticky bottom-0 bg-white pb-2 border-t border-slate-50">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]" 
                  style={{ background: "var(--blue)" }}
                >
                  {saving ? "Saving…" : questions.length > 0 ? `Save Paper + ${questions.length} Questions` : "Save Paper"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setModal(null)} 
                  className="flex-1 py-3 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
