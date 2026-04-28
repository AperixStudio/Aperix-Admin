import Link from "next/link";
import { AppShell } from "@/components/admin/app-shell";
import { QuickActionBar } from "@/components/admin/quick-action-bar";
import { DeployBadge, SeverityBadge } from "@/components/admin/status-badge";
import { CompletenessRing } from "@/components/admin/completeness-ring";
import { TaskForm, TaskStatusButtons } from "@/components/admin/task-form";
import { ContactForm } from "@/components/admin/contact-form";
import { IncidentForm, IncidentLifecycle } from "@/components/admin/incident-form";
import { RevealCredentialButton } from "@/components/admin/reveal-credential-modal";
import { AuditLogList } from "@/components/admin/audit-log-list";
import { getHealthDotClass } from "@/lib/admin-utils";
import type { ClientDetailContent, ProjectCompleteness, ProjectRecord, UiConfig } from "@/lib/admin-types";
import type { AuditEntry } from "@/lib/admin-schemas";

interface ClientDetailViewProps {
  ui: UiConfig;
  content: ClientDetailContent;
  project: ProjectRecord;
  allProjects: ProjectRecord[];
  completeness?: ProjectCompleteness;
  audit?: AuditEntry[];
  session?: { canReveal?: boolean };
  shellExtras?: Record<string, unknown>;
}

export function ClientDetailView({ ui, content, project, allProjects, completeness, audit = [], session, shellExtras = {} }: ClientDetailViewProps) {
  const canReveal = session?.canReveal ?? true;
  const brandKey = project.brandKey ?? project.id;
  return (
    <AppShell
      {...shellExtras}
      activeView="client"
      brandKicker={ui.brandKicker}
      shellTitle={ui.viewTitles.client}
      primaryNav={ui.primaryNav}
      title={project.name}
      description={project.summary}
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
      <div data-client={brandKey} className="client-scope">
      <section className="grid-2">
        <div className="stack">
          <div className="panel section">
            <div className="panel-head">
              <h3>{content.sections.snapshot}</h3>
              {completeness && (
                <div className="completeness-inline" title={`${completeness.filledCount} / ${completeness.totalCount} fields filled`}>
                  <CompletenessRing percentage={completeness.percentage} size={36} />
                  <span className="completeness-inline-label">Record</span>
                </div>
              )}
            </div>

            {(project.quickLinks?.length > 0 || project.liveUrl) && (
              <QuickActionBar links={project.quickLinks ?? []} liveUrl={project.liveUrl} />
            )}

            <div className="info">
              <div className="kv"><div className="kv-label">Status</div><div className="kv-value">{project.health}</div></div>
              <div className="kv"><div className="kv-label">Lead Owner</div><div className="kv-value">{project.lead}</div></div>
              <div className="kv"><div className="kv-label">Support Owner</div><div className="kv-value">{project.support}</div></div>
              <div className="kv"><div className="kv-label">Tier</div><div className="kv-value">{project.tier}</div></div>
              <div className="kv"><div className="kv-label">Domain</div><div className="kv-value">{project.domain}</div></div>
              <div className="kv"><div className="kv-label">Last Deploy</div><div className="kv-value">{project.deploy}</div></div>
              {project.domainExpiry && <div className="kv"><div className="kv-label">Domain Expiry</div><div className="kv-value">{project.domainExpiry}</div></div>}
              {project.sslExpiry && <div className="kv"><div className="kv-label">SSL</div><div className="kv-value">{project.sslExpiry}</div></div>}
              {project.tags && project.tags.length > 0 && (
                <div className="kv">
                  <div className="kv-label">Tags</div>
                  <div className="kv-value">
                    <div className="tag-pills">
                      {project.tags.map((tag) => <span key={tag} className="tag-pill">{tag}</span>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="panel section">
            <h3>{content.sections.platform}</h3>
            <div className="info">
              <div className="kv"><div className="kv-label">Repo</div><div className="kv-value">{project.repo}</div></div>
              <div className="kv"><div className="kv-label">GitHub Org</div><div className="kv-value">{project.githubOrg}</div></div>
              <div className="kv"><div className="kv-label">Hosting</div><div className="kv-value">{project.hosting}</div></div>
              <div className="kv"><div className="kv-label">Registrar</div><div className="kv-value">{project.registrar}</div></div>
              <div className="kv"><div className="kv-label">DNS</div><div className="kv-value">{project.dns}</div></div>
              <div className="kv"><div className="kv-label">Repo Access</div><div className="kv-value">{project.repoStatus}</div></div>
            </div>
          </div>

          <div className="panel section">
            <h3>{content.sections.links}</h3>
            <div className="links">
              {project.links.map((link) => (
                <div key={link.title} className="link-card">
                  <strong>{link.title}</strong>
                  <span>{link.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="panel section">
            <h3>{content.sections.checks}</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Result</th>
                  <th>Last Run</th>
                </tr>
              </thead>
              <tbody>
                {project.checks.map((check) => (
                  <tr key={check.label}>
                    <td>{check.label}</td>
                    <td>
                      <span className="badge">
                        <span className={`dot ${getHealthDotClass(check.state)}`} />
                        {check.result}
                      </span>
                    </td>
                    <td>{check.lastRun}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel section">
            <h3>{content.sections.priorities}</h3>
            <div className="timeline">
              {project.priorities.map((item) => (
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
            <h3>{content.sections.notes}</h3>
            <div className="callout">{project.notes}</div>
          </div>

          <div className="panel section">
            <h3>{content.sections.future}</h3>
            <p className="section-copy">{content.futureDescription}</p>
          </div>
        </div>

        {/* Deployments + Incidents — second right column panel */}
        <div className="stack">
          {(
            <div className="panel section">
              <div className="panel-head">
                <h3>{content.sections.tasks}</h3>
              </div>
              <TaskForm projectId={project.id} defaultOwner={project.lead} />
              <div className="task-list">
                {(project.tasks ?? []).map((t) => (
                  <div key={t.id} className={`task-row priority-${t.priority} status-${t.status}`}>
                    <span className={`task-status status-${t.status}`}>{t.status}</span>
                    <div className="task-body">
                      <div className="task-title">{t.title}</div>
                      {t.detail && <div className="task-detail">{t.detail}</div>}
                      <div className="task-meta">
                        <span>{t.owner}</span>
                        {t.due && <><span>·</span><span>{t.due}</span></>}
                        <span>·</span>
                        <span className={`priority-pill priority-${t.priority}`}>{t.priority}</span>
                      </div>
                      <TaskStatusButtons projectId={project.id} task={t} />
                    </div>
                  </div>
                ))}
                {(project.tasks ?? []).length === 0 && (
                  <p className="muted">No open tasks. Add the first one above.</p>
                )}
              </div>
            </div>
          )}

          {(
            <div className="panel section">
              <h3>{content.sections.contacts}</h3>
              <ContactForm projectId={project.id} />
              <div className="contacts-grid">
                {(project.contacts ?? []).map((c) => (
                  <div key={c.id} className="contact-card">
                    <div className="contact-name">{c.name}</div>
                    <div className="contact-role">{c.role}</div>
                    {c.email && <a href={`mailto:${c.email}`} className="contact-link">{c.email}</a>}
                    {c.phone && <div className="contact-meta">{c.phone}</div>}
                    {c.notes && <div className="contact-notes">{c.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.credentials && project.credentials.length > 0 && (
            <div className="panel section">
              <h3>{content.sections.credentials}</h3>
              <div className="creds-list">
                {project.credentials.map((cr) => (
                  <div key={cr.id} className="creds-row">
                    <div className="creds-icon">🔑</div>
                    <div className="creds-body">
                      <div className="creds-label">{cr.label}</div>
                      <div className="creds-location">{cr.location}</div>
                      <div className="creds-meta">Owned by {cr.ownedBy}</div>
                      {cr.notes && <div className="creds-notes">{cr.notes}</div>}
                    </div>
                    <div className="creds-actions">
                      {cr.vaultUrl && (
                        <a href={cr.vaultUrl} target="_blank" rel="noopener noreferrer" className="quick-action-btn">Open vault</a>
                      )}
                      <RevealCredentialButton projectId={project.id} credential={cr} canReveal={canReveal} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.deployments && project.deployments.length > 0 && (
            <div className="panel section">
              <h3>{content.sections.deployments}</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Branch</th>
                    <th>Message</th>
                    <th>When</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {project.deployments.map((d) => (
                    <tr key={d.id}>
                      <td><DeployBadge status={d.status} /></td>
                      <td><span className="deploy-row-branch">{d.branch}</span></td>
                      <td>{d.message}</td>
                      <td><span className="deploy-row-actor">{d.timestamp}</span></td>
                      <td><span className="deploy-row-actor">{d.duration}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(
            <div className="panel section">
              <h3>{content.sections.incidents}</h3>
              <IncidentForm projectId={project.id} />
              {(project.incidents ?? []).map((inc) => (
                <div key={inc.id} className={`incident-item incident-${inc.severity}`}>
                  <div className="incident-header">
                    <SeverityBadge severity={inc.severity} />
                    <span className="incident-title">{inc.title}</span>
                    <span className="incident-meta">{inc.timestamp} · {inc.author}</span>
                  </div>
                  <div className="incident-body">{inc.body}</div>
                  <IncidentLifecycle projectId={project.id} incident={inc} />
                </div>
              ))}
              {(project.incidents ?? []).length === 0 && (
                <p className="muted">No incidents. Long may it last.</p>
              )}
            </div>
          )}

          {audit.length > 0 && (
            <div className="panel section">
              <h3>Activity</h3>
              <AuditLogList entries={audit} />
            </div>
          )}
        </div>
      </section>
      </div>
    </AppShell>
  );
}
