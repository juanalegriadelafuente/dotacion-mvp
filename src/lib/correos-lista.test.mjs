// Tests de los correos de la lista de revisión. Correr con: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  correoKit,
  correoLista,
  correoSaliente,
  enPesos,
  proximoEnvio,
  urlBaja,
} from "./correos-lista.ts";

const TOKEN = "11111111-2222-3333-4444-555555555555";

test("cada correo trae el enlace de baja en html y en texto (Ley 19.496, art. 28 B)", () => {
  for (const c of [
    correoLista(TOKEN),
    correoSaliente(TOKEN),
    correoKit(TOKEN, 9900),
  ]) {
    assert.ok(c.html.includes(urlBaja(TOKEN)));
    assert.ok(c.texto.includes(urlBaja(TOKEN)));
    assert.ok(c.asunto.length > 0);
  }
});

test("el correo del Kit dice el precio que entrega la tienda", () => {
  const c = correoKit(TOKEN, 9900);
  assert.ok(c.html.includes("$9.900"));
  assert.ok(c.texto.includes("$9.900"));
  assert.ok(correoKit(TOKEN, 12345).texto.includes("$12.345"));
  assert.equal(enPesos(990), "$990");
});

test("el correo 2 sale a los 2 días y el 3, 3 días después", () => {
  const inicio = new Date("2026-11-01T12:00:00Z");
  const segundo = proximoEnvio(1, inicio);
  assert.equal(segundo.toISOString(), "2026-11-03T12:00:00.000Z");
  assert.equal(
    proximoEnvio(2, segundo).toISOString(),
    "2026-11-06T12:00:00.000Z",
  );
});

test("el primer correo enlaza el PDF y no ofrece nada pagado", () => {
  const c = correoLista(TOKEN);
  assert.ok(c.html.includes("/lista-revision-turnos.pdf"));
  assert.ok(!c.texto.includes("Kit"));
});
