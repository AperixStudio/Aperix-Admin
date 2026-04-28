import type { Metadata } from "next";
import { SettingsView } from "@/components/admin/settings-view";
import { getSession } from "@/lib/auth";
import { getFlags } from "@/lib/flags";
import { getUiConfig } from "@/lib/admin-data";
import { getShellProps } from "@/lib/shell-data";

export const metadata: Metadata = {
  title: "Settings | Aperix Admin",
  description: "Workspace settings: account, appearance, integrations, flags.",
};

interface IntegrationStatus {
  key: string;
  label: string;
  status: "ok" | "missing" | "stub";
  detail: string;
}

function getIntegrationStatuses(): IntegrationStatus[] {
  const supa = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const gh = !!process.env.GITHUB_TOKEN;
  const slack = !!process.env.SLACK_WEBHOOK_URL;
  const llm = false;
  return [
    {
      key: "supabase",
      label: "Supabase (live data)",
      status: supa ? "ok" : "missing",
      detail: supa ? "Connected." : "Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    },
    {
      key: "github",
      label: "GitHub (repos)",
      status: gh ? "ok" : "missing",
      detail: gh ? "Token detected." : "Set GITHUB_TOKEN + GITHUB_ORG in .env.local.",
    },
    {
      key: "slack",
      label: "Slack alerts",
      status: slack ? "ok" : "missing",
      detail: slack ? "Webhook detected." : "Set SLACK_WEBHOOK_URL in .env.local.",
    },
    {
      key: "llm",
      label: "AI Query LLM",
      status: llm ? "ok" : "stub",
      detail: "Heuristic answers. Wire an OSS model (Ollama / llama.cpp) when ready.",
    },
  ];
}

export default async function SettingsPage() {
  const [shell, flags, ui, session] = await Promise.all([
    getShellProps(),
    getFlags(),
    getUiConfig(),
    getSession(),
  ]);

  return (
    <SettingsView
      ui={ui}
      flags={flags}
      integrations={getIntegrationStatuses()}
      dataMode={shell.dataMode}
      liveConfigured={shell.liveConfigured}
      user={session.user}
      email={session.email}
      shellExtras={shell}
    />
  );
}
