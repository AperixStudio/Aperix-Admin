import { getDataMode, isLiveConfigured } from "@/lib/data-mode";
import { mockAdapter } from "@/lib/data/mock-adapter";
import { emptyAdapter } from "@/lib/data/empty-adapter";
import { liveAdapter } from "@/lib/data/live-adapter";
import type { DataAdapter } from "@/lib/data/adapter";

/**
 * Resolves the adapter for the current request based on the
 * data-mode cookie. Live falls back to empty if Supabase env
 * vars aren't set, so the UI never explodes.
 */
export async function getAdapter(): Promise<DataAdapter> {
  const mode = await getDataMode();
  if (mode === "live") return isLiveConfigured() ? liveAdapter : emptyAdapter;
  if (mode === "mock") return mockAdapter;
  return emptyAdapter;
}
