/**
 * Netlify Scheduled Function: daily-digest
 *
 * Triggered by the `[[scheduled.functions]]` block in netlify.toml
 * (default 22:00 UTC = 08:00 AEST). All it does is hit our own
 * /api/cron/digest endpoint with the shared secret. Keeping the real
 * logic in the Next.js route means we only have one runtime to debug.
 */

import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.URL;
  const secret = process.env.CRON_SECRET;

  if (!base) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "NEXT_PUBLIC_APP_URL not set" }),
    };
  }
  if (!secret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "CRON_SECRET not set" }),
    };
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/cron/digest`, {
      method: "POST",
      headers: {
        "x-cron-secret": secret,
        "content-type": "application/json",
      },
    });
    const text = await res.text();
    return {
      statusCode: res.ok ? 200 : 502,
      body: JSON.stringify({
        ok: res.ok,
        status: res.status,
        body: text.slice(0, 500),
      }),
    };
  } catch (e) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        ok: false,
        error: e instanceof Error ? e.message : "Unknown digest error",
      }),
    };
  }
};
