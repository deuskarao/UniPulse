create table if not exists public.security_rate_limits (
  key text primary key,
  hits integer not null default 0,
  reset_at timestamptz not null,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists security_rate_limits_updated_at_idx
on public.security_rate_limits (updated_at);

create index if not exists security_rate_limits_blocked_until_idx
on public.security_rate_limits (blocked_until);

alter table public.security_rate_limits enable row level security;

drop policy if exists "security_rate_limits_no_client_access" on public.security_rate_limits;
create policy "security_rate_limits_no_client_access"
on public.security_rate_limits
for all
using (false)
with check (false);

create or replace function public.check_security_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer,
  p_block_seconds integer default null
)
returns table (
  allowed boolean,
  hits integer,
  reset_at timestamptz,
  blocked_until timestamptz,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_block_seconds integer := coalesce(p_block_seconds, p_window_seconds);
  v_hit_count integer;
  v_reset_at timestamptz;
  v_blocked_until timestamptz;
begin
  insert into public.security_rate_limits as rl (key, hits, reset_at, blocked_until, updated_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_seconds), null, v_now)
  on conflict (key) do update set
    hits = case
      when rl.reset_at <= v_now then 1
      else rl.hits + 1
    end,
    reset_at = case
      when rl.reset_at <= v_now then v_now + make_interval(secs => p_window_seconds)
      else rl.reset_at
    end,
    blocked_until = case
      when rl.blocked_until is not null and rl.blocked_until > v_now then rl.blocked_until
      when rl.reset_at <= v_now then null
      when rl.hits + 1 > p_max then v_now + make_interval(secs => v_block_seconds)
      else null
    end,
    updated_at = v_now
  returning rl.hits, rl.reset_at, rl.blocked_until
  into v_hit_count, v_reset_at, v_blocked_until;

  return query select
    not (v_blocked_until is not null and v_blocked_until > v_now) and v_hit_count <= p_max,
    v_hit_count,
    v_reset_at,
    v_blocked_until,
    greatest(0, ceil(extract(epoch from (coalesce(v_blocked_until, v_reset_at) - v_now)))::integer);
end;
$$;

revoke all on function public.check_security_rate_limit(text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.check_security_rate_limit(text, integer, integer, integer) to service_role;
