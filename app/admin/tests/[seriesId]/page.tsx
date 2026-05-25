"use client";

import { useEffect, useRef, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  apiAdminGetTests, apiAdminCreateTest, apiAdminUpdateTest, apiAdminDeleteTest,
  apiAdminBulkUploadQuestions, apiAdminGetTestSeries, apiAdminExportTest,
  AdminTest, AdminTestSeries,
} from "@/lib/api";
import { AdminTable, Pagination, Modal, Field, SelectField, Toggle } from "@/components/admin/AdminTable";

// ─── MCQ Row type ─────────────────────────────────────────────────────────────
type MCQRow = {
  question: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  answer?: string; difficulty?: string;
  subject_superset?: string; subject?: string; chapter?: string; topic?: string;
  question_hindi?: string;
  option_a_hindi?: string; option_b_hindi?: string; option_c_hindi?: string; option_d_hindi?: string;
  explanation?: string; explanation_hindi?: string;
  year?: number;
};

const REQUIRED = ["question", "option_a", "option_b", "option_c", "option_d"] as const;

function validateRows(rows: MCQRow[]): string | null {
  if (!rows.length) return "No questions found.";
  for (const col of REQUIRED) {
    if (!rows[0][col]) return `Missing required column: "${col}"`;
  }
  return null;
}

// ─── Question Upload Modal ────────────────────────────────────────────────────
function UploadQuestionsModal({ test, onClose, onSuccess }: {
  test: AdminTest;
  onClose: () => void;
  onSuccess: (count: number) => void;
}) {
  const [jsonText, setJsonText] = useState("");
  const [rows, setRows] = useState<MCQRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<"input" | "preview" | "done">("input");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function parseJSON(raw: string) {
    setParseError(null);
    try {
      const parsed = JSON.parse(raw);
      const arr: MCQRow[] = Array.isArray(parsed)
        ? parsed
        : parsed.questions || parsed.data || [parsed];
      const err = validateRows(arr);
      if (err) { setParseError(err); return; }
      setRows(arr);
      setStep("preview");
    } catch {
      setParseError("Invalid JSON. Please paste a valid JSON array of question objects.");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    
    if (ext === "json") {
      const text = await file.text();
      setJsonText(text);
      parseJSON(text);
    } else if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json<MCQRow>(worksheet, { defval: "" });
      
      const err = validateRows(data);
      if (err) {
        setParseError(`Excel Error: ${err}`);
        return;
      }
      setRows(data);
      setStep("preview");
    } else {
      setParseError("Only .json, .xlsx, .xls, and .csv files are supported.");
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    setUploading(true);
    try {
      const result = await apiAdminBulkUploadQuestions(test.id, rows as unknown as Record<string, unknown>[]);
      onSuccess(result.added);
      setStep("done");
    } catch (err: any) {
      setParseError(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Difficulty distribution
  const diffCounts = rows.reduce((acc, r) => {
    const d = (r.difficulty || "medium").toLowerCase();
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Modal title={`Upload Questions → ${test.title}`} onClose={onClose} wide>
      {step === "input" && (
        <div className="space-y-4">
          <div className="text-sm" style={{ color: "var(--ink-2)" }}>
            Accepts <strong>JSON or Excel (.xlsx)</strong> with columns:
            <code className="ml-1 text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg)", color: "var(--blue)" }}>
              question, option_a, option_b, option_c, option_d
            </code>{" "}
            + optional: <code className="text-xs px-1 py-0.5 rounded" style={{ background: "var(--bg)" }}>answer, difficulty, subject, chapter, topic, explanation</code>
          </div>

          {/* File drop */}
          <label
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-colors py-8"
            style={{ borderColor: "var(--line)" }}
          >
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--ink-3)" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>Drop JSON/Excel file or click to browse</span>
            <input ref={fileInputRef} type="file" accept=".json,.xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          </label>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t" style={{ borderColor: "var(--line)" }} />
            <span className="text-xs" style={{ color: "var(--ink-3)" }}>OR paste JSON</span>
            <div className="flex-1 border-t" style={{ borderColor: "var(--line)" }} />
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none"
            style={{ border: "1.5px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }}
            placeholder='[{"question":"What is...","option_a":"A","option_b":"B","option_c":"C","option_d":"D","answer":"a","difficulty":"easy"}]'
          />

          {parseError && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
              {parseError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => parseJSON(jsonText)}
              disabled={!jsonText.trim()}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--blue)" }}
            >
              Validate JSON Text
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Questions", value: rows.length, color: "var(--blue)" },
              { label: "Easy / Med / Hard", value: `${diffCounts.easy || 0} / ${diffCounts.medium || 0} / ${diffCounts.hard || 0}`, color: "var(--green)" },
              { label: "With Subjects", value: rows.filter(r => r.subject_superset || r.subject).length, color: "var(--amber)" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--bg)", border: "1px solid var(--line)" }}>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            <div className="px-3 py-2 text-xs font-semibold flex justify-between" style={{ background: "var(--bg)", color: "var(--ink-2)", borderBottom: "1px solid var(--line)" }}>
              <span>Preview (first {Math.min(5, rows.length)} of {rows.length} questions)</span>
              <span>Matched Structure</span>
            </div>
            <div className="divide-y max-h-[300px] overflow-y-auto" style={{ borderColor: "var(--line)" }}>
              {rows.slice(0, 5).map((r, i) => (
                <div key={i} className="px-3 py-2 text-xs space-y-1">
                  <p className="font-medium" style={{ color: "var(--ink-1)" }}>{i + 1}. {String(r.question).slice(0, 80)}{String(r.question).length > 80 ? "…" : ""}</p>
                  <div className="flex gap-2 flex-wrap">
                    {(["a", "b", "c", "d"] as const).map((opt) => (
                      <span
                        key={opt}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                        style={{
                          background: String(r.answer)?.toLowerCase() === opt ? "var(--green-soft)" : "var(--bg)",
                          color: String(r.answer)?.toLowerCase() === opt ? "var(--green)" : "var(--ink-3)",
                          border: "1px solid var(--line)",
                        }}
                      >
                        {opt.toUpperCase()}: {String(r[`option_${opt}`] || "").slice(0, 30)}
                      </span>
                    ))}
                    {r.difficulty && (
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>
                        {r.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {parseError && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
              {parseError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "var(--green)" }}
            >
              {uploading ? `Uploading ${rows.length} questions…` : `Upload ${rows.length} Questions`}
            </button>
            <button onClick={() => setStep("input")} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}>
              Back
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-8 space-y-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--green-soft)" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--green)" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-lg font-bold" style={{ color: "var(--ink-1)" }}>Questions uploaded!</p>
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>{rows.length} MCQs added to <strong>{test.title}</strong></p>
          <button onClick={onClose} className="mt-4 px-6 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue)" }}>
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}

// ─── Test Create/Edit Modal ───────────────────────────────────────────────────
const emptyTest = (seriesId = ""): Partial<AdminTest> => ({
  seriesId, title: "", description: "", testType: "OBJECTIVE",
  subjects: "", durationSec: 3600, totalMarks: 100, negMarks: 0.25,
  isLocked: false, isActive: true,
});

export default function AdminSeriesTestsPage() {
  const params = useParams();
  const seriesId = params.seriesId as string;
  const router = useRouter();
  
  const [data, setData] = useState<{ items: AdminTest[]; total: number } | null>(null);
  const [seriesInfo, setSeriesInfo] = useState<AdminTestSeries | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [uploadTarget, setUploadTarget] = useState<AdminTest | null>(null);
  const [form, setForm] = useState<Partial<AdminTest>>(emptyTest(seriesId));
  const [saving, setSaving] = useState(false);

  async function load(p = page) {
    setLoading(true);
    try {
      const [tests, ser] = await Promise.all([
        apiAdminGetTests({ page: p, seriesId }),
        apiAdminGetTestSeries({ page: 1, limit: 1000 }), // We'll find ours
      ]);
      setData(tests);
      const found = ser.items.find(s => s.id === seriesId);
      if (found) setSeriesInfo(found);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page, seriesId]);

  function set(key: keyof AdminTest, val: unknown) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        seriesId: seriesId, // force it
        durationSec: Number(form.durationSec),
        totalMarks: Number(form.totalMarks),
        negMarks: Number(form.negMarks),
      };
      if (modal === "create") await apiAdminCreateTest(payload);
      else await apiAdminUpdateTest(form.id!, payload);
      setModal(null);
      load();
    } finally { setSaving(false); }
  }

  async function handleDelete(t: AdminTest) {
    if (!confirm(`Delete test "${t.title}"?`)) return;
    await apiAdminDeleteTest(t.id);
    load();
  }

  const cols = [
    { key: "title", label: "Title" },
    { key: "testType", label: "Type", render: (t: AdminTest) => <span className="text-xs">{t.testType}</span> },
    { key: "durationSec", label: "Duration", render: (t: AdminTest) => `${Math.round(t.durationSec / 60)} min` },
    { key: "totalMarks", label: "Marks" },
    {
      key: "isActive", label: "Active",
      render: (t: AdminTest) => <span style={{ color: t.isActive ? "var(--green)" : "var(--red)" }}>{t.isActive ? "Yes" : "No"}</span>,
    },
    {
      key: "upload", label: "Questions",
      render: (t: AdminTest) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={(e) => { e.stopPropagation(); setUploadTarget(t); }}
            className="px-2 py-0.5 rounded text-[10px] font-semibold text-white flex items-center gap-1"
            style={{ background: "var(--blue)" }}
          >
            ↑ Upload
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const blob = await apiAdminExportTest(t.id, "json");
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `${t.title.replace(/\s+/g, "_")}_questions.json`; a.click();
                URL.revokeObjectURL(url);
              } catch { alert("Export failed"); }
            }}
            className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"
            style={{ background: "var(--green-soft)", color: "var(--green)" }}
          >
            ↓ JSON
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const blob = await apiAdminExportTest(t.id, "zip");
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `${t.title.replace(/\s+/g, "_")}_questions.zip`; a.click();
                URL.revokeObjectURL(url);
              } catch { alert("Export failed"); }
            }}
            className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"
            style={{ background: "var(--amber-soft)", color: "var(--amber)" }}
          >
            ↓ ZIP
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center pb-2 border-b" style={{ borderColor: "var(--line)" }}>
        <Link href="/admin/tests" className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--ink-1)" }}>
            {seriesInfo ? seriesInfo.title : "Loading Series..."}
          </h1>
          <p className="text-xs" style={{ color: "var(--ink-3)" }}>Manage tests for this series</p>
        </div>
        
        <button
          onClick={() => { setForm(emptyTest(seriesId)); setModal("create"); }}
          className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--blue)" }}
        >
          + Add Test
        </button>
      </div>

      <AdminTable columns={cols} data={data?.items ?? []} loading={loading}
        onEdit={(t) => { setForm({ ...t }); setModal("edit"); }}
        onDelete={handleDelete}
      />
      <Pagination page={page} total={data?.total ?? 0} limit={20} onChange={setPage} />

      {modal && (
        <Modal title={modal === "create" ? "Add Test" : `Edit — ${form.title}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            <Field label="Title" name="title" value={form.title ?? ""} onChange={(v) => set("title", v)} required placeholder="e.g. Full Test #1" />
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
            <SelectField
              label="Test Type"
              name="testType"
              value={form.testType ?? "OBJECTIVE"}
              onChange={(v) => set("testType", v)}
              options={[
                { value: "OBJECTIVE", label: "Objective (MCQ)" },
                { value: "SUBJECTIVE", label: "Subjective (Written)" },
                { value: "MIXED", label: "Mixed" },
              ]}
            />
            <Field
              label="Subjects (comma-separated, e.g. GK, Reasoning)"
              name="subjects"
              value={form.subjects ?? ""}
              onChange={(v) => set("subjects", v)}
              placeholder="GK, Reasoning, Math"
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration (minutes)" name="durationSec" type="number"
                value={Math.round((form.durationSec ?? 3600) / 60)}
                onChange={(v) => set("durationSec", parseInt(v) * 60)} />
              <Field label="Total Marks" name="totalMarks" type="number"
                value={form.totalMarks ?? 100}
                onChange={(v) => set("totalMarks", parseInt(v))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Negative Marks (per wrong)" name="negMarks" type="number"
                value={form.negMarks ?? 0.25}
                onChange={(v) => set("negMarks", parseFloat(v))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Toggle label="Locked (Premium)" checked={form.isLocked ?? false} onChange={(v) => set("isLocked", v)} />
              <Toggle label="Active" checked={form.isActive ?? true} onChange={(v) => set("isActive", v)} />
            </div>
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

      {uploadTarget && (
        <UploadQuestionsModal
          test={uploadTarget}
          onClose={() => { setUploadTarget(null); load(); }}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
