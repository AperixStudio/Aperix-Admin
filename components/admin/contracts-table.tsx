import Link from "next/link";
import type { ContractRecord } from "@/lib/admin-schemas";
import type { ProjectRecord } from "@/lib/admin-types";
import { totalMrr } from "@/lib/metrics";
import { CsvExportButton } from "@/components/admin/csv-export-button";

const fmt = (n: number, currency = "AUD") =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

export function ContractsTable({ contracts, projects }: { contracts: ContractRecord[]; projects: ProjectRecord[] }) {
  const mrr = totalMrr(contracts);
  const arr = mrr * 12;
  const active = contracts.filter((c) => c.status === "active").length;
  const trial = contracts.filter((c) => c.status === "trial").length;

  const rows = contracts.map((c) => {
    const p = projects.find((x) => x.id === c.projectId);
    return {
      project: p?.name ?? c.projectId,
      status: c.status,
      tier: c.tier,
      mrr: c.mrr,
      currency: c.currency,
      hoursAllotted: c.hoursAllotted ?? 0,
      hoursUsed: c.hoursUsed ?? 0,
      startDate: c.startDate,
      endDate: c.endDate ?? "",
    };
  });

  return (
    <>
      <section className="metric-tiles">
        <div className="metric-tile">
          <span className="metric-kicker">MRR</span>
          <strong>{fmt(mrr)}</strong>
          <span className="metric-sub">active contracts only</span>
        </div>
        <div className="metric-tile">
          <span className="metric-kicker">ARR (annualized)</span>
          <strong>{fmt(arr)}</strong>
          <span className="metric-sub">MRR × 12</span>
        </div>
        <div className="metric-tile">
          <span className="metric-kicker">Active</span>
          <strong>{active}</strong>
          <span className="metric-sub">contracts</span>
        </div>
        <div className="metric-tile">
          <span className="metric-kicker">In trial</span>
          <strong>{trial}</strong>
          <span className="metric-sub">contracts</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Contracts</h3>
          <CsvExportButton filename="aperix-contracts" rows={rows as unknown as Record<string, unknown>[]} />
        </div>
        <div className="contracts-table">
          <div className="contracts-head">
            <span>Client</span><span>Status</span><span>Tier</span><span>MRR</span><span>Hours</span><span>Term</span>
          </div>
          {contracts.map((c) => {
            const p = projects.find((x) => x.id === c.projectId);
            const used = c.hoursUsed ?? 0;
            const allot = c.hoursAllotted ?? 0;
            const overrun = allot > 0 && used > allot;
            return (
              <Link key={c.id} href={`/clients/${c.projectId}`} className="contracts-row">
                <span className="contracts-name">{p?.name ?? c.projectId}</span>
                <span className={`contracts-status status-${c.status}`}>{c.status}</span>
                <span>{c.tier}</span>
                <span>{fmt(c.mrr, c.currency)}</span>
                <span className={overrun ? "tone-bad" : ""}>
                  {allot ? `${used} / ${allot}h` : "—"}
                </span>
                <span className="contracts-term">
                  {c.startDate}{c.endDate ? ` → ${c.endDate}` : ""}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
