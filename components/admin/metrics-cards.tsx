import Link from "next/link";
import type { ProjectRecord } from "@/lib/admin-types";
import { computeDora, computeUptime } from "@/lib/metrics";

export function MetricsCards({ projects }: { projects: ProjectRecord[] }) {
  const dora = computeDora(projects);
  const uptime = computeUptime(projects);

  const overall = {
    avgFreq: dora.length ? dora.reduce((a, d) => a + d.deployFrequencyPerWeek, 0) / dora.length : 0,
    avgSuccess: dora.length ? dora.reduce((a, d) => a + d.successRate, 0) / dora.length : 1,
    avgUptime: uptime.length ? uptime.reduce((a, u) => a + u.uptimePct, 0) / uptime.length : 100,
    openIncidents: uptime.reduce((a, u) => a + u.openIncidents, 0),
  };

  return (
    <>
      <section className="metric-tiles">
        <div className="metric-tile">
          <span className="metric-kicker">Deploy frequency</span>
          <strong>{overall.avgFreq.toFixed(1)}</strong>
          <span className="metric-sub">deploys / project / week</span>
        </div>
        <div className="metric-tile">
          <span className="metric-kicker">Success rate</span>
          <strong>{Math.round(overall.avgSuccess * 100)}%</strong>
          <span className="metric-sub">across all deploys</span>
        </div>
        <div className="metric-tile">
          <span className="metric-kicker">Uptime (est.)</span>
          <strong>{overall.avgUptime.toFixed(2)}%</strong>
          <span className="metric-sub">last 30 days, synthetic</span>
        </div>
        <div className="metric-tile metric-warn">
          <span className="metric-kicker">Open incidents</span>
          <strong>{overall.openIncidents}</strong>
          <span className="metric-sub">across all clients</span>
        </div>
      </section>

      <section className="panel">
        <h3>Per-project DORA</h3>
        <div className="dora-table">
          <div className="dora-head">
            <span>Project</span><span>Deploys/wk</span><span>Success</span><span>Lead time</span><span>Failed</span>
          </div>
          {dora.map((d) => (
            <Link key={d.projectId} href={`/clients/${d.projectId}`} className="dora-row">
              <span className="dora-name">{d.projectName}</span>
              <span>{d.deployFrequencyPerWeek.toFixed(1)}</span>
              <span className={d.successRate >= 0.9 ? "tone-ok" : d.successRate >= 0.7 ? "tone-warn" : "tone-bad"}>
                {Math.round(d.successRate * 100)}%
              </span>
              <span>{d.meanLeadTimeMinutes}m</span>
              <span className={d.failedCount === 0 ? "tone-ok" : "tone-bad"}>{d.failedCount}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Per-project uptime (synthetic)</h3>
        <div className="uptime-grid">
          {uptime.map((u) => (
            <Link key={u.projectId} href={`/clients/${u.projectId}`} className="uptime-card">
              <span className="uptime-name">{u.projectName}</span>
              <span className={`uptime-pct ${u.uptimePct >= 99.9 ? "tone-ok" : u.uptimePct >= 99 ? "tone-warn" : "tone-bad"}`}>
                {u.uptimePct.toFixed(2)}%
              </span>
              <span className="uptime-sub">{u.openIncidents} open / {u.incidentCount} total incidents</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
