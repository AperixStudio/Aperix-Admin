import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase server client tied to the user's session via cookies.
 * Use this for reading auth state inside Server Components,
 * Server Actions, and Route Handlers.
 */
export async function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Supabase server client missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY env.");
  }
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component (no mutation allowed) — middleware refreshes the session instead.
        }
      },
    },
  });
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
