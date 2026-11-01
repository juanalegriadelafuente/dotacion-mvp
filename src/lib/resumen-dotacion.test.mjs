// Tests del resumen de dotación. Correr con: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { resumenRetail, resumenSan } from "./resumen-dotacion.ts";

const barata = {
  headcount: 15,
  hoursTotal: 542,
  slackHours: 38,
  isCheapest: true,
  isOptimal: false,
  items: [
    { count: 11, contractName: "Full 42h" },
    { count: 4, contractName: "Part 20h" },
  ],
};

test("el resumen repite los números del cálculo", () => {
  const texto = resumenRetail([barata], { requiredHours: 504 });
  assert.ok(texto.includes("504 horas a la semana"));
  assert.ok(
    texto.includes(
      "Opción más barata: 15 personas (11 de Full 42h y 4 de Part 20h), con 542 horas contratadas a la semana y 38 horas de holgura.",
    ),
  );
});

test("una opción que es la más barata y la de menos personas lo dice una vez", () => {
  const texto = resumenRetail([{ ...barata, isOptimal: true }]);
  assert.ok(texto.includes("Opción más barata y con menos personas:"));
});

test("lo que no viene en el cálculo no se menciona", () => {
  const texto = resumenRetail([{ headcount: 1 }], {});
  assert.ok(texto.startsWith("Opción: 1 persona."));
  assert.ok(!texto.includes("holgura"));
  assert.ok(!texto.includes("undefined"));
  assert.ok(!texto.includes("NaN"));
});

test("una opción sin dotación o con datos raros no se inventa", () => {
  for (const mix of [
    {},
    { headcount: "15" },
    { headcount: Number.NaN },
    null,
  ]) {
    const texto = resumenRetail([mix]);
    assert.ok(!texto.includes("Opción"));
    assert.ok(!texto.includes("persona"));
  }
});

test("el resumen no opina sobre la ley y dice dónde se revisa", () => {
  for (const texto of [
    resumenRetail([barata]),
    resumenSan({ totalHorasSemanales: 300 }),
  ]) {
    assert.ok(texto.includes("kaden.cl/verificador"));
    assert.ok(!/45 horas|Código del Trabajo|es legal|es ilegal/.test(texto));
  }
});

test("SAN usa solo sus cifras y omite las que faltan", () => {
  const completo = resumenSan({
    totalHorasSemanales: 320.5,
    fteEquivalente: 7.6,
    nutricionistasCli: 2,
    mixRecomendado: null,
    advertencias: ["Faltan datos de la UCP"],
  });
  assert.ok(completo.includes("320,5 horas"));
  assert.ok(completo.includes("7,6 jornadas completas"));
  assert.ok(completo.includes("Nutricionistas clínicas: 2."));
  assert.ok(completo.includes("Faltan datos de la UCP"));

  const vacio = resumenSan({});
  assert.ok(!vacio.includes("necesita"));
  assert.ok(!vacio.includes("Advertencias"));
});
