import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/admin/app-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";

export const metadata: Metadata = {
  title: "Clients | Aperix Admin",
  description: "All Aperix Studio clients with quick health and contract status.",
};

const HEALTH_LABEL: Record<string, string> = {
  healthy: "Healthy",
  attention: "Attention",
  down: "Down",
  neutral: "Neutral",
};

export default async function ClientsIndexPage() {
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const [projects, completeness] = await Promise.all([
    adapter.listProjects(),
    adapter.getProjectCompleteness(),
  ]);
  const completenessById = new Map(completeness.map((c) => [c.projectId, c]));

  return (
    <AppShell
      {...shell}
      activeView="client"
      title="Clients"
      description="Every project Aperix Studio currently looks after."
      brandKicker="Records"
      shellTitle="Clients"
      noteTitle="Click a row"
      noteBody="Drill into a client for hosting, contacts, deploys and credentials."
      actions={
        <Link className="btn primary" href="/onboarding">+ New client</Link>
      }
    >
      {projects.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="No clients in this view"
          description={
            shell.dataMode === "empty"
              ? "Empty mode — no records. Switch to Mock or Live to see data."
              : shell.dataMode === "live"
              ? "Live mode is connected but has no projects yet. Add one via New client."
              : "No projects in mock data."
          }
          action={
            <Link className="btn primary" href="/onboarding">+ New client</Link>
          }
        />
      ) : (
        <div className="panel section">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Tier</th>
                <th>Lead</th>
                <th>Domain</th>
                <th>Health</th>
                <th>Completeness</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const c = completenessById.get(p.id);
                const pct = c?.percentage ?? 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/clients/${p.id}`} className="link-cell">
                        <strong>{p.name}</strong>
                        <span className="muted" style={{ display: "block", fontSize: 12 }}>{p.summary}</span>
                      </Link>
                    </td>
                    <td><span className="chip">{p.tier}</span></td>
                    <td>{p.lead}</td>
                    <td className="muted">{p.domain ?? "—"}</td>
                    <td>
                      <span className={`pill pill-${p.healthState}`}>
                        {HEALTH_LABEL[p.healthState] ?? p.healthState}
                      </span>
                    </td>
                    <td>
                      <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                      <span className="muted" style={{ fontSize: 12 }}>{pct}%</span>
                    </td>
                    <td><Link className="btn-text" href={`/clients/${p.id}`}>Open →</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
