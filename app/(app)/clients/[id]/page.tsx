import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientDetailView } from "@/components/admin/client-detail-view";
import { getClientDetailContent } from "@/lib/admin-data";
import { getAdapter } from "@/lib/data";
import { getShellProps } from "@/lib/shell-data";
import { getAuditFor } from "@/lib/audit";

interface ClientPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ClientPageProps): Promise<Metadata> {
  const { id } = await params;
  const adapter = await getAdapter();
  const project = await adapter.getProject(id);

  if (!project) {
    return {
      title: "Project Not Found | Aperix Admin",
    };
  }

  return {
    title: `${project.name} | Aperix Admin`,
    description: project.summary,
  };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const [project, allProjects, content, completenessAll, audit] = await Promise.all([
    adapter.getProject(id),
    adapter.listProjects(),
    getClientDetailContent(),
    adapter.getProjectCompleteness(),
    getAuditFor("project", id),
  ]);

  if (!project) {
    notFound();
  }

  const completeness = completenessAll.find((c) => c.projectId === id);

  return (
    <ClientDetailView
      ui={shell.ui}
      content={content}
      project={project}
      allProjects={allProjects}
      completeness={completeness}
      audit={audit}
      session={{ canReveal: true }}
      shellExtras={shell}
    />
  );
}
