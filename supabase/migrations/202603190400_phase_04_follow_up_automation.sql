create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  due_at timestamptz not null,
  status text not null check (status in ('pending', 'sent', 'completed', 'skipped')) default 'pending',
  channel text not null check (channel in ('internal', 'email')),
  template_name text,
  note text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  last_reminded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists follow_ups_workspace_due_at_idx
  on public.follow_ups (workspace_id, due_at asc);

create index if not exists follow_ups_lead_created_at_idx
  on public.follow_ups (lead_id, created_at desc);

drop trigger if exists follow_ups_touch_updated_at on public.follow_ups;
create trigger follow_ups_touch_updated_at
before update on public.follow_ups
for each row execute function public.touch_updated_at();

alter table public.follow_ups enable row level security;

drop policy if exists "Users can read their workspace follow ups" on public.follow_ups;
create policy "Users can read their workspace follow ups"
on public.follow_ups
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = follow_ups.workspace_id
      and wm.user_id = auth.uid()
  )
);

create or replace function public.create_follow_up(
  p_lead_id uuid,
  p_due_at timestamptz,
  p_channel text,
  p_note text default null,
  p_template_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_workspace_id uuid;
  created_follow_up_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_lead_id is null then
    raise exception 'Lead is required';
  end if;

  if p_due_at is null then
    raise exception 'Due date is required';
  end if;

  if p_channel not in ('internal', 'email') then
    raise exception 'Channel must be internal or email';
  end if;

  if p_due_at < timezone('utc', now()) - interval '5 minutes' then
    raise exception 'Due time must be current or upcoming';
  end if;

  select l.workspace_id
    into target_workspace_id
  from public.leads l
  where l.id = p_lead_id
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = l.workspace_id
        and wm.user_id = current_user_id
    )
  limit 1;

  if target_workspace_id is null then
    raise exception 'Lead not found or access denied';
  end if;

  insert into public.follow_ups (
    workspace_id,
    lead_id,
    due_at,
    status,
    channel,
    template_name,
    note,
    created_by_user_id
  )
  values (
    target_workspace_id,
    p_lead_id,
    p_due_at,
    'pending',
    p_channel,
    nullif(trim(coalesce(p_template_name, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    current_user_id
  )
  returning id into created_follow_up_id;

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
    p_lead_id,
    current_user_id,
    'follow_up_created',
    'Follow-up scheduled',
    case
      when p_channel = 'email' then 'Email reminder scheduled for this lead.'
      else 'Internal reminder scheduled for this lead.'
    end,
    jsonb_build_object(
      'follow_up_id', created_follow_up_id,
      'status', 'pending',
      'channel', p_channel,
      'due_at', p_due_at,
      'template_name', nullif(trim(coalesce(p_template_name, '')), '')
    )
  );

  return created_follow_up_id;
end;
$$;

create or replace function public.update_follow_up_status(
  p_follow_up_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_follow_up record;
  status_title text;
  status_description text;
  activity_type text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_follow_up_id is null then
    raise exception 'Follow-up is required';
  end if;

  if p_status not in ('pending', 'sent', 'completed', 'skipped') then
    raise exception 'Invalid follow-up status';
  end if;

  select fu.id, fu.lead_id, fu.workspace_id, fu.status, fu.channel, fu.due_at
    into target_follow_up
  from public.follow_ups fu
  where fu.id = p_follow_up_id
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = fu.workspace_id
        and wm.user_id = current_user_id
    )
  limit 1;

  if target_follow_up is null then
    raise exception 'Follow-up not found or access denied';
  end if;

  update public.follow_ups
  set
    status = p_status,
    last_reminded_at = case when p_status = 'sent' then timezone('utc', now()) else last_reminded_at end
  where id = p_follow_up_id;

  status_title := case
    when p_status = 'sent' then 'Follow-up sent'
    when p_status = 'completed' then 'Follow-up completed'
    when p_status = 'skipped' then 'Follow-up skipped'
    else 'Follow-up reopened'
  end;

  status_description := case
    when p_status = 'sent' then 'The reminder was marked as sent.'
    when p_status = 'completed' then 'The follow-up was completed.'
    when p_status = 'skipped' then 'The follow-up was skipped.'
    else 'The follow-up was moved back to pending.'
  end;

  activity_type := case
    when p_status = 'sent' then 'follow_up_sent'
    when p_status = 'completed' then 'follow_up_completed'
    when p_status = 'skipped' then 'follow_up_skipped'
    else 'follow_up_reopened'
  end;

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
    target_follow_up.workspace_id,
    target_follow_up.lead_id,
    current_user_id,
    activity_type,
    status_title,
    status_description,
    jsonb_build_object(
      'follow_up_id', p_follow_up_id,
      'status', p_status,
      'channel', target_follow_up.channel,
      'due_at', target_follow_up.due_at
    )
  );

  return p_follow_up_id;
end;
$$;

create or replace function public.record_follow_up_reminder_sent(
  p_follow_up_id uuid,
  p_delivery_channel text default 'email'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_follow_up record;
begin
  if p_follow_up_id is null then
    raise exception 'Follow-up is required';
  end if;

  select fu.id, fu.lead_id, fu.workspace_id, fu.channel, fu.due_at
    into target_follow_up
  from public.follow_ups fu
  where fu.id = p_follow_up_id
  limit 1;

  if target_follow_up is null then
    raise exception 'Follow-up not found';
  end if;

  update public.follow_ups
  set
    status = 'sent',
    last_reminded_at = timezone('utc', now())
  where id = p_follow_up_id;

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
    target_follow_up.workspace_id,
    target_follow_up.lead_id,
    null,
    'follow_up_sent',
    'Follow-up reminder sent',
    'The reminder workflow recorded a sent reminder.',
    jsonb_build_object(
      'follow_up_id', p_follow_up_id,
      'status', 'sent',
      'channel', coalesce(nullif(trim(coalesce(p_delivery_channel, '')), ''), target_follow_up.channel),
      'due_at', target_follow_up.due_at,
      'origin', 'n8n'
    )
  );

  return p_follow_up_id;
end;
$$;

create or replace function public.get_due_follow_up_queue(
  p_workspace_slug text default null,
  p_limit integer default 100
)
returns table (
  follow_up_id uuid,
  workspace_id uuid,
  workspace_name text,
  workspace_slug text,
  lead_id uuid,
  lead_name text,
  lead_email text,
  due_at timestamptz,
  channel text,
  status text,
  note text
)
language sql
security definer
set search_path = public
as $$
  select
    fu.id,
    fu.workspace_id,
    w.name,
    w.slug,
    l.id,
    l.full_name,
    l.email,
    fu.due_at,
    fu.channel,
    fu.status,
    fu.note
  from public.follow_ups fu
  join public.workspaces w on w.id = fu.workspace_id
  join public.leads l on l.id = fu.lead_id
  where fu.status in ('pending', 'sent')
    and fu.due_at <= timezone('utc', now())
    and (p_workspace_slug is null or w.slug = p_workspace_slug)
  order by fu.due_at asc
  limit greatest(coalesce(p_limit, 100), 1);
$$;

grant execute on function public.create_follow_up(uuid, timestamptz, text, text, text) to authenticated;
grant execute on function public.update_follow_up_status(uuid, text) to authenticated;
grant execute on function public.record_follow_up_reminder_sent(uuid, text) to authenticated, service_role;
grant execute on function public.get_due_follow_up_queue(text, integer) to authenticated, service_role;
