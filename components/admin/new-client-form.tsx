"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/admin-actions";
import { useToast } from "@/components/admin/toast-provider";
import type { DataMode } from "@/lib/data-mode";

const initial = { ok: false as const, error: "" };

export function NewClientForm({ dataMode }: { dataMode: DataMode }) {
  const router = useRouter();
  const toast = useToast();
  const [state, action, pending] = useActionState(createClient, initial as unknown as
    { ok: true; id: string; name: string } | { ok: false; error: string });

  const pushToast = toast.push;
  useEffect(() => {
    if (!state) return;
    if ("ok" in state && state.ok) {
      pushToast(`Client ${state.name} created`, "success");
      router.push(`/clients/${state.id}`);
    } else if (state && !state.ok && state.error) {
      pushToast(state.error, "error");
    }
  }, [state, router, pushToast]);

  return (
    <form action={action} className="new-client-form">
      {dataMode !== "live" ? (
        <div className="form-banner">
          <strong>Read-only in {dataMode} mode.</strong>
          <span> Switch to <em>Live</em> in the topbar (Supabase keys required) to create real records.</span>
        </div>
      ) : null}

      <div className="grid-2 form-grid">
        <label className="form-field">
          <span>Client ID <em>required</em></span>
          <input name="id" required pattern="[a-z0-9-]+" placeholder="acme-co" />
          <small>lowercase letters, numbers, dashes — used in URLs.</small>
        </label>
        <label className="form-field">
          <span>Display name <em>required</em></span>
          <input name="name" required placeholder="Acme Co" />
        </label>
        <label className="form-field" style={{ gridColumn: "1 / -1" }}>
          <span>Summary <em>required</em></span>
          <input name="summary" required placeholder="One line about the client and their site." />
        </label>
        <label className="form-field">
          <span>Lead <em>required</em></span>
          <input name="lead" required defaultValue="Harrison" />
        </label>
        <label className="form-field">
          <span>Support</span>
          <input name="support" placeholder="Optional secondary contact" />
        </label>
        <label className="form-field">
          <span>Tier</span>
          <select name="tier" defaultValue="essential">
            <option value="essential">Essential</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
            <option value="internal">Internal</option>
          </select>
        </label>
        <label className="form-field">
          <span>Brand key</span>
          <input name="brandKey" placeholder="e.g. apex, soothe (controls accent tint)" />
        </label>
        <label className="form-field">
          <span>Domain</span>
          <input name="domain" placeholder="acme.com.au" />
        </label>
        <label className="form-field">
          <span>Hosting</span>
          <input name="hosting" placeholder="Netlify" defaultValue="Netlify" />
        </label>
        <label className="form-field">
          <span>Registrar</span>
          <input name="registrar" placeholder="Cloudflare" />
        </label>
        <label className="form-field" style={{ gridColumn: "1 / -1" }}>
          <span>GitHub repo</span>
          <input name="githubRepo" placeholder="AperixStudio/client-acme-site" />
        </label>
      </div>

      <div className="actions-row">
        <button type="submit" className="btn primary" disabled={pending || dataMode !== "live"}>
          {pending ? "Creating…" : "Create client"}
        </button>
        <span className="muted" style={{ fontSize: 12 }}>
          Form submits to <code>adapter.createProject()</code>. Mock + Empty are read-only.
        </span>
      </div>
    </form>
  );
}
