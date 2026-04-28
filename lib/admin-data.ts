import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { ProjectsArraySchema, assertUniqueIds } from "@/lib/admin-schemas";
import type {
  ChangelogEntry,
  ContractRecord,
  NotificationItem,
  RunbookEntry,
} from "@/lib/admin-schemas";
import type {
  ActionQueueItem,
  ClientDetailContent,
  DashboardContent,
  DashboardStats,
  OnboardingContent,
  OperationsContent,
  ProjectCompleteness,
  ProjectRecord,
  ProviderGroup,
  RenewalItem,
  RepoContent,
  UiConfig,
} from "@/lib/admin-types";

const dataDir = path.join(process.cwd(), "data", "admin");

async function readJsonFile<T>(fileName: string): Promise<T> {
  const filePath = path.join(dataDir, fileName);
  const fileContents = await fs.readFile(filePath, "utf8");
  return JSON.parse(fileContents) as T;
}

export const getUiConfig = cache(async () => readJsonFile<UiConfig>("ui.json"));
export const getProjects = cache(async () => {
  const raw = await readJsonFile<unknown>("projects.json");
  // Validate top-level shape; throws clearly on malformed records.
  const arr = ProjectsArraySchema.parse(raw) as unknown as ProjectRecord[];
  assertUniqueIds(arr, "projects.json");
  return arr;
});
export const getDashboardContent = cache(async () => readJsonFile<DashboardContent>("dashboard.json"));
export const getClientDetailContent = cache(async () => readJsonFile<ClientDetailContent>("client-detail.json"));
export const getRepoContent = cache(async () => readJsonFile<RepoContent>("repos.json"));
export const getOperationsContent = cache(async () => readJsonFile<OperationsContent>("operations.json"));
export const getOnboardingContent = cache(async () => readJsonFile<OnboardingContent>("onboarding.json"));

// New entity loaders
export const getContracts = cache(async () => {
  try { return await readJsonFile<ContractRecord[]>("contracts.json"); } catch { return []; }
});
export const getRunbooks = cache(async () => {
  try { return await readJsonFile<RunbookEntry[]>("runbooks.json"); } catch { return []; }
});
export const getChangelog = cache(async () => {
  try { return await readJsonFile<ChangelogEntry[]>("changelog.json"); } catch { return []; }
});
export const getNotifications = cache(async () => {
  try { return await readJsonFile<NotificationItem[]>("notifications.json"); } catch { return []; }
});

export async function getProjectById(id: string | null | undefined) {
  const projects = await getProjects();
  return projects.find((project) => project.id === id);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const projects = await getProjects();

  const ownerCounts: Record<string, number> = {};
  projects.forEach((p) => {
    ownerCounts[p.lead] = (ownerCounts[p.lead] ?? 0) + 1;
  });

  return {
    total: projects.length,
    healthy: projects.filter((p) => p.healthState === "healthy").length,
    attention: projects.filter((p) => p.healthState === "attention").length,
    ownerCounts,
  };
}

// ── Derived ops helpers ────────────────────────────────────

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Parse "Mar 2027" / "Aug 2027" style strings into months-from-now. */
function parseMonthsUntil(label: string | undefined): number | null {
  if (!label) return null;
  const m = label.toLowerCase().match(/([a-z]{3})\s+(\d{4})/);
  if (!m) return null;
  const monthIdx = MONTH_INDEX[m[1]];
  if (monthIdx === undefined) return null;
  const year = parseInt(m[2], 10);
  const now = new Date();
  return (year - now.getFullYear()) * 12 + (monthIdx - now.getMonth());
}

function urgencyFor(months: number | null): RenewalItem["urgency"] {
  if (months === null) return "unknown";
  if (months < 0) return "expired";
  if (months <= 1) return "urgent";
  if (months <= 3) return "soon";
  return "ok";
}

export async function getUpcomingRenewals(): Promise<RenewalItem[]> {
  const projects = await getProjects();
  const items: RenewalItem[] = [];
  for (const p of projects) {
    if (p.domainExpiry) {
      const months = parseMonthsUntil(p.domainExpiry);
      items.push({
        projectId: p.id,
        projectName: p.name,
        type: "domain",
        label: p.domainExpiry,
        monthsUntil: months ?? Infinity,
        urgency: urgencyFor(months),
      });
    }
    if (p.sslExpiry) {
      const months = parseMonthsUntil(p.sslExpiry);
      items.push({
        projectId: p.id,
        projectName: p.name,
        type: "ssl",
        label: p.sslExpiry,
        monthsUntil: months ?? Infinity,
        urgency: urgencyFor(months),
      });
    }
  }
  return items.sort((a, b) => a.monthsUntil - b.monthsUntil);
}

export async function getActionQueue(): Promise<ActionQueueItem[]> {
  const projects = await getProjects();
  const items: ActionQueueItem[] = [];
  for (const p of projects) {
    (p.tasks ?? []).forEach((task) => {
      if (task.status === "done") return;
      items.push({
        id: `${p.id}-${task.id}`,
        projectId: p.id,
        projectName: p.name,
        source: "task",
        title: task.title,
        detail: task.detail ?? "",
        owner: task.owner,
        priority: task.priority,
        href: `/clients/${p.id}`,
      });
    });
    (p.incidents ?? []).forEach((inc) => {
      if (inc.severity === "resolved") return;
      const priority: ActionQueueItem["priority"] =
        inc.severity === "critical" ? "high" : inc.severity === "warning" ? "medium" : "low";
      items.push({
        id: `${p.id}-${inc.id}`,
        projectId: p.id,
        projectName: p.name,
        source: "incident",
        title: inc.title,
        detail: inc.body,
        owner: inc.author,
        priority,
        href: `/clients/${p.id}`,
      });
    });
  }
  const order: Record<ActionQueueItem["priority"], number> = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => order[a.priority] - order[b.priority]);
}

const COMPLETENESS_FIELDS: { key: keyof ProjectRecord; label: string }[] = [
  { key: "liveUrl", label: "Live URL" },
  { key: "stagingUrl", label: "Staging URL" },
  { key: "repoUrl", label: "Repo URL" },
  { key: "netlifySite", label: "Netlify site" },
  { key: "domainExpiry", label: "Domain expiry" },
  { key: "sslExpiry", label: "SSL expiry" },
  { key: "contacts", label: "Contacts" },
  { key: "credentials", label: "Credentials references" },
  { key: "tasks", label: "Tasks" },
  { key: "quickLinks", label: "Quick links" },
];

export async function getProjectCompleteness(): Promise<ProjectCompleteness[]> {
  const projects = await getProjects();
  return projects.map((p) => {
    const missing: string[] = [];
    let filled = 0;
    for (const f of COMPLETENESS_FIELDS) {
      const val = p[f.key];
      const isFilled = Array.isArray(val) ? val.length > 0 : Boolean(val);
      if (isFilled) filled += 1;
      else missing.push(f.label);
    }
    return {
      projectId: p.id,
      filledCount: filled,
      totalCount: COMPLETENESS_FIELDS.length,
      percentage: Math.round((filled / COMPLETENESS_FIELDS.length) * 100),
      missing,
    };
  });
}

export async function getProvidersGrouping(): Promise<ProviderGroup[]> {
  const projects = await getProjects();
  const groups: Record<string, ProviderGroup> = {};

  const add = (type: ProviderGroup["type"], name: string, projectId: string) => {
    if (!name || name === "N/A") return;
    const key = `${type}::${name}`;
    if (!groups[key]) groups[key] = { type, name, projectIds: [], count: 0 };
    groups[key].projectIds.push(projectId);
    groups[key].count += 1;
  };

  projects.forEach((p) => {
    add("hosting", p.hosting, p.id);
    add("dns", p.dns, p.id);
    add("registrar", p.registrar, p.id);
  });

  return Object.values(groups).sort((a, b) => {
    if (a.type !== b.type) {
      const order = { hosting: 0, dns: 1, registrar: 2 };
      return order[a.type] - order[b.type];
    }
    return b.count - a.count;
  });
}

export async function getRecentDeploys(limit = 8) {
  const projects = await getProjects();
  const all = projects.flatMap((p) =>
    (p.deployments ?? []).map((d) => ({ ...d, projectId: p.id, projectName: p.name }))
  );
  // Deployments are already authored newest-first per project; flatten and keep order.
  return all.slice(0, limit);
}
