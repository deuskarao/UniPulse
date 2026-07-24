create table if not exists public.pending_registrations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  username text not null unique,
  password_cipher text not null,
  password_iv text not null,
  full_name text not null,
  dept_data jsonb,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.pending_registrations enable row level security;

drop policy if exists "pending_registrations_no_client_access" on public.pending_registrations;
create policy "pending_registrations_no_client_access"
on public.pending_registrations
for all
using (false)
with check (false);
