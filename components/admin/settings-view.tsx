"use client";

import { useState, useTransition } from "react";
import { AppShell } from "@/components/admin/app-shell";
import { DataModeSwitcher } from "@/components/admin/data-mode-switcher";
import { usePrefs } from "@/components/admin/prefs-provider";
import { useToast } from "@/components/admin/toast-provider";
import { setPrefs } from "@/lib/admin-actions";
import type { FeatureFlag } from "@/lib/admin-schemas";
import type { UiConfig } from "@/lib/admin-types";
import type { DataMode } from "@/lib/data-mode";

interface IntegrationStatus {
  key: string;
  label: string;
  status: "ok" | "missing" | "stub";
  detail: string;
}

interface SettingsViewProps {
  ui: UiConfig;
  flags: FeatureFlag[];
  integrations: IntegrationStatus[];
  dataMode: DataMode;
  liveConfigured: boolean;
  user: string;
  email?: string;
  shellExtras?: Record<string, unknown>;
}

export function SettingsView({ ui, flags, integrations, dataMode, liveConfigured, user, email, shellExtras = {} }: SettingsViewProps) {
  const prefs = usePrefs();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [section, setSection] = useState<"account" | "appearance" | "integrations" | "flags" | "defaults" | "data">("account");

  const persistTheme = (t: "light" | "dark" | "auto") => {
    prefs.setTheme(t);
    start(async () => {
      try {
        await setPrefs({ theme: t, density: prefs.density });
        toast.push("Theme saved", "success");
      } catch (e) {
        toast.push(e instanceof Error ? e.message : "Failed", "error");
      }
    });
  };

  const persistDensity = (d: "comfortable" | "compact") => {
    prefs.setDensity(d);
    start(async () => {
      try {
        await setPrefs({ theme: prefs.theme, density: d });
        toast.push("Density saved", "success");
      } catch (e) {
        toast.push(e instanceof Error ? e.message : "Failed", "error");
      }
    });
  };

  return (
    <AppShell
      {...shellExtras}
      activeView="settings"
      brandKicker="Workspace"
      shellTitle="Settings"
      primaryNav={ui.primaryNav}
      title="Settings"
      description="Account, appearance, integrations, feature flags, and workspace data."
      noteTitle="Single admin"
      noteBody="Aperix uses one admin role. There are no per-user permissions to configure."
    >
      <div className="settings-layout">
        <nav className="settings-nav">
          {([
            ["account", "Account"],
            ["appearance", "Appearance"],
            ["integrations", "Integrations"],
            ["flags", "Feature Flags"],
            ["defaults", "Defaults"],
            ["data", "Data"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`settings-nav-item ${section === k ? "active" : ""}`}
              onClick={() => setSection(k)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="settings-body">
          {section === "account" && (
            <div className="panel section">
              <h3>Account</h3>
              <p className="section-copy">Signed in admin. Real auth (Supabase magic link) lands when keys are wired.</p>
              <dl className="kv">
                <dt>Display name</dt><dd>{user}</dd>
                <dt>Email</dt><dd>{email ?? <span className="muted">— not set —</span>}</dd>
                <dt>Role</dt><dd>admin (single role)</dd>
              </dl>
            </div>
          )}

          {section === "appearance" && (
            <>
              <div className="panel section">
                <h3>Theme</h3>
                <div className="seg">
                  {(["light", "dark", "auto"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`seg-btn ${prefs.theme === t ? "active" : ""}`}
                      onClick={() => persistTheme(t)}
                      disabled={pending}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="panel section">
                <h3>Density</h3>
                <div className="seg">
                  {(["comfortable", "compact"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`seg-btn ${prefs.density === d ? "active" : ""}`}
                      onClick={() => persistDensity(d)}
                      disabled={pending}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="panel section">
                <h3>Data source</h3>
                <p className="section-copy">Switch between Live (Supabase), Mock (seed JSON), and Empty (no data).</p>
                <DataModeSwitcher mode={dataMode} liveConfigured={liveConfigured} />
              </div>
            </>
          )}

          {section === "integrations" && (
            <div className="panel section">
              <h3>Integrations</h3>
              <p className="section-copy">Status of external services Aperix Admin can connect to.</p>
              <table className="table">
                <thead><tr><th>Service</th><th>Status</th><th>Detail</th></tr></thead>
                <tbody>
                  {integrations.map((i) => (
                    <tr key={i.key}>
                      <td>{i.label}</td>
                      <td><span className={`badge int-${i.status}`}>{i.status}</span></td>
                      <td className="muted">{i.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section === "flags" && (
            <div className="panel section">
              <h3>Feature flags</h3>
              <p className="section-copy">Edit <code>data/admin/flags.json</code> to toggle features. Read-only here.</p>
              <table className="table">
                <thead><tr><th>Key</th><th>Enabled</th><th>Audience</th><th>Notes</th></tr></thead>
                <tbody>
                  {flags.length === 0 ? (
                    <tr><td colSpan={4} className="muted">No flags defined.</td></tr>
                  ) : flags.map((f) => (
                    <tr key={f.key}>
                      <td><code>{f.key}</code></td>
                      <td>{f.enabled ? "yes" : "no"}</td>
                      <td>{f.audience}</td>
                      <td className="muted">{f.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section === "defaults" && (
            <div className="panel section">
              <h3>Defaults</h3>
              <p className="section-copy">Workspace-wide defaults for new records. Wire to Supabase when live.</p>
              <dl className="kv">
                <dt>Default lead</dt><dd>Harrison</dd>
                <dt>Default support</dt><dd>—</dd>
                <dt>Default tier</dt><dd>Care</dd>
                <dt>Default hosting</dt><dd>Netlify</dd>
              </dl>
            </div>
          )}

          {section === "data" && (
            <div className="panel section">
              <h3>Data</h3>
              <p className="section-copy">Import / export tools. Empty until Supabase is connected.</p>
              <div className="actions-row">
                <button type="button" className="btn" disabled>Export portfolio (CSV)</button>
                <button type="button" className="btn" disabled>Import projects (JSON)</button>
                <button type="button" className="btn danger" disabled>Reset workspace</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
