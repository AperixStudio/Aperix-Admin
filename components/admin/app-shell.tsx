import type { ReactNode } from "react";
import { CommandPalette } from "@/components/admin/command-palette";
import { DataModeSwitcher } from "@/components/admin/data-mode-switcher";
import { KeyboardHelp } from "@/components/admin/keyboard-help";
import { NotificationBell } from "@/components/admin/notification-bell";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import type { NotificationItem } from "@/lib/admin-schemas";
import type { PrimaryNavItem, ViewKey } from "@/lib/admin-types";
import type { SearchHit } from "@/lib/search";
import type { DataMode } from "@/lib/data-mode";

/**
 * Page-level header + content frame.
 *
 * As of the persistent-shell refactor, the sidebar lives in
 * `app/(app)/layout.tsx` so it survives client-side navigation.
 * `<AppShell>` is now a thin per-page header that renders title,
 * description, and the topbar tools alongside `{children}`.
 *
 * The signature is unchanged so existing pages keep working
 * without edits — props that used to drive the sidebar
 * (activeView, brandKicker, shellTitle, primaryNav, note*) are
 * now ignored here.
 */
interface ShellProps {
  // Identification (legacy / ignored here)
  activeView?: ViewKey;
  brandKicker?: string;
  shellTitle?: string;
  primaryNav?: PrimaryNavItem[];

  // Per-page header
  title: string;
  description: string;
  noteTitle?: string;
  noteBody?: string;
  actions?: ReactNode;

  // Topbar tools (passed via shellExtras spread)
  notifications?: NotificationItem[];
  user?: string;
  clients?: { id: string; name: string }[];
  firstClientId?: string;
  searchIndex?: SearchHit[];
  dataMode?: DataMode;
  liveConfigured?: boolean;
  ui?: unknown;

  children: ReactNode;
}

export function AppShell({
  title,
  description,
  actions,
  notifications = [],
  user = "Harrison",
  clients = [],
  firstClientId,
  searchIndex = [],
  dataMode = "live",
  liveConfigured = false,
  children,
}: ShellProps) {
  return (
    <div className="page-frame">
      <header className="topbar">
        <div className="topbar-titles">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="topbar-tools">
          {actions}
          <CommandPalette
            clients={clients}
            firstClientId={firstClientId}
            searchIndex={searchIndex}
          />
          <NotificationBell items={notifications.slice(0, 8)} />
          <ThemeToggle />
          <DataModeSwitcher mode={dataMode} liveConfigured={liveConfigured} />
          <span className="topbar-user" title={`Signed in as ${user}`}>
            {user}
          </span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="topbar-icon-btn" title="Sign out">
              ↩ Sign out
            </button>
          </form>
          <KeyboardHelp firstClientId={firstClientId} />
        </div>
      </header>

      <div className="content">{children}</div>
    </div>
  );
}
