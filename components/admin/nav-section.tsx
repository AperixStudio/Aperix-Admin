"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface NavItem {
  label: string;
  href: string;
  key: string;
  badge?: number;
}

interface Props {
  label: string;
  items: NavItem[];
  activeKey: string;
  storageKey: string;
}

export function NavSection({ label, items, activeKey, storageKey }: Props) {
  const containsActive = items.some((i) => i.key === activeKey);
  // Default open if section contains the active route, else use stored preference (default closed for collapsibles).
  const [open, setOpen] = useState<boolean>(containsActive);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) return;
    setOpen(stored === "1" || containsActive);
  }, [storageKey, containsActive]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(storageKey, next ? "1" : "0"); } catch { /* ignore */ }
  };

  return (
    <div className={`nav-section ${open ? "is-open" : "is-closed"}`}>
      <button type="button" className="nav-label nav-label-toggle" onClick={toggle} aria-expanded={open}>
        <span>{label}</span>
        <span className="nav-chevron" aria-hidden>{open ? "▾" : "▸"}</span>
      </button>
      {open ? (
        <nav className="nav-list">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${activeKey === item.key ? "active" : ""}`}
            >
              <span>{item.label}</span>
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
