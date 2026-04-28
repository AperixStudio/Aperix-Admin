"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { answerNlQuery } from "@/lib/nl-query";
import type { ProjectRecord, RenewalItem } from "@/lib/admin-types";

const SUGGESTIONS = [
  "ssl expiring",
  "open incidents",
  "sites on netlify",
  "domains at porkbun",
  "led by harrison",
];

export function AiQueryBox({
  projects,
  renewals,
}: {
  projects: ProjectRecord[];
  renewals: RenewalItem[];
}) {
  const [q, setQ] = useState("");
  const answer = useMemo(() => answerNlQuery(q, projects, renewals), [q, projects, renewals]);

  return (
    <section className="ai-wrap">
      <div className="ai-input-wrap">
        <input
          autoFocus
          className="ai-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask anything about your stack…"
        />
      </div>
      <div className="ai-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="ai-suggest" onClick={() => setQ(s)}>{s}</button>
        ))}
      </div>

      <div className="ai-answer panel">
        <p className="ai-summary">{answer.summary}</p>
        {answer.rows.length > 0 ? (
          <ul className="ai-rows">
            {answer.rows.map((r, i) => (
              <li key={i} className={`ai-row ai-tone-${r.tone ?? "info"}`}>
                {r.href ? (
                  <Link href={r.href}>{r.label}</Link>
                ) : (
                  <span>{r.label}</span>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p className="ai-disclaimer">
        Local heuristic engine — no LLM call. Wire to OpenAI/Anthropic in <code>lib/nl-query.ts</code> when ready.
      </p>
    </section>
  );
}
