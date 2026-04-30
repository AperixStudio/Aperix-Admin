-- =============================================================
-- Aperix Admin — Prospects (lead generation)
-- =============================================================
-- A prospect is a business we have not engaged yet but are
-- considering reaching out to. Workflow today:
--   1. Drive Google Maps; spot business with no/old website.
--   2. Save the Maps share link, current site URL, and notes.
--   3. Track outreach status until they convert into a client.
--
-- When a prospect is converted, we copy the relevant fields into
-- the projects table and mark the prospect as `won`.
-- =============================================================

create table if not exists public.prospects (
  id              uuid primary key default uuid_generate_v4(),
  business_name   text not null,
  -- The thing we save when scanning Google Maps for stale sites.
  maps_url        text,
  current_site    text,
  -- Free-form why-we-care.
  notes           text,
  -- Discovery breadcrumb so we know how this lead got here.
  source          text not null default 'google-maps' check (source in ('google-maps','referral','cold-list','event','inbound','other')),
  -- Outreach pipeline.
  status          text not null default 'new' check (status in ('new','researching','contacted','meeting','won','lost','dormant')),
  -- Ranking heuristics.
  priority        text not null default 'medium' check (priority in ('low','medium','high')),
  -- Anything else we observed (industry, suburb, est. revenue, etc.)
  industry        text,
  location        text,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  -- Tracking
  owner           text not null default 'Harrison',
  next_action     text,
  next_action_due date,
  last_contacted  timestamptz,
  -- If this prospect has been converted into a paying client.
  converted_project_id text references public.projects(id) on delete set null,
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_prospects_status   on public.prospects(status);
create index if not exists idx_prospects_priority on public.prospects(priority);
create index if not exists idx_prospects_owner    on public.prospects(owner);

drop trigger if exists trg_prospects_touch on public.prospects;
create trigger trg_prospects_touch
  before update on public.prospects
  for each row execute function public.touch_updated_at();

-- =============================================================
-- RLS for prospects — same admin-only pattern as everything else
-- =============================================================
alter table public.prospects enable row level security;

drop policy if exists "prospects_admin_read" on public.prospects;
create policy "prospects_admin_read" on public.prospects
  for select using (public.is_admin());

-- Service-role grants (mirrors 0002_grants.sql for the new table).
grant select, insert, update, delete on public.prospects to service_role;
grant select on public.prospects to authenticated;
