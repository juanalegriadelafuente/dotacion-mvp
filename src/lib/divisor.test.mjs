// Tests del divisor de turnos. Correr con: npm test
// (Node 22.6+ importa el .ts directamente, sin compilar.)
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aHora,
  aMinutos,
  aPlanilla,
  dividir,
  duracionTexto,
  largoDelHorario,
  minutosPorPersona,
  repartir,
  sumarDias,
} from "./divisor.ts";

const h = (t) => aMinutos(t);

test("lee y escribe horas", () => {
  assert.equal(aMinutos("08:30"), 510);
  assert.equal(aMinutos("8:05"), 485);
  assert.equal(aMinutos("24:00"), null);
  assert.equal(aMinutos("12:60"), null);
  assert.equal(aMinutos("hola"), null);
  assert.equal(aHora(1530), "01:30");
  assert.equal(duracionTexto(160), "2 h 40 min");
  assert.equal(duracionTexto(480), "8 h");
  assert.equal(duracionTexto(45), "45 min");
});

test("un horario que cruza la medianoche y uno de 24 horas", () => {
  assert.equal(largoDelHorario(h("22:00"), h("06:00")), 480);
  assert.equal(largoDelHorario(h("08:00"), h("08:00")), 1440);
  assert.equal(largoDelHorario(h("09:00"), h("18:00")), 540);
});

test("24 horas en 3 turnos de 8", () => {
  const t = dividir(h("08:00"), h("08:00"), 3);
  assert.deepEqual(
    t.map((x) => `${aHora(x.inicio)}-${aHora(x.fin)}`),
    ["08:00-16:00", "16:00-00:00", "00:00-08:00"],
  );
});

test("sin huecos ni traslapes, y el último termina exacto", () => {
  for (const n of [2, 3, 4, 5, 7, 11]) {
    for (const paso of [1, 5, 15, 30]) {
      const t = dividir(h("22:00"), h("06:10"), n, paso);
      assert.equal(t[0].inicio, h("22:00"));
      assert.equal(t.at(-1).fin, h("22:00") + 490);
      for (let i = 1; i < t.length; i++)
        assert.equal(t[i].inicio, t[i - 1].fin);
      for (const x of t) assert.ok(x.fin > x.inicio, `n=${n} paso=${paso}`);
    }
  }
});

test("con redondeo a 15 minutos, los cortes caen en cuartos de hora", () => {
  const t = dividir(h("09:00"), h("19:00"), 3, 15); // 600 min / 3 = 200
  assert.deepEqual(
    t.map((x) => aHora(x.fin)),
    ["12:15", "15:45", "19:00"],
  );
});

test("fechas sin zona horaria, también a fin de mes", () => {
  assert.equal(sumarDias("2026-10-31", 1), "2026-11-01");
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
});

test("la rueda reparte parejo cuando hay más personas que turnos", () => {
  const tramos = dividir(h("08:00"), h("08:00"), 3);
  const a = repartir(["Ana", "Beto", "Caro", "Dani"], 3, "2026-11-02", 4);
  assert.equal(a.length, 12);
  assert.deepEqual(
    a.filter((x) => x.fecha === "2026-11-03").map((x) => x.persona),
    ["Dani", "Ana", "Beto"],
  );
  const min = minutosPorPersona(a, tramos);
  assert.deepEqual(Object.values(min), [1440, 1440, 1440, 1440]);
});

test("la planilla queda en el formato que lee Kaden Revisión", () => {
  const tramos = dividir(h("22:00"), h("06:00"), 2);
  const a = repartir(["Ana", "Beto", "Caro"], 2, "2026-11-02", 2);
  const { texto, dobles } = aPlanilla(a, tramos);
  assert.equal(dobles, 0);
  assert.equal(
    texto,
    [
      // El turno 02:00-06:00 va en la columna del día siguiente al inicio.
      "Nombre\t2026-11-02\t2026-11-03\t2026-11-04",
      "Ana\t22:00-02:00\t\t02:00-06:00",
      "Beto\t\t02:00-06:00\t",
      "Caro\t\t22:00-02:00\t",
    ].join("\n"),
  );
});

test("con menos personas que turnos se avisa el turno doble", () => {
  const tramos = dividir(h("08:00"), h("20:00"), 3);
  const { dobles } = aPlanilla(repartir(["Ana"], 3, "2026-11-02", 1), tramos);
  assert.equal(dobles, 2);
});
