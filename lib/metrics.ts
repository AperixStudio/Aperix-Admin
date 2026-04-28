import type { ProjectRecord } from "@/lib/admin-types";

export interface DoraMetrics {
  projectId: string;
  projectName: string;
  deployFrequencyPerWeek: number;
  successRate: number; // 0..1
  meanLeadTimeMinutes: number;
  failedCount: number;
}

/** Parse a "12 min" / "3 min" / "1h 12m" duration string to minutes (best effort). */
function parseDurationMinutes(d: string | undefined): number {
  if (!d) return 0;
  const s = d.toLowerCase();
  let mins = 0;
  const h = s.match(/(\d+)\s*h/);
  const m = s.match(/(\d+)\s*m/);
  if (h) mins += parseInt(h[1], 10) * 60;
  if (m) mins += parseInt(m[1], 10);
  if (!h && !m) {
    const n = parseInt(s, 10);
    if (Number.isFinite(n)) mins = n;
  }
  return mins;
}

export function computeDora(projects: ProjectRecord[]): DoraMetrics[] {
  return projects.map((p) => {
    const deploys = p.deployments ?? [];
    const successCount = deploys.filter((d) => d.status === "success").length;
    const failedCount = deploys.filter((d) => d.status === "failed").length;
    const totalCounted = successCount + failedCount;
    const successRate = totalCounted ? successCount / totalCounted : 1;
    const meanLeadTimeMinutes = deploys.length
      ? deploys.reduce((acc, d) => acc + parseDurationMinutes(d.duration), 0) / deploys.length
      : 0;
    // Synthetic — assume the recorded deploys cover ~30 days of activity.
    const deployFrequencyPerWeek = deploys.length ? (deploys.length / 30) * 7 : 0;
    return {
      projectId: p.id,
      projectName: p.name,
      deployFrequencyPerWeek: Math.round(deployFrequencyPerWeek * 10) / 10,
      successRate,
      meanLeadTimeMinutes: Math.round(meanLeadTimeMinutes),
      failedCount,
    };
  });
}

export interface UptimeBucket {
  projectId: string;
  projectName: string;
  uptimePct: number; // 0..100
  incidentCount: number;
  openIncidents: number;
}

export function computeUptime(projects: ProjectRecord[]): UptimeBucket[] {
  return projects.map((p) => {
    const incidents = p.incidents ?? [];
    const open = incidents.filter((i) => i.severity !== "resolved").length;
    // Synthetic: 99.9 baseline, -0.05 per warning, -0.2 per critical.
    let uptime = 99.9;
    for (const i of incidents) {
      if (i.severity === "warning") uptime -= 0.05;
      if (i.severity === "critical") uptime -= 0.2;
    }
    return {
      projectId: p.id,
      projectName: p.name,
      uptimePct: Math.max(95, Math.round(uptime * 100) / 100),
      incidentCount: incidents.length,
      openIncidents: open,
    };
  });
}

export function totalMrr(contracts: { mrr: number; status: string }[]): number {
  return contracts.filter((c) => c.status === "active").reduce((acc, c) => acc + c.mrr, 0);
}
