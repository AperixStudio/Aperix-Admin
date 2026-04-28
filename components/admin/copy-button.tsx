"use client";

import { useState } from "react";

interface CopyButtonProps {
  value: string;
  label: string;
}

export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback – silent fail
    }
  };

  return (
    <button
      type="button"
      className={`quick-action-btn${copied ? " copied" : ""}`}
      onClick={handleCopy}
    >
      {copied ? "✓ Copied" : `⎘ ${label}`}
    </button>
  );
}
