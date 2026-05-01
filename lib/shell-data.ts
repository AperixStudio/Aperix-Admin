import { cache } from "react";
import { getUiConfig } from "@/lib/admin-data";
import { getSession } from "@/lib/auth";
import { getAdapter } from "@/lib/data";
import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { buildSearchIndex } from "@/lib/search";

/** One call to assemble shared topbar/sidebar data for any AppShell. */
export const getShellProps = cache(async function getShellProps() {
  const adapter = await getAdapter();
  const [ui, projects, notifications, session, mode] = await Promise.all([
    getUiConfig(),
    adapter.listProjects(),
    adapter.listNotifications(),
    getSession(),
    getDataMode(),
  ]);
  return {
    ui,
    notifications,
    user: session.user,
    clients: projects.map((p) => ({ id: p.id, name: p.name })),
    firstClientId: projects[0]?.id,
    searchIndex: buildSearchIndex(projects),
    dataMode: mode,
    liveConfigured: isLiveConfigured(),
  };
});
