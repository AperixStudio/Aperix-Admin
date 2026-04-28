import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseAdminConfigured, getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, isResendConfigured } from "@/lib/integrations/resend";
import { getAdminAllowlist } from "@/lib/auth";

/**
 * Daily digest endpoint.
 *
 * Called by Netlify Scheduled Functions (see netlify/functions/daily-digest.ts)
 * once a day at 08:00 AEST. Authenticated by a shared secret header
 * (CRON_SECRET) — bypasses the auth middleware (which excludes /api/cron/*).
 *
 * Output:
 *  - Builds an HTML summary of unread notifications + open action items
 *  - Sends to ADMIN_EMAIL_DIGEST_TO (defaults to all allowlisted admins)
 */

export const dynamic = "force-dynamic";

interface NotificationRow {
  id: string; kind: string; title: string; body: string;
  created_at: string; read: boolean | null; href: string | null;
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  // 1. Auth: require shared secret.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured on server" },
      { status: 500 }
    );
  }
  const supplied = request.headers.get("x-cron-secret");
  if (supplied !== expected) return unauthorized();

  // 2. Resolve recipients.
  const recipientsRaw = process.env.ADMIN_EMAIL_DIGEST_TO;
  const recipients = recipientsRaw
    ? recipientsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : getAdminAllowlist();

  if (recipients.length === 0) {
    return NextResponse.json({
      ok: false,
      error: "No digest recipients (set ADMIN_EMAIL_DIGEST_TO or ADMIN_ALLOWED_EMAILS)",
    }, { status: 500 });
  }

  // 3. Build digest payload (only when DB + email are configured).
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "Supabase not configured — digest skipped",
    }, { status: 503 });
  }
  if (!isResendConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "Resend not configured — digest skipped",
    }, { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: unread }, { data: openTasks }, { data: openIncidents }] = await Promise.all([
    supabase.from("notifications").select("*").eq("read", false).gte("created_at", since).order("created_at", { ascending: false }),
    supabase.from("tasks").select("id,title,owner,priority,due,project_id").neq("status", "done").limit(50),
    supabase.from("incidents").select("id,title,severity,project_id").neq("severity", "resolved").limit(50),
  ]);

  const html = renderDigestHtml({
    unread: (unread ?? []) as NotificationRow[],
    openTasksCount: openTasks?.length ?? 0,
    openIncidentsCount: openIncidents?.length ?? 0,
  });

  const result = await sendEmail({
    to: recipients,
    subject: `Aperix Admin · daily digest (${new Date().toLocaleDateString("en-AU")})`,
    html,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    sent: recipients.length,
    notifications: unread?.length ?? 0,
    tasks: openTasks?.length ?? 0,
    incidents: openIncidents?.length ?? 0,
  });
}

// Allow GET for manual testing (still requires the secret).
export async function GET(request: NextRequest) {
  return POST(request);
}

function renderDigestHtml(input: {
  unread: NotificationRow[];
  openTasksCount: number;
  openIncidentsCount: number;
}): string {
  const { unread, openTasksCount, openIncidentsCount } = input;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://admin.aperixstudio.com.au";

  const notificationsHtml = unread.length === 0
    ? `<p style="color:#617181;margin:0;">No new notifications in the last 24h.</p>`
    : unread.slice(0, 25).map((n) => `
        <li style="margin:0 0 10px;padding:0;">
          <strong style="color:#14202d;">${escapeHtml(n.title)}</strong>
          <span style="color:#617181;font-size:12px;margin-left:6px;">${escapeHtml(n.kind)}</span>
          <div style="color:#233140;font-size:13px;margin-top:2px;">${escapeHtml(n.body)}</div>
        </li>`).join("");

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#e8eef5;font-family:Inter,system-ui,sans-serif;color:#14202d;">
  <div style="max-width:560px;margin:0 auto;background:#f2f5f9;border:1px solid #c1cedb;border-radius:20px;padding:28px;">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#617181;">Aperix</p>
    <h1 style="margin:6px 0 4px;font-size:22px;font-weight:700;">Daily digest</h1>
    <p style="margin:0 0 18px;color:#617181;font-size:13px;">${new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>

    <div style="display:flex;gap:8px;margin:0 0 20px;flex-wrap:wrap;">
      <span style="background:#dde6f0;border:1px solid #c1cedb;border-radius:14px;padding:6px 10px;font-size:12px;">${unread.length} new notification${unread.length === 1 ? "" : "s"}</span>
      <span style="background:#dde6f0;border:1px solid #c1cedb;border-radius:14px;padding:6px 10px;font-size:12px;">${openTasksCount} open task${openTasksCount === 1 ? "" : "s"}</span>
      <span style="background:#dde6f0;border:1px solid #c1cedb;border-radius:14px;padding:6px 10px;font-size:12px;">${openIncidentsCount} open incident${openIncidentsCount === 1 ? "" : "s"}</span>
    </div>

    <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.16em;color:#233140;margin:0 0 12px;">Recent notifications</h2>
    <ul style="margin:0 0 22px;padding:0;list-style:none;">
      ${notificationsHtml}
    </ul>

    <a href="${baseUrl}" style="display:inline-block;background:#0a84ff;color:#fff;border-radius:14px;padding:10px 16px;text-decoration:none;font-weight:600;font-size:13px;">Open Aperix Admin →</a>

    <p style="margin:24px 0 0;color:#617181;font-size:11px;">Internal automated email · ${baseUrl}</p>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
