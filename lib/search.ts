import type { ProjectRecord } from "@/lib/admin-types";
import type { ProjectSummary } from "@/lib/data/adapter";

export interface SearchHit {
  id: string;
  kind: "project" | "task" | "contact" | "credential" | "incident" | "deploy" | "renewal" | "runbook";
  title: string;
  subtitle: string;
  href: string;
  haystack: string; // lowercased text used for matching
}

/** Build a flat search index from projects (and optionally other entities). */
export function buildSearchIndex(projects: ProjectRecord[]): SearchHit[] {
  const hits: SearchHit[] = [];

  for (const p of projects) {
    hits.push({
      id: p.id,
      kind: "project",
      title: p.name,
      subtitle: `${p.domain} · ${p.tier}`,
      href: `/clients/${p.id}`,
      haystack: `${p.name} ${p.domain} ${p.tier} ${p.lead} ${(p.tags ?? []).join(" ")}`.toLowerCase(),
    });

    (p.tasks ?? []).forEach((t) =>
      hits.push({
        id: `${p.id}-${t.id}`,
        kind: "task",
        title: t.title,
        subtitle: `${p.name} · ${t.status} · ${t.priority}`,
        href: `/clients/${p.id}`,
        haystack: `${t.title} ${t.detail ?? ""} ${p.name} ${t.owner}`.toLowerCase(),
      })
    );

    (p.contacts ?? []).forEach((c) =>
      hits.push({
        id: `${p.id}-${c.id}`,
        kind: "contact",
        title: c.name,
        subtitle: `${p.name} · ${c.role}`,
        href: `/clients/${p.id}`,
        haystack: `${c.name} ${c.role} ${c.email ?? ""} ${p.name}`.toLowerCase(),
      })
    );

    (p.credentials ?? []).forEach((c) =>
      hits.push({
        id: `${p.id}-${c.id}`,
        kind: "credential",
        title: c.label,
        subtitle: `${p.name} · ${c.location}`,
        href: `/clients/${p.id}`,
        haystack: `${c.label} ${c.location} ${c.ownedBy} ${p.name}`.toLowerCase(),
      })
    );

    (p.incidents ?? []).forEach((i) =>
      hits.push({
        id: `${p.id}-${i.id}`,
        kind: "incident",
        title: i.title,
        subtitle: `${p.name} · ${i.severity}`,
        href: `/clients/${p.id}`,
        haystack: `${i.title} ${i.body} ${p.name}`.toLowerCase(),
      })
    );
  }

  return hits;
}

export function buildProjectSummarySearchIndex(projects: ProjectSummary[]): SearchHit[] {
  return projects.map((p) => ({
    id: p.id,
    kind: "project",
    title: p.name,
    subtitle: [p.domain, p.tier].filter(Boolean).join(" · ") || "Client",
    href: `/clients/${p.id}`,
    haystack: `${p.name} ${p.domain ?? ""} ${p.tier ?? ""} ${p.lead ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase(),
  }));
}

/** Lightweight ranked match. Returns a score 0..n; higher is better. */
export function scoreHit(hit: SearchHit, queryLower: string): number {
  if (!queryLower) return 0;
  const tokens = queryLower.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const t of tokens) {
    if (hit.title.toLowerCase().startsWith(t)) score += 5;
    if (hit.title.toLowerCase().includes(t)) score += 3;
    if (hit.haystack.includes(t)) score += 1;
    else return 0; // every token must match somewhere
  }
  return score;
}

export function searchIndex(index: SearchHit[], query: string, limit = 12): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index
    .map((h) => ({ h, s: scoreHit(h, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.h);
}
