/**
 * Lightweight Cloudflare REST helper.
 * Reads CLOUDFLARE_API_TOKEN + (optional) CLOUDFLARE_ACCOUNT_ID from env.
 *
 * Docs: https://developers.cloudflare.com/api/
 */

export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  created_on: string;
  modified_on: string;
  activated_on: string | null;
  development_mode: number;
  name_servers: string[];
  original_name_servers: string[] | null;
}

export interface CloudflareResult<T> {
  ok: boolean;
  configured: boolean;
  items: T[];
  error?: string;
}

const API = "https://api.cloudflare.com/client/v4";

function token(): string | null {
  return process.env.CLOUDFLARE_API_TOKEN || null;
}

interface CfEnvelope<T> {
  success: boolean;
  errors?: { code: number; message: string }[];
  messages?: unknown[];
  result?: T;
  result_info?: { page: number; per_page: number; total_count: number; total_pages: number };
}

async function cfFetch<T>(path: string): Promise<CloudflareResult<T>> {
  const t = token();
  if (!t) {
    return {
      ok: false,
      configured: false,
      items: [],
      error: "Set CLOUDFLARE_API_TOKEN in .env.local to enable Cloudflare integration.",
    };
  }
  try {
    const res = await fetch(`${API}${path}`, {
      headers: {
        Authorization: `Bearer ${t}`,
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });
    const json = (await res.json().catch(() => ({}))) as CfEnvelope<T[]>;
    if (!res.ok || !json.success) {
      const msg = json.errors?.map((e) => e.message).join("; ") ?? `HTTP ${res.status}`;
      return { ok: false, configured: true, items: [], error: `Cloudflare: ${msg}` };
    }
    return { ok: true, configured: true, items: json.result ?? [] };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      items: [],
      error: e instanceof Error ? e.message : "Unknown error fetching Cloudflare.",
    };
  }
}

export function fetchCloudflareZones() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const filter = accountId ? `?account.id=${encodeURIComponent(accountId)}&per_page=200` : "?per_page=200";
  return cfFetch<CloudflareZone>(`/zones${filter}`);
}
