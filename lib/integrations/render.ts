/**
 * Lightweight Render REST helper.
 * Reads RENDER_API_KEY from env. Returns configured=false if missing.
 *
 * Docs: https://api-docs.render.com/reference/introduction
 */

export interface RenderService {
  id: string;
  name: string;
  type: string;          // "web_service" | "static_site" | "background_worker" | etc.
  slug: string;
  serviceDetails?: {
    url?: string | null;
    publishPath?: string | null;
    pullRequestPreviewsEnabled?: string | null;
  } | null;
  repo?: string | null;
  branch?: string | null;
  suspended?: string;
  suspenders?: string[];
  createdAt: string;
  updatedAt: string;
}

interface RenderListEnvelope<T> {
  cursor: string;
  service?: T;
}

export interface RenderResult<T> {
  ok: boolean;
  configured: boolean;
  items: T[];
  error?: string;
}

const API = "https://api.render.com/v1";

function token(): string | null {
  return process.env.RENDER_API_KEY || null;
}

async function rnFetch<T>(path: string): Promise<RenderResult<T>> {
  const t = token();
  if (!t) {
    return {
      ok: false,
      configured: false,
      items: [],
      error: "Set RENDER_API_KEY in .env.local to enable Render integration.",
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
        error: `Render responded ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    const json = (await res.json()) as unknown;
    // Render returns either an array of envelopes (for list endpoints) or a
    // single service. Normalise to the inner item.
    if (Array.isArray(json)) {
      const items = (json as RenderListEnvelope<T>[])
        .map((e) => e.service)
        .filter((x): x is T => Boolean(x));
      return { ok: true, configured: true, items };
    }
    return { ok: true, configured: true, items: [json as T] };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      items: [],
      error: e instanceof Error ? e.message : "Unknown error fetching Render.",
    };
  }
}

export function fetchRenderServices() {
  return rnFetch<RenderService>("/services?limit=100");
}
