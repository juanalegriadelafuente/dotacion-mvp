-- Lista de revisión: quienes dejaron su correo y qué correo les toca.
-- Correr UNA vez en Supabase → SQL Editor, antes de publicar /lista-revision.
--
-- Solo se guarda lo necesario para mandar los tres correos (Ley 21.719,
-- minimización). La fila se borra al darse de baja y al enviar el último correo:
-- lo que no se guarda no hay que protegerlo.

create table if not exists public.lista_revision (
  correo text primary key,
  token_baja uuid not null unique default gen_random_uuid(),
  aceptado_en timestamptz not null default now(),
  ultimo_correo smallint not null default 1,
  proximo_envio timestamptz not null,
  constraint ck_lista_revision_correo check (correo = lower(correo) and length(correo) <= 180),
  constraint ck_lista_revision_paso check (ultimo_correo between 1 and 2)
);

create index if not exists ix_lista_revision_proximo on public.lista_revision (proximo_envio);

-- Nadie entra desde el navegador: RLS activo y sin políticas. Escribe solo el
-- servidor de dotaciones.cl con la clave de servicio.
alter table public.lista_revision enable row level security;
