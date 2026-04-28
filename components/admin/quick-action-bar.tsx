import type { QuickLinkItem, QuickLinkCategory } from "@/lib/admin-types";
import { CopyButton } from "@/components/admin/copy-button";

const CATEGORY_ICONS: Record<QuickLinkCategory, string> = {
  hosting: "☁",
  repo: "⎇",
  dns: "🌐",
  email: "✉",
  docs: "📄",
  vault: "🔑",
  analytics: "📊",
  other: "↗",
};

interface QuickActionBarProps {
  links: QuickLinkItem[];
  liveUrl?: string;
}

export function QuickActionBar({ links, liveUrl }: QuickActionBarProps) {
  return (
    <div className="quick-action-bar">
      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="quick-action-btn"
        >
          ↗ Visit Site
        </a>
      )}
      {liveUrl && <CopyButton value={liveUrl} label="Copy URL" />}
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="quick-action-btn"
        >
          {CATEGORY_ICONS[link.category]} {link.label}
        </a>
      ))}
    </div>
  );
}
