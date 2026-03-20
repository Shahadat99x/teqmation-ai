create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  invoice_number text not null,
  amount_cents bigint not null check (amount_cents > 0),
  due_at timestamptz not null,
  status text not null check (status in ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')) default 'draft',
  external_payment_link text,
  note text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  send_requested_at timestamptz,
  email_sent_at timestamptz,
  last_reminder_sent_at timestamptz,
  viewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, invoice_number)
);

create index if not exists invoices_workspace_due_at_idx
  on public.invoices (workspace_id, due_at asc);

create index if not exists invoices_workspace_status_due_at_idx
  on public.invoices (workspace_id, status, due_at asc);

create index if not exists invoices_lead_created_at_idx
  on public.invoices (lead_id, created_at desc);

drop trigger if exists invoices_touch_updated_at on public.invoices;
create trigger invoices_touch_updated_at
before update on public.invoices
for each row execute function public.touch_updated_at();

alter table public.invoices enable row level security;

drop policy if exists "Users can read their workspace invoices" on public.invoices;
create policy "Users can read their workspace invoices"
on public.invoices
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = invoices.workspace_id
      and wm.user_id = auth.uid()
  )
);

create or replace function public.create_invoice(
  p_lead_id uuid,
  p_amount_cents bigint,
  p_due_at timestamptz,
  p_external_payment_link text default null,
  p_note text default null,
  p_send_now boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_lead record;
  created_invoice_id uuid;
  generated_invoice_number text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_lead_id is null then
    raise exception 'Lead is required';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Invoice amount must be greater than zero';
  end if;

  if p_due_at is null then
    raise exception 'Due date is required';
  end if;

  select l.id, l.workspace_id
    into target_lead
  from public.leads l
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

  generated_invoice_number := 'INV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.invoices (
    workspace_id,
    lead_id,
    invoice_number,
    amount_cents,
    due_at,
    status,
    external_payment_link,
    note,
    created_by_user_id,
    send_requested_at
  )
  values (
    target_lead.workspace_id,
    p_lead_id,
    generated_invoice_number,
    p_amount_cents,
    p_due_at,
    'draft',
    nullif(trim(coalesce(p_external_payment_link, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    current_user_id,
    case when coalesce(p_send_now, false) then timezone('utc', now()) else null end
  )
  returning id into created_invoice_id;

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
    'invoice_created',
    'Invoice created',
    case
      when coalesce(p_send_now, false) then 'Invoice created and queued for sending.'
      else 'Invoice created as a draft record.'
    end,
    jsonb_build_object(
      'invoice_id', created_invoice_id,
      'invoice_number', generated_invoice_number,
      'amount_cents', p_amount_cents,
      'due_at', p_due_at,
      'status', 'draft',
      'external_payment_link', nullif(trim(coalesce(p_external_payment_link, '')), ''),
      'send_now', coalesce(p_send_now, false)
    )
  );

  return created_invoice_id;
end;
$$;

create or replace function public.update_invoice_status(
  p_invoice_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_invoice record;
  normalized_status text;
  activity_type text;
  activity_title text;
  activity_description text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_invoice_id is null then
    raise exception 'Invoice is required';
  end if;

  normalized_status := lower(trim(coalesce(p_status, '')));
  if normalized_status not in ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled') then
    raise exception 'Invalid invoice status';
  end if;

  select i.id, i.workspace_id, i.lead_id, i.invoice_number, i.status, i.amount_cents, i.due_at
    into target_invoice
  from public.invoices i
  where i.id = p_invoice_id
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = i.workspace_id
        and wm.user_id = current_user_id
    )
  limit 1;

  if target_invoice is null then
    raise exception 'Invoice not found or access denied';
  end if;

  if target_invoice.status = normalized_status then
    return p_invoice_id;
  end if;

  update public.invoices
  set
    status = normalized_status,
    email_sent_at = case
      when normalized_status = 'sent' and email_sent_at is null then timezone('utc', now())
      else email_sent_at
    end,
    viewed_at = case
      when normalized_status = 'viewed' and viewed_at is null then timezone('utc', now())
      else viewed_at
    end,
    paid_at = case
      when normalized_status = 'paid' then timezone('utc', now())
      when normalized_status <> 'paid' then null
      else paid_at
    end
  where id = p_invoice_id;

  activity_type := case normalized_status
    when 'draft' then 'invoice_reverted_to_draft'
    when 'sent' then 'invoice_sent'
    when 'viewed' then 'invoice_viewed'
    when 'paid' then 'invoice_paid'
    when 'overdue' then 'invoice_overdue'
    else 'invoice_cancelled'
  end;

  activity_title := case normalized_status
    when 'draft' then 'Invoice reverted to draft'
    when 'sent' then 'Invoice marked as sent'
    when 'viewed' then 'Invoice marked as viewed'
    when 'paid' then 'Invoice marked as paid'
    when 'overdue' then 'Invoice marked as overdue'
    else 'Invoice cancelled'
  end;

  activity_description := case normalized_status
    when 'draft' then 'The invoice was moved back to draft.'
    when 'sent' then 'The invoice was marked as sent.'
    when 'viewed' then 'The invoice was marked as viewed.'
    when 'paid' then 'The invoice was marked as paid.'
    when 'overdue' then 'The invoice was marked as overdue.'
    else 'The invoice was cancelled.'
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
    target_invoice.workspace_id,
    target_invoice.lead_id,
    current_user_id,
    activity_type,
    activity_title,
    activity_description,
    jsonb_build_object(
      'invoice_id', p_invoice_id,
      'invoice_number', target_invoice.invoice_number,
      'status', normalized_status,
      'amount_cents', target_invoice.amount_cents,
      'due_at', target_invoice.due_at
    )
  );

  return p_invoice_id;
end;
$$;

create or replace function public.get_invoice_send_queue(
  p_workspace_slug text default null,
  p_limit integer default 100
)
returns table (
  invoice_id uuid,
  workspace_id uuid,
  workspace_name text,
  workspace_slug text,
  lead_id uuid,
  lead_name text,
  lead_email text,
  invoice_number text,
  amount_cents bigint,
  due_at timestamptz,
  status text,
  external_payment_link text,
  note text
)
language sql
security definer
set search_path = public
as $$
  select
    i.id,
    i.workspace_id,
    w.name,
    w.slug,
    l.id,
    l.full_name,
    l.email,
    i.invoice_number,
    i.amount_cents,
    i.due_at,
    i.status,
    i.external_payment_link,
    i.note
  from public.invoices i
  join public.workspaces w on w.id = i.workspace_id
  join public.leads l on l.id = i.lead_id
  where i.send_requested_at is not null
    and i.email_sent_at is null
    and i.status not in ('paid', 'cancelled')
    and (p_workspace_slug is null or w.slug = p_workspace_slug)
  order by i.send_requested_at asc
  limit greatest(coalesce(p_limit, 100), 1);
$$;

create or replace function public.mark_invoice_email_sent(
  p_invoice_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice record;
begin
  if p_invoice_id is null then
    raise exception 'Invoice is required';
  end if;

  select i.id, i.workspace_id, i.lead_id, i.invoice_number, i.amount_cents, i.due_at
    into target_invoice
  from public.invoices i
  where i.id = p_invoice_id
  limit 1;

  if target_invoice is null then
    raise exception 'Invoice not found';
  end if;

  update public.invoices
  set
    email_sent_at = timezone('utc', now()),
    status = case
      when status in ('draft', 'overdue') then 'sent'
      else status
    end
  where id = p_invoice_id;

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
    target_invoice.workspace_id,
    target_invoice.lead_id,
    null,
    'invoice_sent',
    'Invoice email sent',
    'The invoice email was sent to the lead.',
    jsonb_build_object(
      'invoice_id', p_invoice_id,
      'invoice_number', target_invoice.invoice_number,
      'amount_cents', target_invoice.amount_cents,
      'due_at', target_invoice.due_at,
      'origin', 'n8n'
    )
  );

  return p_invoice_id;
end;
$$;

create or replace function public.get_overdue_invoice_queue(
  p_workspace_slug text default null,
  p_limit integer default 100
)
returns table (
  invoice_id uuid,
  workspace_id uuid,
  workspace_name text,
  workspace_slug text,
  lead_id uuid,
  lead_name text,
  lead_email text,
  invoice_number text,
  amount_cents bigint,
  due_at timestamptz,
  status text,
  external_payment_link text,
  note text
)
language sql
security definer
set search_path = public
as $$
  select
    i.id,
    i.workspace_id,
    w.name,
    w.slug,
    l.id,
    l.full_name,
    l.email,
    i.invoice_number,
    i.amount_cents,
    i.due_at,
    i.status,
    i.external_payment_link,
    i.note
  from public.invoices i
  join public.workspaces w on w.id = i.workspace_id
  join public.leads l on l.id = i.lead_id
  where i.status in ('draft', 'sent', 'viewed', 'overdue')
    and i.due_at <= timezone('utc', now())
    and (
      i.last_reminder_sent_at is null
      or i.last_reminder_sent_at < timezone('utc', now()) - interval '24 hours'
    )
    and (p_workspace_slug is null or w.slug = p_workspace_slug)
  order by i.due_at asc
  limit greatest(coalesce(p_limit, 100), 1);
$$;

create or replace function public.mark_invoice_reminder_sent(
  p_invoice_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice record;
begin
  if p_invoice_id is null then
    raise exception 'Invoice is required';
  end if;

  select i.id, i.workspace_id, i.lead_id, i.invoice_number, i.amount_cents, i.due_at
    into target_invoice
  from public.invoices i
  where i.id = p_invoice_id
  limit 1;

  if target_invoice is null then
    raise exception 'Invoice not found';
  end if;

  update public.invoices
  set
    status = case
      when status in ('draft', 'sent', 'viewed', 'overdue') then 'overdue'
      else status
    end,
    last_reminder_sent_at = timezone('utc', now())
  where id = p_invoice_id;

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
    target_invoice.workspace_id,
    target_invoice.lead_id,
    null,
    'invoice_overdue_reminder_sent',
    'Overdue invoice reminder sent',
    'An overdue invoice reminder email was sent to the lead.',
    jsonb_build_object(
      'invoice_id', p_invoice_id,
      'invoice_number', target_invoice.invoice_number,
      'amount_cents', target_invoice.amount_cents,
      'due_at', target_invoice.due_at,
      'origin', 'n8n'
    )
  );

  return p_invoice_id;
end;
$$;

grant execute on function public.create_invoice(uuid, bigint, timestamptz, text, text, boolean) to authenticated;
grant execute on function public.update_invoice_status(uuid, text) to authenticated;
grant execute on function public.get_invoice_send_queue(text, integer) to authenticated, service_role;
grant execute on function public.mark_invoice_email_sent(uuid) to authenticated, service_role;
grant execute on function public.get_overdue_invoice_queue(text, integer) to authenticated, service_role;
grant execute on function public.mark_invoice_reminder_sent(uuid) to authenticated, service_role;
