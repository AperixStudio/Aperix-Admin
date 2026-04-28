import type { Metadata } from "next";
import { AppShell } from "@/components/admin/app-shell";
import { AuditLogList } from "@/components/admin/audit-log-list";
import { getAuditLog } from "@/lib/audit";
import { getShellProps } from "@/lib/shell-data";

export const metadata: Metadata = {
  title: "Audit Log | Aperix Admin",
  description: "Append-only history of every privileged action across the workspace.",
};

export default async function AuditPage() {
  const [shell, entries] = await Promise.all([getShellProps(), getAuditLog(500)]);

  return (
    <AppShell
      {...shell}
      activeView="audit"
      title="Audit log"
      description="Tamper-evident record of every write."
      brandKicker="Compliance"
      shellTitle="Audit"
      noteTitle="Append-only"
      noteBody="Entries are written immutably. Export the file for SOC 2 evidence."
    >
      <AuditLogList entries={entries} />
    </AppShell>
  );
}
