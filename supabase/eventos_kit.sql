-- supabase/eventos_kit.sql
-- Eventos de la página del Kit Turnos Legales (30-10-2026): clic en «Pagar con
-- Flow» y compra pagada vista en /kit-turnos/gracias. Correr una vez en Supabase.
alter table eventos drop constraint ck_eventos_evento;
alter table eventos add constraint ck_eventos_evento check (evento in (
  'visita', 'revisar_click', 'lite_click', 'planilla_demo', 'divisor_mini',
  'divisor_uso', 'divisor_copiar', 'dotacion_calculo', 'suscripcion', 'blog_filtro',
  'kit_comprar', 'kit_pagado'
));
