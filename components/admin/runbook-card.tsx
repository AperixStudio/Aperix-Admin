import type { RunbookEntry } from "@/lib/admin-schemas";

const CATEGORY_TONE: Record<RunbookEntry["category"], string> = {
  incident: "tone-bad",
  deploy: "tone-info",
  renewal: "tone-warn",
  onboarding: "tone-ok",
  security: "tone-bad",
  other: "tone-info",
};

export function RunbookCard({ runbook }: { runbook: RunbookEntry }) {
  return (
    <article className="runbook-card">
      <header className="runbook-head">
        <span className={`runbook-cat ${CATEGORY_TONE[runbook.category]}`}>{runbook.category}</span>
        <h3>{runbook.title}</h3>
        <span className="runbook-owner">owner: {runbook.owner}</span>
      </header>
      <div className="runbook-triggers">
        {runbook.triggers.map((t, i) => (
          <span key={i} className="runbook-chip">{t}</span>
        ))}
      </div>
      <ol className="runbook-steps">
        {runbook.steps.map((s, i) => (
          <li key={i}>
            <strong>{s.title}</strong>
            <p>{s.detail}</p>
          </li>
        ))}
      </ol>
      {runbook.lastReviewed ? (
        <footer className="runbook-foot">Last reviewed {runbook.lastReviewed}</footer>
      ) : null}
    </article>
  );
}
