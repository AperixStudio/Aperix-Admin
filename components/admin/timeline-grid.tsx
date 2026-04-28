import Link from "next/link";
import type { ProjectRecord, RenewalItem } from "@/lib/admin-types";
import type { ContractRecord } from "@/lib/admin-schemas";

interface TimelineGridProps {
  projects: ProjectRecord[];
  renewals: RenewalItem[];
  contracts: ContractRecord[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthsAhead(count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` };
  });
}

export function TimelineGrid({ projects, renewals, contracts }: TimelineGridProps) {
  const cells = monthsAhead(12);
  const items: { col: number; label: string; tone: string; href: string }[] = [];

  for (const r of renewals) {
    if (!Number.isFinite(r.monthsUntil)) continue;
    const col = Math.max(0, Math.min(11, r.monthsUntil));
    items.push({
      col,
      label: `${r.projectName} ${r.type.toUpperCase()}`,
      tone: r.urgency === "expired" || r.urgency === "urgent" ? "bad" : r.urgency === "soon" ? "warn" : "ok",
      href: `/clients/${r.projectId}`,
    });
  }

  for (const c of contracts) {
    if (!c.endDate) continue;
    const end = new Date(c.endDate);
    const now = new Date();
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    if (months < 0 || months > 11) continue;
    const project = projects.find((p) => p.id === c.projectId);
    items.push({
      col: months,
      label: `${project?.name ?? c.projectId} contract`,
      tone: months <= 1 ? "bad" : months <= 3 ? "warn" : "info",
      href: `/contracts`,
    });
  }

  return (
    <div className="timeline-wrap">
      <div className="timeline-head">
        {cells.map((c) => (
          <div key={`${c.year}-${c.month}`} className="timeline-h">{c.label}</div>
        ))}
      </div>
      <div className="timeline-grid">
        {cells.map((c) => (
          <div key={`g-${c.year}-${c.month}`} className="timeline-col">
            {items
              .filter((it) => it.col === cells.indexOf(c))
              .map((it, i) => (
                <Link key={i} href={it.href} className={`timeline-pill timeline-${it.tone}`}>
                  {it.label}
                </Link>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
