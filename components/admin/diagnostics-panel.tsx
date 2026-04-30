"use client";

import { useState, useTransition } from "react";
import { runDiagnostics } from "@/lib/admin-actions";
import type { DiagnosticReport } from "@/lib/data/adapter";

export function DiagnosticsPanel() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = () => {
    setError(null);
    start(async () => {
      try {
        const r = await runDiagnostics();
        setReport(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const summary = report
    ? {
        ok: report.checks.filter((c) => c.status === "ok").length,
        warn: report.checks.filter((c) => c.status === "warn").length,
        fail: report.checks.filter((c) => c.status === "fail").length,
      }
    : null;

  return (
    <div className="panel section">
      <h3>Diagnostics</h3>
      <p className="section-copy">
        Pings every Supabase table the app depends on and reports if it&apos;s missing,
        permission-denied, or healthy. Use this whenever a page shows blank or errors.
      </p>

      <div className="actions-row" style={{ marginBottom: 14 }}>
        <button type="button" className="btn primary" onClick={run} disabled={pending}>
          {pending ? "Running…" : report ? "Re-run diagnostics" : "Run diagnostics"}
        </button>
        {report ? (
          <span className="muted" style={{ fontSize: 12 }}>
            {summary?.ok} OK · {summary?.warn} warn · {summary?.fail} fail · {new Date(report.generatedAt).toLocaleTimeString()}
          </span>
        ) : null}
      </div>

      {error ? <p className="login-alert login-alert--err">{error}</p> : null}

      {report ? (
        <table className="table">
          <thead>
            <tr><th>Check</th><th>Status</th><th>Detail</th><th>Fix</th></tr>
          </thead>
          <tbody>
            {report.checks.map((c) => (
              <tr key={c.key}>
                <td>{c.label}</td>
                <td><span className={`badge int-${c.status === "ok" ? "ok" : c.status === "warn" ? "stub" : "missing"}`}>{c.status}</span></td>
                <td className="muted" style={{ fontSize: 13 }}>{c.detail}</td>
                <td className="muted" style={{ fontSize: 12 }}>{c.fixHint ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted" style={{ fontSize: 13 }}>Click &ldquo;Run diagnostics&rdquo; to check every connected table.</p>
      )}
    </div>
  );
}
