"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, X, Check, Loader2 } from "lucide-react";
import {
  apiAdminGetTierDefinitions,
  apiAdminCreateTierDefinition,
  apiAdminUpdateTierDefinition,
  apiAdminDeleteTierDefinition,
  apiAdminGetTierContents,
  apiAdminAddTierContent,
  apiAdminRemoveTierContent,
  apiAdminGetTestSeries,
  apiAdminGetPYQ,
  apiAdminGetStudyMaterials,
  apiAdminGetMentorship,
  type TierDefinition,
  type TierContent,
  type ContentType,
} from "@/lib/api";

// ── Content type display config ───────────────────────────────────────────────

const CONTENT_TYPES: { value: ContentType; label: string; color: string }[] = [
  { value: "TEST_SERIES", label: "Test Series", color: "#4F7BF7" },
  { value: "PYQ", label: "PYQ Papers", color: "#7C3AED" },
  { value: "STUDY_MATERIAL", label: "Study Material", color: "#0D9488" },
  { value: "MENTORSHIP", label: "Mentorship", color: "#F59E0B" },
  { value: "COURSE", label: "Course", color: "#EF4444" },
];

function contentTypeColor(ct: string) {
  return CONTENT_TYPES.find((c) => c.value === ct)?.color ?? "#888";
}
function contentTypeLabel(ct: string) {
  return CONTENT_TYPES.find((c) => c.value === ct)?.label ?? ct;
}

// ── Tier form (create / edit) ─────────────────────────────────────────────────

interface TierFormValues {
  name: string;
  eligibility: string;
  description: string;
  monthlyPaise: number;
  yearlyPaise: number;
  isActive: boolean;
}

const EMPTY_FORM: TierFormValues = {
  name: "",
  eligibility: "",
  description: "",
  monthlyPaise: 0,
  yearlyPaise: 0,
  isActive: true,
};

function TierForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: TierFormValues;
  onSave: (v: TierFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [v, setV] = useState<TierFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (key: keyof TierFormValues, val: unknown) =>
    setV((prev) => ({ ...prev, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.name.trim()) { setErr("Name is required"); return; }
    setSaving(true);
    setErr("");
    try {
      await onSave(v);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-2)" }}>
            Tier Name *
          </label>
          <input
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Tier 1 — 10th Pass"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-1)" }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-2)" }}>
            Eligibility
          </label>
          <input
            value={v.eligibility}
            onChange={(e) => set("eligibility", e.target.value)}
            placeholder="e.g. 10th Pass"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-1)" }}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-2)" }}>
          Description
        </label>
        <textarea
          value={v.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="What does this tier include?"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
          style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-1)" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-2)" }}>
            Monthly Price (₹)
          </label>
          <input
            type="number"
            min={0}
            value={v.monthlyPaise / 100}
            onChange={(e) => set("monthlyPaise", Math.round(parseFloat(e.target.value || "0") * 100))}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-1)" }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-2)" }}>
            Yearly Price (₹)
          </label>
          <input
            type="number"
            min={0}
            value={v.yearlyPaise / 100}
            onChange={(e) => set("yearlyPaise", Math.round(parseFloat(e.target.value || "0") * 100))}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink-1)" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={v.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="w-4 h-4 accent-[var(--blue)]"
        />
        <label htmlFor="isActive" className="text-sm" style={{ color: "var(--ink-2)" }}>
          Active (visible to students)
        </label>
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--blue)" }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Save Tier
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--bg)", color: "var(--ink-2)", border: "1px solid var(--line)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Content picker ────────────────────────────────────────────────────────────

interface ContentOption { id: string; label: string }

function ContentPicker({
  tierId,
  existingIds,
  onAdd,
}: {
  tierId: number;
  existingIds: Set<string>;
  onAdd: (type: ContentType, id: string) => Promise<void>;
}) {
  const [selectedType, setSelectedType] = useState<ContentType>("TEST_SERIES");
  const [options, setOptions] = useState<ContentOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");

  const loadOptions = useCallback(async (type: ContentType) => {
    setLoadingOptions(true);
    setSelectedId("");
    setOptions([]);
    try {
      let items: ContentOption[] = [];
      if (type === "TEST_SERIES") {
        const res = await apiAdminGetTestSeries({ limit: 100 });
        items = res.items.map((i: { id: string; title: string }) => ({ id: i.id, label: i.title }));
      } else if (type === "PYQ") {
        const res = await apiAdminGetPYQ({ limit: 100 } as Parameters<typeof apiAdminGetPYQ>[0]);
        items = res.items.map((i: { id: string; title: string; year: number }) => ({ id: i.id, label: `${i.title} (${i.year})` }));
      } else if (type === "STUDY_MATERIAL") {
        const res = await apiAdminGetStudyMaterials({ limit: 100 } as Parameters<typeof apiAdminGetStudyMaterials>[0]);
        items = res.items.map((i: { id: string; title: string; subject: string }) => ({ id: i.id, label: `${i.title} — ${i.subject}` }));
      } else if (type === "MENTORSHIP") {
        const res = await apiAdminGetMentorship({ limit: 100 });
        items = res.items.map((i: { id: string; title: string; mentorName: string }) => ({ id: i.id, label: `${i.title} (${i.mentorName})` }));
      }
      setOptions(items);
    } catch {
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    loadOptions(selectedType);
  }, [selectedType, loadOptions]);

  async function handleAdd() {
    if (!selectedId) { setErr("Select a content item first"); return; }
    if (existingIds.has(selectedId)) { setErr("Already added to this tier"); return; }
    setAdding(true);
    setErr("");
    try {
      await onAdd(selectedType, selectedId);
      setSelectedId("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Add failed");
    } finally {
      setAdding(false);
    }
  }

  const availableOptions = options.filter((o) => !existingIds.has(o.id));

  return (
    <div className="p-4 rounded-xl space-y-3" style={{ background: "var(--bg)", border: "1px solid var(--line)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
        Add content to this tier
      </p>

      <div className="flex flex-wrap gap-2">
        {CONTENT_TYPES.filter((ct) => ct.value !== "COURSE").map((ct) => (
          <button
            key={ct.value}
            onClick={() => setSelectedType(ct.value)}
            className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
            style={{
              background: selectedType === ct.value ? ct.color : "transparent",
              color: selectedType === ct.value ? "#fff" : "var(--ink-3)",
              borderColor: selectedType === ct.value ? ct.color : "var(--line)",
            }}
          >
            {ct.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          {loadingOptions ? (
            <div className="w-full rounded-lg px-3 py-2 text-sm flex items-center gap-2" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink-3)" }}>
              <Loader2 size={12} className="animate-spin" /> Loading…
            </div>
          ) : (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink-1)" }}
            >
              <option value="">— Select {contentTypeLabel(selectedType)} —</option>
              {availableOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
              {availableOptions.length === 0 && (
                <option disabled>No items available</option>
              )}
            </select>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || !selectedId}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white flex-shrink-0"
          style={{ background: "var(--blue)", opacity: !selectedId ? 0.5 : 1 }}
        >
          {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Add
        </button>
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  );
}

// ── Tier row ──────────────────────────────────────────────────────────────────

function TierRow({
  tier,
  onEdit,
  onDelete,
  onRefresh,
}: {
  tier: TierDefinition;
  onEdit: (t: TierDefinition) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [contents, setContents] = useState<TierContent[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadContents = useCallback(async () => {
    setLoadingContents(true);
    try {
      const data = await apiAdminGetTierContents(tier.id);
      setContents(data);
    } catch {
      setContents([]);
    } finally {
      setLoadingContents(false);
    }
  }, [tier.id]);

  useEffect(() => {
    if (expanded) loadContents();
  }, [expanded, loadContents]);

  async function handleAdd(contentType: ContentType, contentId: string) {
    await apiAdminAddTierContent(tier.id, { contentType, contentId });
    await loadContents();
    onRefresh();
  }

  async function handleRemove(contentRecordId: string) {
    setRemoving(contentRecordId);
    try {
      await apiAdminRemoveTierContent(tier.id, contentRecordId);
      setContents((prev) => prev.filter((c) => c.id !== contentRecordId));
      onRefresh();
    } finally {
      setRemoving(null);
    }
  }

  const existingIds = new Set(contents.map((c) => c.contentId));

  // Group contents by type for display
  const byType: Record<string, TierContent[]> = {};
  for (const c of contents) {
    if (!byType[c.contentType]) byType[c.contentType] = [];
    byType[c.contentType].push(c);
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: tier.isActive ? "var(--blue)" : "var(--ink-4)" }}
        >
          T{tier.id}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: "var(--ink-1)" }}>{tier.name}</span>
            {tier.eligibility && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>
                {tier.eligibility}
              </span>
            )}
            {!tier.isActive && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[11px]" style={{ color: "var(--ink-3)" }}>
            <span>₹{(tier.monthlyPaise / 100).toLocaleString("en-IN")}/mo</span>
            <span>₹{(tier.yearlyPaise / 100).toLocaleString("en-IN")}/yr</span>
            <span>{tier.contents?.length ?? 0} items</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(tier)}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg)]"
            title="Edit tier"
          >
            <Pencil size={14} style={{ color: "var(--ink-3)" }} />
          </button>
          <button
            onClick={() => onDelete(tier.id)}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg)]"
            title="Delete tier"
          >
            <Trash2 size={14} style={{ color: "var(--red)" }} />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg)]"
            title={expanded ? "Collapse" : "Manage contents"}
          >
            {expanded ? (
              <ChevronUp size={14} style={{ color: "var(--ink-3)" }} />
            ) : (
              <ChevronDown size={14} style={{ color: "var(--ink-3)" }} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content panel */}
      {expanded && (
        <div className="border-t px-4 py-4 space-y-4" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
          {/* Content picker */}
          <ContentPicker tierId={tier.id} existingIds={existingIds} onAdd={handleAdd} />

          {/* Current contents */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-3)" }}>
              Current contents ({contents.length} items)
            </p>

            {loadingContents ? (
              <div className="flex items-center gap-2 text-sm py-4" style={{ color: "var(--ink-3)" }}>
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : contents.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--ink-4)" }}>
                No content assigned yet. Use the picker above to add items.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byType).map(([type, items]) => (
                  <div key={type}>
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1"
                      style={{ color: contentTypeColor(type) }}
                    >
                      {contentTypeLabel(type)}
                    </div>
                    <div className="flex flex-col gap-1">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg"
                          style={{ background: "var(--card)", border: "1px solid var(--line)" }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: contentTypeColor(type) }}
                          />
                          <span className="flex-1 text-sm truncate" style={{ color: "var(--ink-1)" }}>
                            {item.contentTitle ?? item.contentId}
                          </span>
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={removing === item.id}
                            className="p-1 rounded hover:bg-[var(--bg)] flex-shrink-0"
                          >
                            {removing === item.id ? (
                              <Loader2 size={12} className="animate-spin" style={{ color: "var(--ink-3)" }} />
                            ) : (
                              <X size={12} style={{ color: "var(--red)" }} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TierPlansPage() {
  const [tiers, setTiers] = useState<TierDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTier, setEditingTier] = useState<TierDefinition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const loadTiers = useCallback(async () => {
    try {
      const data = await apiAdminGetTierDefinitions();
      setTiers(data);
    } catch {
      setError("Failed to load tiers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  async function handleCreate(values: TierFormValues) {
    await apiAdminCreateTierDefinition(values);
    setShowForm(false);
    await loadTiers();
  }

  async function handleUpdate(values: TierFormValues) {
    if (!editingTier) return;
    await apiAdminUpdateTierDefinition(editingTier.id, values);
    setEditingTier(null);
    await loadTiers();
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await apiAdminDeleteTierDefinition(id);
      setDeleteConfirm(null);
      await loadTiers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--blue)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--ink-1)" }}>Tier Plans</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
            Define subscription tiers and assign content (Test Series, PYQ, Study Material, Mentorship) to each.
          </p>
        </div>
        {!showForm && !editingTier && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--blue)" }}
          >
            <Plus size={14} /> New Tier
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: "var(--ink-1)" }}>New Tier</h2>
          <TierForm
            initial={EMPTY_FORM}
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editingTier && (
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "2px solid var(--blue)" }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: "var(--ink-1)" }}>
            Editing: {editingTier.name}
          </h2>
          <TierForm
            initial={{
              name: editingTier.name,
              eligibility: editingTier.eligibility,
              description: editingTier.description,
              monthlyPaise: editingTier.monthlyPaise,
              yearlyPaise: editingTier.yearlyPaise,
              isActive: editingTier.isActive,
            }}
            onSave={handleUpdate}
            onCancel={() => setEditingTier(null)}
          />
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div className="rounded-xl p-4" style={{ background: "var(--red-soft)", border: "1px solid var(--red)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--red)" }}>
            Delete this tier? Active subscribers will not be affected immediately, but the tier will no longer accept new subscribers.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDelete(deleteConfirm)}
              disabled={deleting}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5"
              style={{ background: "var(--red)" }}
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : null}
              Yes, Delete
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--card)", color: "var(--ink-2)", border: "1px solid var(--line)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tier list */}
      {tiers.length === 0 && !showForm ? (
        <div className="text-center py-16 rounded-xl" style={{ background: "var(--card)", border: "1px dashed var(--line)" }}>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--ink-2)" }}>No tiers created yet</p>
          <p className="text-xs mb-4" style={{ color: "var(--ink-4)" }}>
            Create your first tier to start selling subscriptions.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--blue)" }}
          >
            Create First Tier
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map((tier) => (
            <TierRow
              key={tier.id}
              tier={tier}
              onEdit={(t) => { setEditingTier(t); setShowForm(false); }}
              onDelete={(id) => setDeleteConfirm(id)}
              onRefresh={loadTiers}
            />
          ))}
        </div>
      )}

      {/* Info callout */}
      <div className="rounded-xl p-4 text-xs space-y-1" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink-3)" }}>
        <p className="font-semibold" style={{ color: "var(--ink-2)" }}>How tier access works</p>
        <p>• Students who subscribe to a tier get access to <strong>all content currently in that tier</strong> — live, no snapshot.</p>
        <p>• Adding or removing content from a tier instantly affects all active tier subscribers.</p>
        <p>• Students who individually purchase content keep it even after their tier expires.</p>
      </div>
    </div>
  );
}

