"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { notifySlack } from "@/lib/notify";
import { setDataMode as persistDataMode } from "@/lib/data-mode";
import type { DataMode } from "@/lib/data-mode";
import type { ChangelogEntry, NotificationItem } from "@/lib/admin-schemas";
import type { IncidentNote, TaskItem } from "@/lib/admin-types";

// ── Tasks ────────────────────────────────────────────────────
const TaskInput = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2),
  detail: z.string().optional().default(""),
  owner: z.string().min(1),
  status: z.enum(["open", "in-progress", "blocked", "done"]).default("open"),
  due: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function createTask(formData: FormData) {
  const parsed = TaskInput.parse(Object.fromEntries(formData.entries()));
  const { getAdapter } = await import("@/lib/data");
  const adapter = await getAdapter();
  const task = await adapter.createTask(parsed.projectId, {
    title: parsed.title,
    detail: parsed.detail,
    owner: parsed.owner,
    status: parsed.status,
    due: parsed.due,
    priority: parsed.priority,
  });
  await logAudit({
    action: "create",
    entityType: "task",
    entityId: task.id,
    after: task,
    note: `on ${parsed.projectId}`,
  });
  revalidatePath(`/clients/${parsed.projectId}`);
  revalidatePath("/");
}

export async function setTaskStatus(projectId: string, taskId: string, status: TaskItem["status"]) {
  const { getAdapter } = await import("@/lib/data");
  const adapter = await getAdapter();
  await adapter.updateTaskStatus(projectId, taskId, status);
  await logAudit({
    action: "update",
    entityType: "task",
    entityId: taskId,
    note: `status → ${status}`,
  });
  revalidatePath(`/clients/${projectId}`);
}

// ── Contacts ─────────────────────────────────────────────────
const ContactInput = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2),
  role: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function createContact(formData: FormData) {
  const parsed = ContactInput.parse(Object.fromEntries(formData.entries()));
  const { getAdapter } = await import("@/lib/data");
  const adapter = await getAdapter();
  const contact = await adapter.createContact(parsed.projectId, {
    name: parsed.name,
    role: parsed.role,
    email: parsed.email,
    phone: parsed.phone,
    notes: parsed.notes,
  });
  await logAudit({
    action: "create",
    entityType: "contact",
    entityId: contact.id,
    after: contact,
    note: `on ${parsed.projectId}`,
  });
  revalidatePath(`/clients/${parsed.projectId}`);
}

// ── Credentials ──────────────────────────────────────────────
const CredentialInput = z.object({
  projectId: z.string().min(1),
  label: z.string().min(2),
  location: z.string().min(1),
  vaultUrl: z.string().optional(),
  ownedBy: z.string().min(1),
  notes: z.string().optional(),
});

export async function createCredential(formData: FormData) {
  const parsed = CredentialInput.parse(Object.fromEntries(formData.entries()));
  const { getAdapter } = await import("@/lib/data");
  const adapter = await getAdapter();
  const cred = await adapter.createCredential(parsed.projectId, {
    label: parsed.label,
    location: parsed.location,
    vaultUrl: parsed.vaultUrl,
    ownedBy: parsed.ownedBy,
    notes: parsed.notes,
  });
  await logAudit({
    action: "create",
    entityType: "credential",
    entityId: cred.id,
    after: { ...cred, location: "[redacted]" },
    note: `on ${parsed.projectId}`,
  });
  revalidatePath(`/clients/${parsed.projectId}`);
}

export async function revealCredential(projectId: string, credentialId: string, reason: string) {
  await logAudit({
    action: "reveal",
    entityType: "credential",
    entityId: credentialId,
    note: `project=${projectId} reason="${reason}"`,
  });
  return { ok: true, message: "Reveal logged. (Vault integration not configured.)" };
}

// ── Incidents (with lifecycle) ───────────────────────────────
const IncidentInput = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2),
  body: z.string().default(""),
  severity: z.enum(["info", "warning", "critical"]).default("warning"),
});

export async function createIncident(formData: FormData) {
  const parsed = IncidentInput.parse(Object.fromEntries(formData.entries()));
  const s = await getSession();
  const { getAdapter } = await import("@/lib/data");
  const adapter = await getAdapter();
  const inc = await adapter.createIncident(parsed.projectId, {
    severity: parsed.severity,
    title: parsed.title,
    body: parsed.body,
    author: s.user,
    state: "open",
  });
  await logAudit({
    action: "create",
    entityType: "incident",
    entityId: inc.id,
    after: inc,
    note: `on ${parsed.projectId}`,
  });
  if (parsed.severity === "critical") {
    await notifySlack({
      title: `🚨 ${inc.title}`,
      body: `${inc.body}\nProject: ${parsed.projectId}`,
      severity: "critical",
    });
  }
  revalidatePath(`/clients/${parsed.projectId}`);
}

export async function advanceIncident(
  projectId: string,
  incidentId: string,
  toState: NonNullable<IncidentNote["state"]>,
  postmortem?: string
) {
  const currentState = toState; // validation happens client-side via TRANSITIONS
  const { getAdapter } = await import("@/lib/data");
  const adapter = await getAdapter();
  await adapter.advanceIncident(projectId, incidentId, toState, postmortem);
  await logAudit({
    action: "transition",
    entityType: "incident",
    entityId: incidentId,
    note: `→ ${currentState}`,
  });
  revalidatePath(`/clients/${projectId}`);
}

// ── Changelog (folded into notifications kind=changelog) ─────
const ChangelogInput = z.object({
  kind: z.enum(["ship", "fix", "ops", "security", "internal"]),
  title: z.string().min(2),
  body: z.string().default(""),
});

export async function postChangelog(formData: FormData) {
  const s = await getSession();
  const parsed = ChangelogInput.parse(Object.fromEntries(formData.entries()));
  const { getAdapter } = await import("@/lib/data");
  const adapter = await getAdapter();
  const entry = await adapter.postChangelog({
    kind: parsed.kind,
    title: parsed.title,
    body: parsed.body,
    author: s.user,
  });
  await logAudit({ action: "create", entityType: "changelog", entityId: entry.id, after: entry });
  revalidatePath("/notifications");
}

// ── Notifications ────────────────────────────────────────────
export async function markNotificationRead(id: string) {
  const { getAdapter } = await import("@/lib/data");
  const adapter = await getAdapter();
  await adapter.markNotificationRead(id);
  revalidatePath("/");
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const { getAdapter } = await import("@/lib/data");
  const adapter = await getAdapter();
  await adapter.markAllNotificationsRead();
  revalidatePath("/");
  revalidatePath("/notifications");
}

// ── Data mode toggle ─────────────────────────────────────────
export async function setDataMode(mode: DataMode) {
  await persistDataMode(mode);
  await logAudit({ action: "data-mode", entityType: "session", entityId: "self", note: `→ ${mode}` });
  revalidatePath("/", "layout");
}

// ── New client (onboarding) ──────────────────────────────────
const NewClientInput = z.object({
  id: z.string().min(2).regex(/^[a-z0-9-]+$/, "id must be lowercase letters, numbers and dashes"),
  name: z.string().min(2),
  summary: z.string().min(2),
  lead: z.string().min(1),
  support: optStr,
  tier: z.enum(["essential", "standard", "premium", "enterprise", "internal"]).default("essential"),
  domain: optStr,
  hosting: optStr,
  registrar: optStr,
  githubRepo: optStr,
  brandKey: optStr,
  liveUrl: optStr,
  stagingUrl: optStr,
  notes: optStr,
  tags: optStr, // comma-separated
});

export async function createClient(_prev: unknown, formData: FormData) {
  try {
    const parsed = NewClientInput.parse(Object.fromEntries(formData.entries()));
    const tags = parsed.tags
      ? parsed.tags.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const { getAdapter } = await import("@/lib/data");
    const adapter = await getAdapter();
    const created = await adapter.createProject({ ...parsed, tags });
    await logAudit({
      action: "create",
      entityType: "project",
      entityId: created.id,
      note: `Created via onboarding form (mode=${adapter.mode})`,
    });
    revalidatePath("/");
    revalidatePath("/onboarding");
    revalidatePath(`/clients/${created.id}`);
    return { ok: true as const, id: created.id, name: created.name };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to create client." };
  }
}

// ── Prospects (lead generation) ──────────────────────────────
// Helper: blank form fields submit as "" — coerce them to undefined so
// the live adapter sees null instead of an empty string (which would
// cause a Postgres error on the `date` column, among others).
const optStr = z.string().optional().transform((v) => v === "" ? undefined : v);

const NewProspectInput = z.object({
  businessName: z.string().min(2),
  mapsUrl: optStr,
  currentSite: optStr,
  notes: optStr,
  source: z.enum(["google-maps", "referral", "cold-list", "event", "inbound", "other"]).default("google-maps"),
  status: z.enum(["new", "researching", "contacted", "meeting", "won", "lost", "dormant"]).default("new"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  industry: optStr,
  location: optStr,
  contactName: optStr,
  contactEmail: optStr,
  contactPhone: optStr,
  owner: optStr,
  nextAction: optStr,
  nextActionDue: optStr,
  tags: optStr, // comma-separated
});

export async function createProspect(_prev: unknown, formData: FormData) {
  try {
    const parsed = NewProspectInput.parse(Object.fromEntries(formData.entries()));
    const tags = parsed.tags
      ? parsed.tags.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const { getAdapter } = await import("@/lib/data");
    const adapter = await getAdapter();
    const created = await adapter.createProspect({ ...parsed, tags });
    await logAudit({
      action: "create",
      entityType: "prospect",
      entityId: created.id,
      after: { businessName: created.businessName, status: created.status },
      note: `Created via onboarding form (mode=${adapter.mode})`,
    });
    revalidatePath("/prospects");
    revalidatePath("/onboarding");
    revalidatePath("/");
    return { ok: true as const, id: created.id, businessName: created.businessName };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to create prospect." };
  }
}

const ProspectStatusInput = z.object({
  id: z.string().min(1),
  status: z.enum(["new", "researching", "contacted", "meeting", "won", "lost", "dormant"]),
});

export async function setProspectStatus(formData: FormData) {
  const parsed = ProspectStatusInput.parse(Object.fromEntries(formData.entries()));
  const { getAdapter } = await import("@/lib/data");
  const adapter = await getAdapter();
  await adapter.updateProspectStatus(parsed.id, parsed.status);
  await logAudit({
    action: "update",
    entityType: "prospect",
    entityId: parsed.id,
    note: `status → ${parsed.status}`,
  });
  revalidatePath("/prospects");
}

// ── Diagnostics ──────────────────────────────────────────────
export async function runDiagnostics() {
  const { getAdapter } = await import("@/lib/data");
  const adapter = await getAdapter();
  return adapter.runDiagnostics();
}

// ── Prefs ────────────────────────────────────────────────────
export async function setPrefs(prefs: { theme?: string; density?: string }) {
  const c = await cookies();
  const current = c.get("aperix_prefs")?.value;
  let merged: Record<string, string> = {};
  try {
    merged = current ? JSON.parse(current) : {};
  } catch {
    /* ignore */
  }
  merged = { ...merged, ...prefs };
  c.set("aperix_prefs", JSON.stringify(merged), { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}
