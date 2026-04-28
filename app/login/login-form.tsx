"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

interface LoginFormProps {
  next?: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setError(null);

    try {
      const supabase = getSupabaseBrowser();
      const redirectBase = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const callback = `${redirectBase}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callback },
      });
      if (err) throw err;
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send magic link.");
    }
  }

  if (status === "sent") {
    return (
      <div className="login-alert login-alert--ok">
        Magic link sent to <strong>{email}</strong>. Check your inbox.
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
        disabled={status === "sending"}
        className="login-submit"
      >
        {status === "sending" ? "Sending…" : "Send magic link"}
      </button>
      {error ? <p className="login-error">{error}</p> : null}
    </form>
  );
}
