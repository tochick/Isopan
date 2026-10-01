-- Solo el servidor de Isopan puede acceder al estado, incluidas las cuentas.
-- No hay acceso directo desde el navegador ni políticas públicas.
begin;
create table if not exists public.isopan_state (
  id text primary key check (id = 'main'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
alter table public.isopan_state enable row level security;
revoke all on public.isopan_state from public, anon, authenticated;
grant select, insert, update on public.isopan_state to service_role;
create table if not exists public.isopan_login_attempts (
  key text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);
alter table public.isopan_login_attempts enable row level security;
revoke all on public.isopan_login_attempts from public, anon, authenticated;
grant select, insert, update, delete on public.isopan_login_attempts to service_role;
create or replace function public.isopan_check_login_attempt(p_key text)
returns boolean language plpgsql set search_path = '' as $$
declare hits integer;
begin
  if p_key !~ '^[a-f0-9]{64}$' then return false; end if;
  insert into public.isopan_login_attempts as prior (key,window_start,attempts)
  values (p_key,now(),1)
  on conflict (key) do update set
    attempts=case when prior.window_start < now()-interval '15 minutes' then 1 else least(prior.attempts+1,100000) end,
    window_start=case when prior.window_start < now()-interval '15 minutes' then now() else prior.window_start end
  returning attempts into hits;
  return hits <= 5;
end;
$$;
revoke all on function public.isopan_check_login_attempt(text) from public,anon,authenticated;
grant execute on function public.isopan_check_login_attempt(text) to service_role;
commit;
