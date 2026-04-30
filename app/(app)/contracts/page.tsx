import type { Metadata } from "next";
import { AppShell } from "@/components/admin/app-shell";
import { ContractsTable } from "@/components/admin/contracts-table";
import { EmptyState } from "@/components/admin/empty-state";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";

export const metadata: Metadata = {
  title: "Contracts | Aperix Admin",
  description: "MRR, ARR, and contract terms across all clients.",
};

export default async function ContractsPage() {
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const [contracts, projects] = await Promise.all([
    adapter.listContracts(),
    adapter.listProjects(),
  ]);

  return (
    <AppShell
      {...shell}
      activeView="contracts"
      title="Contracts"
      description="Recurring revenue and contract status across the portfolio."
      brandKicker="Records"
      shellTitle="Contracts"
      noteTitle="Export ready"
      noteBody="CSV download top-right. Pipe straight into accounting."
    >
      {contracts.length === 0 ? (
        <EmptyState icon="📄" title="No contracts yet" description={`No contract records in ${shell.dataMode} mode.`} />
      ) : (
        <ContractsTable contracts={contracts} projects={projects} />
      )}
    </AppShell>
  );
}
