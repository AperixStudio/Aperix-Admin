"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { SearchHit } from "@/lib/search";

interface ClientLite {
  id: string;
  name: string;
}

interface Props {
  clients: ClientLite[];
  firstClientId?: string;
  searchIndex: SearchHit[];
}

interface Command {
  label: string;
  href: string;
  hint?: string;
  group: string;
}

export function CommandPalette({ clients, firstClientId, searchIndex }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const commands = useMemo<Command[]>(() => {
    const fallback = firstClientId ?? clients[0]?.id ?? "rhinos";
    const navCmds: Command[] = [
      { label: "Go to Command Center", href: "/", hint: "g d", group: "Navigate" },
      { label: "Go to Notifications", href: "/notifications", hint: "g n", group: "Navigate" },
      { label: "Go to Repos", href: "/repos", group: "Navigate" },
      { label: "Go to Contracts", href: "/contracts", group: "Navigate" },
      { label: "Go to Runbooks", href: "/runbooks", group: "Navigate" },
      { label: "Go to Timeline", href: "/timeline", hint: "g t", group: "Navigate" },
      { label: "Go to Metrics", href: "/metrics", hint: "g m", group: "Navigate" },
      { label: "Go to Dependencies", href: "/dependencies", group: "Navigate" },
      { label: "Go to Audit Log", href: "/audit", group: "Navigate" },
      { label: "Go to AI Query", href: "/ai", hint: "g a", group: "Navigate" },
      { label: "Go to Settings", href: "/settings", hint: "g s", group: "Navigate" },
      { label: "New Client", href: "/onboarding", group: "Actions" },
      { label: `Open first client (${fallback})`, href: `/clients/${fallback}`, hint: "g c", group: "Navigate" },
    ];
    const clientCmds: Command[] = clients.map((c) => ({
      label: `Client · ${c.name}`,
      href: `/clients/${c.id}`,
      group: "Clients",
    }));
    const indexCmds: Command[] = searchIndex.map((s) => ({
      label: `${s.kind} · ${s.title}`,
      href: s.href,
      group: "Search",
    }));
    return [...navCmds, ...clientCmds, ...indexCmds];
  }, [clients, firstClientId, searchIndex]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return commands.slice(0, 30);
    return commands
      .filter((c) => c.label.toLowerCase().includes(needle))
      .slice(0, 30);
  }, [q, commands]);

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (inField) return;

      // g-prefix shortcuts (handled here because it's the global listener)
      if (e.key === "g") {
        const handler = (ev: KeyboardEvent) => {
          window.removeEventListener("keydown", handler, true);
          if (ev.target && (ev.target as HTMLElement).tagName === "INPUT") return;
          const fallback = firstClientId ?? clients[0]?.id;
          const map: Record<string, string> = {
            d: "/",
            n: "/notifications",
            t: "/timeline",
            m: "/metrics",
            a: "/ai",
            s: "/settings",
          };
          const k = ev.key.toLowerCase();
          if (k === "c" && fallback) {
            ev.preventDefault();
            router.push(`/clients/${fallback}`);
            return;
          }
          if (map[k]) {
            ev.preventDefault();
            router.push(map[k]);
          }
        };
        window.addEventListener("keydown", handler, true);
        setTimeout(() => window.removeEventListener("keydown", handler, true), 1200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, firstClientId, clients]);

  const choose = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        className="topbar-icon-btn"
        title="Command palette (⌘K / Ctrl+K)"
        aria-label="Command palette"
        onClick={() => setOpen(true)}
      >
        ⌘K
      </button>
      {open ? (
        <div className="palette-scrim" onClick={() => setOpen(false)}>
          <div className="palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Command palette">
            <input
              autoFocus
              className="palette-input"
              type="search"
              placeholder="Search clients, pages, records…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, filtered.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const sel = filtered[active];
                  if (sel) choose(sel.href);
                }
              }}
            />
            <ul className="palette-list" role="listbox">
              {filtered.length === 0 ? (
                <li className="palette-empty">No matches.</li>
              ) : (
                filtered.map((c, i) => (
                  <li
                    key={`${c.href}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={`palette-item ${i === active ? "active" : ""}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(c.href)}
                  >
                    <span className="palette-item-group">{c.group}</span>
                    <span className="palette-item-label">{c.label}</span>
                    {c.hint ? <span className="palette-item-hint">{c.hint}</span> : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
