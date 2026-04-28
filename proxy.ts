import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isEmailAllowed, getAdminAllowlist } from "@/lib/auth";

/**
 * Root proxy — runs on every request matching the matcher below.
 * (Renamed from `middleware` per Next 16 file convention; same behaviour.)
 *
 * Responsibilities:
 *   1. Refresh the Supabase auth cookie (server-side session bridge).
 *   2. Gate the entire app behind `ADMIN_ALLOWED_EMAILS` allowlist.
 *
 * Bypass list:
 *   - /login                 → magic-link entry
 *   - /auth/*                → callback + signout endpoints
 *   - /api/cron/*            → cron jobs (use CRON_SECRET instead)
 *   - /_next, favicon, etc.  → static assets (handled by matcher)
 *
 * Behaviour when Supabase is NOT configured:
 *   - We let everything through. Local dev with mock mode shouldn't
 *     require setting up Supabase first. Production deploys MUST set
 *     the env vars — see /lib/supabase/middleware.ts for the toggle.
 */

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/signout",
];

const PUBLIC_PREFIXES = [
  "/api/cron/",
  "/_next/",
  "/favicon",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Refresh session cookies (always — even on public paths so that
  //    /login knows whether the visitor is already signed in).
  const { response, user, configured } = await updateSession(request);

  // 2. If Supabase isn't configured, pass through. Caller (deploy
  //    pipeline) is responsible for ensuring env vars exist in prod.
  if (!configured) return response;

  // 3. Public paths skip the allowlist check.
  if (isPublic(pathname)) return response;

  // 4. No user → redirect to /login with redirect-back marker.
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 5. User present but not on the allowlist → forbid via /login?denied=1.
  //    (We never throw 403 here because the user might just need a
  //    different account; the /login page renders a clear message.)
  const allowlist = getAdminAllowlist();
  if (allowlist.length === 0) {
    // Misconfiguration: env says configured but no emails listed.
    // Soft-fail to /login with a denied marker.
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("denied", "noallowlist");
    return NextResponse.redirect(url);
  }
  if (!isEmailAllowed(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("denied", "1");
    url.searchParams.set("email", user.email ?? "");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except Next internals + static files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
