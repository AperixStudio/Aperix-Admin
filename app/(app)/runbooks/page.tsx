import type { Metadata } from "next";
import { AppShell } from "@/components/admin/app-shell";
import { RunbookCard } from "@/components/admin/runbook-card";
import { EmptyState } from "@/components/admin/empty-state";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";

export const metadata: Metadata = {
  title: "Runbooks | Aperix Admin",
  description: "Step-by-step playbooks for common incidents and routines.",
};

export default async function RunbooksPage() {
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const runbooks = await adapter.listRunbooks();

  return (
    <AppShell
      {...shell}
      activeView="runbooks"
      title="Runbooks"
      description="The how-to library for everything that happens twice."
      brandKicker="Records"
      shellTitle="Runbooks"
      noteTitle="Living docs"
      noteBody="Edit JSON to evolve. Each runbook owner is on the hook for keeping it fresh."
    >
      {runbooks.length === 0 ? (
        <EmptyState
          icon="📘"
          title="No runbooks yet"
          description={shell.dataMode === "empty" ? "Empty mode — no records." : shell.dataMode === "live" ? "Live data has no runbooks. Add one in Supabase." : "No runbooks in mock data."}
        />
      ) : (
        <div className="runbook-grid">
          {runbooks.map((rb) => (
            <RunbookCard key={rb.id} runbook={rb} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
