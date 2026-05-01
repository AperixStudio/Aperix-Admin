"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProspect, setProspectStatus, updateProspect } from "@/lib/admin-actions";
import { useToast } from "@/components/admin/toast-provider";
import type { ProspectRecord, ProspectStatus } from "@/lib/admin-types";

// ── Status transition map ────────────────────────────────────
const TRANSITIONS: Partial<Record<ProspectStatus, ProspectStatus[]>> = {
  new:         ["researching", "contacted", "dormant", "lost"],
  researching: ["contacted", "meeting", "dormant", "lost"],
  contacted:   ["meeting", "researching", "won", "lost"],
  meeting:     ["won", "contacted", "lost"],
  won:         ["lost"],
  lost:        ["new", "dormant"],
  dormant:     ["researching", "new"],
};

const STATUS_LABEL: Record<ProspectStatus, string> = {
  new: "New",
  researching: "Researching",
  contacted: "Contacted",
  meeting: "Meeting",
  won: "Won ✓",
  lost: "Lost",
  dormant: "Dormant",
};

// Colour class per target status for the move chips
const STATUS_CHIP_CLASS: Record<ProspectStatus, string> = {
  new:         "prospect-chip chip-new",
  researching: "prospect-chip chip-researching",
  contacted:   "prospect-chip chip-contacted",
  meeting:     "prospect-chip chip-meeting",
  won:         "prospect-chip chip-won",
  lost:        "prospect-chip chip-lost",
  dormant:     "prospect-chip chip-dormant",
};

type UpdateResult = { ok: true; businessName: string } | { ok: false; error: string };
const initResult: UpdateResult = { ok: false, error: "" };

type View = "default" | "edit" | "delete";

export function ProspectCrud({ prospect }: { prospect: ProspectRecord }) {
  const router = useRouter();
  const toast = useToast();
  const [view, setView] = useState<View>("default");
  const [movePending, startMove] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const editFormRef = useRef<HTMLFormElement>(null);

  const [updateState, updateAction, updatePending] = useActionState(
    updateProspect,
    initResult as UpdateResult
  );

  const pushToast = toast.push;

  useEffect(() => {
    if (!updateState || !("ok" in updateState)) return;
    if (updateState.ok) {
      pushToast(`"${updateState.businessName}" updated`, "success");
      setView("default");
      router.refresh();
    } else if (!updateState.ok && updateState.error) {
      pushToast(updateState.error, "error");
    }
  }, [updateState, router, pushToast]);

  const move = (status: ProspectStatus) => {
    const fd = new FormData();
    fd.set("id", prospect.id);
    fd.set("status", status);
    startMove(async () => {
      try {
        await setProspectStatus(fd);
        pushToast(`Moved to ${STATUS_LABEL[status]}`, "success");
        router.refresh();
      } catch (e) {
        pushToast(e instanceof Error ? e.message : "Failed to update", "error");
      }
    });
  };

  const confirmDelete = () => {
    const fd = new FormData();
    fd.set("id", prospect.id);
    startDelete(async () => {
      try {
        await deleteProspect(fd);
        pushToast(`"${prospect.businessName}" deleted`, "success");
        router.refresh();
      } catch (e) {
        pushToast(e instanceof Error ? e.message : "Failed to delete", "error");
      }
    });
  };

  const nextStatuses = TRANSITIONS[prospect.status] ?? [];

  return (
    <div className="prospect-crud">
      {/* ── Status chips ──────────────────────────────── */}
      {nextStatuses.length > 0 && (
        <div className="prospect-chips">
          <span className="chips-label">Move to:</span>
          {nextStatuses.map((s) => (
            <button
              key={s}
              type="button"
              className={STATUS_CHIP_CLASS[s]}
              disabled={movePending}
              onClick={() => move(s)}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      )}

      {/* ── Action buttons row ────────────────────────── */}
      <div className="prospect-actions-row">
        <button
          type="button"
          className="btn-icon"
          title="Edit prospect"
          onClick={() => setView(view === "edit" ? "default" : "edit")}
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          className="btn-icon btn-icon-danger"
          title="Delete prospect"
          onClick={() => setView(view === "delete" ? "default" : "delete")}
        >
          🗑 Delete
        </button>
      </div>

      {/* ── Inline delete confirm ─────────────────────── */}
      {view === "delete" && (
        <div className="prospect-inline-panel delete-confirm">
          <p>Delete <strong>{prospect.businessName}</strong>? This cannot be undone.</p>
          <div className="actions-row">
            <button
              type="button"
              className="btn danger"
              disabled={deletePending}
              onClick={confirmDelete}
            >
              {deletePending ? "Deleting…" : "Yes, delete"}
            </button>
            <button type="button" className="btn" onClick={() => setView("default")}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Inline edit form ──────────────────────────── */}
      {view === "edit" && (
        <form
          ref={editFormRef}
          action={updateAction}
          className="prospect-inline-panel prospect-edit-form"
        >
          <input type="hidden" name="id" value={prospect.id} />

          <div className="prospect-edit-grid">
            <label className="form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Business name <em>required</em></span>
              <input name="businessName" required defaultValue={prospect.businessName} />
            </label>

            <label className="form-field">
              <span>Priority</span>
              <select name="priority" defaultValue={prospect.priority}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            <label className="form-field">
              <span>Owner</span>
              <input name="owner" defaultValue={prospect.owner} />
            </label>

            <label className="form-field">
              <span>Industry</span>
              <input name="industry" defaultValue={prospect.industry ?? ""} />
            </label>

            <label className="form-field">
              <span>Location</span>
              <input name="location" defaultValue={prospect.location ?? ""} />
            </label>

            <label className="form-field">
              <span>Google Maps URL</span>
              <input name="mapsUrl" type="url" defaultValue={prospect.mapsUrl ?? ""} />
            </label>

            <label className="form-field">
              <span>Current site</span>
              <input name="currentSite" type="url" defaultValue={prospect.currentSite ?? ""} />
            </label>

            <label className="form-field">
              <span>Contact name</span>
              <input name="contactName" defaultValue={prospect.contactName ?? ""} />
            </label>

            <label className="form-field">
              <span>Contact email</span>
              <input name="contactEmail" type="email" defaultValue={prospect.contactEmail ?? ""} />
            </label>

            <label className="form-field">
              <span>Contact phone</span>
              <input name="contactPhone" defaultValue={prospect.contactPhone ?? ""} />
            </label>

            <label className="form-field">
              <span>Next action</span>
              <input name="nextAction" defaultValue={prospect.nextAction ?? ""} />
            </label>

            <label className="form-field">
              <span>Next action due</span>
              <input name="nextActionDue" type="date" defaultValue={prospect.nextActionDue ?? ""} />
            </label>

            <label className="form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Tags <small className="muted">(comma-separated)</small></span>
              <input name="tags" defaultValue={prospect.tags?.join(", ") ?? ""} />
            </label>

            <label className="form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Notes</span>
              <textarea name="notes" rows={3} defaultValue={prospect.notes ?? ""} />
            </label>
          </div>

          <div className="actions-row" style={{ marginTop: 12 }}>
            <button type="submit" className="btn primary" disabled={updatePending}>
              {updatePending ? "Saving…" : "Save changes"}
            </button>
            <button type="button" className="btn" onClick={() => setView("default")}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
