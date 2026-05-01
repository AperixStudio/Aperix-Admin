import {
  getProjects,
  getProjectById,
  getContracts,
  getRunbooks,
  getNotifications,
  getDashboardStats,
  getActionQueue,
  getUpcomingRenewals,
  getProvidersGrouping,
  getProjectCompleteness,
  getRecentDeploys,
} from "@/lib/admin-data";
import { updateProject, appendToList, updateListItem, readList } from "@/lib/admin-store";
import type {
  DataAdapter,
  DiagnosticReport,
  NewProjectInput,
  NewProspectInput,
} from "@/lib/data/adapter";
import type { ProspectRecord, ProspectStatus, TaskItem, ContactRecord, CredentialReference, IncidentNote } from "@/lib/admin-types";
import type { ChangelogEntry, NotificationItem } from "@/lib/admin-schemas";

const PROSPECTS: ProspectRecord[] = [
  {
    id: "demo-prospect-1",
    businessName: "Demo Auto Repairs (mock)",
    mapsUrl: "https://maps.app.goo.gl/example1",
    currentSite: "https://demoautorepairs.example",
    notes: "Outdated 2010-era WordPress site, no mobile layout.",
    source: "google-maps",
    status: "new",
    priority: "medium",
    industry: "Automotive",
    location: "Geelong VIC",
    owner: "Harrison",
    tags: ["mock"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockAdapter: DataAdapter = {
  mode: "mock",
  listProjects: () => getProjects(),
  listProjectSummaries: async () =>
    (await getProjects()).map((p) => ({
      id: p.id,
      name: p.name,
      domain: p.domain,
      tier: p.tier,
      lead: p.lead,
      tags: p.tags,
    })),
  getProject: async (id) => (await getProjectById(id)) ?? null,
  listContracts: () => getContracts(),
  listRunbooks: () => getRunbooks(),
  listNotifications: () => getNotifications(),
  getDashboardStats: () => getDashboardStats(),
  getActionQueue: () => getActionQueue(),
  getUpcomingRenewals: () => getUpcomingRenewals(),
  getProvidersGrouping: () => getProvidersGrouping(),
  getProjectCompleteness: () => getProjectCompleteness(),
  getRecentDeploys: (limit) => getRecentDeploys(limit),
  createProject: async (_input: NewProjectInput) => {
    throw new Error("Mock mode is read-only. Switch to Live to create real records.");
  },
  listProspects: async () => PROSPECTS,
  getProspect: async (id) => PROSPECTS.find((p) => p.id === id) ?? null,
  createProspect: async (_input: NewProspectInput) => {
    throw new Error("Mock mode is read-only. Switch to Live to create real records.");
  },
  updateProspectStatus: async (_id: string, _status: ProspectStatus) => {
    throw new Error("Mock mode is read-only. Switch to Live to update prospects.");
  },
  updateProspect: async (_id: string) => {
    throw new Error("Mock mode is read-only. Switch to Live to update prospects.");
  },
  deleteProspect: async () => {
    throw new Error("Mock mode is read-only. Switch to Live to delete prospects.");
  },
  convertProspectToClient: async () => {
    throw new Error("Mock mode is read-only. Switch to Live to convert.");
  },
  createTask: async (projectId, input) => {
    const id = `tsk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const task: TaskItem = { id, ...input };
    await updateProject(projectId, (p) => ({ ...p, tasks: [task, ...(p.tasks ?? [])] }));
    return task;
  },
  updateTaskStatus: async (projectId, taskId, status) => {
    await updateProject(projectId, (p) => ({
      ...p,
      tasks: (p.tasks ?? []).map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
  },
  createContact: async (projectId, input) => {
    const id = `ctc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const contact: ContactRecord = { id, ...input };
    await updateProject(projectId, (p) => ({ ...p, contacts: [contact, ...(p.contacts ?? [])] }));
    return contact;
  },
  createCredential: async (projectId, input) => {
    const id = `crd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const cred: CredentialReference = { id, ...input };
    await updateProject(projectId, (p) => ({ ...p, credentials: [cred, ...(p.credentials ?? [])] }));
    return cred;
  },
  createIncident: async (projectId, input) => {
    const id = `inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const inc: IncidentNote = { id, timestamp: new Date().toISOString(), ...input };
    await updateProject(projectId, (p) => ({ ...p, incidents: [inc, ...(p.incidents ?? [])] }));
    return inc;
  },
  advanceIncident: async (projectId, incidentId, toState, postmortem) => {
    await updateProject(projectId, (p) => ({
      ...p,
      incidents: (p.incidents ?? []).map((i) => {
        if (i.id !== incidentId) return i;
        return {
          ...i,
          state: toState,
          severity: toState === "resolved" || toState === "postmortem" ? "resolved" : i.severity,
          resolvedAt: toState === "resolved" ? new Date().toISOString() : i.resolvedAt,
          postmortem: postmortem ?? i.postmortem,
        };
      }),
    }));
  },
  markNotificationRead: async (id) => {
    await updateListItem<NotificationItem>("notifications.json", id, (n) => ({ ...n, read: true }));
  },
  markAllNotificationsRead: async () => {
    const list = await readList<NotificationItem>("notifications.json");
    for (const n of list) {
      if (!n.read) await updateListItem<NotificationItem>("notifications.json", n.id, (x) => ({ ...x, read: true }));
    }
  },
  postChangelog: async (input) => {
    const id = `chg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const entry: ChangelogEntry = { id, date: new Date().toISOString(), ...input };
    await appendToList<ChangelogEntry>("changelog.json", entry);
    return entry;
  },
  runDiagnostics: async (): Promise<DiagnosticReport> => ({
    generatedAt: new Date().toISOString(),
    mode: "mock",
    checks: [
      { key: "mode", label: "Adapter", status: "ok", detail: "Running in mock mode (seeded JSON files)." },
    ],
  }),
};
