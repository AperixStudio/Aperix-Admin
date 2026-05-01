"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NavSection } from "@/components/admin/nav-section";
import type { ViewKey } from "@/lib/admin-types";

type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

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

interface SidebarProps {
  brandKicker: string;
  shellTitle: string;
  unreadCount: number;
  noteTitle?: string;
  noteBody?: string;
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
        { label: "Prospects", href: "/prospects", key: "prospects" },
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
        { label: "New Client / Lead", href: "/onboarding", key: "onboarding" },
        { label: "Settings", href: "/settings", key: "settings" },
      ],
    },
  ];
}

const NAV_PREFETCH_HREFS = [
  "/",
  "/notifications",
  "/clients",
  "/prospects",
  "/repos",
  "/contracts",
  "/runbooks",
  "/timeline",
  "/metrics",
  "/dependencies",
  "/audit",
  "/ai",
  "/onboarding",
  "/settings",
];

function activeKeyForPath(pathname: string): ViewKey {
  if (pathname === "/") return "dashboard";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/clients")) return "client";
  if (pathname.startsWith("/prospects")) return "prospects";
  if (pathname.startsWith("/repos")) return "repo";
  if (pathname.startsWith("/contracts")) return "contracts";
  if (pathname.startsWith("/runbooks")) return "runbooks";
  if (pathname.startsWith("/timeline")) return "timeline";
  if (pathname.startsWith("/metrics")) return "metrics";
  if (pathname.startsWith("/dependencies")) return "dependencies";
  if (pathname.startsWith("/audit")) return "audit";
  if (pathname.startsWith("/ai")) return "ai";
  if (pathname.startsWith("/onboarding")) return "onboarding";
  if (pathname.startsWith("/settings")) return "settings";
  return "dashboard";
}

export function Sidebar({ brandKicker, shellTitle, unreadCount, noteTitle, noteBody }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const activeKey = activeKeyForPath(pathname);
  const sections = buildSections(unreadCount);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const win = window as IdleWindow;
    const prefetch = () => {
      for (const href of NAV_PREFETCH_HREFS) router.prefetch(href);
    };

    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(prefetch, { timeout: 1500 });
      return () => win.cancelIdleCallback?.(id);
    }

    const id = win.setTimeout(prefetch, 750);
    return () => win.clearTimeout(id);
  }, [router]);

  // Close mobile drawer whenever route changes.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when drawer open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        className="hamburger-btn"
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
      >
        <span /><span /><span />
      </button>

      {mobileOpen ? (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-hidden />
      ) : null}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-scroll">
          <div className="sidebar-brand">
            <p className="kicker">{brandKicker}</p>
            <h1>{shellTitle}</h1>
            <button
              type="button"
              className="sidebar-close"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            >
              ×
            </button>
          </div>

          {sections.map((section) =>
            section.collapsible ? (
              <NavSection
                key={section.label}
                label={section.label}
                items={section.items}
                activeKey={activeKey as ViewKey}
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
                      prefetch
                      className={`nav-item ${activeKey === item.key ? "active" : ""}`}
                    >
                      <span>{item.label}</span>
                      {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                    </Link>
                  ))}
                </nav>
              </div>
            )
          )}

          {noteTitle ? (
            <div className="sidebar-note">
              <strong>{noteTitle}</strong>
              <span>{noteBody}</span>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
