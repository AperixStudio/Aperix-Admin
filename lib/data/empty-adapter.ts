import type { DataAdapter, DiagnosticReport, NewProjectInput, NewProspectInput } from "@/lib/data/adapter";

/**
 * Empty adapter — what a fresh, real install looks like before
 * any data is entered. Useful for screenshots, demos, and to
 * confirm the UI degrades gracefully.
 */
export const emptyAdapter: DataAdapter = {
  mode: "empty",
  listProjects: async () => [],
  listProjectSummaries: async () => [],
  getProject: async () => null,
  listContracts: async () => [],
  listRunbooks: async () => [],
  listNotifications: async () => [],
  getDashboardStats: async () => ({ total: 0, healthy: 0, attention: 0, ownerCounts: {} }),
  getActionQueue: async () => [],
  getUpcomingRenewals: async () => [],
  getProvidersGrouping: async () => [],
  getProjectCompleteness: async () => [],
  getRecentDeploys: async () => [],
  createProject: async (_input: NewProjectInput) => {
    throw new Error("Empty mode is read-only. Switch to Live to create real records.");
  },
  listProspects: async () => [],
  getProspect: async () => null,
  createProspect: async (_input: NewProspectInput) => {
    throw new Error("Empty mode is read-only. Switch to Live to create real records.");
  },
  updateProspectStatus: async () => {
    throw new Error("Empty mode is read-only.");
  },
  convertProspectToClient: async () => {
    throw new Error("Empty mode is read-only.");
  },
  runDiagnostics: async (): Promise<DiagnosticReport> => ({
    generatedAt: new Date().toISOString(),
    mode: "empty",
    checks: [
      { key: "mode", label: "Adapter", status: "ok", detail: "Empty mode — every read returns []." },
    ],
  }),
};
