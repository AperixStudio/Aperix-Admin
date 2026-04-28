import type { Metadata } from "next";
import { AppShell } from "@/components/admin/app-shell";
import { DependencyGraph } from "@/components/admin/dependency-graph";
import { EmptyState } from "@/components/admin/empty-state";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";

export const metadata: Metadata = {
  title: "Dependencies | Aperix Admin",
  description: "Provider blast radius across the portfolio.",
};

export default async function DependenciesPage() {
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const [providers, projects] = await Promise.all([
    adapter.getProvidersGrouping(),
    adapter.listProjects(),
  ]);

  return (
    <AppShell
      {...shell}
      activeView="dependencies"
      title="Dependencies"
      description="Which providers underpin which projects."
      brandKicker="Insights"
      shellTitle="Dependencies"
      noteTitle="Blast radius"
      noteBody="If a vendor goes down, this map shows who you call first."
    >
      {providers.length === 0 ? (
        <EmptyState icon="🔗" title="No dependencies tracked" description={`No provider data in ${shell.dataMode} mode.`} />
      ) : (
        <DependencyGraph providers={providers} projects={projects} />
      )}
    </AppShell>
  );
}
