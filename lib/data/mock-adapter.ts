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
import type { DataAdapter, NewProjectInput } from "@/lib/data/adapter";

export const mockAdapter: DataAdapter = {
  mode: "mock",
  listProjects: () => getProjects(),
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
};
