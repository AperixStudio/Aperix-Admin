import type { Metadata } from "next";
import { getRepoContent } from "@/lib/admin-data";
import { getAdapter } from "@/lib/data";
import { fetchOrgRepos } from "@/lib/github";
import { getShellProps } from "@/lib/shell-data";
import { RepoView } from "@/components/admin/repo-view";

export const metadata: Metadata = {
  title: "Repositories | Aperix Admin",
  description: "GitHub organization structure and repo architecture for Aperix Studio.",
};

export default async function ReposPage() {
  const shell = await getShellProps();
  const adapter = await getAdapter();
  const [content, projects, github] = await Promise.all([
    getRepoContent(),
    adapter.listProjects(),
    fetchOrgRepos(),
  ]);

  return <RepoView ui={shell.ui} content={content} projects={projects} github={github} shellExtras={shell} />;
}
