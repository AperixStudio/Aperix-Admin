import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import type { AuditEntry } from "@/lib/admin-schemas";

const AUDIT_PATH = path.join(process.cwd(), "data", "admin", "audit.json");

async function readAudit(): Promise<AuditEntry[]> {
  try {
    const text = await fs.readFile(AUDIT_PATH, "utf8");
    return JSON.parse(text) as AuditEntry[];
  } catch {
    return [];
  }
}

async function writeAudit(entries: AuditEntry[]) {
  await fs.writeFile(AUDIT_PATH, JSON.stringify(entries, null, 2), "utf8");
}

/** Append-only. Server-only. */
export async function logAudit(entry: Omit<AuditEntry, "id" | "timestamp" | "actor" | "role">) {
  const all = await readAudit();
  const cookieStore = await cookies();
  const actor = cookieStore.get("aperix_user")?.value ?? "unknown";
  const role = cookieStore.get("aperix_role")?.value ?? "viewer";
  const next: AuditEntry = {
    ...entry,
    id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    actor,
    role,
  };
  all.unshift(next);
  await writeAudit(all.slice(0, 5000)); // bounded
  return next;
}

export async function getAuditLog(limit = 200): Promise<AuditEntry[]> {
  const all = await readAudit();
  return all.slice(0, limit);
}

export async function getAuditFor(entityType: string, entityId: string, limit = 50) {
  const all = await readAudit();
  return all.filter((e) => e.entityType === entityType && e.entityId === entityId).slice(0, limit);
}
