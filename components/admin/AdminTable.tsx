"use client";

import { ReactNode } from "react";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  width?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  keyField?: keyof T;
}

export function AdminTable<T>({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
  keyField = "id" as keyof T,
}: AdminTableProps<T>) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: "var(--line)", borderTopColor: "var(--blue)" }} />
        <p className="text-xs" style={{ color: "var(--ink-4)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow)", border: "1px solid var(--line)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--ink-3)", width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-16 text-center" style={{ background: "var(--card)" }}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--bg)" }}>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--ink-4)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>No records found</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--ink-4)" }}>Add one using the button above</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={String((row as Record<string, unknown>)[String(keyField)] ?? i)}
                  className="border-b last:border-0 transition-colors group"
                  style={{ borderColor: "var(--line)", background: "var(--card)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--card)")}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm" style={{ color: "var(--ink-1)" }}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
                            style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
                            style={{ background: "var(--red-soft)", color: "var(--red)" }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;

  return (
    <div className="flex items-center gap-2 justify-end mt-3">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
        style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line)" }}
      >
        Prev
      </button>
      <span className="text-xs" style={{ color: "var(--ink-3)" }}>
        {page} / {pages} ({total} total)
      </span>
      <button
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
        style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line)" }}
      >
        Next
      </button>
    </div>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ title, onClose, children, wide }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] flex flex-col rounded-2xl overflow-hidden`} style={{ background: "var(--card)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--line)" }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--line)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "var(--ink-3)", background: "var(--bg)" }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

export function Field({ label, name, value, onChange, type = "text", required, placeholder }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--ink-2)" }}>
        {label}{required && <span style={{ color: "var(--red)" }}> *</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
        style={{ border: "1.5px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }}
        onFocus={(e) => { e.target.style.borderColor = "var(--blue)"; e.target.style.background = "var(--card)"; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--line)"; e.target.style.background = "var(--bg)"; }}
      />
    </div>
  );
}

export function SelectField({ label, name, value, onChange, options, required }: {
  label: string; name: string; value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--ink-2)" }}>
        {label}{required && <span style={{ color: "var(--red)" }}> *</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
        style={{ border: "1.5px solid var(--line)", background: "var(--bg)", color: "var(--ink-1)" }}
        onFocus={(e) => (e.target.style.borderColor = "var(--blue)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className="relative w-9 h-5 rounded-full transition-colors"
        style={{ background: checked ? "var(--blue)" : "var(--line)" }}
        onClick={() => onChange(!checked)}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color: "var(--ink-2)" }}>{label}</span>
    </label>
  );
}
