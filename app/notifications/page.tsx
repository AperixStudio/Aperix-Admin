import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/admin/app-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/admin-actions";
import type { NotificationItem } from "@/lib/admin-schemas";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";

export const metadata: Metadata = {
  title: "Notifications | Aperix Admin",
  description: "Inbox of alerts, ops events, security notices, and changelog.",
};

interface PageProps {
  searchParams: Promise<{ kind?: string; show?: string }>;
}

const KIND_LABEL: Record<NotificationItem["kind"], string> = {
  alert: "Alerts",
  info: "Info",
  ops: "Ops",
  security: "Security",
  changelog: "Changelog",
};

export default async function NotificationsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const kind = (sp.kind ?? "all") as "all" | NotificationItem["kind"];
  const show = sp.show ?? "all"; // all | unread

  const shell = await getShellProps();
  const adapter = await getAdapter();
  const all = await adapter.listNotifications();

  const filtered = all.filter((n) => {
    if (kind !== "all" && n.kind !== kind) return false;
    if (show === "unread" && n.read) return false;
    return true;
  });

  const counts = {
    all: all.length,
    unread: all.filter((n) => !n.read).length,
    alert: all.filter((n) => n.kind === "alert").length,
    info: all.filter((n) => n.kind === "info").length,
    ops: all.filter((n) => n.kind === "ops").length,
    security: all.filter((n) => n.kind === "security").length,
    changelog: all.filter((n) => n.kind === "changelog").length,
  };

  const filterLink = (k: string, s = show) => {
    const params = new URLSearchParams();
    if (k !== "all") params.set("kind", k);
    if (s !== "all") params.set("show", s);
    const qs = params.toString();
    return qs ? `/notifications?${qs}` : "/notifications";
  };

  return (
    <AppShell
      {...shell}
      activeView="notifications"
      brandKicker="Daily"
      shellTitle="Notifications"
      title="Notifications"
      description="One inbox for alerts, ops events, security notices, and changelog."
      noteTitle="Auto-folded changelog"
      noteBody="Changelog entries appear here too once GitHub auto-publish is wired."
      actions={
        counts.unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="btn">Mark all read</button>
          </form>
        ) : null
      }
    >
      <div className="notif-toolbar">
        <div className="seg">
          {(["all", "alert", "info", "ops", "security", "changelog"] as const).map((k) => (
            <Link
              key={k}
              href={filterLink(k)}
              className={`seg-btn ${kind === k ? "active" : ""}`}
            >
              {k === "all" ? "All" : KIND_LABEL[k]} ({counts[k]})
            </Link>
          ))}
        </div>
        <div className="seg">
          <Link href={filterLink(kind, "all")} className={`seg-btn ${show === "all" ? "active" : ""}`}>All</Link>
          <Link href={filterLink(kind, "unread")} className={`seg-btn ${show === "unread" ? "active" : ""}`}>Unread ({counts.unread})</Link>
        </div>
      </div>

      <div className="panel section">
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No notifications"
            description={all.length === 0 ? "Inbox is empty. Notifications will appear here as events fire." : "Nothing matches this filter."}
          />
        ) : (
          <ul className="notif-list">
            {filtered.map((n) => (
              <li key={n.id} className={`notif-row notif-${n.kind} ${n.read ? "is-read" : ""}`}>
                <div className="notif-head">
                  <span className={`badge notif-kind-${n.kind}`}>{KIND_LABEL[n.kind]}</span>
                  <strong>{n.title}</strong>
                  <span className="notif-ts">{n.timestamp}</span>
                </div>
                <p className="notif-body">{n.body}</p>
                <div className="notif-foot">
                  {n.href ? <Link className="btn-text" href={n.href}>Open →</Link> : null}
                  {!n.read ? (
                    <form action={markNotificationRead.bind(null, n.id)}>
                      <button type="submit" className="btn-text">Mark read</button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
