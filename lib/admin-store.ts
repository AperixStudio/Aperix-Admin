import { promises as fs } from "node:fs";
import path from "node:path";
import type { ProjectRecord } from "@/lib/admin-types";

const dataDir = path.join(process.cwd(), "data", "admin");

/**
 * Minimal mutation store backed by JSON files. Sequential writes only
 * (Node's single-thread + per-call read-modify-write is fine for an internal
 * tool of this scale). For real production: swap with Drizzle + Postgres.
 */

async function readJson<T>(name: string): Promise<T> {
  const p = path.join(dataDir, name);
  const text = await fs.readFile(p, "utf8");
  return JSON.parse(text) as T;
}

async function writeJson<T>(name: string, data: T) {
  const p = path.join(dataDir, name);
  await fs.writeFile(p, JSON.stringify(data, null, 2), "utf8");
}

// ── Project mutations ────────────────────────────────────────
export async function updateProject(
  id: string,
  patch: (p: ProjectRecord) => ProjectRecord
): Promise<{ before: ProjectRecord; after: ProjectRecord } | null> {
  const projects = await readJson<ProjectRecord[]>("projects.json");
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const before = JSON.parse(JSON.stringify(projects[idx])) as ProjectRecord;
  const after = patch(projects[idx]);
  projects[idx] = after;
  await writeJson("projects.json", projects);
  return { before, after };
}

// ── Generic JSON list mutations (notifications, changelog, etc.) ──
export async function readList<T>(file: string): Promise<T[]> {
  try {
    return await readJson<T[]>(file);
  } catch {
    return [];
  }
}

export async function appendToList<T extends { id: string }>(file: string, item: T, max = 1000) {
  const list = await readList<T>(file);
  list.unshift(item);
  await writeJson(file, list.slice(0, max));
  return item;
}

export async function updateListItem<T extends { id: string }>(
  file: string,
  id: string,
  patch: (item: T) => T
): Promise<T | null> {
  const list = await readList<T>(file);
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  list[idx] = patch(list[idx]);
  await writeJson(file, list);
  return list[idx];
}
