"use client";

import { useTransition } from "react";
import { setProspectStatus } from "@/lib/admin-actions";
import { useToast } from "@/components/admin/toast-provider";
import type { ProspectStatus } from "@/lib/admin-types";

const NEXT: Partial<Record<ProspectStatus, ProspectStatus[]>> = {
  new:         ["researching", "contacted", "lost", "dormant"],
  researching: ["contacted", "meeting", "lost", "dormant"],
  contacted:   ["meeting", "researching", "won", "lost"],
  meeting:     ["won", "lost", "contacted"],
  won:         [],
  lost:        ["new"],
  dormant:     ["researching"],
};

const LABEL: Record<ProspectStatus, string> = {
  new: "New",
  researching: "Researching",
  contacted: "Contacted",
  meeting: "Meeting",
  won: "Won",
  lost: "Lost",
  dormant: "Dormant",
};

export function ProspectStatusButtons({ id, current }: { id: string; current: ProspectStatus }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const next = NEXT[current] ?? [];

  if (next.length === 0) return null;

  const move = (status: ProspectStatus) => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    start(async () => {
      try {
        await setProspectStatus(fd);
        toast.push(`Moved to ${LABEL[status]}`, "success");
      } catch (e) {
        toast.push(e instanceof Error ? e.message : "Failed to update", "error");
      }
    });
  };

  return (
    <div className="actions-row" style={{ marginTop: 10, gap: 6, flexWrap: "wrap" }}>
      {next.map((s) => (
        <button
          key={s}
          type="button"
          className="btn-text"
          disabled={pending}
          onClick={() => move(s)}
        >
          → {LABEL[s]}
        </button>
      ))}
    </div>
  );
}
