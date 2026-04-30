import type { Metadata } from "next";
import { AppShell } from "@/components/admin/app-shell";
import { AiQueryBox } from "@/components/admin/ai-query-box";
import { EmptyState } from "@/components/admin/empty-state";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";
import { isFlagOn } from "@/lib/flags";

export const metadata: Metadata = {
  title: "AI Query | Aperix Admin",
  description: "Ask questions in natural language about your portfolio.",
};

export default async function AiPage() {
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const [projects, renewals, enabled] = await Promise.all([
    adapter.listProjects(),
    adapter.getUpcomingRenewals(),
    isFlagOn("ai-query"),
  ]);

  return (
    <AppShell
      {...shell}
      activeView="ai"
      title="AI Query"
      description="Heuristic answers across projects, contracts, and incidents."
      brandKicker="Tools"
      shellTitle="AI"
      noteTitle="Local-only"
      noteBody="No data leaves the workspace. Drop in an LLM adapter to upgrade."
    >
      {enabled ? (
        <AiQueryBox projects={projects} renewals={renewals} />
      ) : (
        <EmptyState
          icon="🤖"
          title="AI Query is disabled"
          description="Toggle the ai-query flag in settings to enable."
        />
      )}
    </AppShell>
  );
}
