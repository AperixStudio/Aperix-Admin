import { z } from "zod";

// ── Primitive enums ──────────────────────────────────────────
export const HealthStateSchema = z.enum(["healthy", "attention", "down", "neutral"]);
export const DeployStatusSchema = z.enum(["success", "failed", "building", "cancelled"]);
export const IncidentSeveritySchema = z.enum(["info", "warning", "critical", "resolved"]);
export const IncidentStateSchema = z.enum(["open", "investigating", "mitigated", "resolved", "postmortem"]);
export const QuickLinkCategorySchema = z.enum([
  "hosting", "repo", "dns", "email", "docs", "vault", "analytics", "other",
]);

// ── Composite schemas ────────────────────────────────────────
export const ActionItemSchema = z.object({
  label: z.string(),
  href: z.string(),
  primary: z.boolean().optional(),
});

export const ContactRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const CredentialReferenceSchema = z.object({
  id: z.string(),
  label: z.string(),
  location: z.string(),
  vaultUrl: z.string().optional(),
  ownedBy: z.string(),
  notes: z.string().optional(),
});

export const TaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string().optional(),
  owner: z.string(),
  status: z.enum(["open", "in-progress", "blocked", "done"]),
  due: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
});

export const DeploymentRecordSchema = z.object({
  id: z.string(),
  status: DeployStatusSchema,
  branch: z.string(),
  message: z.string(),
  timestamp: z.string(),
  duration: z.string(),
  actor: z.string(),
});

export const IncidentNoteSchema = z.object({
  id: z.string(),
  severity: IncidentSeveritySchema,
  title: z.string(),
  body: z.string(),
  timestamp: z.string(),
  author: z.string(),
  state: IncidentStateSchema.optional(),
  postmortem: z.string().optional(),
  resolvedAt: z.string().optional(),
});

export const ProjectRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  domain: z.string(),
}).passthrough();

/** Validate an array has unique ids; throws with a clear message. */
export function assertUniqueIds<T extends { id: string }>(records: T[], label: string): T[] {
  const seen = new Map<string, number>();
  records.forEach((r, i) => {
    const prev = seen.get(r.id);
    if (prev !== undefined) {
      throw new Error(`[${label}] duplicate id "${r.id}" at indices ${prev} and ${i}`);
    }
    seen.set(r.id, i);
  });
  return records;
}

export const ProjectsArraySchema = z.array(ProjectRecordSchema);

// ── New entity schemas ───────────────────────────────────────
export const ContractRecordSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  status: z.enum(["active", "trial", "paused", "ended"]),
  tier: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  mrr: z.number(),
  currency: z.string().default("AUD"),
  hoursAllotted: z.number().optional(),
  hoursUsed: z.number().optional(),
  notes: z.string().optional(),
});

export const RunbookEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(["incident", "deploy", "renewal", "onboarding", "security", "other"]),
  triggers: z.array(z.string()),
  steps: z.array(z.object({ title: z.string(), detail: z.string() })),
  owner: z.string(),
  lastReviewed: z.string().optional(),
});

export const ChangelogEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  kind: z.enum(["ship", "fix", "ops", "security", "internal"]),
  title: z.string(),
  body: z.string(),
  author: z.string(),
  projectIds: z.array(z.string()).optional(),
});

export const FeatureFlagSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  audience: z.enum(["all", "admin"]).default("all"),
  note: z.string().optional(),
});

export const NotificationItemSchema = z.object({
  id: z.string(),
  kind: z.enum(["alert", "info", "ops", "security", "changelog"]),
  title: z.string(),
  body: z.string(),
  timestamp: z.string(),
  href: z.string().optional(),
  read: z.boolean().default(false),
});

export const AuditEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  actor: z.string(),
  role: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  note: z.string().optional(),
});

export const MetricsSeriesPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});

export const MetricsHistorySchema = z.object({
  uptime: z.record(z.string(), z.array(MetricsSeriesPointSchema)),
  deployFrequency: z.record(z.string(), z.array(MetricsSeriesPointSchema)),
  lighthouse: z.record(z.string(), z.array(MetricsSeriesPointSchema)),
});

export type ContractRecord = z.infer<typeof ContractRecordSchema>;
export type RunbookEntry = z.infer<typeof RunbookEntrySchema>;
export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export type NotificationItem = z.infer<typeof NotificationItemSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type MetricsHistory = z.infer<typeof MetricsHistorySchema>;
