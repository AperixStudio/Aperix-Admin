import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/admin/app-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { ProspectCrud } from "@/components/admin/prospect-crud";
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
const CLOSED: ProspectStatus[] = ["won", "lost", "dormant"];

export default async function ProspectsPage() {
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const prospects = await adapter.listProspects();

  const grouped: Record<ProspectStatus, typeof prospects> = {
    new: [], researching: [], contacted: [], meeting: [], won: [], lost: [], dormant: [],
  };
  for (const p of prospects) grouped[p.status].push(p);

  const closedCount = CLOSED.reduce((n, s) => n + grouped[s].length, 0);

  return (
    <AppShell
      {...shell}
      activeView={"client" as const}
      title="Prospects"
      description="Businesses we&rsquo;re targeting for outreach. Saved straight from the field (Google Maps + notes)."
      brandKicker="Records"
      shellTitle="Prospects"
      noteTitle="Working the pipeline"
      noteBody="Move cards along as you research, contact, meet, then convert. Use ✏️ Edit on any card to update details."
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
                            <a className="badge" href={p.mapsUrl} target="_blank" rel="noopener noreferrer">📍 Maps</a>
                          ) : null}
                          {p.currentSite ? (
                            <a className="badge" href={p.currentSite} target="_blank" rel="noopener noreferrer">🔗 Current site</a>
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
                        {p.owner ? (
                          <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>Owner: {p.owner}</p>
                        ) : null}
                        <ProspectCrud prospect={p} />
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>

          {closedCount > 0 ? (
            <section className="panel section" style={{ marginTop: 18 }}>
              <h3>Closed <span className="muted">({closedCount})</span></h3>
              <div className="card-list prospect-closed-list" style={{ marginTop: 10 }}>
                {CLOSED.flatMap((s) =>
                  grouped[s].map((p) => (
                    <article key={p.id} className="site-card prospect-card prospect-card-closed">
                      <div className="card-head">
                        <div>
                          <h4 className="card-title">{p.businessName}</h4>
                          {(p.location || p.industry) ? (
                            <p className="card-sub">{[p.industry, p.location].filter(Boolean).join(" · ")}</p>
                          ) : null}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span className={`pill pill-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                          <span className={`badge prio-${p.priority}`}>{p.priority}</span>
                        </div>
                      </div>
                      {p.notes ? (
                        <p className="card-sub" style={{ marginTop: 8 }}>{p.notes}</p>
                      ) : null}
                      <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>Owner: {p.owner}</p>
                      <ProspectCrud prospect={p} />
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : null}
        </>
      )}
    </AppShell>
  );
}
