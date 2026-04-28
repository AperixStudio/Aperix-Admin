import type { DeployStatus, IncidentSeverity } from "@/lib/admin-types";

interface DeployBadgeProps {
  status: DeployStatus;
}

const DEPLOY_ICONS: Record<DeployStatus, string> = {
  success: "✓",
  failed: "✕",
  building: "↻",
  cancelled: "–",
};

export function DeployBadge({ status }: DeployBadgeProps) {
  return (
    <span className={`deploy-badge deploy-${status}`}>
      {DEPLOY_ICONS[status]} {status}
    </span>
  );
}

interface SeverityBadgeProps {
  severity: IncidentSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span className={`severity-badge severity-${severity}`}>
      {severity}
    </span>
  );
}
