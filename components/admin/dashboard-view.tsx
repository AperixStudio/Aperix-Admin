"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/admin/app-shell";
import { ActionQueueList } from "@/components/admin/action-queue-list";
import { RenewalsList } from "@/components/admin/renewals-list";
import { getHealthDotClass } from "@/lib/admin-utils";
import type { ActionQueueItem, DashboardContent, DashboardStats, ProjectRecord, RenewalItem, UiConfig } from "@/lib/admin-types";
import type { RecentDeploy } from "@/lib/data/adapter";

type FilterValue = string;

interface DashboardViewProps {
  ui: UiConfig;
  content: DashboardContent;
  projects: ProjectRecord[];
  stats: DashboardStats;
  actionQueue?: ActionQueueItem[];
  renewals?: RenewalItem[];
  recentDeploys?: RecentDeploy[];
  shellExtras?: Record<string, unknown>;
}

export function DashboardView({
  ui,
  content,
  projects,
  stats,
  actionQueue = [],
  renewals = [],
  recentDeploys = [],
  shellExtras = {},
}: DashboardViewProps) {
  const [currentFilter, setCurrentFilter] = useState<FilterValue>(content.filters[0] ?? "all");
  const [search, setSearch] = useState("");

  const visibleProjects = useMemo(() => {
    const q = search.toLowerCase().trim();
    return projects.filter((project) => {
      if (currentFilter !== "all" && content.filterConfig) {
        const rule = content.filterConfig[currentFilter];
        if (rule && String(project[rule.field as keyof ProjectRecord]) !== rule.match) return false;
      }
      if (!q) return true;
      return (
        project.name.toLowerCase().includes(q) ||
        project.domain.toLowerCase().includes(q) ||
        project.lead.toLowerCase().includes(q) ||
        (project.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [currentFilter, search, projects, content.filterConfig]);

  return (
    <AppShell
      {...shellExtras}
      activeView="dashboard"
      brandKicker={ui.brandKicker}
      shellTitle={ui.viewTitles.dashboard}
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
      <section className="stats">
        {content.stats.map((stat) => {
          const value =
            stat.key === "ownerSplit"
              ? Object.entries(stats.ownerCounts).map(([name, n]) => `${name} · ${n}`).join("  /  ")
              : String(stats[stat.key as keyof Omit<DashboardStats, "ownerCounts">]);

          return (
            <div key={stat.key} className="panel stat">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-sub">{stat.description}</div>
            </div>
          );
        })}
      </section>

      <section className="grid-2">
        <div className="panel section">
          <h3>{content.board.title}</h3>
          <p className="section-copy">{content.board.description}</p>

          <div className="filters">
            {content.filters.map((filter) => (
              <button
                key={filter}
                className={`chip ${currentFilter === filter ? "active" : ""}`}
                onClick={() => setCurrentFilter(filter)}
                type="button"
              >
                {filter === "attention" ? "Needs Attention" : filter}
              </button>
            ))}
          </div>

          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              type="search"
              className="search-bar"
              placeholder="Search by name, domain, lead, or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="card-list">
            {visibleProjects.length ? (
              visibleProjects.map((project) => (
                <Link key={project.id} className="site-card" href={`/clients/${project.id}`}>
                  <div className="card-head">
                    <div>
                      <h4 className="card-title">{project.name}</h4>
                      <p className="card-sub">{project.domain}</p>
                    </div>
                    <div className="badges">
                      <span className="badge">
                        <span className={`dot ${getHealthDotClass(project.healthState)}`} />
                        {project.health}
                      </span>
                    </div>
                  </div>

                  {(project.tags ?? []).length > 0 && (
                    <div className="tag-pills">
                      {project.tags!.map((tag) => (
                        <span key={tag} className="tag-pill">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="badges">
                    <span className="badge">Lead · {project.lead}</span>
                    <span className="badge">Support · {project.support}</span>
                    <span className="badge">Tier · {project.tier}</span>
                  </div>

                  <div className="meta-row">
                    <div className="meta-box">
                      <div className="meta-label">Hosting</div>
                      <div className="meta-value">{project.hosting}</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-label">DNS</div>
                      <div className="meta-value">{project.dns}</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-label">Repo</div>
                      <div className="meta-value">{project.repoStatus}</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-label">Deploy</div>
                      <div className="meta-value">{project.deploy}</div>
                    </div>
                  </div>

                  {project.liveUrl && (
                    <div className="card-actions" onClick={(e) => e.preventDefault()}>
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-visit-btn"
                      >
                        ↗ Visit Site
                      </a>
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="card-visit-btn"
                        >
                          ⎇ GitHub
                        </a>
                      )}
                    </div>
                  )}
                </Link>
              ))
            ) : (
              <div className="empty-state">No projects match the current filter.</div>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="panel section">
            <div className="panel-head">
              <h3>Recent Deploys</h3>
              <Link href="/timeline" className="panel-head-link">View timeline →</Link>
            </div>
            {recentDeploys.length ? (
              <div className="activity-feed">
                {recentDeploys.map((deploy) => (
                  <div key={`${deploy.projectId}-${deploy.id}`} className="activity-item">
                    <div className={`activity-icon ${deploy.status === "success" ? "deploy" : "alert"}`}>
                      {deploy.status === "success" ? "↑" : "⚠"}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">{deploy.projectName} deployed</div>
                      <div className="activity-detail">{deploy.branch} — {deploy.message}</div>
                      <div className="activity-ts">{deploy.timestamp} · {deploy.actor}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No deploy events recorded yet.</div>
            )}
          </div>

          <div className="panel section">
            <div className="panel-head">
              <h3>Action Queue</h3>
              <Link href="/notifications" className="panel-head-link">View notifications →</Link>
            </div>
            <ActionQueueList
              items={actionQueue}
              emptyCopy="Nothing in the queue. The team is clear."
              limit={6}
            />
          </div>

          <div className="panel section">
            <div className="panel-head">
              <h3>Upcoming Renewals</h3>
              <Link href="/contracts" className="panel-head-link">View contracts →</Link>
            </div>
            <RenewalsList
              items={renewals.slice(0, 6)}
              emptyCopy="No domain or SSL expiries on file."
            />
          </div>
          <div className="panel section">
            <h3>Live Data Status</h3>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-node-wrap"><div className="timeline-node" /></div>
                <div>
                  <strong>Projects indexed</strong>
                  <span>{projects.length} records from Supabase.</span>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-node-wrap"><div className="timeline-node" /></div>
                <div>
                  <strong>Open queue items</strong>
                  <span>{actionQueue.length} actionable items.</span>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-node-wrap"><div className="timeline-node" /></div>
                <div>
                  <strong>Upcoming renewals</strong>
                  <span>{renewals.length} domain/SSL records tracked.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
