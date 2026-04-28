"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Used by the /login page to send the
 * magic link and listen for auth state changes. Safe to expose
 * the anon key — RLS protects rows.
 */
export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Supabase browser client missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY.");
  }
  return createBrowserClient(url, anon);
}
