"use client";

import { useState, useTransition } from "react";
import { revealCredential } from "@/lib/admin-actions";
import { useToast } from "@/components/admin/toast-provider";
import type { CredentialReference } from "@/lib/admin-types";

export function RevealCredentialButton({
  projectId,
  credential,
  canReveal,
}: {
  projectId: string;
  credential: CredentialReference;
  canReveal: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();

  const onConfirm = () => {
    if (reason.trim().length < 4) {
      toast.push("Provide a reason (≥4 chars)", "error");
      return;
    }
    start(async () => {
      try {
        const res = await revealCredential(projectId, credential.id, reason.trim());
        toast.push(res.message, "info");
        setOpen(false);
        setReason("");
      } catch (e) {
        toast.push(e instanceof Error ? e.message : "Reveal failed", "error");
      }
    });
  };

  if (!canReveal) {
    return <span className="creds-locked" title="Your role cannot reveal credentials">🔒</span>;
  }

  return (
    <>
      <button type="button" className="creds-reveal" onClick={() => setOpen(true)}>
        Reveal
      </button>
      {open ? (
        <div className="cmdk-overlay" onClick={() => setOpen(false)}>
          <div className="reveal-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reveal credential</h3>
            <p className="muted">
              <strong>{credential.label}</strong> · {credential.location}
            </p>
            <p>Why are you accessing this? (audited)</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. rotating after staff change"
              rows={3}
            />
            <div className="reveal-actions">
              <button type="button" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
              <button type="button" className="btn-primary" onClick={onConfirm} disabled={pending}>
                {pending ? "Revealing…" : "Confirm reveal"}
              </button>
            </div>
            <p className="reveal-disclaimer">
              Vault integration is not configured. This logs the access; the secret itself isn’t fetched yet.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
