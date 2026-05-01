"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, createProspect } from "@/lib/admin-actions";
import { useToast } from "@/components/admin/toast-provider";
import type { DataMode } from "@/lib/data-mode";

type ClientResult = { ok: true; id: string; name: string } | { ok: false; error: string };
type ProspectResult = { ok: true; id: string; businessName: string } | { ok: false; error: string };

const initial = { ok: false as const, error: "" };

type Mode = "client" | "prospect";

export function NewClientForm({ dataMode }: { dataMode: DataMode }) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("client");

  const [clientState, clientAction, clientPending] =
    useActionState(createClient, initial as unknown as ClientResult);
  const [prospectState, prospectAction, prospectPending] =
    useActionState(createProspect, initial as unknown as ProspectResult);

  const pushToast = toast.push;

  useEffect(() => {
    if (mode !== "client" || !clientState) return;
    if ("ok" in clientState && clientState.ok) {
      pushToast(`Client ${clientState.name} created`, "success");
      router.push(`/clients/${clientState.id}`);
    } else if (clientState && !clientState.ok && clientState.error) {
      pushToast(clientState.error, "error");
    }
  }, [clientState, mode, router, pushToast]);

  useEffect(() => {
    if (mode !== "prospect" || !prospectState) return;
    if ("ok" in prospectState && prospectState.ok) {
      pushToast(`Prospect "${prospectState.businessName}" saved`, "success");
      router.prefetch("/prospects");
      router.push(`/prospects`);
      window.setTimeout(() => router.refresh(), 0);
    } else if (prospectState && !prospectState.ok && prospectState.error) {
      pushToast(prospectState.error, "error");
    }
  }, [prospectState, mode, router, pushToast]);

  const readOnly = dataMode !== "live";
  const pending = mode === "client" ? clientPending : prospectPending;

  return (
    <div className="new-client-form-wrap">
      <div className="form-mode-toggle" role="tablist" aria-label="Record type">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "client"}
          className={`seg-btn ${mode === "client" ? "active" : ""}`}
          onClick={() => setMode("client")}
        >
          📦 New client
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "prospect"}
          className={`seg-btn ${mode === "prospect" ? "active" : ""}`}
          onClick={() => setMode("prospect")}
        >
          🎯 New prospect / lead
        </button>
      </div>

      <p className="section-copy">
        {mode === "client"
          ? "Create a paying or active client. All fields are persisted to the projects table and surface across the dashboard."
          : "Save a business you've spotted (e.g. on Google Maps) as a lead to research and reach out to. Convert to a client later."}
      </p>

      {readOnly ? (
        <div className="form-banner">
          <strong>Read-only in {dataMode} mode.</strong>
          <span> Switch to <em>Live</em> in the topbar (Supabase keys required) to write records.</span>
        </div>
      ) : null}

      {mode === "client" ? (
        <form action={clientAction} className="new-client-form" key="client-form">
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
              <input name="brandKey" placeholder="apex, soothe, lumina (controls accent tint)" />
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
            <label className="form-field">
              <span>Live URL</span>
              <input name="liveUrl" type="url" placeholder="https://acme.com.au" />
            </label>
            <label className="form-field">
              <span>Staging URL</span>
              <input name="stagingUrl" type="url" placeholder="https://staging.acme.com.au" />
            </label>
            <label className="form-field" style={{ gridColumn: "1 / -1" }}>
              <span>GitHub repo</span>
              <input name="githubRepo" placeholder="AperixStudio/client-acme-site" />
            </label>
            <label className="form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Tags</span>
              <input name="tags" placeholder="ecommerce, geelong, electrician (comma-separated)" />
            </label>
            <label className="form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Internal notes</span>
              <textarea name="notes" rows={3} placeholder="Anything we should remember about this client." />
            </label>
          </div>

          <div className="actions-row">
            <button type="submit" className="btn primary" disabled={pending || readOnly}>
              {pending ? "Creating…" : "Create client"}
            </button>
            <span className="muted" style={{ fontSize: 12 }}>
              Saved fields appear across Clients, Dashboard, Repos, and Audit log.
            </span>
          </div>
        </form>
      ) : (
        <form action={prospectAction} className="new-client-form" key="prospect-form">
          <div className="grid-2 form-grid">
            <label className="form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Business name <em>required</em></span>
              <input name="businessName" required placeholder="Geelong Auto Repairs" />
            </label>
            <label className="form-field">
              <span>Google Maps share link</span>
              <input name="mapsUrl" type="url" placeholder="https://maps.app.goo.gl/…" />
              <small>Tap the share button on the Maps listing and paste the URL.</small>
            </label>
            <label className="form-field">
              <span>Current website (if any)</span>
              <input name="currentSite" type="url" placeholder="https://oldsite.example" />
              <small>Their existing site — we&apos;ll review it before we reach out.</small>
            </label>
            <label className="form-field">
              <span>Industry</span>
              <input name="industry" placeholder="Trades, Hospitality, Retail…" />
            </label>
            <label className="form-field">
              <span>Location / suburb</span>
              <input name="location" placeholder="Belmont VIC" />
            </label>
            <label className="form-field">
              <span>Source</span>
              <select name="source" defaultValue="google-maps">
                <option value="google-maps">Google Maps</option>
                <option value="referral">Referral</option>
                <option value="cold-list">Cold list</option>
                <option value="event">Event</option>
                <option value="inbound">Inbound enquiry</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="form-field">
              <span>Priority</span>
              <select name="priority" defaultValue="medium">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="form-field">
              <span>Owner</span>
              <input name="owner" defaultValue="Harrison" />
            </label>
            <label className="form-field">
              <span>Status</span>
              <select name="status" defaultValue="new">
                <option value="new">New</option>
                <option value="researching">Researching</option>
                <option value="contacted">Contacted</option>
                <option value="meeting">Meeting booked</option>
                <option value="dormant">Dormant</option>
              </select>
            </label>
            <label className="form-field">
              <span>Contact name</span>
              <input name="contactName" placeholder="Best person to talk to" />
            </label>
            <label className="form-field">
              <span>Contact email</span>
              <input name="contactEmail" type="email" placeholder="owner@example.com.au" />
            </label>
            <label className="form-field">
              <span>Contact phone</span>
              <input name="contactPhone" placeholder="0400 000 000" />
            </label>
            <label className="form-field">
              <span>Next action</span>
              <input name="nextAction" placeholder="Build mock site, then cold call" />
            </label>
            <label className="form-field">
              <span>Next action due</span>
              <input name="nextActionDue" type="date" />
            </label>
            <label className="form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Tags</span>
              <input name="tags" placeholder="electrician, no-mobile, geelong (comma-separated)" />
            </label>
            <label className="form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Notes</span>
              <textarea
                name="notes"
                rows={4}
                placeholder="Why are they a lead? What's wrong with their current site? What angle would we lead with?"
              />
            </label>
          </div>

          <div className="actions-row">
            <button type="submit" className="btn primary" disabled={pending || readOnly}>
              {pending ? "Saving…" : "Save prospect"}
            </button>
            <span className="muted" style={{ fontSize: 12 }}>
              Saved leads appear on the <a href="/prospects" className="link">Prospects</a> tab so we can work the pipeline.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
