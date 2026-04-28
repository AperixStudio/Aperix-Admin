-- =============================================================
-- Aperix Admin — Initial schema
-- =============================================================
-- Fully normalised tables for every entity the dashboard tracks.
-- Apply via:
--   supabase login
--   supabase link --project-ref $SUPABASE_PROJECT_REF
--   supabase db push
--
-- Naming conventions:
--   - snake_case columns
--   - id columns are uuid v4 unless human-meaningful (project.id stays text slug)
--   - timestamps default to now() at insert
--   - all tables get RLS; admin_users is the only authority
-- =============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- admin_users — the email allowlist. Anything not in here is
-- rejected by the auth middleware regardless of having a
-- Supabase user account. Seeded with the two founder emails.
-- -------------------------------------------------------------
create table if not exists public.admin_users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  display_name text,
  role text not null default 'admin' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

insert into public.admin_users (email, display_name, role) values
  ('hazabone2233@gmail.com', 'Harrison', 'admin'),
  ('thomastabone303@gmail.com', 'Thomas', 'admin')
on conflict (email) do nothing;

-- -------------------------------------------------------------
-- projects — the master list of clients/sites.
-- id stays a text slug (e.g. "rhinos", "aperix") so URLs are
-- /clients/rhinos rather than /clients/<uuid>.
-- -------------------------------------------------------------
create table if not exists public.projects (
  id              text primary key check (id ~ '^[a-z0-9-]+$'),
  name            text not null,
  summary         text not null default '',
  notes           text not null default '',
  -- People
  lead            text not null,
  support         text not null default '',
  -- Commercial
  tier            text not null default 'essential' check (tier in ('essential','standard','premium','enterprise','internal')),
  stage           text not null default 'live',
  -- Health (cached for fast list views; recomputed by triggers later)
  health_label    text not null default 'OK',
  health_state    text not null default 'neutral' check (health_state in ('healthy','attention','down','neutral')),
  -- Infrastructure
  domain          text,
  hosting         text,
  registrar       text,
  dns             text,
  repo            text,
  repo_status     text,
  deploy          text,
  -- Links
  live_url        text,
  staging_url     text,
  repo_url        text,
  github_org      text,
  netlify_site    text,
  render_service  text,
  -- Renewals (manual fallback; cron updates these where automated)
  domain_expiry   text,
  ssl_expiry      text,
  last_activity   text,
  -- Theming
  brand_key       text,
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_projects_health on public.projects(health_state);
create index if not exists idx_projects_tier   on public.projects(tier);

-- -------------------------------------------------------------
-- contacts — people associated with a project (client-side or
-- third-party vendors). One row per person per project.
-- -------------------------------------------------------------
create table if not exists public.contacts (
  id          uuid primary key default uuid_generate_v4(),
  project_id  text not null references public.projects(id) on delete cascade,
  name        text not null,
  role        text not null,
  email       text,
  phone       text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_contacts_project on public.contacts(project_id);

-- -------------------------------------------------------------
-- credentials — pointers to where credentials live (1Password
-- vault entries, etc.). NEVER store the actual secret.
-- -------------------------------------------------------------
create table if not exists public.credentials (
  id          uuid primary key default uuid_generate_v4(),
  project_id  text not null references public.projects(id) on delete cascade,
  label       text not null,
  location    text not null,
  vault_url   text,
  owned_by    text not null,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_credentials_project on public.credentials(project_id);

-- -------------------------------------------------------------
-- tasks — to-do items on a project.
-- -------------------------------------------------------------
create table if not exists public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  project_id  text not null references public.projects(id) on delete cascade,
  title       text not null,
  detail      text,
  owner       text not null,
  status      text not null default 'open' check (status in ('open','in-progress','blocked','done')),
  priority    text not null default 'medium' check (priority in ('low','medium','high')),
  due         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_tasks_project_status on public.tasks(project_id, status);

-- -------------------------------------------------------------
-- incidents — anomalies/outages with severity + state.
-- -------------------------------------------------------------
create table if not exists public.incidents (
  id           uuid primary key default uuid_generate_v4(),
  project_id   text not null references public.projects(id) on delete cascade,
  title        text not null,
  body         text not null,
  severity     text not null check (severity in ('info','warning','critical','resolved')),
  state        text check (state in ('open','investigating','mitigated','resolved','postmortem')),
  author       text not null,
  postmortem   text,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_incidents_project on public.incidents(project_id);

-- -------------------------------------------------------------
-- deployments — record of every push/build.
-- Auto-fed by the GitHub + Netlify + Render integration crons.
-- -------------------------------------------------------------
create table if not exists public.deployments (
  id          uuid primary key default uuid_generate_v4(),
  project_id  text not null references public.projects(id) on delete cascade,
  status      text not null check (status in ('success','failed','building','cancelled')),
  branch      text not null,
  message     text not null,
  duration    text,
  actor       text not null,
  occurred_at timestamptz not null default now(),
  -- Optional provider breadcrumbs
  provider    text check (provider in ('netlify','render','github','manual')),
  provider_id text,
  log_url     text
);
create index if not exists idx_deployments_project_time on public.deployments(project_id, occurred_at desc);

-- -------------------------------------------------------------
-- quick_links — pinned URLs per project (Netlify dashboard,
-- DNS panel, analytics, etc.)
-- -------------------------------------------------------------
create table if not exists public.quick_links (
  id          uuid primary key default uuid_generate_v4(),
  project_id  text not null references public.projects(id) on delete cascade,
  label       text not null,
  href        text not null,
  category    text check (category in ('hosting','repo','dns','email','docs','vault','analytics','other')),
  created_at  timestamptz not null default now()
);
create index if not exists idx_quick_links_project on public.quick_links(project_id);

-- -------------------------------------------------------------
-- contracts — recurring revenue records.
-- -------------------------------------------------------------
create table if not exists public.contracts (
  id              uuid primary key default uuid_generate_v4(),
  project_id      text not null references public.projects(id) on delete cascade,
  status          text not null check (status in ('active','trial','paused','ended')),
  tier            text not null,
  start_date      date not null,
  end_date        date,
  mrr             numeric(10,2) not null default 0,
  currency        text not null default 'AUD',
  hours_allotted  integer,
  hours_used      integer,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_contracts_project on public.contracts(project_id);
create index if not exists idx_contracts_status  on public.contracts(status);

-- -------------------------------------------------------------
-- runbooks — step-by-step playbooks. Cross-project.
-- -------------------------------------------------------------
create table if not exists public.runbooks (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  category      text not null check (category in ('incident','deploy','renewal','onboarding','security','other')),
  triggers      text[] not null default '{}',
  steps         jsonb not null default '[]'::jsonb,
  owner         text not null,
  last_reviewed date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -------------------------------------------------------------
-- notifications — what the bell + /notifications tab reads.
-- -------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  kind        text not null check (kind in ('alert','info','ops','security','changelog')),
  title       text not null,
  body        text not null,
  href        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notifications_read_time on public.notifications(read, created_at desc);

-- -------------------------------------------------------------
-- audit_log — every mutation to anything, recorded.
-- -------------------------------------------------------------
create table if not exists public.audit_log (
  id            uuid primary key default uuid_generate_v4(),
  actor         text not null,
  role          text not null default 'admin',
  action        text not null,
  entity_type   text not null,
  entity_id     text,
  before        jsonb,
  after         jsonb,
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_audit_entity on public.audit_log(entity_type, entity_id, created_at desc);
create index if not exists idx_audit_actor  on public.audit_log(actor, created_at desc);

-- -------------------------------------------------------------
-- changelog — manual ship/fix posts. Mirrored into
-- notifications by a trigger so the bell shows them.
-- -------------------------------------------------------------
create table if not exists public.changelog (
  id           uuid primary key default uuid_generate_v4(),
  posted_at    timestamptz not null default now(),
  kind         text not null check (kind in ('ship','fix','ops','security','internal')),
  title        text not null,
  body         text not null,
  author       text not null,
  project_ids  text[] not null default '{}'
);
create index if not exists idx_changelog_time on public.changelog(posted_at desc);

-- -------------------------------------------------------------
-- updated_at triggers (Postgres standard pattern)
-- -------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_projects_touch on public.projects;
create trigger trg_projects_touch
  before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_tasks_touch on public.tasks;
create trigger trg_tasks_touch
  before update on public.tasks
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_contracts_touch on public.contracts;
create trigger trg_contracts_touch
  before update on public.contracts
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_runbooks_touch on public.runbooks;
create trigger trg_runbooks_touch
  before update on public.runbooks
  for each row execute function public.touch_updated_at();

-- =============================================================
-- Row Level Security
-- =============================================================
-- The service role key (used by the Next.js server adapter)
-- bypasses RLS. The anon key (used by browser components, if any)
-- gets read-only access ONLY when the JWT email matches
-- admin_users. Right now no browser code talks to Supabase
-- directly — every read goes through the server adapter — so
-- these policies are belt-and-braces.
-- =============================================================

alter table public.admin_users   enable row level security;
alter table public.projects      enable row level security;
alter table public.contacts      enable row level security;
alter table public.credentials   enable row level security;
alter table public.tasks         enable row level security;
alter table public.incidents     enable row level security;
alter table public.deployments   enable row level security;
alter table public.quick_links   enable row level security;
alter table public.contracts     enable row level security;
alter table public.runbooks      enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log     enable row level security;
alter table public.changelog     enable row level security;

-- Helper: is the current JWT subject an Aperix admin?
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.admin_users
    where email = (auth.jwt() ->> 'email')
  );
$$;

-- Generic read policy for every table — admins only.
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'admin_users','projects','contacts','credentials','tasks',
      'incidents','deployments','quick_links','contracts','runbooks',
      'notifications','audit_log','changelog'
    ])
  loop
    execute format(
      'drop policy if exists "%1$s_admin_read" on public.%1$s; '
      'create policy "%1$s_admin_read" on public.%1$s '
      'for select using (public.is_admin());',
      t
    );
  end loop;
end$$;

-- Note: writes go through the service role key from the server,
-- so we deliberately do NOT add insert/update/delete policies
-- for the anon key. Adding them later if you wire browser
-- mutations is a one-line change.
