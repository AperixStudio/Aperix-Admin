"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { advanceIncident, createIncident } from "@/lib/admin-actions";
import { useToast } from "@/components/admin/toast-provider";
import type { IncidentNote, IncidentState } from "@/lib/admin-types";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : label}</button>;
}

export function IncidentForm({ projectId }: { projectId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const toast = useToast();
  return (
    <form
      ref={ref}
      action={async (fd) => {
        try { await createIncident(fd); toast.push("Incident logged", "success"); ref.current?.reset(); }
        catch (e) { toast.push(e instanceof Error ? e.message : "Failed", "error"); }
      }}
      className="inline-form"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input name="title" placeholder="Incident title" required minLength={2} />
      <select name="severity" defaultValue="warning">
        <option>info</option>
        <option>warning</option>
        <option>critical</option>
      </select>
      <input name="body" placeholder="Short description" />
      <Submit label="Open incident" />
    </form>
  );
}

const TRANSITIONS: Record<string, IncidentState[]> = {
  open: ["investigating", "mitigated", "resolved"],
  investigating: ["mitigated", "resolved"],
  mitigated: ["resolved", "investigating"],
  resolved: ["postmortem"],
  postmortem: [],
};

export function IncidentLifecycle({
  projectId,
  incident,
}: {
  projectId: string;
  incident: IncidentNote;
}) {
  const toast = useToast();
  const [showPm, setShowPm] = useState(false);
  const [pmText, setPmText] = useState(incident.postmortem ?? "");
  const current = incident.state ?? "open";
  const next = TRANSITIONS[current] ?? [];

  const advance = async (to: IncidentState, postmortem?: string) => {
    try {
      await advanceIncident(projectId, incident.id, to, postmortem);
      toast.push(`Incident → ${to}`, "success");
      if (to !== "postmortem") setShowPm(false);
    } catch (e) {
      toast.push(e instanceof Error ? e.message : "Transition failed", "error");
    }
  };

  return (
    <div className="incident-lifecycle">
      <div className={`incident-state state-${current}`}>{current}</div>
      <div className="incident-transitions">
        {next.map((s) =>
          s === "postmortem" ? (
            <button key={s} type="button" className="task-action" onClick={() => setShowPm(true)}>
              + postmortem
            </button>
          ) : (
            <button key={s} type="button" className="task-action" onClick={() => advance(s)}>
              → {s}
            </button>
          )
        )}
      </div>
      {showPm ? (
        <div className="pm-edit">
          <textarea
            rows={4}
            value={pmText}
            onChange={(e) => setPmText(e.target.value)}
            placeholder="Postmortem summary — what happened, impact, root cause, follow-ups…"
          />
          <div className="pm-actions">
            <button type="button" onClick={() => setShowPm(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={() => advance("postmortem", pmText)}>
              Save postmortem
            </button>
          </div>
        </div>
      ) : null}
      {incident.postmortem && !showPm ? (
        <details className="pm-summary">
          <summary>Postmortem</summary>
          <p>{incident.postmortem}</p>
        </details>
      ) : null}
    </div>
  );
}
