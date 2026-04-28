import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in · Aperix Admin",
};

interface LoginPageProps {
  searchParams: Promise<{
    next?: string;
    denied?: string;
    email?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-header">
          <p className="login-kicker">Aperix</p>
          <h1 className="login-title">Admin sign in</h1>
          <p className="login-sub">
            Magic link to your email. Only allow-listed founder accounts can access this dashboard.
          </p>
        </div>
        {params.denied === "1" ? (
          <div className="login-alert login-alert--warn">
            Access denied for <strong>{params.email || "that account"}</strong>. Try a different email or contact an admin.
          </div>
        ) : null}
        {params.denied === "noallowlist" ? (
          <div className="login-alert login-alert--err">
            Server misconfigured: <code>ADMIN_ALLOWED_EMAILS</code> is not set.
          </div>
        ) : null}
        {params.denied === "missing-code" || params.denied === "exchange-failed" ? (
          <div className="login-alert login-alert--warn">
            That magic link looks expired or already used. Send a fresh one.
          </div>
        ) : null}
        <Suspense fallback={null}>
          <LoginForm next={params.next} />
        </Suspense>
        <p className="login-footnote">
          Internal tool — usage logged via audit trail.
        </p>
      </div>
    </div>
  );
}
