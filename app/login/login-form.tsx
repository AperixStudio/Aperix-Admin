"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

interface LoginFormProps {
  next?: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const COOLDOWN_SECONDS = 60;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!cooldownUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    if (now < cooldownUntil) {
      const secs = Math.max(1, Math.ceil((cooldownUntil - now) / 1000));
      setStatus("error");
      setError(`Please wait ${secs}s before requesting another magic link.`);
      return;
    }

    setStatus("sending");
    setError(null);

    try {
      const supabase = getSupabaseBrowser();
      const redirectBase = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const callback = `${redirectBase}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
      const { error: err } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { emailRedirectTo: callback },
      });
      if (err) throw err;
      setCooldownUntil(Date.now() + COOLDOWN_SECONDS * 1000);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      const raw = err instanceof Error ? err.message : "Could not send magic link.";
      const message =
        /rate|too many|security purposes/i.test(raw)
          ? "Too many login email requests. Please wait a minute and try again."
          : raw;
      setError(message);
    }
  }

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const coolingDown = cooldownSeconds > 0;

  if (status === "sent") {
    return (
      <div className="login-alert login-alert--ok">
        Magic link sent to <strong>{email.trim().toLowerCase()}</strong>. Check your inbox.
        {coolingDown ? ` You can request another in ${cooldownSeconds}s.` : ""}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <label className="login-label">
        <span>Email address</span>
        <input
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@aperixstudio.com.au"
          className="login-input"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending" || coolingDown}
        className="login-submit"
      >
        {status === "sending"
          ? "Sending…"
          : coolingDown
            ? `Wait ${cooldownSeconds}s`
            : "Send magic link"}
      </button>
      {error ? <p className="login-error">{error}</p> : null}
    </form>
  );
}
