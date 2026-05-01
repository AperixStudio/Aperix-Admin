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
import type {
  DataAdapter,
  DiagnosticReport,
  NewProjectInput,
  NewProspectInput,
} from "@/lib/data/adapter";
import type { ProspectRecord, ProspectStatus } from "@/lib/admin-types";

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
  convertProspectToClient: async () => {
    throw new Error("Mock mode is read-only. Switch to Live to convert.");
  },
  runDiagnostics: async (): Promise<DiagnosticReport> => ({
    generatedAt: new Date().toISOString(),
    mode: "mock",
    checks: [
      { key: "mode", label: "Adapter", status: "ok", detail: "Running in mock mode (seeded JSON files)." },
    ],
  }),
};
