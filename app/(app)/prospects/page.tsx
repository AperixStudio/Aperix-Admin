import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/admin/app-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { ProspectStatusButtons } from "@/components/admin/prospect-status-buttons";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";
import type { ProspectStatus } from "@/lib/admin-types";

export const metadata: Metadata = {
  title: "Prospects | Aperix Admin",
  description: "Targeted leads — businesses we are researching for outreach.",
};

const STATUS_LABEL: Record<ProspectStatus, string> = {
  new: "New",
  researching: "Researching",
  contacted: "Contacted",
  meeting: "Meeting",
  won: "Won",
  lost: "Lost",
  dormant: "Dormant",
};

const PIPELINE: ProspectStatus[] = ["new", "researching", "contacted", "meeting"];

export default async function ProspectsPage() {
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const prospects = await adapter.listProspects();

  const grouped: Record<ProspectStatus, typeof prospects> = {
    new: [], researching: [], contacted: [], meeting: [], won: [], lost: [], dormant: [],
  };
  for (const p of prospects) grouped[p.status].push(p);

  return (
    <AppShell
      {...shell}
      activeView={"client" as const}
      title="Prospects"
      description="Businesses we&rsquo;re targeting for outreach. Saved straight from the field (Google Maps + notes)."
      brandKicker="Records"
      shellTitle="Prospects"
      noteTitle="Working the pipeline"
      noteBody="Move cards along as you research, contact, meet, then convert."
      actions={
        <Link className="btn primary" href="/onboarding">+ New prospect</Link>
      }
    >
      {prospects.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No prospects yet"
          description="Save your first lead from /onboarding (toggle to &ldquo;New prospect&rdquo;)."
          action={<Link className="btn primary" href="/onboarding">+ New prospect</Link>}
        />
      ) : (
        <>
          <section className="prospect-board">
            {PIPELINE.map((status) => (
              <div key={status} className="panel section prospect-column">
                <h3>{STATUS_LABEL[status]} <span className="muted">({grouped[status].length})</span></h3>
                {grouped[status].length === 0 ? (
                  <p className="muted" style={{ fontSize: 13 }}>—</p>
                ) : (
                  <div className="card-list">
                    {grouped[status].map((p) => (
                      <article key={p.id} className="site-card prospect-card">
                        <div className="card-head">
                          <div>
                            <h4 className="card-title">{p.businessName}</h4>
                            {p.location || p.industry ? (
                              <p className="card-sub">
                                {[p.industry, p.location].filter(Boolean).join(" · ")}
                              </p>
                            ) : null}
                          </div>
                          <span className={`badge prio-${p.priority}`}>{p.priority}</span>
                        </div>
                        {p.notes ? (
                          <p className="card-sub" style={{ marginTop: 8 }}>{p.notes}</p>
                        ) : null}
                        <div className="badges" style={{ marginTop: 10 }}>
                          {p.mapsUrl ? (
                            <a
                              className="badge"
                              href={p.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >📍 Maps</a>
                          ) : null}
                          {p.currentSite ? (
                            <a
                              className="badge"
                              href={p.currentSite}
                              target="_blank"
                              rel="noopener noreferrer"
                            >🔗 Current site</a>
                          ) : null}
                          {p.contactPhone ? (
                            <a className="badge" href={`tel:${p.contactPhone}`}>📞 {p.contactPhone}</a>
                          ) : null}
                          {p.contactEmail ? (
                            <a className="badge" href={`mailto:${p.contactEmail}`}>✉ {p.contactEmail}</a>
                          ) : null}
                        </div>
                        {p.nextAction ? (
                          <p style={{ marginTop: 10, fontSize: 12 }}>
                            <strong>Next:</strong> {p.nextAction}{p.nextActionDue ? ` · ${p.nextActionDue}` : ""}
                          </p>
                        ) : null}
                        <ProspectStatusButtons id={p.id} current={p.status} />
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>

          {(grouped.won.length + grouped.lost.length + grouped.dormant.length) > 0 ? (
            <section className="panel section" style={{ marginTop: 18 }}>
              <h3>Closed</h3>
              <table className="table">
                <thead>
                  <tr><th>Business</th><th>Status</th><th>Owner</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {[...grouped.won, ...grouped.lost, ...grouped.dormant].map((p) => (
                    <tr key={p.id}>
                      <td>{p.businessName}</td>
                      <td><span className={`pill pill-${p.status}`}>{STATUS_LABEL[p.status]}</span></td>
                      <td>{p.owner}</td>
                      <td className="muted">{p.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </>
      )}
    </AppShell>
  );
}
