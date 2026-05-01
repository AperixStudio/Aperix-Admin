import type {
  ProjectRecord,
  ActionQueueItem,
  RenewalItem,
  ProviderGroup,
  ProjectCompleteness,
  DashboardStats,
  DeploymentRecord,
  ProspectRecord,
  ProspectStatus,
  ProspectSource,
} from "@/lib/admin-types";
import type { ContractRecord, RunbookEntry, NotificationItem } from "@/lib/admin-schemas";

export type RecentDeploy = DeploymentRecord & { projectId: string; projectName: string };

export interface ProjectSummary {
  id: string;
  name: string;
  domain?: string;
  tier?: string;
  lead?: string;
  tags?: string[];
}

/**
 * The single contract every data source must satisfy.
 * mock = JSON files, empty = always [], live = Supabase.
 * Switching between them is a topbar toggle for the operator.
 */
export interface DataAdapter {
  mode: "live" | "mock" | "empty";

  // Reads
  listProjects(): Promise<ProjectRecord[]>;
  listProjectSummaries(): Promise<ProjectSummary[]>;
  getProject(id: string): Promise<ProjectRecord | null>;
  listContracts(): Promise<ContractRecord[]>;
  listRunbooks(): Promise<RunbookEntry[]>;
  listNotifications(): Promise<NotificationItem[]>;

  // Derived helpers (computed from above; same on every adapter)
  getDashboardStats(): Promise<DashboardStats>;
  getActionQueue(): Promise<ActionQueueItem[]>;
  getUpcomingRenewals(): Promise<RenewalItem[]>;
  getProvidersGrouping(): Promise<ProviderGroup[]>;
  getProjectCompleteness(): Promise<ProjectCompleteness[]>;
  getRecentDeploys(limit?: number): Promise<RecentDeploy[]>;

  // Writes (mutations) — empty + mock implement; live writes to Supabase
  createProject(input: NewProjectInput): Promise<ProjectRecord>;

  // Prospects (lead generation pipeline)
  listProspects(): Promise<ProspectRecord[]>;
  getProspect(id: string): Promise<ProspectRecord | null>;
  createProspect(input: NewProspectInput): Promise<ProspectRecord>;
  updateProspectStatus(id: string, status: ProspectStatus): Promise<void>;
  convertProspectToClient(id: string, project: NewProjectInput): Promise<ProjectRecord>;

  // Diagnostics — used by Settings → Diagnostics. Each row reports
  // whether a logical resource is reachable. Implementation differs
  // per adapter (live pings Supabase; mock/empty just summarise).
  runDiagnostics(): Promise<DiagnosticReport>;
}

export interface DiagnosticCheck {
  key: string;
  label: string;
  status: "ok" | "warn" | "fail";
  detail: string;
  fixHint?: string;
}

export interface DiagnosticReport {
  generatedAt: string;
  mode: "live" | "mock" | "empty";
  checks: DiagnosticCheck[];
}

export interface NewProspectInput {
  businessName: string;
  mapsUrl?: string;
  currentSite?: string;
  notes?: string;
  source?: ProspectSource;
  status?: ProspectStatus;
  priority?: "low" | "medium" | "high";
  industry?: string;
  location?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  owner?: string;
  nextAction?: string;
  nextActionDue?: string;
  tags?: string[];
}

export interface NewProjectInput {
  id: string;
  name: string;
  summary: string;
  lead: string;
  support?: string;
  tier: "essential" | "standard" | "premium" | "enterprise" | "internal";
  domain?: string;
  hosting?: string;
  registrar?: string;
  githubRepo?: string;
  brandKey?: string;
  // Extended profile (optional — captured at onboarding when known)
  liveUrl?: string;
  stagingUrl?: string;
  notes?: string;
  tags?: string[];
}
