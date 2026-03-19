create extension if not exists "pgcrypto";

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.slugify_text(input_text text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input_text, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id)
);

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  sort_order integer not null default 1,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, name)
);

create unique index if not exists pipeline_stages_one_default_per_workspace
  on public.pipeline_stages (workspace_id)
  where is_default;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  country text,
  desired_destination text,
  intake_term text,
  message text,
  source text not null,
  current_stage_id uuid not null references public.pipeline_stages(id),
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists leads_workspace_created_at_idx
  on public.leads (workspace_id, created_at desc);

create index if not exists leads_workspace_stage_idx
  on public.leads (workspace_id, current_stage_id);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  type text not null,
  title text not null,
  description text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists activities_lead_created_at_idx
  on public.activities (lead_id, created_at desc);

drop trigger if exists workspaces_touch_updated_at on public.workspaces;
create trigger workspaces_touch_updated_at
before update on public.workspaces
for each row execute function public.touch_updated_at();

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at
before update on public.leads
for each row execute function public.touch_updated_at();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.leads enable row level security;
alter table public.activities enable row level security;

drop policy if exists "Users can read their workspaces" on public.workspaces;
create policy "Users can read their workspaces"
on public.workspaces
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "Users can read their memberships" on public.workspace_members;
create policy "Users can read their memberships"
on public.workspace_members
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read their workspace stages" on public.pipeline_stages;
create policy "Users can read their workspace stages"
on public.pipeline_stages
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = pipeline_stages.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "Users can read their workspace leads" on public.leads;
create policy "Users can read their workspace leads"
on public.leads
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = leads.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "Users can read their workspace activities" on public.activities;
create policy "Users can read their workspace activities"
on public.activities
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = activities.workspace_id
      and wm.user_id = auth.uid()
  )
);

create or replace function public.ensure_current_workspace()
returns table (
  workspace_id uuid,
  workspace_name text,
  workspace_slug text,
  member_role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_user_email text;
  current_user_name text;
  existing_workspace_id uuid;
  existing_workspace_name text;
  existing_workspace_slug text;
  existing_member_role text;
  base_slug text;
  final_slug text;
  created_workspace_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select w.id, w.name, w.slug, wm.role
    into existing_workspace_id, existing_workspace_name, existing_workspace_slug, existing_member_role
  from public.workspace_members wm
  join public.workspaces w on w.id = wm.workspace_id
  where wm.user_id = current_user_id
  order by wm.created_at asc
  limit 1;

  if existing_workspace_id is not null then
    return query
    select existing_workspace_id, existing_workspace_name, existing_workspace_slug, existing_member_role;
    return;
  end if;

  select
    email,
    coalesce(
      raw_user_meta_data ->> 'full_name',
      raw_user_meta_data ->> 'name',
      split_part(email, '@', 1),
      'ClientFlow'
    )
  into current_user_email, current_user_name
  from auth.users
  where id = current_user_id;

  base_slug := public.slugify_text(split_part(coalesce(current_user_email, current_user_name, 'workspace'), '@', 1));
  if base_slug = '' then
    base_slug := 'workspace';
  end if;

  final_slug := base_slug || '-' || substr(replace(current_user_id::text, '-', ''), 1, 8);

  insert into public.workspaces (name, slug)
  values (
    coalesce(nullif(trim(current_user_name), ''), 'ClientFlow') || ' Workspace',
    final_slug
  )
  returning id into created_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (created_workspace_id, current_user_id, 'owner');

  insert into public.pipeline_stages (workspace_id, name, sort_order, is_default)
  values (created_workspace_id, 'New Lead', 1, true)
  on conflict (workspace_id, name) do nothing;

  return query
  select w.id, w.name, w.slug, wm.role
  from public.workspaces w
  join public.workspace_members wm on wm.workspace_id = w.id
  where w.id = created_workspace_id
    and wm.user_id = current_user_id
  limit 1;
end;
$$;

create or replace function public.get_public_workspace(p_workspace_slug text)
returns table (
  workspace_id uuid,
  workspace_name text,
  workspace_slug text
)
language sql
security definer
set search_path = public
as $$
  select w.id, w.name, w.slug
  from public.workspaces w
  where w.slug = p_workspace_slug
  limit 1;
$$;

create or replace function public.create_manual_lead(
  p_full_name text,
  p_email text default null,
  p_phone text default null,
  p_country text default null,
  p_desired_destination text default null,
  p_intake_term text default null,
  p_message text default null,
  p_source text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_workspace_id uuid;
  default_stage_id uuid;
  created_lead_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(coalesce(p_full_name, '')), '') is null then
    raise exception 'Full name is required';
  end if;

  if nullif(trim(coalesce(p_source, '')), '') is null then
    raise exception 'Source is required';
  end if;

  if nullif(trim(coalesce(p_email, '')), '') is null
     and nullif(trim(coalesce(p_phone, '')), '') is null then
    raise exception 'Email or phone is required';
  end if;

  select workspace_id into current_workspace_id
  from public.ensure_current_workspace()
  limit 1;

  select id into default_stage_id
  from public.pipeline_stages
  where workspace_id = current_workspace_id
    and is_default = true
  order by sort_order asc
  limit 1;

  if default_stage_id is null then
    insert into public.pipeline_stages (workspace_id, name, sort_order, is_default)
    values (current_workspace_id, 'New Lead', 1, true)
    on conflict (workspace_id, name) do update set is_default = true
    returning id into default_stage_id;
  end if;

  insert into public.leads (
    workspace_id,
    full_name,
    email,
    phone,
    country,
    desired_destination,
    intake_term,
    message,
    source,
    current_stage_id,
    assigned_to_user_id
  )
  values (
    current_workspace_id,
    trim(p_full_name),
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_country, '')), ''),
    nullif(trim(coalesce(p_desired_destination, '')), ''),
    nullif(trim(coalesce(p_intake_term, '')), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    trim(p_source),
    default_stage_id,
    current_user_id
  )
  returning id into created_lead_id;

  insert into public.activities (
    workspace_id,
    lead_id,
    actor_user_id,
    type,
    title,
    description,
    metadata_json
  )
  values (
    current_workspace_id,
    created_lead_id,
    current_user_id,
    'lead_created',
    'Lead created',
    'Lead added from the dashboard.',
    jsonb_build_object(
      'origin', 'manual',
      'source', trim(p_source),
      'stage', 'New Lead'
    )
  );

  return created_lead_id;
end;
$$;

create or replace function public.create_public_inquiry_lead(
  p_workspace_slug text,
  p_full_name text,
  p_email text,
  p_phone text default null,
  p_country text default null,
  p_desired_destination text default null,
  p_intake_term text default null,
  p_message text default null,
  p_source text default 'Public Inquiry'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace_id uuid;
  default_stage_id uuid;
  created_lead_id uuid;
begin
  if nullif(trim(coalesce(p_workspace_slug, '')), '') is null then
    raise exception 'Workspace slug is required';
  end if;

  if nullif(trim(coalesce(p_full_name, '')), '') is null then
    raise exception 'Full name is required';
  end if;

  if nullif(trim(coalesce(p_email, '')), '') is null then
    raise exception 'Email is required';
  end if;

  select id into target_workspace_id
  from public.workspaces
  where slug = p_workspace_slug
  limit 1;

  if target_workspace_id is null then
    raise exception 'Workspace not found';
  end if;

  select id into default_stage_id
  from public.pipeline_stages
  where workspace_id = target_workspace_id
    and is_default = true
  order by sort_order asc
  limit 1;

  if default_stage_id is null then
    insert into public.pipeline_stages (workspace_id, name, sort_order, is_default)
    values (target_workspace_id, 'New Lead', 1, true)
    on conflict (workspace_id, name) do update set is_default = true
    returning id into default_stage_id;
  end if;

  insert into public.leads (
    workspace_id,
    full_name,
    email,
    phone,
    country,
    desired_destination,
    intake_term,
    message,
    source,
    current_stage_id
  )
  values (
    target_workspace_id,
    trim(p_full_name),
    trim(p_email),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_country, '')), ''),
    nullif(trim(coalesce(p_desired_destination, '')), ''),
    nullif(trim(coalesce(p_intake_term, '')), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    coalesce(nullif(trim(coalesce(p_source, '')), ''), 'Public Inquiry'),
    default_stage_id
  )
  returning id into created_lead_id;

  insert into public.activities (
    workspace_id,
    lead_id,
    actor_user_id,
    type,
    title,
    description,
    metadata_json
  )
  values (
    target_workspace_id,
    created_lead_id,
    null,
    'lead_created',
    'Lead created',
    'Lead created from the public inquiry form.',
    jsonb_build_object(
      'origin', 'public_inquiry',
      'source', 'Public Inquiry',
      'stage', 'New Lead'
    )
  );

  return created_lead_id;
end;
$$;

grant execute on function public.ensure_current_workspace() to authenticated;
grant execute on function public.get_public_workspace(text) to anon, authenticated;
grant execute on function public.create_manual_lead(text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.create_public_inquiry_lead(text, text, text, text, text, text, text, text, text) to anon, authenticated;
