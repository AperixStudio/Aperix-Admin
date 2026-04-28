/**
 * Lightweight Netlify REST helper.
 * Reads NETLIFY_TOKEN from env. Returns configured=false if missing.
 *
 * Docs: https://docs.netlify.com/api/get-started/
 */

export interface NetlifySite {
  id: string;
  name: string;
  url: string;
  ssl_url: string | null;
  custom_domain: string | null;
  deploy_url: string | null;
  state: string;
  build_settings?: { repo_url?: string | null } | null;
  published_deploy?: {
    id: string;
    state: string;
    branch: string | null;
    commit_ref: string | null;
    title: string | null;
    deploy_time: number | null;
    created_at: string;
    error_message: string | null;
  } | null;
}

export interface NetlifyDeploy {
  id: string;
  site_id: string;
  state: string;          // "ready" | "error" | "building" | "uploading" | etc.
  branch: string | null;
  commit_ref: string | null;
  title: string | null;
  error_message: string | null;
  deploy_time: number | null;
  created_at: string;
  published_at: string | null;
}

export interface NetlifyResult<T> {
  ok: boolean;
  configured: boolean;
  items: T[];
  error?: string;
}

const API = "https://api.netlify.com/api/v1";

function token(): string | null {
  return process.env.NETLIFY_TOKEN || null;
}

async function ntFetch<T>(path: string): Promise<NetlifyResult<T>> {
  const t = token();
  if (!t) {
    return {
      ok: false,
      configured: false,
      items: [],
      error: "Set NETLIFY_TOKEN in .env.local to enable Netlify integration.",
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
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        configured: true,
        items: [],
        error: `Netlify responded ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    const json = (await res.json()) as T[];
    return { ok: true, configured: true, items: json };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      items: [],
      error: e instanceof Error ? e.message : "Unknown error fetching Netlify.",
    };
  }
}

export function fetchNetlifySites() {
  return ntFetch<NetlifySite>("/sites?per_page=200");
}

export function fetchNetlifyDeploys(siteId: string, limit = 20) {
  return ntFetch<NetlifyDeploy>(`/sites/${encodeURIComponent(siteId)}/deploys?per_page=${limit}`);
}
