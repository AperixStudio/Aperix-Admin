import Link from "next/link";
import { AppShell } from "@/components/admin/app-shell";
import { EmptyState } from "@/components/admin/empty-state";
import type { GhFetchResult } from "@/lib/github";
import type { ProjectRecord, RepoContent, UiConfig } from "@/lib/admin-types";

interface RepoViewProps {
  ui: UiConfig;
  content: RepoContent;
  projects: ProjectRecord[];
  github?: GhFetchResult;
  shellExtras?: Record<string, unknown>;
}

export function RepoView({ ui, content, projects, github, shellExtras = {} }: RepoViewProps) {
  return (
    <AppShell
      {...shellExtras}
      activeView="repo"
      brandKicker={ui.brandKicker}
      shellTitle={ui.viewTitles.repo}
      primaryNav={ui.primaryNav}
      title={content.title}
      description={content.description}
      noteTitle={content.noteTitle}
      noteBody={content.noteBody}
      actions={
        <>
          {(content.actions ?? []).map((action) => (
            <Link key={action.href} className={`btn${action.primary ? " primary" : ""}`} href={action.href}>
              {action.label}
            </Link>
          ))}
        </>
      }
    >
      <section className="panel section" id="live-repos">
        <div className="panel-head">
          <h3>Live repositories {github?.org ? <span className="muted">· {github.org}</span> : null}</h3>
          {github?.ok ? (
            <span className="muted" style={{ fontSize: 12 }}>{github.repos.length} repos · refreshed every 5 min</span>
          ) : null}
        </div>

        {!github || !github.configured ? (
          <EmptyState
            icon="⎇"
            title="GitHub not connected"
            description={github?.error ?? "Set GITHUB_TOKEN + GITHUB_ORG in .env.local to list every repo in your org here."}
          />
        ) : !github.ok ? (
          <EmptyState
            icon="⚠"
            title="GitHub fetch failed"
            description={github.error ?? "Unknown error."}
          />
        ) : github.repos.length === 0 ? (
          <EmptyState
            icon="∅"
            title="No repositories"
            description={`${github.org} has no repos visible to this token.`}
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Repo</th>
                <th>Lang</th>
                <th>Updated</th>
                <th>★</th>
                <th>Issues</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {github.repos.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.name}</strong>
                    {r.private ? <span className="badge" style={{ marginLeft: 6 }}>private</span> : null}
                    {r.archived ? <span className="badge" style={{ marginLeft: 6 }}>archived</span> : null}
                    {r.description ? <div className="muted" style={{ fontSize: 12 }}>{r.description}</div> : null}
                  </td>
                  <td>{r.language ?? "—"}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{new Date(r.pushed_at).toLocaleDateString()}</td>
                  <td>{r.stargazers_count}</td>
                  <td>{r.open_issues_count}</td>
                  <td><a href={r.html_url} target="_blank" rel="noopener noreferrer" className="btn-text">Open ↗</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="grid-2">
        <div className="stack">
          <div className="panel section" id="agency">
            <h3>{content.layout.title}</h3>
            <div className="code-panel">
              <h4>{content.layout.heading}</h4>
              <div className="code-tree">{content.layout.tree}</div>
            </div>
          </div>

          <div className="panel section" id="starter">
            <h3>{content.repoPurposes.title}</h3>
            <div className="grid-3">
              {content.repoPurposes.items.map((item) => (
                <div key={item.title} className="info">
                  <h4>{item.title}</h4>
                  <div className="small">{item.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel section" id="client">
            <h3>{content.clientPattern.title}</h3>
            <div className="code-panel">
              <h4>{content.clientPattern.heading}</h4>
              <div className="code-tree">{content.clientPattern.tree}</div>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="panel section" id="internal">
            <h3>{content.flow.title}</h3>
            <div className="timeline">
              {content.flow.items.map((item) => (
                <div key={item.title} className="timeline-item">
                  <div className="timeline-node-wrap"><div className="timeline-node" /></div>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel section">
            <h3>{content.why.title}</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Repo View Fix</th>
                </tr>
              </thead>
              <tbody>
                {content.why.rows.map((row) => (
                  <tr key={row.problem}>
                    <td>{row.problem}</td>
                    <td>{row.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel section">
            <h3>{content.liveExamples.title}</h3>
            <div className="links">
              {projects.map((project) => (
                <Link key={project.id} className="link-card" href={`/clients/${project.id}`}>
                  <strong>{project.repo}</strong>
                  <span>
                    {project.name} · {project.hosting} · {project.domain}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel section">
            <h3>{content.design.title}</h3>
            <div className="callout">{content.design.callout}</div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
