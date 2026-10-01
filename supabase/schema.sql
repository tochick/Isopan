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
commit;
