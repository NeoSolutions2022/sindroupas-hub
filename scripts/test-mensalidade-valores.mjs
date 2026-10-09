import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/mensalidadeValores.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { calcularValoresMensalidade: calcular } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

// Mantenedores com valores diferentes e desconto individual: o lote deve somar cada cadastro.
const lote = [calcular(500, 0, 1, false), calcular(750, 10, 1, false)];
assert.equal(lote.reduce((total, empresa) => total + empresa.valorTotal, 0), 1175);
assert.equal(lote.reduce((total, empresa) => total + empresa.quantidadeBoletos, 0), 2);
assert.equal(lote[1].descontoBoleto, 75);

// Trocar de trimestral para mensal recalcula o valor e o número de boletos.
assert.equal(calcular(500, 0, 3, false).valorTotal, 1500);
assert.equal(calcular(500, 0, 3, false).quantidadeBoletos, 3);
assert.equal(calcular(500, 0, 1, false).valorTotal, 500);
assert.equal(calcular(500, 0, 1, false).quantidadeBoletos, 1);
assert.equal(calcular(94, 0, 3, true).valorBoleto, 282);
assert.equal(calcular(94, 0, 3, true).quantidadeBoletos, 1);

// A prévia corresponde à soma exata dos boletos arredondados, inclusive separados/unificados.
assert.equal(calcular(94, 7.5, 3, false).valorTotal, 260.85);
assert.equal(calcular(94, 7.5, 3, true).valorTotal, 260.85);
assert.equal(calcular(100.01, 5, 3, false).valorTotal, 285.03);
assert.equal(calcular(100.01, 5, 3, true).valorTotal, 285.03);
assert.equal(calcular(94, 33.33, 3, false).valorTotal, 188.01);
assert.equal(calcular(94, 33.33, 3, true).valorTotal, 188.01);
assert.equal(calcular(94, 50.005, 3, false).valorTotal, 141);
assert.equal(calcular(94, 50.005, 3, true).valorTotal, 140.99);
assert.equal(calcular(500, 0, 0, false).valorTotal, 0);
assert.equal(calcular(500, 0, 0, true).quantidadeBoletos, 0);
console.log("Mensalidade values: 19 checks passed.");
