import Link from "next/link";
import type { ReactNode } from "react";
import { CommandPalette } from "@/components/admin/command-palette";
import { DataModeSwitcher } from "@/components/admin/data-mode-switcher";
import { KeyboardHelp } from "@/components/admin/keyboard-help";
import { NavSection } from "@/components/admin/nav-section";
import { NotificationBell } from "@/components/admin/notification-bell";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import type { NotificationItem } from "@/lib/admin-schemas";
import type { PrimaryNavItem, ViewKey } from "@/lib/admin-types";
import type { SearchHit } from "@/lib/search";
import type { DataMode } from "@/lib/data-mode";

interface ShellProps {
  // Identification
  activeView: ViewKey;
  brandKicker: string;
  shellTitle: string;
  primaryNav?: PrimaryNavItem[];

  // Header
  title: string;
  description: string;
  noteTitle: string;
  noteBody: string;
  actions?: ReactNode;

  // Shell-wide context (passed via shellExtras spread)
  notifications?: NotificationItem[];
  user?: string;
  clients?: { id: string; name: string }[];
  firstClientId?: string;
  searchIndex?: SearchHit[];
  dataMode?: DataMode;
  liveConfigured?: boolean;
  // Discard misc spread props from getShellProps()
  ui?: unknown;

  children: ReactNode;
}

interface SectionLink {
  label: string;
  href: string;
  key: ViewKey;
  badge?: number;
}

interface NavSectionDef {
  label: string;
  items: SectionLink[];
  collapsible: boolean;
}

function buildSections(unread: number): NavSectionDef[] {
  return [
    {
      label: "Daily",
      collapsible: false,
      items: [
        { label: "Command Center", href: "/", key: "dashboard" },
        { label: "Notifications", href: "/notifications", key: "notifications", badge: unread || undefined },
      ],
    },
    {
      label: "Records",
      collapsible: true,
      items: [
        { label: "Clients", href: "/clients", key: "client" },
        { label: "Repos", href: "/repos", key: "repo" },
        { label: "Contracts", href: "/contracts", key: "contracts" },
        { label: "Runbooks", href: "/runbooks", key: "runbooks" },
      ],
    },
    {
      label: "Insights",
      collapsible: true,
      items: [
        { label: "Timeline", href: "/timeline", key: "timeline" },
        { label: "Metrics", href: "/metrics", key: "metrics" },
        { label: "Dependencies", href: "/dependencies", key: "dependencies" },
        { label: "Audit Log", href: "/audit", key: "audit" },
      ],
    },
    {
      label: "Tools",
      collapsible: true,
      items: [
        { label: "AI Query", href: "/ai", key: "ai" },
        { label: "New Client", href: "/onboarding", key: "onboarding" },
        { label: "Settings", href: "/settings", key: "settings" },
      ],
    },
  ];
}

export function AppShell({
  activeView,
  brandKicker,
  shellTitle,
  title,
  description,
  noteTitle,
  noteBody,
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
  const unread = notifications.filter((n) => !n.read).length;
  const sections = buildSections(unread);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="kicker">{brandKicker}</p>
          <h1>{shellTitle}</h1>
        </div>

        {sections.map((section) =>
          section.collapsible ? (
            <NavSection
              key={section.label}
              label={section.label}
              items={section.items}
              activeKey={activeView}
              storageKey={`aperix.nav.${section.label.toLowerCase()}`}
            />
          ) : (
            <div className="nav-section is-open" key={section.label}>
              <p className="nav-label">{section.label}</p>
              <nav className="nav-list">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${activeView === item.key ? "active" : ""}`}
                  >
                    <span>{item.label}</span>
                    {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                  </Link>
                ))}
              </nav>
            </div>
          )
        )}

        <div className="sidebar-note">
          <strong>{noteTitle}</strong>
          <span>{noteBody}</span>
        </div>
      </aside>

      <main className="main">
        {dataMode !== "live" ? (
          <div className={`data-banner data-banner-${dataMode}`}>
            <strong>{dataMode === "mock" ? "Mock data" : "Empty state"}</strong>
            <span>
              {dataMode === "mock"
                ? "You're viewing seeded JSON. Switch to Live (Supabase) when keys are wired."
                : "All data sources are empty. Switch to Mock or Live."}
            </span>
            {!liveConfigured ? (
              <span className="data-banner-hint">
                Live mode needs <code>SUPABASE_URL</code> + <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code>.
              </span>
            ) : null}
          </div>
        ) : null}

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
      </main>
    </div>
  );
}
