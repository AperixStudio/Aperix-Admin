import Link from "next/link";
import type { RenewalItem } from "@/lib/admin-types";

const URGENCY_COPY: Record<RenewalItem["urgency"], string> = {
  expired: "Expired",
  urgent: "Renew now",
  soon: "Renew soon",
  ok: "On track",
  unknown: "Unparsed date",
};

interface Props {
  items: RenewalItem[];
  emptyCopy: string;
}

export function RenewalsList({ items, emptyCopy }: Props) {
  if (!items.length) return <div className="empty-state">{emptyCopy}</div>;

  return (
    <div className="renewals-list">
      {items.map((item) => {
        const months = item.monthsUntil;
        const monthsLabel =
          months === Infinity || isNaN(months) ? "—" :
          months < 0 ? `${Math.abs(months)} mo overdue` :
          months === 0 ? "this month" :
          `${months} mo`;

        return (
          <Link
            key={`${item.projectId}-${item.type}`}
            href={`/clients/${item.projectId}`}
            className={`renewal-row renewal-${item.urgency}`}
          >
            <div className="renewal-meta">
              <span className="renewal-type">{item.type === "domain" ? "Domain" : "SSL"}</span>
              <span className={`renewal-urgency urgency-${item.urgency}`}>{URGENCY_COPY[item.urgency]}</span>
            </div>
            <div className="renewal-name">{item.projectName}</div>
            <div className="renewal-when">
              <strong>{item.label}</strong>
              <span>{monthsLabel}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
