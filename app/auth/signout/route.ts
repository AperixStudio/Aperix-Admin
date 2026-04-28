import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Sign the current user out (clears Supabase cookies) and bounce
 * back to /login.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    await supabase.auth.signOut();
  } catch {
    // best-effort; cookie may already be invalid
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
