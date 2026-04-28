/**
 * Lightweight GitHub REST helper for the repos page.
 * Reads GITHUB_TOKEN + GITHUB_ORG from env. Returns null if unconfigured.
 *
 * No client library to keep the bundle small — Aperix only needs a list view.
 */

export interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  private: boolean;
  archived: boolean;
  fork: boolean;
  language: string | null;
  pushed_at: string;
  stargazers_count: number;
  open_issues_count: number;
  topics: string[];
}

export interface GhFetchResult {
  ok: boolean;
  configured: boolean;
  org?: string;
  repos: GhRepo[];
  error?: string;
}

export async function fetchOrgRepos(): Promise<GhFetchResult> {
  const token = process.env.GITHUB_TOKEN;
  const org = process.env.GITHUB_ORG;

  if (!token || !org) {
    return {
      ok: false,
      configured: false,
      repos: [],
      error: "Set GITHUB_TOKEN + GITHUB_ORG in .env.local to enable live repos.",
    };
  }

  try {
    const url = `https://api.github.com/orgs/${encodeURIComponent(org)}/repos?per_page=100&sort=pushed&direction=desc`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "aperix-admin",
      },
      // Re-fetch every 5 minutes — repos rarely change faster than that.
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        configured: true,
        org,
        repos: [],
        error: `GitHub responded ${res.status}: ${body.slice(0, 200)}`,
      };
    }

    const json = (await res.json()) as GhRepo[];
    return { ok: true, configured: true, org, repos: json };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      org,
      repos: [],
      error: e instanceof Error ? e.message : "Unknown error fetching GitHub.",
    };
  }
}
