import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Magic-link callback: Supabase redirects here with `?code=...`.
 * We exchange the code for a session (sets cookies via the server
 * client) and then bounce the user to `?next=` or `/`.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (!code) {
    const back = url.clone();
    back.pathname = "/login";
    back.search = "?denied=missing-code";
    return NextResponse.redirect(back);
  }

  try {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  } catch {
    const back = url.clone();
    back.pathname = "/login";
    back.search = "?denied=exchange-failed";
    return NextResponse.redirect(back);
  }

  const dest = url.clone();
  dest.pathname = next.startsWith("/") ? next : "/";
  dest.search = "";
  return NextResponse.redirect(dest);
}
