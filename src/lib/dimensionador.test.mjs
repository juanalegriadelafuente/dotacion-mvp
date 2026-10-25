// Tests del cliente del dimensionador. Correr con: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aMixDeCorreo,
  curvaPorHora,
  entradasPorDia,
  mensajeDeError,
} from "./dimensionador.ts";

const cerrado = { open: false, slots: Array(48).fill(0) };

test("cada hora toma el mayor de sus dos tramos", () => {
  const slots = Array(48).fill(0);
  slots[26] = 3; // 13:00
  slots[27] = 5; // 13:30
  const curva = curvaPorHora({
    mon: { open: true, slots },
    tue: cerrado,
    wed: cerrado,
    thu: cerrado,
    fri: cerrado,
    sat: cerrado,
    sun: cerrado,
  });
  assert.deepEqual(Object.keys(curva), ["LUN"]);
  assert.equal(curva.LUN.length, 24);
  assert.equal(curva.LUN[13], 5);
  assert.equal(
    curva.LUN.reduce((a, b) => a + b, 0),
    5,
  );
});

test("un día abierto sin demanda, o cerrado con demanda, no se manda", () => {
  const conGente = Array(48).fill(2);
  const curva = curvaPorHora({
    mon: { open: true, slots: Array(48).fill(0) },
    tue: { open: false, slots: conGente },
    wed: cerrado,
    thu: cerrado,
    fri: cerrado,
    sat: cerrado,
    sun: { open: true, slots: conGente },
  });
  assert.deepEqual(Object.keys(curva), ["DOM"]);
});

test("las entradas salen agrupadas en el orden de la semana", () => {
  const e = (dia, h) => ({
    dia,
    jornada: "42h",
    hora_inicio: h,
    horas: 9,
    personas: 1,
  });
  const grupos = entradasPorDia({
    entradas: [e("DOM", 9), e("LUN", 8), e("LUN", 12)],
  });
  assert.deepEqual(
    grupos.map(([d, es]) => [d, es.length]),
    [
      ["LUN", 2],
      ["DOM", 1],
    ],
  );
});

test("el error del servidor llega en palabras", () => {
  assert.equal(mensajeDeError(422, { detail: "42h: no cabe" }), "42h: no cabe");
  assert.equal(
    mensajeDeError(422, {
      detail: [{ msg: "Value error, 4x3: una jornada de 4 días" }],
    }),
    "4x3: una jornada de 4 días",
  );
  assert.match(mensajeDeError(429, null), /Espera un rato/);
  assert.match(mensajeDeError(500, null), /Intenta de nuevo/);
});

test("la opción se traduce al formato del correo sin inventar números", () => {
  const opcion = {
    estado: "OPTIMAL",
    optima: true,
    personas: { "42h": 3, "20h": 2 },
    dotacion_total: 5,
    horas_contratadas: 166,
    horas_requeridas: 150,
    costo_semanal: null,
    entradas: [],
  };
  const jornadas = [
    { nombre: "42h", horas_semana: 42, dias_semana: 5 },
    { nombre: "20h", horas_semana: 20, dias_semana: 5 },
  ];
  const mix = aMixDeCorreo(opcion, jornadas, 1, {
    isCheapest: true,
    isOptimal: false,
  });
  assert.equal(mix.headcount, 5);
  assert.equal(mix.slackHours, 16);
  assert.equal(mix.ptShare, 2 / 5);
  assert.equal(mix.weeklyCost, undefined);
  assert.deepEqual(
    mix.items.map((i) => [i.count, i.contractName, i.jornadaName]),
    [
      [3, "42h", "5 días"],
      [2, "20h", "5 días"],
    ],
  );
});
