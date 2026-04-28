import type { ProviderGroup } from "@/lib/admin-types";
import type { ProjectRecord } from "@/lib/admin-types";

interface DependencyGraphProps {
  providers: ProviderGroup[];
  projects: ProjectRecord[];
}

/**
 * Provider blast-radius diagram, rendered as SVG.
 * Each provider is a node on the left; connecting lines fan out to each project on the right.
 */
export function DependencyGraph({ providers, projects }: DependencyGraphProps) {
  const W = 760;
  const projW = 200;
  const provW = 200;
  const projectIds = projects.map((p) => p.id);

  // Layout: providers stacked left, projects stacked right.
  const provGap = 64;
  const projGap = 48;
  const provY = (i: number) => 60 + i * provGap;
  const projY = (i: number) => 60 + i * projGap;

  const H = Math.max(
    60 + providers.length * provGap + 40,
    60 + projects.length * projGap + 40
  );

  const provColor: Record<ProviderGroup["type"], string> = {
    hosting: "var(--agency-accent)",
    dns: "var(--agency-accent3, #16a34a)",
    registrar: "var(--agency-accent2, #d97706)",
  };

  return (
    <div className="depgraph-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="depgraph-svg" role="img" aria-label="Provider dependency graph">
        {/* connector lines */}
        {providers.map((g, gi) => {
          const fromX = provW;
          const fromY = provY(gi) + 16;
          return g.projectIds.map((pid) => {
            const idx = projectIds.indexOf(pid);
            if (idx === -1) return null;
            const toX = W - projW;
            const toY = projY(idx) + 16;
            const midX = (fromX + toX) / 2;
            return (
              <path
                key={`${g.type}-${g.name}-${pid}`}
                d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                stroke={provColor[g.type]}
                strokeWidth={1.5}
                fill="none"
                opacity={0.55}
              />
            );
          });
        })}

        {/* provider nodes */}
        {providers.map((g, gi) => (
          <g key={`p-${g.type}-${g.name}`} transform={`translate(0, ${provY(gi)})`}>
            <rect width={provW - 12} height={32} rx={8} fill="var(--surface-1)" stroke={provColor[g.type]} strokeWidth={1.5} />
            <text x={12} y={20} fontSize={12} fontWeight={700} fill="var(--agency-text)">
              {g.name}
            </text>
            <text x={provW - 24} y={20} fontSize={11} textAnchor="end" fill="var(--agency-muted)">
              {g.type} · {g.count}
            </text>
          </g>
        ))}

        {/* project nodes */}
        {projects.map((p, pi) => (
          <g key={`pj-${p.id}`} transform={`translate(${W - projW + 12}, ${projY(pi)})`}>
            <rect width={projW - 24} height={32} rx={8} fill="var(--surface-1)" stroke="var(--agency-border)" />
            <text x={12} y={20} fontSize={12} fontWeight={700} fill="var(--agency-text)">{p.name}</text>
          </g>
        ))}
      </svg>
      <div className="depgraph-legend">
        <span><i style={{ background: "var(--agency-accent)" }} /> Hosting</span>
        <span><i style={{ background: "var(--agency-accent3, #16a34a)" }} /> DNS</span>
        <span><i style={{ background: "var(--agency-accent2, #d97706)" }} /> Registrar</span>
      </div>
    </div>
  );
}
