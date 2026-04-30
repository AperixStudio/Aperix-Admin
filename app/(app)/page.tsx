import type { Metadata } from "next";
import { DashboardView } from "@/components/admin/dashboard-view";
import { getDashboardContent } from "@/lib/admin-data";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";

export const metadata: Metadata = {
  title: "Command Center | Aperix Admin",
  description: "Operational landing for Aperix Studio internal dashboard.",
};

export default async function DashboardPage() {
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const [content, projects, stats, actionQueue, renewals, recentDeploys, prospects] = await Promise.all([
    getDashboardContent(),
    adapter.listProjects(),
    adapter.getDashboardStats(),
    adapter.getActionQueue(),
    adapter.getUpcomingRenewals(),
    adapter.getRecentDeploys(8),
    adapter.listProspects(),
  ]);

  return (
    <DashboardView
      ui={shell.ui}
      content={content}
      projects={projects}
      stats={stats}
      actionQueue={actionQueue}
      renewals={renewals}
      recentDeploys={recentDeploys}
      prospects={prospects}
      shellExtras={shell}
    />
  );
}
