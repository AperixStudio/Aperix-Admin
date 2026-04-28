"use client";

import Link from "next/link";
import { useState } from "react";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/admin-actions";
import type { NotificationItem } from "@/lib/admin-schemas";

export function NotificationBell({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="bell-wrap">
      <button
        type="button"
        className="bell-btn"
        aria-label={`Notifications, ${unread} unread`}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden>🔔</span>
        {unread > 0 ? <span className="bell-dot">{unread}</span> : null}
      </button>
      {open ? (
        <>
          <div className="bell-scrim" onClick={() => setOpen(false)} />
          <div className="bell-pop">
            <div className="bell-head">
              <strong>Notifications</strong>
              {unread > 0 ? (
                <form action={markAllNotificationsRead}>
                  <button type="submit" className="bell-clear">Mark all read</button>
                </form>
              ) : null}
            </div>
            <div className="bell-list">
              {items.length === 0 ? (
                <div className="bell-empty">All caught up.</div>
              ) : null}
              {items.map((n) => (
                <div key={n.id} className={`bell-row ${n.read ? "bell-read" : ""} bell-${n.kind}`}>
                  <div className="bell-row-head">
                    <strong>{n.title}</strong>
                    {!n.read ? (
                      <form action={markNotificationRead.bind(null, n.id)}>
                        <button type="submit" className="bell-mark" aria-label="Mark as read">✓</button>
                      </form>
                    ) : null}
                  </div>
                  <p>{n.body}</p>
                  {n.href ? (
                    <Link href={n.href} className="bell-link" onClick={() => setOpen(false)}>
                      Open →
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
