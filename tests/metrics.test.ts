import { describe, it, expect } from "vitest";
import { totalMrr, computeDora, computeUptime } from "@/lib/metrics";

describe("metrics.totalMrr", () => {
  it("sums only active contracts", () => {
    const contracts = [
      { mrr: 100, status: "active" },
      { mrr: 50, status: "trial" },
      { mrr: 200, status: "active" },
      { mrr: 999, status: "ended" },
    ];
    expect(totalMrr(contracts)).toBe(300);
  });

  it("returns 0 for empty list", () => {
    expect(totalMrr([])).toBe(0);
  });
});

describe("metrics.computeDora", () => {
  it("returns one row per project", () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const projects = [
      { id: "x", name: "X", deployments: [], incidents: [] } as any,
      {
        id: "y",
        name: "Y",
        deployments: [
          { status: "success", duration: "5 min" },
          { status: "failed", duration: "3 min" },
        ],
        incidents: [],
      } as any,
    ];
    const dora = computeDora(projects);
    expect(dora).toHaveLength(2);
    expect(dora[0].deployFrequencyPerWeek).toBe(0);
    expect(dora[1].failedCount).toBe(1);
    expect(dora[1].successRate).toBe(0.5);
  });
});

describe("metrics.computeUptime", () => {
  it("returns near-100% baseline when no incidents", () => {
    const projects = [{ id: "x", name: "X", deployments: [], incidents: [] } as any];
    const u = computeUptime(projects);
    expect(u[0].uptimePct).toBeGreaterThanOrEqual(99);
  });

  it("docks uptime for critical incidents", () => {
    const projects = [
      {
        id: "x",
        name: "X",
        deployments: [],
        incidents: [{ severity: "critical" }, { severity: "critical" }],
      } as any,
    ];
    const u = computeUptime(projects);
    expect(u[0].uptimePct).toBeLessThan(99.9);
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
});
