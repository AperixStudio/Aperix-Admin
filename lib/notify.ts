/**
 * Notification adapters. All optional and env-gated so the dashboard
 * functions without any external service. Real integrations slot in here.
 */

export interface NotifyPayload {
  title: string;
  body: string;
  href?: string;
  severity?: "info" | "warning" | "critical";
}

/** Slack: requires SLACK_WEBHOOK_URL env. No-op otherwise. */
export async function notifySlack(payload: NotifyPayload): Promise<{ ok: boolean; reason?: string }> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return { ok: false, reason: "SLACK_WEBHOOK_URL not configured" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: `*${payload.title}*\n${payload.body}${payload.href ? `\n<${payload.href}>` : ""}`,
      }),
    });
    return { ok: res.ok };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "unknown" };
  }
}

/** Email digest stub. Wire to Resend / SES later. */
export async function notifyEmail(_payload: NotifyPayload & { to: string }): Promise<{ ok: boolean; reason?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, reason: "RESEND_API_KEY not configured" };
  // Real send goes here.
  return { ok: true };
}

/** Sentry init stub. Module-level guard for missing DSN. */
export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  // Real init goes here once @sentry/nextjs is added.
}
