create table if not exists public.lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  from_stage_id uuid references public.pipeline_stages(id) on delete set null,
  to_stage_id uuid not null references public.pipeline_stages(id) on delete cascade,
  changed_by_user_id uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default timezone('utc', now()),
  automation_processed_at timestamptz
);

create index if not exists lead_stage_history_lead_changed_at_idx
  on public.lead_stage_history (lead_id, changed_at desc);

create index if not exists lead_stage_history_workspace_processed_idx
  on public.lead_stage_history (workspace_id, automation_processed_at, changed_at asc);

alter table public.lead_stage_history enable row level security;

drop policy if exists "Users can read their workspace stage history" on public.lead_stage_history;
create policy "Users can read their workspace stage history"
on public.lead_stage_history
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = lead_stage_history.workspace_id
      and wm.user_id = auth.uid()
  )
);

create or replace function public.ensure_workspace_pipeline_stages(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_workspace_id is null then
    raise exception 'Workspace is required';
  end if;

  update public.pipeline_stages
  set is_default = false
  where workspace_id = p_workspace_id
    and name <> 'New Lead'
    and is_default = true;

  insert into public.pipeline_stages (workspace_id, name, sort_order, is_default)
  values
    (p_workspace_id, 'New Lead', 1, true),
    (p_workspace_id, 'Contacted', 2, false),
    (p_workspace_id, 'Interested', 3, false),
    (p_workspace_id, 'Waiting for Documents', 4, false),
    (p_workspace_id, 'Documents Complete', 5, false),
    (p_workspace_id, 'Invoice Sent', 6, false),
    (p_workspace_id, 'Payment Received', 7, false),
    (p_workspace_id, 'Application In Progress', 8, false),
    (p_workspace_id, 'Completed', 9, false)
  on conflict (workspace_id, name)
  do update set
    sort_order = excluded.sort_order,
    is_default = excluded.is_default;
end;
$$;

create or replace function public.get_default_pipeline_stage_id(p_workspace_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  default_stage_id uuid;
begin
  perform public.ensure_workspace_pipeline_stages(p_workspace_id);

  select id
    into default_stage_id
  from public.pipeline_stages
  where workspace_id = p_workspace_id
    and is_default = true
  order by sort_order asc
  limit 1;

  if default_stage_id is null then
    raise exception 'Default pipeline stage is not available';
  end if;

  return default_stage_id;
end;
$$;

do $$
declare
  workspace_row record;
begin
  for workspace_row in
    select id
    from public.workspaces
  loop
    perform public.ensure_workspace_pipeline_stages(workspace_row.id);
  end loop;
end;
$$;

insert into public.lead_stage_history (
  workspace_id,
  lead_id,
  from_stage_id,
  to_stage_id,
  changed_by_user_id,
  changed_at
)
select
  l.workspace_id,
  l.id,
  null,
  l.current_stage_id,
  l.assigned_to_user_id,
  l.created_at
from public.leads l
where not exists (
  select 1
  from public.lead_stage_history lsh
  where lsh.lead_id = l.id
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
    perform public.ensure_workspace_pipeline_stages(existing_workspace_id);

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

  perform public.ensure_workspace_pipeline_stages(created_workspace_id);

  return query
  select w.id, w.name, w.slug, wm.role
  from public.workspaces w
  join public.workspace_members wm on wm.workspace_id = w.id
  where w.id = created_workspace_id
    and wm.user_id = current_user_id
  limit 1;
end;
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

  default_stage_id := public.get_default_pipeline_stage_id(current_workspace_id);

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

  insert into public.lead_stage_history (
    workspace_id,
    lead_id,
    from_stage_id,
    to_stage_id,
    changed_by_user_id,
    changed_at
  )
  values (
    current_workspace_id,
    created_lead_id,
    null,
    default_stage_id,
    current_user_id,
    timezone('utc', now())
  );

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

  default_stage_id := public.get_default_pipeline_stage_id(target_workspace_id);

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

  insert into public.lead_stage_history (
    workspace_id,
    lead_id,
    from_stage_id,
    to_stage_id,
    changed_by_user_id,
    changed_at
  )
  values (
    target_workspace_id,
    created_lead_id,
    null,
    default_stage_id,
    null,
    timezone('utc', now())
  );

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

create or replace function public.change_lead_stage(
  p_lead_id uuid,
  p_stage_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_lead record;
  target_stage record;
  history_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_lead_id is null then
    raise exception 'Lead is required';
  end if;

  if p_stage_id is null then
    raise exception 'Stage is required';
  end if;

  select
    l.id,
    l.workspace_id,
    l.current_stage_id,
    current_stage.name as current_stage_name
    into target_lead
  from public.leads l
  left join public.pipeline_stages current_stage on current_stage.id = l.current_stage_id
  where l.id = p_lead_id
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = l.workspace_id
        and wm.user_id = current_user_id
    )
  limit 1;

  if target_lead is null then
    raise exception 'Lead not found or access denied';
  end if;

  perform public.ensure_workspace_pipeline_stages(target_lead.workspace_id);

  select id, name
    into target_stage
  from public.pipeline_stages
  where id = p_stage_id
    and workspace_id = target_lead.workspace_id
  limit 1;

  if target_stage is null then
    raise exception 'Stage not found';
  end if;

  if target_lead.current_stage_id = target_stage.id then
    return p_lead_id;
  end if;

  update public.leads
  set current_stage_id = target_stage.id
  where id = p_lead_id;

  insert into public.lead_stage_history (
    workspace_id,
    lead_id,
    from_stage_id,
    to_stage_id,
    changed_by_user_id,
    changed_at
  )
  values (
    target_lead.workspace_id,
    p_lead_id,
    target_lead.current_stage_id,
    target_stage.id,
    current_user_id,
    timezone('utc', now())
  )
  returning id into history_id;

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
    target_lead.workspace_id,
    p_lead_id,
    current_user_id,
    'lead_stage_changed',
    'Lead stage changed',
    format(
      'Lead moved from %s to %s.',
      coalesce(target_lead.current_stage_name, 'Unknown Stage'),
      target_stage.name
    ),
    jsonb_build_object(
      'history_id', history_id,
      'from_stage_id', target_lead.current_stage_id,
      'from_stage_name', target_lead.current_stage_name,
      'to_stage_id', target_stage.id,
      'to_stage_name', target_stage.name,
      'origin', 'manual'
    )
  );

  return p_lead_id;
end;
$$;

create or replace function public.get_stage_change_queue(
  p_workspace_slug text default null,
  p_limit integer default 100
)
returns table (
  history_id uuid,
  workspace_id uuid,
  workspace_name text,
  workspace_slug text,
  lead_id uuid,
  lead_name text,
  lead_email text,
  from_stage_name text,
  to_stage_name text,
  changed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    lsh.id,
    lsh.workspace_id,
    w.name,
    w.slug,
    l.id,
    l.full_name,
    l.email,
    from_stage.name,
    to_stage.name,
    lsh.changed_at
  from public.lead_stage_history lsh
  join public.workspaces w on w.id = lsh.workspace_id
  join public.leads l on l.id = lsh.lead_id
  left join public.pipeline_stages from_stage on from_stage.id = lsh.from_stage_id
  join public.pipeline_stages to_stage on to_stage.id = lsh.to_stage_id
  where lsh.automation_processed_at is null
    and lsh.from_stage_id is distinct from lsh.to_stage_id
    and (p_workspace_slug is null or w.slug = p_workspace_slug)
  order by lsh.changed_at asc
  limit greatest(coalesce(p_limit, 100), 1);
$$;

create or replace function public.mark_stage_change_processed(
  p_history_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_history_id is null then
    raise exception 'History entry is required';
  end if;

  update public.lead_stage_history
  set automation_processed_at = timezone('utc', now())
  where id = p_history_id;

  return p_history_id;
end;
$$;

grant execute on function public.ensure_workspace_pipeline_stages(uuid) to authenticated, service_role;
grant execute on function public.get_default_pipeline_stage_id(uuid) to authenticated, service_role;
grant execute on function public.change_lead_stage(uuid, uuid) to authenticated;
grant execute on function public.get_stage_change_queue(text, integer) to authenticated, service_role;
grant execute on function public.mark_stage_change_processed(uuid) to authenticated, service_role;
