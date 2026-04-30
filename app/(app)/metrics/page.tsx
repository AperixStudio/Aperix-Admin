import type { Metadata } from "next";
import { AppShell } from "@/components/admin/app-shell";
import { MetricsCards } from "@/components/admin/metrics-cards";
import { EmptyState } from "@/components/admin/empty-state";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";

export const metadata: Metadata = {
  title: "Metrics | Aperix Admin",
  description: "DORA metrics and uptime across the portfolio.",
};

export default async function MetricsPage() {
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const projects = await adapter.listProjects();

  return (
    <AppShell
      {...shell}
      activeView="metrics"
      title="Metrics"
      description="DORA, uptime, and revenue at a glance."
      brandKicker="Insights"
      shellTitle="Metrics"
      noteTitle="Synthetic"
      noteBody="Computed from deployments + incidents in JSON. Wire to real telemetry to replace."
    >
      {projects.length === 0 ? (
        <EmptyState icon="📈" title="No metrics yet" description={`No projects in ${shell.dataMode} mode.`} />
      ) : (
        <MetricsCards projects={projects} />
      )}
    </AppShell>
  );
}
