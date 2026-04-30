import type { Metadata } from "next";
import { getOnboardingContent } from "@/lib/admin-data";
import { getShellProps } from "@/lib/shell-data";
import { OnboardingView } from "@/components/admin/onboarding-view";

export const metadata: Metadata = {
  title: "New Client | Aperix Admin",
  description: "Schema-first onboarding template for new client projects.",
};

export default async function OnboardingPage() {
  const [shell, content] = await Promise.all([getShellProps(), getOnboardingContent()]);
  return <OnboardingView ui={shell.ui} content={content} dataMode={shell.dataMode} shellExtras={shell} />;
}
