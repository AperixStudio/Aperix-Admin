import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/sidebar";
import { getUiConfig } from "@/lib/admin-data";
import { getAdapter } from "@/lib/data";

/**
 * Persistent shell layout for every authenticated admin route.
 *
 * Why this exists:
 *   Each page used to render `<AppShell>` itself, meaning the sidebar
 *   was unmounted/remounted on every navigation — jarring flicker.
 *   By hoisting the sidebar into a parent layout, Next.js's App Router
 *   keeps the sidebar mounted and only swaps `{children}` (the content
 *   area), giving instant SPA-style transitions.
 *
 * The auth proxy (`proxy.ts`) already redirects unauthenticated users
 * to `/login` before any of these routes render.
 */
export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const adapter = await getAdapter();
  const [ui, notifications] = await Promise.all([
    getUiConfig(),
    adapter.listNotifications(),
  ]);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="shell">
      <Sidebar
        brandKicker={ui.brandKicker}
        shellTitle="Aperix Admin"
        unreadCount={unread}
        noteTitle="Persistent shell"
        noteBody="Sidebar stays mounted; only the page content swaps on navigation."
      />
      <main className="main">{children}</main>
    </div>
  );
}
