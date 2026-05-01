import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardView } from "@/components/admin/dashboard-view";
import { getDashboardContent } from "@/lib/admin-data";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";
import type { DashboardContent } from "@/lib/admin-types";

export const metadata: Metadata = {
  title: "Command Center | Aperix Admin",
  description: "Operational landing for Aperix Studio internal dashboard.",
};

export default async function DashboardPage() {
  const [shell, content] = await Promise.all([
    getShellProps(),
    getDashboardContent(),
  ]);

  return (
    <Suspense fallback={<DashboardFallback shell={shell} content={content} />}>
      <DashboardData shell={shell} content={content} />
    </Suspense>
  );
}

async function DashboardData({
  shell,
  content,
}: {
  shell: Awaited<ReturnType<typeof getShellProps>>;
  content: DashboardContent;
}) {
  const adapter = await getAdapter();
  const [projects, stats, actionQueue, renewals, recentDeploys, prospects] = await Promise.all([
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

function DashboardFallback({
  shell,
  content,
}: {
  shell: Awaited<ReturnType<typeof getShellProps>>;
  content: DashboardContent;
}) {
  return (
    <DashboardView
      ui={shell.ui}
      content={content}
      projects={[]}
      stats={{ total: 0, healthy: 0, attention: 0, ownerCounts: {} }}
      actionQueue={[]}
      renewals={[]}
      recentDeploys={[]}
      prospects={[]}
      shellExtras={shell}
    />
  );
}
