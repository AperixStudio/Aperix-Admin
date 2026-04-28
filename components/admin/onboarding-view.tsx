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

export function OnboardingView({ ui, content, dataMode, shellExtras = {} }: OnboardingViewProps) {
  return (
    <AppShell
      {...shellExtras}
      activeView="onboarding"
      brandKicker={ui.brandKicker}
      shellTitle={ui.viewTitles.onboarding}
      primaryNav={ui.primaryNav}
      title={content.title}
      description={content.description}
      noteTitle={content.noteTitle}
      noteBody={content.noteBody}
      actions={
        <>
          {(content.actions ?? []).map((a) => (
            <Link key={a.href} className={`btn${a.primary ? " primary" : ""}`} href={a.href}>{a.label}</Link>
          ))}
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
            <h3>Create client</h3>
            <p className="section-copy">
              Submits to the active data adapter. In <strong>Live</strong> mode this writes through Supabase;
              <strong> Mock</strong> and <strong>Empty</strong> modes are read-only.
            </p>
            <NewClientForm dataMode={dataMode} />
          </div>

          {content.groups.map((group) => (
            <div key={group.title} className="panel section">
              <h3>{group.title}</h3>
              <p className="section-copy">{group.description}</p>
              <div className="onboarding-fields">
                {group.fields.map((field) => (
                  <div key={field.label} className="onboarding-field">
                    <div className="onboarding-field-label">
                      {field.label}
                      {field.required && <span className="onboarding-required">required</span>}
                    </div>
                    <div className="onboarding-field-hint">{field.hint}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="stack">
          <div className="panel section">
            <h3>How to add a new client today</h3>
            <div className="timeline">
              {content.nextSteps.map((step) => (
                <div key={step.title} className="timeline-item">
                  <div className="timeline-node-wrap"><div className="timeline-node" /></div>
                  <div>
                    <strong>{step.title}</strong>
                    <span>{step.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel section">
            <h3>Future automation</h3>
            <p className="section-copy">
              When integrations land, this template becomes the trigger. Submitting it will:
            </p>
            <ul className="onboarding-future">
              <li>create the GitHub repo from the chosen starter,</li>
              <li>register the Netlify site and link the repo,</li>
              <li>add the domain to Cloudflare and queue DNS records,</li>
              <li>seed health checks and renewal reminders,</li>
              <li>and surface the new project across every operations panel.</li>
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
