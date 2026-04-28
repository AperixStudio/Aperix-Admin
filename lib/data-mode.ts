import { cookies } from "next/headers";

export type DataMode = "live" | "mock" | "empty";

const COOKIE = "aperix_data_mode";

export async function getDataMode(): Promise<DataMode> {
  const c = await cookies();
  const v = c.get(COOKIE)?.value;
  if (v === "live") return v;
  return "live";
}

export async function setDataMode(mode: DataMode): Promise<void> {
  const c = await cookies();
  const next = mode === "live" ? "live" : "live";
  c.set(COOKIE, next, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export function isLiveConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
