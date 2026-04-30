import Link from "next/link";
import { AppShell } from "@/components/admin/app-shell";
import { NewClientForm } from "@/components/admin/new-client-form";
import type { OnboardingContent, UiConfig } from "@/lib/admin-types";
import type { DataMode } from "@/lib/data-mode";

interface OnboardingViewProps {
  ui: UiConfig;
  content: OnboardingContent;
  dataMode: DataMode;
  shellExtras?: Record<string, unknown>;
}

/**
 * Onboarding screen — single source of truth for adding records.
 *
 * Previously this page had three sections:
 *   1. The form (works)
 *   2. A field-group cheatsheet (read-only filler)
 *   3. A "Future automation" wishlist (purely aspirational)
 *
 * (2) duplicated form labels and (3) had no behaviour, so they
 * were misleading. They have been removed; the form now owns
 * the screen and supports BOTH client + prospect creation via
 * a toggle.
 */
export function OnboardingView({ ui, content, dataMode, shellExtras = {} }: OnboardingViewProps) {
  return (
    <AppShell
      {...shellExtras}
      activeView="onboarding"
      brandKicker={ui.brandKicker}
      shellTitle={ui.viewTitles.onboarding}
      primaryNav={ui.primaryNav}
      title="New client / lead"
      description="Create a real client, or save a prospect we want to reach out to."
      noteTitle={content.noteTitle}
      noteBody={content.noteBody}
      actions={
        <>
          <Link className="btn" href="/clients">View clients</Link>
          <Link className="btn" href="/prospects">View prospects</Link>
        </>
      }
    >
      <section className="grid-2">
        <div className="stack">
          <div className="panel section">
            <h3>{content.intro.title}</h3>
            <p className="section-copy">{content.intro.body}</p>
          </div>

          <div className="panel section">
            <NewClientForm dataMode={dataMode} />
          </div>
        </div>

        <div className="stack">
          <div className="panel section">
            <h3>How the prospect workflow works</h3>
            <ol className="onboarding-future">
              <li><strong>Find</strong> — driving Google Maps for businesses with no/old/broken websites.</li>
              <li><strong>Save</strong> — paste the Maps share link + current site URL into the prospect form.</li>
              <li><strong>Research</strong> — track status as you assess them (researching → meeting → contacted).</li>
              <li><strong>Reach out</strong> — cold call with aperix.com.au, or build a quick mock site first.</li>
              <li><strong>Convert</strong> — when they sign on, promote the prospect to a full client record.</li>
            </ol>
          </div>

          <div className="panel section">
            <h3>What gets persisted</h3>
            <p className="section-copy">
              Every field on the client form lands in the <code>projects</code> table and surfaces on the
              Clients list, the Command Center, the per-client detail page, and the Audit log. Tags appear
              on the Dashboard cards. Live URL drives the &ldquo;Visit site&rdquo; button.
            </p>
            <p className="section-copy">
              Prospects live in their own <code>prospects</code> table and appear on the Prospects tab with
              a simple kanban-style status pipeline.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
