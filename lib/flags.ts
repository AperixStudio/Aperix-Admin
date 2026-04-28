import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { FeatureFlag } from "@/lib/admin-schemas";

const FLAGS_PATH = path.join(process.cwd(), "data", "admin", "flags.json");

export const getFlags = cache(async (): Promise<FeatureFlag[]> => {
  try {
    const text = await fs.readFile(FLAGS_PATH, "utf8");
    return JSON.parse(text) as FeatureFlag[];
  } catch {
    return [];
  }
});

export async function isFlagOn(key: string): Promise<boolean> {
  const flags = await getFlags();
  const f = flags.find((x) => x.key === key);
  if (!f) return false;
  if (!f.enabled) return false;
  // Single admin role — flag is on for everyone if enabled.
  return true;
}
