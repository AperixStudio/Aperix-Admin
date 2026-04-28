import { cookies } from "next/headers";

export type DataMode = "live" | "mock" | "empty";

const COOKIE = "aperix_data_mode";

export async function getDataMode(): Promise<DataMode> {
  const c = await cookies();
  const v = c.get(COOKIE)?.value;
  if (v === "live" || v === "mock" || v === "empty") return v;
  // Default: mock so a fresh clone has something to look at.
  return "mock";
}

export async function setDataMode(mode: DataMode): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, mode, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export function isLiveConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
