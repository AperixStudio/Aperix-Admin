import type { HealthState } from "@/lib/admin-types";

export function getHealthDotClass(state: HealthState) {
  if (state === "healthy") return "success";
  if (state === "attention") return "warning";
  if (state === "down") return "danger";
  if (state === "neutral") return "violet";
  return "accent";
}