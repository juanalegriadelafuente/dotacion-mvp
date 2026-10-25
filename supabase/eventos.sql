-- Eventos de dotaciones.cl para medir el embudo (D-ING-11).
-- Correr UNA vez en Supabase → SQL Editor. Mientras no exista la tabla, la
-- página funciona igual: medir nunca rompe lo que el visitante vino a hacer.
--
-- Lo que NO se guarda, a propósito: hora, IP, cookies, identificadores de
-- persona o de navegador. Con el día y el conteo alcanza para decidir, y lo que
-- no se guarda no hay que protegerlo (mismo criterio que eventos_lite en Kaden).

create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  dia date not null default (now() at time zone 'America/Santiago')::date,
  evento text not null,
  lugar text,
  origen text,
  constraint ck_eventos_evento check (evento in (
    'visita', 'revisar_click', 'lite_click', 'planilla_demo', 'divisor_mini',
    'divisor_uso', 'divisor_copiar', 'dotacion_calculo', 'suscripcion', 'blog_filtro'
  )),
  constraint ck_eventos_lugar check (lugar ~ '^[a-z0-9/_.-]{1,80}$'),
  constraint ck_eventos_origen check (origen ~ '^[a-z0-9._-]{1,40}$')
);

create index if not exists ix_eventos_dia_evento on public.eventos (dia, evento);

-- Nadie entra desde el navegador: RLS activo y sin políticas. Escribe solo el
-- servidor de dotaciones.cl con la clave de servicio.
alter table public.eventos enable row level security;

-- Para el tablero: conteos por día, evento, lugar y origen.
create or replace view public.eventos_por_dia as
  select dia, evento, coalesce(lugar, '') as lugar, coalesce(origen, '') as origen, count(*) as n
  from public.eventos
  group by 1, 2, 3, 4;
