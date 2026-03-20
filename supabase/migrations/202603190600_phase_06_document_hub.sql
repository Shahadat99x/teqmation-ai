insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-documents',
  'lead-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.document_upload_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by_user_id uuid references auth.users(id) on delete set null,
  note text,
  expires_at timestamptz not null default timezone('utc', now()) + interval '14 days',
  email_sent_at timestamptz,
  last_reminder_sent_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists document_upload_links_workspace_created_at_idx
  on public.document_upload_links (workspace_id, created_at desc);

create table if not exists public.document_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  upload_link_id uuid not null references public.document_upload_links(id) on delete cascade,
  document_type text not null check (document_type in ('passport', 'transcript', 'IELTS', 'CV', 'photo', 'other')),
  label text not null,
  status text not null check (status in ('requested', 'uploaded')) default 'requested',
  due_at timestamptz,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  uploaded_at timestamptz,
  unique (upload_link_id, document_type)
);

create index if not exists document_requests_lead_created_at_idx
  on public.document_requests (lead_id, created_at desc);

create index if not exists document_requests_workspace_status_due_idx
  on public.document_requests (workspace_id, status, due_at asc);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  request_id uuid references public.document_requests(id) on delete set null,
  upload_link_id uuid references public.document_upload_links(id) on delete set null,
  document_type text not null check (document_type in ('passport', 'transcript', 'IELTS', 'CV', 'photo', 'other')),
  file_name text not null,
  storage_bucket text not null default 'lead-documents',
  storage_path text not null unique,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  mime_type text not null,
  uploaded_by_name text,
  uploaded_by_email text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists documents_lead_created_at_idx
  on public.documents (lead_id, created_at desc);

create index if not exists documents_workspace_created_at_idx
  on public.documents (workspace_id, created_at desc);

alter table public.document_upload_links enable row level security;
alter table public.document_requests enable row level security;
alter table public.documents enable row level security;

drop policy if exists "Users can read their workspace document upload links" on public.document_upload_links;
create policy "Users can read their workspace document upload links"
on public.document_upload_links
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = document_upload_links.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "Users can read their workspace document requests" on public.document_requests;
create policy "Users can read their workspace document requests"
on public.document_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = document_requests.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "Users can read their workspace documents" on public.documents;
create policy "Users can read their workspace documents"
on public.documents
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = documents.workspace_id
      and wm.user_id = auth.uid()
  )
);

create or replace function public.get_document_type_label(p_document_type text)
returns text
language sql
immutable
as $$
  select case p_document_type
    when 'passport' then 'Passport'
    when 'transcript' then 'Transcript'
    when 'IELTS' then 'IELTS'
    when 'CV' then 'CV'
    when 'photo' then 'Photo'
    else 'Other'
  end;
$$;

create or replace function public.create_document_request_bundle(
  p_lead_id uuid,
  p_document_types text[],
  p_due_at timestamptz default null,
  p_note text default null,
  p_link_expires_at timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_lead record;
  upload_link_id uuid;
  upload_token text;
  document_type_value text;
  normalized_types text[];
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_lead_id is null then
    raise exception 'Lead is required';
  end if;

  normalized_types := array(
    select distinct trim(value)
    from unnest(coalesce(p_document_types, array[]::text[])) as value
    where nullif(trim(value), '') is not null
  );

  if array_length(normalized_types, 1) is null then
    raise exception 'Select at least one document type';
  end if;

  foreach document_type_value in array normalized_types
  loop
    if document_type_value not in ('passport', 'transcript', 'IELTS', 'CV', 'photo', 'other') then
      raise exception 'Invalid document type: %', document_type_value;
    end if;
  end loop;

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

  insert into public.document_upload_links (
    workspace_id,
    lead_id,
    created_by_user_id,
    note,
    expires_at
  )
  values (
    target_lead.workspace_id,
    p_lead_id,
    current_user_id,
    nullif(trim(coalesce(p_note, '')), ''),
    coalesce(p_link_expires_at, timezone('utc', now()) + interval '14 days')
  )
  returning id, token into upload_link_id, upload_token;

  insert into public.document_requests (
    workspace_id,
    lead_id,
    upload_link_id,
    document_type,
    label,
    status,
    due_at,
    requested_by_user_id
  )
  select
    target_lead.workspace_id,
    p_lead_id,
    upload_link_id,
    document_type_value,
    public.get_document_type_label(document_type_value),
    'requested',
    p_due_at,
    current_user_id
  from unnest(normalized_types) as document_type_value;

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
    'documents_requested',
    'Documents requested',
    format('Requested %s document item(s) for this lead.', array_length(normalized_types, 1)),
    jsonb_build_object(
      'upload_link_id', upload_link_id,
      'requested_types', normalized_types,
      'due_at', p_due_at
    )
  );

  return upload_token;
end;
$$;

create or replace function public.record_document_upload(
  p_token text,
  p_request_id uuid default null,
  p_document_type text default null,
  p_file_name text default null,
  p_storage_bucket text default 'lead-documents',
  p_storage_path text default null,
  p_file_size_bytes bigint default null,
  p_mime_type text default null,
  p_uploaded_by_name text default null,
  p_uploaded_by_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_link record;
  target_request record;
  final_document_type text;
  created_document_id uuid;
begin
  if nullif(trim(coalesce(p_token, '')), '') is null then
    raise exception 'Upload token is required';
  end if;

  if nullif(trim(coalesce(p_file_name, '')), '') is null then
    raise exception 'File name is required';
  end if;

  if nullif(trim(coalesce(p_storage_path, '')), '') is null then
    raise exception 'Storage path is required';
  end if;

  if p_file_size_bytes is null or p_file_size_bytes <= 0 then
    raise exception 'Valid file size is required';
  end if;

  if nullif(trim(coalesce(p_mime_type, '')), '') is null then
    raise exception 'MIME type is required';
  end if;

  select dul.id, dul.workspace_id, dul.lead_id
    into target_link
  from public.document_upload_links dul
  where dul.token = trim(p_token)
    and dul.revoked_at is null
    and dul.expires_at > timezone('utc', now())
  limit 1;

  if target_link is null then
    raise exception 'Upload link is invalid or expired';
  end if;

  if p_request_id is not null then
    select dr.id, dr.document_type, dr.label
      into target_request
    from public.document_requests dr
    where dr.id = p_request_id
      and dr.upload_link_id = target_link.id
    limit 1;

    if target_request is null then
      raise exception 'Requested document item not found';
    end if;

    final_document_type := target_request.document_type;
  else
    final_document_type := nullif(trim(coalesce(p_document_type, '')), '');

    if final_document_type is null then
      raise exception 'Document type is required';
    end if;

    if final_document_type not in ('passport', 'transcript', 'IELTS', 'CV', 'photo', 'other') then
      raise exception 'Invalid document type';
    end if;
  end if;

  insert into public.documents (
    workspace_id,
    lead_id,
    request_id,
    upload_link_id,
    document_type,
    file_name,
    storage_bucket,
    storage_path,
    file_size_bytes,
    mime_type,
    uploaded_by_name,
    uploaded_by_email
  )
  values (
    target_link.workspace_id,
    target_link.lead_id,
    p_request_id,
    target_link.id,
    final_document_type,
    trim(p_file_name),
    coalesce(nullif(trim(coalesce(p_storage_bucket, '')), ''), 'lead-documents'),
    trim(p_storage_path),
    p_file_size_bytes,
    trim(p_mime_type),
    nullif(trim(coalesce(p_uploaded_by_name, '')), ''),
    nullif(trim(coalesce(p_uploaded_by_email, '')), '')
  )
  returning id into created_document_id;

  if p_request_id is not null then
    update public.document_requests
    set
      status = 'uploaded',
      uploaded_at = timezone('utc', now())
    where id = p_request_id;
  end if;

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
    target_link.workspace_id,
    target_link.lead_id,
    null,
    'document_uploaded',
    'Document uploaded',
    format(
      '%s uploaded for this lead.',
      case
        when p_request_id is not null then target_request.label
        else public.get_document_type_label(final_document_type)
      end
    ),
    jsonb_build_object(
      'document_id', created_document_id,
      'request_id', p_request_id,
      'document_type', final_document_type,
      'storage_path', trim(p_storage_path),
      'origin', 'public_upload'
    )
  );

  return created_document_id;
end;
$$;

create or replace function public.get_document_request_email_queue(
  p_workspace_slug text default null,
  p_limit integer default 100
)
returns table (
  upload_link_id uuid,
  workspace_id uuid,
  workspace_name text,
  workspace_slug text,
  lead_id uuid,
  lead_name text,
  lead_email text,
  upload_token text,
  expires_at timestamptz,
  requested_items text
)
language sql
security definer
set search_path = public
as $$
  select
    dul.id,
    dul.workspace_id,
    w.name,
    w.slug,
    l.id,
    l.full_name,
    l.email,
    dul.token,
    dul.expires_at,
    string_agg(dr.label, ', ' order by dr.created_at asc)
  from public.document_upload_links dul
  join public.workspaces w on w.id = dul.workspace_id
  join public.leads l on l.id = dul.lead_id
  join public.document_requests dr on dr.upload_link_id = dul.id
  where dul.email_sent_at is null
    and dul.revoked_at is null
    and dul.expires_at > timezone('utc', now())
    and dr.status = 'requested'
    and (p_workspace_slug is null or w.slug = p_workspace_slug)
  group by dul.id, dul.workspace_id, w.name, w.slug, l.id, l.full_name, l.email, dul.token, dul.expires_at
  order by dul.created_at asc
  limit greatest(coalesce(p_limit, 100), 1);
$$;

create or replace function public.mark_document_request_email_sent(
  p_upload_link_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_link record;
begin
  if p_upload_link_id is null then
    raise exception 'Upload link is required';
  end if;

  select dul.id, dul.workspace_id, dul.lead_id
    into target_link
  from public.document_upload_links dul
  where dul.id = p_upload_link_id
  limit 1;

  if target_link is null then
    raise exception 'Upload link not found';
  end if;

  update public.document_upload_links
  set email_sent_at = timezone('utc', now())
  where id = p_upload_link_id;

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
    target_link.workspace_id,
    target_link.lead_id,
    null,
    'document_request_email_sent',
    'Document request email sent',
    'The upload request email was sent to the lead.',
    jsonb_build_object(
      'upload_link_id', p_upload_link_id,
      'origin', 'n8n'
    )
  );

  return p_upload_link_id;
end;
$$;

create or replace function public.get_missing_document_reminder_queue(
  p_workspace_slug text default null,
  p_limit integer default 100
)
returns table (
  upload_link_id uuid,
  workspace_id uuid,
  workspace_name text,
  workspace_slug text,
  lead_id uuid,
  lead_name text,
  lead_email text,
  upload_token text,
  missing_items text,
  next_due_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    dul.id,
    dul.workspace_id,
    w.name,
    w.slug,
    l.id,
    l.full_name,
    l.email,
    dul.token,
    string_agg(dr.label, ', ' order by dr.due_at asc nulls last, dr.created_at asc),
    min(dr.due_at)
  from public.document_upload_links dul
  join public.workspaces w on w.id = dul.workspace_id
  join public.leads l on l.id = dul.lead_id
  join public.document_requests dr on dr.upload_link_id = dul.id
  where dul.revoked_at is null
    and dul.expires_at > timezone('utc', now())
    and dr.status = 'requested'
    and dr.due_at is not null
    and dr.due_at <= timezone('utc', now())
    and (
      dul.last_reminder_sent_at is null
      or dul.last_reminder_sent_at < timezone('utc', now()) - interval '24 hours'
    )
    and (p_workspace_slug is null or w.slug = p_workspace_slug)
  group by dul.id, dul.workspace_id, w.name, w.slug, l.id, l.full_name, l.email, dul.token
  order by min(dr.due_at) asc
  limit greatest(coalesce(p_limit, 100), 1);
$$;

create or replace function public.mark_missing_document_reminder_sent(
  p_upload_link_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_link record;
begin
  if p_upload_link_id is null then
    raise exception 'Upload link is required';
  end if;

  select dul.id, dul.workspace_id, dul.lead_id
    into target_link
  from public.document_upload_links dul
  where dul.id = p_upload_link_id
  limit 1;

  if target_link is null then
    raise exception 'Upload link not found';
  end if;

  update public.document_upload_links
  set last_reminder_sent_at = timezone('utc', now())
  where id = p_upload_link_id;

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
    target_link.workspace_id,
    target_link.lead_id,
    null,
    'document_reminder_sent',
    'Missing document reminder sent',
    'The lead was reminded about missing requested documents.',
    jsonb_build_object(
      'upload_link_id', p_upload_link_id,
      'origin', 'n8n'
    )
  );

  return p_upload_link_id;
end;
$$;

grant execute on function public.get_document_type_label(text) to anon, authenticated, service_role;
grant execute on function public.create_document_request_bundle(uuid, text[], timestamptz, text, timestamptz) to authenticated;
grant execute on function public.record_document_upload(text, uuid, text, text, text, text, bigint, text, text, text) to authenticated, service_role;
grant execute on function public.get_document_request_email_queue(text, integer) to authenticated, service_role;
grant execute on function public.mark_document_request_email_sent(uuid) to authenticated, service_role;
grant execute on function public.get_missing_document_reminder_queue(text, integer) to authenticated, service_role;
grant execute on function public.mark_missing_document_reminder_sent(uuid) to authenticated, service_role;
