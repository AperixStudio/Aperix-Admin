import type { DataAdapter, NewProjectInput } from "@/lib/data/adapter";

/**
 * Empty adapter — what a fresh, real install looks like before
 * any data is entered. Useful for screenshots, demos, and to
 * confirm the UI degrades gracefully.
 */
export const emptyAdapter: DataAdapter = {
  mode: "empty",
  listProjects: async () => [],
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
};
