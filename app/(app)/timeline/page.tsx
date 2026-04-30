import type { Metadata } from "next";
import { AppShell } from "@/components/admin/app-shell";
import { TimelineGrid } from "@/components/admin/timeline-grid";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";

export const metadata: Metadata = {
  title: "Timeline | Aperix Admin",
  description: "12-month forward view of renewals, contracts, and milestones.",
};

export default async function TimelinePage() {
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const [projects, renewals, contracts] = await Promise.all([
    adapter.listProjects(),
    adapter.getUpcomingRenewals(),
    adapter.listContracts(),
  ]);

  return (
    <AppShell
      {...shell}
      activeView="timeline"
      title="Timeline"
      description="Renewals and contracts plotted across the next 12 months."
      brandKicker="Insights"
      shellTitle="Timeline"
      noteTitle="Color key"
      noteBody="Red = expired. Amber = under 60d. Blue = scheduled."
    >
      <TimelineGrid projects={projects} renewals={renewals} contracts={contracts} />
    </AppShell>
  );
}
