import type {
  ProjectRecord,
  ActionQueueItem,
  RenewalItem,
  ProviderGroup,
  ProjectCompleteness,
  DashboardStats,
  DeploymentRecord,
} from "@/lib/admin-types";
import type { ContractRecord, RunbookEntry, NotificationItem } from "@/lib/admin-schemas";

export type RecentDeploy = DeploymentRecord & { projectId: string; projectName: string };

/**
 * The single contract every data source must satisfy.
 * mock = JSON files, empty = always [], live = Supabase.
 * Switching between them is a topbar toggle for the operator.
 */
export interface DataAdapter {
  mode: "live" | "mock" | "empty";

  // Reads
  listProjects(): Promise<ProjectRecord[]>;
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
}
