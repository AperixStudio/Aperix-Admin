import type { ProjectRecord } from "@/lib/admin-types";
import type { RenewalItem } from "@/lib/admin-types";

export interface NlAnswer {
  intent: string;
  summary: string;
  rows: { label: string; href?: string; tone?: "ok" | "warn" | "bad" | "info" }[];
}

const HOSTING_KEYS = ["netlify", "vercel", "cloudflare"];
const REGISTRAR_KEYS = ["porkbun", "namecheap", "godaddy"];

export function answerNlQuery(
  query: string,
  projects: ProjectRecord[],
  renewals: RenewalItem[]
): NlAnswer {
  const q = query.trim().toLowerCase();

  if (!q) {
    return { intent: "empty", summary: "Ask anything about your stack.", rows: [] };
  }

  // SSL / renewals
  if (q.includes("ssl") || q.includes("expir") || q.includes("renew")) {
    const filtered = renewals.filter(
      (r) => r.urgency === "soon" || r.urgency === "urgent" || r.urgency === "expired"
    );
    return {
      intent: "renewals",
      summary: `${filtered.length} renewals need attention.`,
      rows: filtered.map((r) => ({
        label: `${r.projectName} · ${r.type.toUpperCase()} ${r.label}`,
        href: `/clients/${r.projectId}`,
        tone: r.urgency === "expired" || r.urgency === "urgent" ? "bad" : "warn",
      })),
    };
  }

  // Incidents / down
  if (q.includes("down") || q.includes("incident") || q.includes("broken")) {
    const rows = projects
      .filter((p) => (p.incidents ?? []).some((i) => i.severity !== "resolved"))
      .map((p) => ({
        label: `${p.name} — ${(p.incidents ?? []).filter((i) => i.severity !== "resolved").length} open`,
        href: `/clients/${p.id}`,
        tone: "bad" as const,
      }));
    return {
      intent: "incidents",
      summary: rows.length ? "Sites with open incidents:" : "No open incidents — all clear.",
      rows,
    };
  }

  // Hosting / provider
  for (const k of HOSTING_KEYS) {
    if (q.includes(k)) {
      const rows = projects
        .filter((p) => p.hosting?.toLowerCase().includes(k))
        .map((p) => ({ label: `${p.name} (${p.domain})`, href: `/clients/${p.id}`, tone: "info" as const }));
      return { intent: "provider", summary: `Sites hosted on ${k}:`, rows };
    }
  }
  for (const k of REGISTRAR_KEYS) {
    if (q.includes(k)) {
      const rows = projects
        .filter((p) => p.registrar?.toLowerCase().includes(k))
        .map((p) => ({ label: `${p.name} (${p.domain})`, href: `/clients/${p.id}`, tone: "info" as const }));
      return { intent: "registrar", summary: `Domains at ${k}:`, rows };
    }
  }

  // Owner / lead
  if (q.includes("harrison") || q.includes("thomas") || q.includes("owner") || q.includes("lead")) {
    const owner = q.includes("thomas") ? "Thomas" : "Harrison";
    const rows = projects
      .filter((p) => p.lead === owner)
      .map((p) => ({ label: `${p.name} — ${p.tier}`, href: `/clients/${p.id}`, tone: "info" as const }));
    return { intent: "owner", summary: `Projects led by ${owner}:`, rows };
  }

  // Generic project name hit
  const hits = projects.filter((p) => p.name.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q));
  if (hits.length) {
    return {
      intent: "project",
      summary: `${hits.length} matching project${hits.length === 1 ? "" : "s"}.`,
      rows: hits.map((p) => ({ label: `${p.name} (${p.domain})`, href: `/clients/${p.id}`, tone: "info" as const })),
    };
  }

  return {
    intent: "unknown",
    summary: "No match. Try: \"ssl expiring\", \"sites on netlify\", \"open incidents\".",
    rows: [],
  };
}
