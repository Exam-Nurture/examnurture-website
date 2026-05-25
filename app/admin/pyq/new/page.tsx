"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  apiAdminCreatePYQ, apiAdminCreatePYQBulk,
  apiAdminGetExams, AdminPYQPaper, AdminExam,
} from "@/lib/api";
import { Field, SelectField, Toggle } from "@/components/admin/AdminTable";

type Question = {
  question?: string;
  text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  answer?: string | number;
  explanation?: string;
  subject?: string;
  options?: string[];
  [key: string]: unknown;
};

const empty = (): Partial<AdminPYQPaper> => ({
  examId: "", title: "", year: new Date().getFullYear(), shift: "",
  totalQs: 0, durationMin: 0, pdfUrl: "", type: "OBJECTIVE",
  hasSolutions: false, isActive: true,
});

const JSON_SAMPLE = `[
  {
    "question": "What is the capital of India?",
    "option_a": "Mumbai",
    "option_b": "New Delhi",
    "option_c": "Kolkata",
    "option_d": "Chennai",
    "answer": "b",
    "explanation": "New Delhi became India's capital in 1911.",
    "subject": "Geography"
  }
]`;

const EXCEL_COLS = [
  { col: "question",    desc: "Full question text",              req: true  },
  { col: "option_a",   desc: "Option A text",                   req: true  },
  { col: "option_b",   desc: "Option B text",                   req: true  },
  { col: "option_c",   desc: "Option C text",                   req: true  },
  { col: "option_d",   desc: "Option D text",                   req: true  },
  { col: "answer",     desc: "Correct option letter: a/b/c/d",  req: true  },
  { col: "explanation",desc: "Explanation for the answer",       req: false },
  { col: "subject",    desc: "Subject or topic category",        req: false },
];

const TIPS = [
  'The "answer" field must be exactly: a, b, c, or d (lowercase)',
  "Total Questions count is auto-filled from the uploaded file",
  "Explanation and subject are optional but improve student experience",
  "Use UTF-8 encoding for Hindi or regional language text",
];

const PER_PAGE = 10;

export default function NewPYQPage() {
  const router = useRouter();
  const [exams, setExams]       = useState<AdminExam[]>([]);
  const [form, setForm]         = useState<Partial<AdminPYQPaper>>(empty());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [formatTab, setFormatTab] = useState<"json" | "excel">("json");
  const [previewPage, setPreviewPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiAdminGetExams({ page: 1, limit: 200 }).then((r) => setExams(r.items));
  }, []);

  function setField(key: keyof AdminPYQPaper, val: unknown) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    setPreviewPage(0);
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith(".json")) {
        const text = await file.text();
        const json = JSON.parse(text) as unknown;
        if (!Array.isArray(json)) {
          setFileError("JSON must be an array of question objects.");
          return;
        }
        setQuestions(json as Question[]);
        setField("totalQs", json.length);
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const wb = XLSX.read(evt.target?.result, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Question>(ws);
          setQuestions(rows);
          setField("totalQs", rows.length);
        };
        reader.readAsBinaryString(file);
      } else {
        setFileError("Unsupported format. Please use .json or .xlsx");
      }
    } catch {
      setFileError("Failed to parse file — check the format and try again.");
    }
    e.target.value = "";
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        year:        Number(form.year),
        totalQs:     Number(form.totalQs),
        durationMin: Number(form.durationMin),
      };
      if (questions.length > 0) {
        await apiAdminCreatePYQBulk({ paper: payload, questions: questions as Record<string, unknown>[] });
      } else {
        await apiAdminCreatePYQ(payload);
      }
      router.push("/admin/pyq");
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const totalPages   = Math.ceil(questions.length / PER_PAGE);
  const pageSlice    = questions.slice(previewPage * PER_PAGE, (previewPage + 1) * PER_PAGE);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/admin/pyq"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: "var(--ink-3)", background: "var(--card)", border: "1px solid var(--line)" }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          PYQ Papers
        </Link>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--ink-4)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-xs font-semibold" style={{ color: "var(--ink-2)" }}>New PYQ Paper</span>
      </div>

      <form onSubmit={handleSave}>
        <div className="flex gap-6 items-start">

          {/* ── LEFT: Form ── */}
          <div className="w-[460px] flex-shrink-0 space-y-4">

            {/* Upload zone */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>Upload Questions</p>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>
                  Optional
                </span>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2.5"
                style={{
                  borderColor: questions.length > 0 ? "var(--green)" : "var(--line)",
                  background:  questions.length > 0 ? "var(--green-soft)" : "var(--bg)",
                }}
              >
                {questions.length > 0 ? (
                  <>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--green)" }}>
                      <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold" style={{ color: "var(--green)" }}>{questions.length} questions loaded</p>
                    <p className="text-xs" style={{ color: "var(--ink-3)" }}>Click to replace with another file</p>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ color: "var(--ink-3)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>Click to upload questions file</p>
                    <p className="text-xs" style={{ color: "var(--ink-4)" }}>.json &nbsp;·&nbsp; .xlsx &nbsp;·&nbsp; .xls</p>
                  </>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept=".json,.xlsx,.xls" onChange={handleFile} className="hidden" />
              {fileError && <p className="text-xs font-medium" style={{ color: "var(--red)" }}>{fileError}</p>}
            </div>

            {/* Paper details */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>Paper Details</p>

              <SelectField
                label="Exam" name="examId" value={form.examId ?? ""}
                onChange={(v) => setField("examId", v)}
                options={exams.map((e) => ({ value: e.id, label: e.name }))}
                required
              />
              <Field
                label="Title" name="title" value={form.title ?? ""}
                onChange={(v) => setField("title", v)}
                required placeholder="e.g. JPSC Prelims 2024 Morning Shift"
              />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Year" name="year" type="number" value={form.year ?? ""} onChange={(v) => setField("year", parseInt(v))} required />
                <Field label="Shift" name="shift" value={form.shift ?? ""} onChange={(v) => setField("shift", v)} placeholder="Morning / Evening" />
                <Field label="Total Questions" name="totalQs" type="number" value={form.totalQs ?? 0} onChange={(v) => setField("totalQs", parseInt(v))} />
                <Field label="Duration (min)" name="durationMin" type="number" value={form.durationMin ?? 0} onChange={(v) => setField("durationMin", parseInt(v))} />
                <SelectField
                  label="Type" name="type" value={form.type ?? "OBJECTIVE"}
                  onChange={(v) => setField("type", v)}
                  options={["OBJECTIVE", "SUBJECTIVE", "MIXED"].map((t) => ({ value: t, label: t }))}
                />
              </div>

              <Field label="PDF URL (Optional)" name="pdfUrl" value={form.pdfUrl ?? ""} onChange={(v) => setField("pdfUrl", v)} placeholder="https://..." />

              <div className="flex gap-6 pt-1">
                <Toggle label="Has Solutions" checked={form.hasSolutions ?? false} onChange={(v) => setField("hasSolutions", v)} />
                <Toggle label="Active" checked={form.isActive ?? true} onChange={(v) => setField("isActive", v)} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !form.examId || !form.title}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all active:scale-[0.98]"
                style={{ background: "var(--blue)" }}
              >
                {saving ? "Saving…" : questions.length > 0 ? `Save Paper + ${questions.length} Questions` : "Save Paper"}
              </button>
              <Link
                href="/admin/pyq"
                className="px-5 py-3 rounded-xl text-sm font-bold flex items-center"
                style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* ── RIGHT: Format guide OR question preview ── */}
          <div className="flex-1 min-w-0 sticky top-[60px]" style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
            {questions.length === 0 ? (

              /* ── Format guide ── */
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
                {/* Header */}
                <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>File Format Guide</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
                    Upload a file in one of these formats to bulk-import questions
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b" style={{ borderColor: "var(--line)" }}>
                  {(["json", "excel"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFormatTab(tab)}
                      className="flex-1 py-2.5 text-xs font-semibold transition-colors"
                      style={{
                        color:        formatTab === tab ? "var(--blue)" : "var(--ink-3)",
                        borderBottom: formatTab === tab ? "2px solid var(--blue)" : "2px solid transparent",
                        background:   "transparent",
                        marginBottom: "-1px",
                      }}
                    >
                      {tab === "json" ? "JSON Format" : "Excel Format"}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-5">
                  {formatTab === "json" ? (
                    <>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
                        Upload a <strong style={{ color: "var(--ink-1)" }}>.json</strong> file containing an array of question objects.
                        Each object must have the required fields shown below.
                      </p>

                      {/* Code block */}
                      <div className="rounded-xl overflow-hidden">
                        <div
                          className="flex items-center justify-between px-4 py-2.5"
                          style={{ background: "#1E2535", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                        >
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
                            questions.json
                          </span>
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Array of objects</span>
                        </div>
                        <pre
                          className="px-5 py-4 text-[12px] font-mono leading-relaxed overflow-x-auto"
                          style={{ background: "#0F172A", color: "#94d3ac" }}
                        >
                          <code>{JSON_SAMPLE}</code>
                        </pre>
                      </div>

                      {/* Field reference */}
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--ink-3)" }}>Field Reference</p>
                        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
                          {EXCEL_COLS.map((c, i) => (
                            <div
                              key={c.col}
                              className="flex items-center gap-3 px-4 py-2.5"
                              style={{ borderTop: i > 0 ? "1px solid var(--line-soft)" : "none", background: "var(--card)" }}
                            >
                              <code className="text-[11px] font-mono font-bold w-28 flex-shrink-0" style={{ color: "var(--blue)" }}>{c.col}</code>
                              <span className="flex-1 text-xs" style={{ color: "var(--ink-2)" }}>{c.desc}</span>
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{
                                  background: c.req ? "var(--red-soft)" : "var(--bg)",
                                  color:      c.req ? "var(--red)"      : "var(--ink-4)",
                                }}
                              >
                                {c.req ? "Required" : "Optional"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
                        Upload a <strong style={{ color: "var(--ink-1)" }}>.xlsx</strong> file where the <strong style={{ color: "var(--ink-1)" }}>first row is the header</strong> with
                        these exact column names. Each subsequent row is one question.
                      </p>

                      {/* Excel column table */}
                      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
                              {["Column Name", "Description", ""].map((h) => (
                                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {EXCEL_COLS.map((c, i) => (
                              <tr key={c.col} style={{ borderTop: i > 0 ? "1px solid var(--line-soft)" : "none", background: "var(--card)" }}>
                                <td className="px-3 py-2.5">
                                  <code className="text-[11px] font-mono font-bold" style={{ color: "var(--blue)" }}>{c.col}</code>
                                </td>
                                <td className="px-3 py-2.5" style={{ color: "var(--ink-2)" }}>{c.desc}</td>
                                <td className="px-3 py-2.5">
                                  <span
                                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                    style={{
                                      background: c.req ? "var(--red-soft)" : "var(--bg)",
                                      color:      c.req ? "var(--red)"      : "var(--ink-4)",
                                    }}
                                  >
                                    {c.req ? "Required" : "Optional"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Sample row preview */}
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--ink-3)" }}>Sample Row</p>
                        <div className="rounded-xl p-3 overflow-x-auto" style={{ background: "#0F172A" }}>
                          <table className="text-[10px] font-mono whitespace-nowrap">
                            <thead>
                              <tr style={{ color: "rgba(255,255,255,0.4)" }}>
                                {EXCEL_COLS.map((c) => (
                                  <th key={c.col} className="px-2 py-1 text-left font-semibold">{c.col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ color: "#94d3ac" }}>
                                <td className="px-2 py-1">What is the capital…</td>
                                <td className="px-2 py-1">Mumbai</td>
                                <td className="px-2 py-1">New Delhi</td>
                                <td className="px-2 py-1">Kolkata</td>
                                <td className="px-2 py-1">Chennai</td>
                                <td className="px-2 py-1">b</td>
                                <td className="px-2 py-1" style={{ color: "rgba(255,255,255,0.3)" }}>New Delhi became…</td>
                                <td className="px-2 py-1" style={{ color: "rgba(255,255,255,0.3)" }}>Geography</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Tips box */}
                  <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--amber-soft)", border: "1px solid var(--amber)" }}>
                    <p className="text-xs font-bold" style={{ color: "var(--amber)" }}>Tips before uploading</p>
                    <ul className="space-y-2">
                      {TIPS.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: "var(--ink-2)" }}>
                          <span
                            className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-px"
                            style={{ background: "var(--amber)", color: "white" }}
                          >
                            {i + 1}
                          </span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            ) : (

              /* ── Question Preview ── */
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
                {/* Preview header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>Question Preview</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
                      {previewPage * PER_PAGE + 1}–{Math.min((previewPage + 1) * PER_PAGE, questions.length)} of {questions.length} questions
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setQuestions([]); setPreviewPage(0); setField("totalQs", 0); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "var(--red-soft)", color: "var(--red)" }}
                  >
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                </div>

                {/* Question list */}
                <div>
                  {pageSlice.map((q, i) => {
                    const idx = previewPage * PER_PAGE + i;
                    const ans = String(q.answer ?? "").toLowerCase();
                    return (
                      <div key={idx} className="p-4 space-y-3" style={{ borderBottom: "1px solid var(--line-soft)" }}>
                        {/* Question */}
                        <div className="flex items-start gap-3">
                          <span
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
                          >
                            {idx + 1}
                          </span>
                          <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--ink-1)" }}>
                            {String(q.question || q.text || "—")}
                          </p>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-1.5 pl-9">
                          {(["a", "b", "c", "d"] as const).map((opt) => {
                            const text    = String(q[`option_${opt}`] ?? (Array.isArray(q.options) ? q.options[["a","b","c","d"].indexOf(opt)] : "") ?? "");
                            const correct = ans === opt;
                            return (
                              <div
                                key={opt}
                                className="flex items-start gap-2 px-2.5 py-2 rounded-lg text-xs"
                                style={{
                                  background:  correct ? "var(--green-soft)" : "var(--bg)",
                                  border:      `1px solid ${correct ? "var(--green)" : "var(--line-soft)"}`,
                                  color:       correct ? "var(--green)"       : "var(--ink-2)",
                                  fontWeight:  correct ? 600                  : 400,
                                }}
                              >
                                <span className="font-bold uppercase flex-shrink-0" style={{ opacity: 0.6 }}>{opt}.</span>
                                <span>{text}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div
                            className="ml-9 px-3 py-2 rounded-lg text-xs leading-relaxed"
                            style={{ background: "var(--blue-soft)", border: "1px solid var(--line-soft)", color: "var(--ink-2)" }}
                          >
                            <span className="font-semibold mr-1" style={{ color: "var(--blue)" }}>Explanation:</span>
                            {String(q.explanation)}
                          </div>
                        )}

                        {/* Subject tag */}
                        {q.subject && (
                          <div className="ml-9">
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded"
                              style={{ background: "var(--violet-soft)", color: "var(--violet)" }}
                            >
                              {String(q.subject)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}
                  >
                    <button
                      type="button"
                      disabled={previewPage === 0}
                      onClick={() => setPreviewPage((p) => p - 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
                      style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink-2)" }}
                    >
                      ← Prev
                    </button>
                    <span className="text-xs" style={{ color: "var(--ink-3)" }}>
                      Page {previewPage + 1} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={previewPage >= totalPages - 1}
                      onClick={() => setPreviewPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
                      style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink-2)" }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>

            )}
          </div>
        </div>
      </form>
    </div>
  );
}
