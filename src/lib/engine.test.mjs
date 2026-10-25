// Tests del motor de la calculadora de dotación. Correr con: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculate } from "./engine.ts";

const dia = {
  open: true,
  hoursOpen: 10,
  requiredPeople: 4,
  shiftsPerDay: 2,
  overlapMinutes: 30,
  breakMinutes: 30,
};
const semana = Object.fromEntries(
  ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((k) => [k, { ...dia }]),
);

function mejor(completo) {
  const r = calculate({
    fullHoursPerWeek: completo,
    days: semana,
    replacementFactor: 1.15,
    contracts: [
      {
        name: `${completo}h`,
        hoursPerWeek: completo,
        allowedJornadaIds: ["J_5X2"],
      },
      { name: "30h", hoursPerWeek: 30, allowedJornadaIds: ["J_5X2"] },
    ],
  });
  return r.mixes[0];
}

test("el contrato completo de 42 h entra en las combinaciones (Ley 21.561)", () => {
  // Con un tope fijo de 40 h, el motor descartaba el contrato de 42 y
  // recomendaba 11 part time donde bastan 8 personas.
  const m = mejor(42);
  assert.ok(
    m.items.some((i) => i.contractName === "42h"),
    "no ofreció el contrato de 42 h",
  );
  assert.ok(m.headcount <= 8, `recomendó ${m.headcount} personas`);
});

test("con 40 h (desde 2028) sigue funcionando", () => {
  const m = mejor(40);
  assert.ok(m.items.some((i) => i.contractName === "40h"));
});

test("un 4x3 no pasa de 40 h aunque la jornada legal sea 42", () => {
  const r = calculate({
    fullHoursPerWeek: 42,
    days: semana,
    replacementFactor: 1,
    contracts: [
      { name: "42h", hoursPerWeek: 42, allowedJornadaIds: ["J_4X3"] },
    ],
  });
  assert.equal(
    r.mixes.length,
    0,
    "ofreció un 4x3 de 42 h, que exige jornadas de más de 10 h",
  );
});
