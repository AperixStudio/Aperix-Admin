"use client";

import { useTransition } from "react";
import { setDataMode } from "@/lib/admin-actions";
import type { DataMode } from "@/lib/data-mode";
import { useToast } from "@/components/admin/toast-provider";

export function DataModeSwitcher({
  mode,
  liveConfigured,
}: {
  mode: DataMode;
  liveConfigured: boolean;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();

  const change = (next: DataMode) => {
    start(async () => {
      try {
        await setDataMode(next);
        toast.push(`Data mode → ${next}`, "info");
      } catch (e) {
        toast.push(e instanceof Error ? e.message : "Failed to switch mode", "error");
      }
    });
  };

  return (
    <div className={`data-mode-switcher mode-${mode}`} role="group" aria-label="Data source">
      <button
        type="button"
        className={`dm-pill ${mode === "live" ? "active" : ""}`}
        onClick={() => change("live")}
        disabled={pending}
        title={liveConfigured ? "Live data (Supabase)" : "Live mode requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY"}
      >
        <span className={`dm-dot ${liveConfigured ? "ok" : "off"}`} /> Live
      </button>
      <button
        type="button"
        className={`dm-pill ${mode === "mock" ? "active" : ""}`}
        onClick={() => change("mock")}
        disabled={pending}
        title="Mock data (JSON seed files)"
      >
        <span className="dm-dot warn" /> Mock
      </button>
      <button
        type="button"
        className={`dm-pill ${mode === "empty" ? "active" : ""}`}
        onClick={() => change("empty")}
        disabled={pending}
        title="Empty (preview UI with no data)"
      >
        <span className="dm-dot off" /> Empty
      </button>
    </div>
  );
}
