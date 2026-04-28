import Link from "next/link";
import type { AuditEntry } from "@/lib/admin-schemas";

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function AuditLogList({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <p className="muted">No activity recorded yet.</p>;
  }
  return (
    <div className="audit-list">
      {entries.map((e) => (
        <div key={e.id} className={`audit-row audit-${e.action}`}>
          <div className="audit-time">{relTime(e.timestamp)}</div>
          <div className="audit-body">
            <div className="audit-head">
              <strong>{e.actor}</strong>
              <span className="audit-role">{e.role}</span>
              <span className="audit-action">{e.action}</span>
              <span className="audit-entity">{e.entityType}</span>
              <code>{e.entityId}</code>
            </div>
            {e.note ? <p className="audit-note">{e.note}</p> : null}
          </div>
          {e.entityType === "task" || e.entityType === "incident" || e.entityType === "credential" ? (
            <Link className="audit-link" href={`/audit#${e.id}`}>view</Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}
