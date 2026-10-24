-- Contador diario para los frenos de src/lib/proteccion.ts.
-- Correr UNA vez en Supabase → SQL Editor, ANTES de desplegar la rama.
-- Las claves son hashes con sal: aquí no se guarda ninguna IP ni correo en claro.

create table if not exists public.uso_diario (
  fecha date not null default (now() at time zone 'America/Santiago')::date,
  clave text not null,
  n integer not null default 0,
  primary key (fecha, clave)
);

-- Nadie entra a esta tabla desde el navegador: RLS activo y sin políticas.
alter table public.uso_diario enable row level security;

-- Suma 1 y dice si sigue dentro del tope. Atómica: dos llamadas simultáneas
-- no pueden leer el mismo valor.
create or replace function public.incrementar_uso(p_clave text, p_tope integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer;
begin
  insert into public.uso_diario as u (clave, n)
  values (p_clave, 1)
  on conflict (fecha, clave) do update set n = u.n + 1
  returning u.n into v_n;
  return v_n <= p_tope;
end;
$$;

revoke all on function public.incrementar_uso(text, integer) from public, anon, authenticated;
grant execute on function public.incrementar_uso(text, integer) to service_role;

-- Limpieza: los contadores de más de 30 días no sirven para nada.
delete from public.uso_diario where fecha < (now() at time zone 'America/Santiago')::date - 30;
