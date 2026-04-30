export type HealthState = "healthy" | "attention" | "down" | "neutral";
export type DeployStatus = "success" | "failed" | "building" | "cancelled";
export type IncidentSeverity = "info" | "warning" | "critical" | "resolved";
export type IncidentState = "open" | "investigating" | "mitigated" | "resolved" | "postmortem";
export type QuickLinkCategory = "hosting" | "repo" | "dns" | "email" | "docs" | "vault" | "analytics" | "other";

export interface ActionItem {
  label: string;
  href: string;
  primary?: boolean;
}

export interface FilterRule {
  field: string;
  match: string;
}

export type ViewKey =
  | "dashboard"
  | "client"
  | "repo"
  | "onboarding"
  | "audit"
  | "contracts"
  | "dependencies"
  | "metrics"
  | "runbooks"
  | "timeline"
  | "ai"
  | "settings"
  | "notifications";

export interface PrimaryNavItem {
  label: string;
  href: string;
  key: ViewKey;
}

export interface UiConfig {
  brandKicker: string;
  primaryNav: PrimaryNavItem[];
  viewTitles: Record<ViewKey, string>;
}

export interface ProjectLink {
  title: string;
  description: string;
}

export interface QuickLinkItem {
  label: string;
  url: string;
  category: QuickLinkCategory;
}

export interface DeploymentRecord {
  id: string;
  status: DeployStatus;
  branch: string;
  message: string;
  timestamp: string;
  duration: string;
  actor: string;
}

export interface IncidentNote {
  id: string;
  severity: IncidentSeverity;
  title: string;
  body: string;
  timestamp: string;
  author: string;
  state?: IncidentState;
  postmortem?: string;
  resolvedAt?: string;
}

export interface ActivityEntry {
  id: string;
  type: "deploy" | "note" | "check" | "alert" | "update";
  title: string;
  detail: string;
  timestamp: string;
  actor: string;
  state: HealthState;
}

export interface ProjectCheck {
  label: string;
  result: string;
  state: HealthState;
  lastRun: string;
}

export interface ProjectPriority {
  title: string;
  description: string;
}

export interface ContactRecord {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface CredentialReference {
  id: string;
  label: string;
  location: string;
  vaultUrl?: string;
  ownedBy: string;
  notes?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  detail?: string;
  owner: string;
  status: "open" | "in-progress" | "blocked" | "done";
  due?: string;
  priority: "low" | "medium" | "high";
}

export interface ProjectRecord {
  id: string;
  name: string;
  domain: string;
  stage: string;
  lead: string;
  support: string;
  tier: string;
  health: string;
  healthState: HealthState;
  hosting: string;
  registrar: string;
  dns: string;
  repo: string;
  repoStatus: string;
  deploy: string;
  summary: string;
  notes: string;
  // Navigation & external links
  liveUrl: string;
  stagingUrl?: string;
  repoUrl?: string;
  githubOrg: string;
  netlifySite?: string;
  domainExpiry?: string;
  sslExpiry?: string;
  lastActivity: string;
  tags: string[];
  /** Optional brand key for per-client accent tinting (e.g. "rhinos","hearthstone","apex","soothe","lumina"). */
  brandKey?: string;
  // Content
  links: ProjectLink[];
  quickLinks: QuickLinkItem[];
  checks: ProjectCheck[];
  priorities: ProjectPriority[];
  deployments: DeploymentRecord[];
  incidents: IncidentNote[];
  contacts?: ContactRecord[];
  credentials?: CredentialReference[];
  tasks?: TaskItem[];
}

export interface DashboardFilterConfig {
  title: string;
  description: string;
}

export interface DashboardStatConfig {
  key: "total" | "healthy" | "attention" | "ownerSplit";
  label: string;
  description: string;
}

export interface DashboardSectionListItem {
  title: string;
  description: string;
}

export interface DashboardAlertRow {
  site: string;
  issue: string;
  owner: string;
}

export interface DashboardContent {
  title: string;
  description: string;
  noteTitle: string;
  noteBody: string;
  actions?: ActionItem[];
  activityTitle?: string;
  filters: string[];
  filterConfig?: Record<string, FilterRule>;
  stats: DashboardStatConfig[];
  board: DashboardFilterConfig;
  overview: {
    title: string;
    description: string;
    items: DashboardSectionListItem[];
  };
  alerts: {
    title: string;
    rows: DashboardAlertRow[];
  };
  activity?: ActivityEntry[];
  design: {
    title: string;
    description: string;
    callout: string;
  };
}

export interface ClientDetailContent {
  noteTitle: string;
  noteBody: string;
  secondaryLabel: string;
  actions?: ActionItem[];
  sections: {
    snapshot: string;
    platform: string;
    links: string;
    quickActions: string;
    checks: string;
    priorities: string;
    notes: string;
    deployments: string;
    incidents: string;
    contacts: string;
    credentials: string;
    tasks: string;
    future: string;
  };
  futureDescription: string;
}

export interface RepoSecondaryItem {
  label: string;
  href: string;
}

export interface RepoTreeSection {
  title: string;
  heading: string;
  tree: string;
}

export interface RepoPurposeItem {
  title: string;
  description: string;
}

export interface RepoFlowItem {
  title: string;
  description: string;
}

export interface RepoWhyRow {
  problem: string;
  fix: string;
}

export interface RepoContent {
  title: string;
  description: string;
  secondaryLabel: string;
  secondaryItems: RepoSecondaryItem[];
  actions?: ActionItem[];
  noteTitle: string;
  noteBody: string;
  layout: RepoTreeSection;
  repoPurposes: {
    title: string;
    items: RepoPurposeItem[];
  };
  clientPattern: RepoTreeSection;
  flow: {
    title: string;
    items: RepoFlowItem[];
  };
  why: {
    title: string;
    rows: RepoWhyRow[];
  };
  liveExamples: {
    title: string;
  };
  design: {
    title: string;
    callout: string;
  };
}

export interface DashboardStats {
  total: number;
  healthy: number;
  attention: number;
  ownerCounts: Record<string, number>;
}

// ── Derived ops data ──────────────────────────────────────────
export interface RenewalItem {
  projectId: string;
  projectName: string;
  type: "domain" | "ssl";
  label: string;          // raw expiry string from project, e.g. "Mar 2027"
  monthsUntil: number;    // negative = expired
  urgency: "ok" | "soon" | "urgent" | "expired" | "unknown";
}

export interface ActionQueueItem {
  id: string;
  projectId: string;
  projectName: string;
  source: "task" | "incident" | "check" | "renewal";
  title: string;
  detail: string;
  owner: string;
  priority: "low" | "medium" | "high";
  href: string;
}

export interface ProjectCompleteness {
  projectId: string;
  filledCount: number;
  totalCount: number;
  percentage: number;
  missing: string[];
}

export interface ProviderGroup {
  type: "hosting" | "dns" | "registrar";
  name: string;            // e.g. "Netlify"
  projectIds: string[];
  count: number;
}

// ── Operations view content ──────────────────────────────────
export interface OperationsContent {
  title: string;
  description: string;
  noteTitle: string;
  noteBody: string;
  actions?: ActionItem[];
  sections: {
    renewals: string;
    actionQueue: string;
    providers: string;
    setupHealth: string;
    recentDeploys: string;
    openIncidents: string;
  };
  copy: {
    renewalsEmpty: string;
    actionQueueEmpty: string;
    setupHealthHint: string;
  };
}

// ── Prospects (lead generation) ──────────────────────────────
export type ProspectStatus =
  | "new"
  | "researching"
  | "contacted"
  | "meeting"
  | "won"
  | "lost"
  | "dormant";

export type ProspectSource =
  | "google-maps"
  | "referral"
  | "cold-list"
  | "event"
  | "inbound"
  | "other";

export interface ProspectRecord {
  id: string;
  businessName: string;
  mapsUrl?: string;
  currentSite?: string;
  notes?: string;
  source: ProspectSource;
  status: ProspectStatus;
  priority: "low" | "medium" | "high";
  industry?: string;
  location?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  owner: string;
  nextAction?: string;
  nextActionDue?: string;
  lastContacted?: string;
  convertedProjectId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Onboarding template content ──────────────────────────────
export interface OnboardingFieldGroup {
  title: string;
  description: string;
  fields: { label: string; hint: string; required?: boolean }[];
}

export interface OnboardingContent {
  title: string;
  description: string;
  noteTitle: string;
  noteBody: string;
  actions?: ActionItem[];
  intro: { title: string; body: string };
  groups: OnboardingFieldGroup[];
  nextSteps: { title: string; description: string }[];
}