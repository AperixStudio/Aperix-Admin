import { cache } from "react";
import type { DataAdapter, DiagnosticReport, NewProjectInput, NewProspectInput, ProjectSummary, RecentDeploy } from "@/lib/data/adapter";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type {
  ActionQueueItem,
  DashboardStats,
  HealthState,
  ProjectCompleteness,
  ProjectRecord,
  ProviderGroup,
  RenewalItem,
  ContactRecord,
  CredentialReference,
  TaskItem,
  IncidentNote,
  DeploymentRecord,
  QuickLinkItem,
  ProspectRecord,
  ProspectSource,
  ProspectStatus,
} from "@/lib/admin-types";
import type {
  ContractRecord,
  RunbookEntry,
  NotificationItem,
} from "@/lib/admin-schemas";

// -------------------------------------------------------------
// Live (Supabase) adapter.
//
// Uses the service-role client → bypasses RLS for server reads
// and writes. The browser never sees this client; the /login
// page uses the public anon client via @supabase/ssr.
// -------------------------------------------------------------

function notConfigured(): never {
  throw new Error(
    "Live (Supabase) data mode is not configured. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local, then restart."
  );
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseMonthsUntil(label: string | null | undefined): number | null {
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

// -------------------------------------------------------------
// Row types — mirror SQL schema in supabase/migrations/0001_init.sql
// -------------------------------------------------------------

interface ProjectRow {
  id: string;
  name: string;
  summary: string;
  notes: string;
  lead: string;
  support: string;
  tier: string;
  stage: string;
  health_label: string;
  health_state: HealthState;
  domain: string | null;
  hosting: string | null;
  registrar: string | null;
  dns: string | null;
  repo: string | null;
  repo_status: string | null;
  deploy: string | null;
  live_url: string | null;
  staging_url: string | null;
  repo_url: string | null;
  github_org: string | null;
  netlify_site: string | null;
  render_service: string | null;
  domain_expiry: string | null;
  ssl_expiry: string | null;
  last_activity: string | null;
  brand_key: string | null;
  tags: string[] | null;
}

interface ContactRow {
  id: string; project_id: string; name: string; role: string;
  email: string | null; phone: string | null; notes: string | null;
}
interface CredentialRow {
  id: string; project_id: string; label: string; location: string;
  vault_url: string | null; owned_by: string; notes: string | null;
}
interface TaskRow {
  id: string; project_id: string; title: string; detail: string | null;
  owner: string; status: TaskItem["status"]; due: string | null;
  priority: TaskItem["priority"];
}
interface IncidentRow {
  id: string; project_id: string; severity: IncidentNote["severity"];
  title: string; body: string; author: string; created_at: string;
  state: IncidentNote["state"] | null; postmortem: string | null; resolved_at: string | null;
}
interface DeploymentRow {
  id: string; project_id: string; status: DeploymentRecord["status"];
  branch: string; message: string; occurred_at: string;
  duration: string | null; actor: string;
}
interface QuickLinkRow {
  id: string; project_id: string; label: string; href: string;
  category: QuickLinkItem["category"] | null;
}

interface ProjectRowWithRelations extends ProjectRow {
  contacts?: ContactRow[] | null;
  credentials?: CredentialRow[] | null;
  tasks?: TaskRow[] | null;
  incidents?: IncidentRow[] | null;
  deployments?: DeploymentRow[] | null;
  quick_links?: QuickLinkRow[] | null;
}

// -------------------------------------------------------------
// Mappers
// -------------------------------------------------------------

function mapContact(r: ContactRow): ContactRecord {
  return {
    id: r.id, name: r.name, role: r.role,
    email: r.email ?? undefined, phone: r.phone ?? undefined, notes: r.notes ?? undefined,
  };
}
function mapCredential(r: CredentialRow): CredentialReference {
  return {
    id: r.id, label: r.label, location: r.location,
    vaultUrl: r.vault_url ?? undefined, ownedBy: r.owned_by, notes: r.notes ?? undefined,
  };
}
function mapTask(r: TaskRow): TaskItem {
  return {
    id: r.id, title: r.title, detail: r.detail ?? undefined,
    owner: r.owner, status: r.status, due: r.due ?? undefined, priority: r.priority,
  };
}
function mapIncident(r: IncidentRow): IncidentNote {
  return {
    id: r.id, severity: r.severity, title: r.title, body: r.body,
    timestamp: r.created_at, author: r.author,
    state: r.state ?? undefined,
    postmortem: r.postmortem ?? undefined,
    resolvedAt: r.resolved_at ?? undefined,
  };
}
function mapDeployment(r: DeploymentRow): DeploymentRecord {
  return {
    id: r.id, status: r.status, branch: r.branch, message: r.message,
    timestamp: r.occurred_at, duration: r.duration ?? "", actor: r.actor,
  };
}
function mapQuickLink(r: QuickLinkRow): QuickLinkItem {
  return { label: r.label, url: r.href, category: r.category ?? "other" };
}

function mapProject(row: ProjectRowWithRelations): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain ?? "",
    stage: row.stage,
    lead: row.lead,
    support: row.support,
    tier: row.tier,
    health: row.health_label,
    healthState: row.health_state,
    hosting: row.hosting ?? "",
    registrar: row.registrar ?? "",
    dns: row.dns ?? "",
    repo: row.repo ?? "",
    repoStatus: row.repo_status ?? "",
    deploy: row.deploy ?? "",
    summary: row.summary,
    notes: row.notes,
    liveUrl: row.live_url ?? "",
    stagingUrl: row.staging_url ?? undefined,
    repoUrl: row.repo_url ?? undefined,
    githubOrg: row.github_org ?? "",
    netlifySite: row.netlify_site ?? undefined,
    domainExpiry: row.domain_expiry ?? undefined,
    sslExpiry: row.ssl_expiry ?? undefined,
    lastActivity: row.last_activity ?? "",
    tags: row.tags ?? [],
    brandKey: row.brand_key ?? undefined,
    // Static lists not modelled in DB yet — keep empty.
    links: [],
    checks: [],
    priorities: [],
    // Nested rows (from PostgREST embed).
    contacts: (row.contacts ?? []).map(mapContact),
    credentials: (row.credentials ?? []).map(mapCredential),
    tasks: (row.tasks ?? []).map(mapTask),
    incidents: (row.incidents ?? []).map(mapIncident),
    deployments: (row.deployments ?? []).map(mapDeployment),
    quickLinks: (row.quick_links ?? []).map(mapQuickLink),
  };
}

// PostgREST embed for nested rows on a project query.
const PROJECT_EMBED =
  "*, contacts(*), credentials(*), tasks(*), incidents(*), deployments(*), quick_links(*)";

// -------------------------------------------------------------
// Reads
// -------------------------------------------------------------

const listProjects = cache(async function listProjects(): Promise<ProjectRecord[]> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_EMBED)
    .order("name");
  if (error) throw new Error(`listProjects: ${error.message}`);
  return ((data ?? []) as unknown as ProjectRowWithRelations[]).map(mapProject);
});

const listProjectSummaries = cache(async function listProjectSummaries(): Promise<ProjectSummary[]> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,domain,tier,lead,tags")
    .order("name");
  if (error) throw new Error(`listProjectSummaries: ${error.message}`);
  type Row = {
    id: string;
    name: string;
    domain: string | null;
    tier: string | null;
    lead: string | null;
    tags: string[] | null;
  };
  return ((data ?? []) as Row[]).map((p) => ({
    id: p.id,
    name: p.name,
    domain: p.domain ?? undefined,
    tier: p.tier ?? undefined,
    lead: p.lead ?? undefined,
    tags: p.tags ?? [],
  }));
});

async function getProject(id: string): Promise<ProjectRecord | null> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_EMBED)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getProject: ${error.message}`);
  if (!data) return null;
  return mapProject(data as unknown as ProjectRowWithRelations);
}

async function listContracts(): Promise<ContractRecord[]> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) throw new Error(`listContracts: ${error.message}`);
  type Row = {
    id: string; project_id: string; status: ContractRecord["status"]; tier: string;
    start_date: string; end_date: string | null; mrr: number | string;
    currency: string | null; hours_allotted: number | null; hours_used: number | null;
    notes: string | null;
  };
  return ((data ?? []) as Row[]).map((c) => ({
    id: c.id,
    projectId: c.project_id,
    status: c.status,
    tier: c.tier,
    startDate: c.start_date,
    endDate: c.end_date ?? undefined,
    mrr: Number(c.mrr ?? 0),
    currency: c.currency ?? "AUD",
    hoursAllotted: c.hours_allotted ?? undefined,
    hoursUsed: c.hours_used ?? undefined,
    notes: c.notes ?? undefined,
  }));
}

async function listRunbooks(): Promise<RunbookEntry[]> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("runbooks")
    .select("*")
    .order("title");
  if (error) throw new Error(`listRunbooks: ${error.message}`);
  type Row = {
    id: string; title: string; category: RunbookEntry["category"];
    triggers: string[] | null; steps: unknown; owner: string;
    last_reviewed: string | null;
  };
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    triggers: r.triggers ?? [],
    steps: (r.steps as { title: string; detail: string }[]) ?? [],
    owner: r.owner,
    lastReviewed: r.last_reviewed ?? undefined,
  }));
}

const listNotifications = cache(async function listNotifications(): Promise<NotificationItem[]> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`listNotifications: ${error.message}`);
  type Row = {
    id: string; kind: NotificationItem["kind"]; title: string; body: string;
    created_at: string; href: string | null; read: boolean | null;
  };
  return ((data ?? []) as Row[]).map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    timestamp: n.created_at,
    href: n.href ?? undefined,
    read: n.read ?? false,
  }));
});

// -------------------------------------------------------------
// Derived helpers
// -------------------------------------------------------------

async function getDashboardStats(): Promise<DashboardStats> {
  const projects = await listProjects();
  const ownerCounts: Record<string, number> = {};
  for (const p of projects) ownerCounts[p.lead] = (ownerCounts[p.lead] ?? 0) + 1;
  return {
    total: projects.length,
    healthy: projects.filter((p) => p.healthState === "healthy").length,
    attention: projects.filter((p) => p.healthState === "attention").length,
    ownerCounts,
  };
}

async function getActionQueue(): Promise<ActionQueueItem[]> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();

  const [{ data: tasks }, { data: incidents }, { data: projects }] = await Promise.all([
    supabase.from("tasks").select("*").neq("status", "done"),
    supabase.from("incidents").select("*").neq("severity", "resolved"),
    supabase.from("projects").select("id,name"),
  ]);

  const projectName = new Map<string, string>(
    ((projects ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name])
  );
  const out: ActionQueueItem[] = [];

  ((tasks ?? []) as TaskRow[]).forEach((t) => out.push({
    id: `${t.project_id}-${t.id}`,
    projectId: t.project_id,
    projectName: projectName.get(t.project_id) ?? t.project_id,
    source: "task",
    title: t.title,
    detail: t.detail ?? "",
    owner: t.owner,
    priority: t.priority,
    href: `/clients/${t.project_id}`,
  }));

  ((incidents ?? []) as IncidentRow[]).forEach((i) => {
    const priority: ActionQueueItem["priority"] =
      i.severity === "critical" ? "high" : i.severity === "warning" ? "medium" : "low";
    out.push({
      id: `${i.project_id}-${i.id}`,
      projectId: i.project_id,
      projectName: projectName.get(i.project_id) ?? i.project_id,
      source: "incident",
      title: i.title,
      detail: i.body,
      owner: i.author,
      priority,
      href: `/clients/${i.project_id}`,
    });
  });

  const order: Record<ActionQueueItem["priority"], number> = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => order[a.priority] - order[b.priority]);
}

async function getUpcomingRenewals(): Promise<RenewalItem[]> {
  const projects = await listProjects();
  const items: RenewalItem[] = [];
  for (const p of projects) {
    if (p.domainExpiry) {
      const months = parseMonthsUntil(p.domainExpiry);
      items.push({
        projectId: p.id, projectName: p.name, type: "domain",
        label: p.domainExpiry, monthsUntil: months ?? Infinity, urgency: urgencyFor(months),
      });
    }
    if (p.sslExpiry) {
      const months = parseMonthsUntil(p.sslExpiry);
      items.push({
        projectId: p.id, projectName: p.name, type: "ssl",
        label: p.sslExpiry, monthsUntil: months ?? Infinity, urgency: urgencyFor(months),
      });
    }
  }
  return items.sort((a, b) => a.monthsUntil - b.monthsUntil);
}

async function getProvidersGrouping(): Promise<ProviderGroup[]> {
  const projects = await listProjects();
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

async function getProjectCompleteness(): Promise<ProjectCompleteness[]> {
  const projects = await listProjects();
  const FIELDS: { key: keyof ProjectRecord; label: string }[] = [
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
  return projects.map((p) => {
    const missing: string[] = [];
    let filled = 0;
    for (const f of FIELDS) {
      const v = p[f.key];
      const ok = Array.isArray(v) ? v.length > 0 : Boolean(v);
      if (ok) filled++; else missing.push(f.label);
    }
    return {
      projectId: p.id,
      filledCount: filled,
      totalCount: FIELDS.length,
      percentage: Math.round((filled / FIELDS.length) * 100),
      missing,
    };
  });
}

async function getRecentDeploys(limit = 8): Promise<RecentDeploy[]> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("deployments")
    .select("*, projects:project_id(name)")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRecentDeploys: ${error.message}`);
  type Row = DeploymentRow & { projects: { name: string } | null };
  return ((data ?? []) as Row[]).map((row) => ({
    ...mapDeployment(row),
    projectId: row.project_id,
    projectName: row.projects?.name ?? row.project_id,
  }));
}

// -------------------------------------------------------------
// Mutations
// -------------------------------------------------------------

async function createProject(input: NewProjectInput): Promise<ProjectRecord> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();

  const insert = {
    id: input.id,
    name: input.name,
    summary: input.summary,
    notes: input.notes ?? "",
    lead: input.lead,
    support: input.support ?? "",
    tier: input.tier,
    domain: input.domain ?? null,
    hosting: input.hosting ?? null,
    registrar: input.registrar ?? null,
    repo: input.githubRepo ?? null,
    repo_url: input.githubRepo ? `https://github.com/${input.githubRepo}` : null,
    live_url: input.liveUrl ?? null,
    staging_url: input.stagingUrl ?? null,
    brand_key: input.brandKey ?? null,
    tags: input.tags ?? [],
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(insert)
    .select(PROJECT_EMBED)
    .single();
  if (error) throw new Error(`createProject: ${error.message}`);
  return mapProject(data as unknown as ProjectRowWithRelations);
}

// -------------------------------------------------------------
// Prospects (lead generation)
// -------------------------------------------------------------

interface ProspectRow {
  id: string;
  business_name: string;
  maps_url: string | null;
  current_site: string | null;
  notes: string | null;
  source: ProspectSource;
  status: ProspectStatus;
  priority: "low" | "medium" | "high";
  industry: string | null;
  location: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  owner: string;
  next_action: string | null;
  next_action_due: string | null;
  last_contacted: string | null;
  converted_project_id: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

function mapProspect(r: ProspectRow): ProspectRecord {
  return {
    id: r.id,
    businessName: r.business_name,
    mapsUrl: r.maps_url ?? undefined,
    currentSite: r.current_site ?? undefined,
    notes: r.notes ?? undefined,
    source: r.source,
    status: r.status,
    priority: r.priority,
    industry: r.industry ?? undefined,
    location: r.location ?? undefined,
    contactName: r.contact_name ?? undefined,
    contactEmail: r.contact_email ?? undefined,
    contactPhone: r.contact_phone ?? undefined,
    owner: r.owner,
    nextAction: r.next_action ?? undefined,
    nextActionDue: r.next_action_due ?? undefined,
    lastContacted: r.last_contacted ?? undefined,
    convertedProjectId: r.converted_project_id ?? undefined,
    tags: r.tags ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function listProspects(): Promise<ProspectRecord[]> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    // Table may not exist yet (migration not applied) — return empty
    // and let Diagnostics flag it instead of breaking the whole UI.
    if (/does not exist|relation/i.test(error.message)) return [];
    throw new Error(`listProspects: ${error.message}`);
  }
  return ((data ?? []) as ProspectRow[]).map(mapProspect);
}

async function getProspect(id: string): Promise<ProspectRecord | null> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getProspect: ${error.message}`);
  if (!data) return null;
  return mapProspect(data as ProspectRow);
}

async function createProspect(input: NewProspectInput): Promise<ProspectRecord> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const insert = {
    business_name: input.businessName,
    maps_url: input.mapsUrl ?? null,
    current_site: input.currentSite ?? null,
    notes: input.notes ?? null,
    source: input.source ?? "google-maps",
    status: input.status ?? "new",
    priority: input.priority ?? "medium",
    industry: input.industry ?? null,
    location: input.location ?? null,
    contact_name: input.contactName ?? null,
    contact_email: input.contactEmail ?? null,
    contact_phone: input.contactPhone ?? null,
    owner: input.owner ?? "Harrison",
    next_action: input.nextAction ?? null,
    next_action_due: input.nextActionDue ?? null,
    tags: input.tags ?? [],
  };
  const { data, error } = await supabase
    .from("prospects")
    .insert(insert)
    .select("*")
    .single();
  if (error) throw new Error(`createProspect: ${error.message}`);
  return mapProspect(data as ProspectRow);
}

async function updateProspectStatus(id: string, status: ProspectStatus): Promise<void> {
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = { status };
  if (status === "contacted") patch.last_contacted = new Date().toISOString();
  const { error } = await supabase.from("prospects").update(patch).eq("id", id);
  if (error) throw new Error(`updateProspectStatus: ${error.message}`);
}

async function convertProspectToClient(id: string, project: NewProjectInput): Promise<ProjectRecord> {
  const created = await createProject(project);
  if (!isSupabaseAdminConfigured()) notConfigured();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("prospects")
    .update({ status: "won", converted_project_id: created.id })
    .eq("id", id);
  if (error) throw new Error(`convertProspectToClient: ${error.message}`);
  return created;
}

// -------------------------------------------------------------
// Diagnostics
// -------------------------------------------------------------

async function runDiagnostics(): Promise<DiagnosticReport> {
  const checks: DiagnosticReport["checks"] = [];
  const now = new Date().toISOString();

  if (!isSupabaseAdminConfigured()) {
    checks.push({
      key: "supabase",
      label: "Supabase service role",
      status: "fail",
      detail: "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.",
      fixHint: "Set both in .env.local (or Netlify env vars) and redeploy with cache cleared.",
    });
    return { generatedAt: now, mode: "live", checks };
  }
  checks.push({
    key: "supabase",
    label: "Supabase service role",
    status: "ok",
    detail: "Service role key is configured.",
  });

  const supabase = getSupabaseAdmin();
  const TABLES: { table: string; label: string; hint?: string }[] = [
    { table: "projects", label: "projects table" },
    { table: "contacts", label: "contacts table" },
    { table: "credentials", label: "credentials table" },
    { table: "tasks", label: "tasks table" },
    { table: "incidents", label: "incidents table" },
    { table: "deployments", label: "deployments table" },
    { table: "quick_links", label: "quick_links table" },
    { table: "contracts", label: "contracts table" },
    { table: "runbooks", label: "runbooks table" },
    { table: "notifications", label: "notifications table" },
    { table: "audit_log", label: "audit_log table" },
    { table: "changelog", label: "changelog table" },
    {
      table: "prospects",
      label: "prospects table",
      hint: "Apply supabase/migrations/0003_prospects.sql in the Supabase SQL editor.",
    },
  ];

  for (const t of TABLES) {
    try {
      const { error, count } = await supabase
        .from(t.table)
        .select("*", { count: "exact", head: true });
      if (error) {
        if (/does not exist|relation/i.test(error.message)) {
          checks.push({
            key: t.table,
            label: t.label,
            status: "fail",
            detail: `Table missing: ${error.message}`,
            fixHint: t.hint ?? `Run all SQL in supabase/migrations/ via the Supabase SQL editor.`,
          });
        } else if (/permission denied|not authorized/i.test(error.message)) {
          checks.push({
            key: t.table,
            label: t.label,
            status: "fail",
            detail: error.message,
            fixHint: "Run supabase/migrations/0002_grants.sql to grant service_role.",
          });
        } else {
          checks.push({
            key: t.table,
            label: t.label,
            status: "warn",
            detail: error.message,
          });
        }
      } else {
        checks.push({
          key: t.table,
          label: t.label,
          status: "ok",
          detail: `${count ?? 0} row${count === 1 ? "" : "s"}.`,
        });
      }
    } catch (e) {
      checks.push({
        key: t.table,
        label: t.label,
        status: "fail",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { generatedAt: now, mode: "live", checks };
}

// -------------------------------------------------------------
// Adapter export
// -------------------------------------------------------------

export const liveAdapter: DataAdapter = {
  mode: "live",
  listProjects,
  listProjectSummaries,
  getProject,
  listContracts,
  listRunbooks,
  listNotifications,
  getDashboardStats,
  getActionQueue,
  getUpcomingRenewals,
  getProvidersGrouping,
  getProjectCompleteness,
  getRecentDeploys,
  createProject,
  listProspects,
  getProspect,
  createProspect,
  updateProspectStatus,
  convertProspectToClient,
  runDiagnostics,
};
