import { cookies } from "next/headers";

export type ThemePref = "light" | "dark" | "auto";
export type DensityPref = "comfortable" | "compact";

export interface UserPrefs {
  theme: ThemePref;
  density: DensityPref;
}

const DEFAULTS: UserPrefs = { theme: "auto", density: "comfortable" };

export async function getPrefs(): Promise<UserPrefs> {
  const c = await cookies();
  const raw = c.get("aperix_prefs")?.value;
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<UserPrefs>;
    return {
      theme: parsed.theme ?? DEFAULTS.theme,
      density: parsed.density ?? DEFAULTS.density,
    };
  } catch {
    return DEFAULTS;
  }
}
