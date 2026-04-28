/**
 * Lightweight Resend wrapper for transactional + digest emails.
 * Reads RESEND_API_KEY + ADMIN_EMAIL_FROM from env. Returns
 * `configured: false` if either is missing — caller should treat
 * that as "skip email send" rather than throwing.
 *
 * No SDK to keep the bundle small.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */

export interface ResendSendInput {
  to: string | string[];
  subject: string;
  html: string;
  /** Optional plain-text fallback. */
  text?: string;
  /** Override the default from address (must be a verified Resend domain). */
  from?: string;
  /** Optional reply-to. */
  replyTo?: string;
}

export interface ResendSendResult {
  ok: boolean;
  configured: boolean;
  id?: string;
  error?: string;
}

const API = "https://api.resend.com/emails";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL_FROM);
}

export async function sendEmail(input: ResendSendInput): Promise<ResendSendResult> {
  const key = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.ADMIN_EMAIL_FROM;

  if (!key || !defaultFrom) {
    return {
      ok: false,
      configured: false,
      error: "Set RESEND_API_KEY + ADMIN_EMAIL_FROM in .env.local to enable email.",
    };
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from ?? defaultFrom,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      return {
        ok: false,
        configured: true,
        error: json.message ?? `Resend responded ${res.status}`,
      };
    }
    return { ok: true, configured: true, id: json.id };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      error: e instanceof Error ? e.message : "Unknown error sending email via Resend.",
    };
  }
}
