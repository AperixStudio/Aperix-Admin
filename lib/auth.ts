import { cookies } from "next/headers";
import { getSupabaseServer, isSupabaseAuthConfigured } from "@/lib/supabase/server";

/**
 * Single-role admin auth.
 *
 * - When Supabase Auth is configured, this reads the real session
 *   from the cookie-bound server client and reports the user's email
 *   as the canonical identity.
 * - When not configured (fresh clone, no env), it falls back to a
 *   cookie-based dev identity so local mock-mode work is uninterrupted.
 *
 * The middleware (root /middleware.ts) is responsible for actually
 * gating access — this helper only describes the current session.
 */
export interface AdminSession {
  user: string;       // Display name (derived from email local-part)
  email?: string;
  isAuthed: boolean;
}

const DEFAULT_USER = "Harrison";

function nameFromEmail(email: string | null | undefined): string {
  if (!email) return DEFAULT_USER;
  const local = email.split("@")[0] ?? "";
  if (!local) return DEFAULT_USER;
  // "harrison.tabone" → "Harrison Tabone"
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export async function getSession(): Promise<AdminSession> {
  // Real auth path
  if (isSupabaseAuthConfigured()) {
    try {
      const supabase = await getSupabaseServer();
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email ?? undefined;
      if (email) {
        return { user: nameFromEmail(email), email, isAuthed: true };
      }
    } catch {
      // Fall through to dev fallback below.
    }
  }

  // Dev fallback — cookie-based, no real auth.
  const c = await cookies();
  const user = c.get("aperix_user")?.value ?? DEFAULT_USER;
  const email = c.get("aperix_email")?.value;
  return { user, email, isAuthed: true };
}

/**
 * Returns the configured allowlist of admin emails.
 * Source: ADMIN_ALLOWED_EMAILS env var (comma-separated).
 * The DB also has `admin_users` for RLS, but the middleware uses
 * this env list to avoid a DB roundtrip on every request.
 */
export function getAdminAllowlist(): string[] {
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = getAdminAllowlist();
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}
