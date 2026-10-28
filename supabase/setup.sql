-- agnc. media website: free-plan requests and their uploaded files.
-- Run once in the Supabase SQL Editor (project "agnc"). Safe to run again.

create table if not exists public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'booked' check (status in ('booked', 'done', 'cancelled', 'no_show')),
  restaurant text not null,
  postcode text not null default '',
  cuisines text[] not null default '{}',
  opening text not null default '',
  menu_files text[] not null default '{}',
  menu_later boolean not null default false,
  goal text not null default '',
  notes text not null default '',
  instagram text not null default '',
  contact_name text not null,
  email text not null,
  whatsapp text not null,
  call_date date not null,
  call_time text not null,
  call_how text not null,
  call_at timestamptz not null,
  ref text not null default '',
  user_agent text not null default ''
);

-- One booking per call slot. Cancelling a request (status = 'cancelled') frees its slot again.
create unique index if not exists plan_requests_one_per_slot
  on public.plan_requests (call_date, call_time)
  where status <> 'cancelled';

create index if not exists plan_requests_call_at on public.plan_requests (call_at);

-- Only the website's server (secret key) reads and writes. The public and signed-in roles get nothing.
alter table public.plan_requests enable row level security;
revoke all on public.plan_requests from anon, authenticated;

-- Private bucket for menus and photos. The browser uploads through one-time links the server hands out.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'plan-files', 'plan-files', false, 20971520,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
