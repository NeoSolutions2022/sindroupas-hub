import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/contribuicaoEmpresaSearch.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { filterEmpresasContribuicao } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const empresas = [
  { id: "1", razaoSocial: "Zeta Confecções LTDA", nomeFantasia: "Árvore", cnpj: "12.345.678/0001-90", associada: true },
  { id: "2", razaoSocial: "Alfa Indústria LTDA", nomeFantasia: "Protecta", cnpj: "98765432000110", associada: false },
  { id: "3", razaoSocial: "Beta Comércio", nomeFantasia: "Boto", cnpj: "11.111.111/0001-11", associada: false },
];
const ids = (search) => filterEmpresasContribuicao(empresas, search).map((empresa) => empresa.id);
assert.deepEqual(ids(""), ["2", "3", "1"], "Sort by razão social, including non-associated companies");
assert.deepEqual(ids("confeccoes"), ["1"], "Search razão social without accents");
assert.deepEqual(ids("arvore"), ["1"], "Search nome fantasia without accents");
assert.deepEqual(ids("Protecta"), ["2"], "Non-associated company is searchable");
assert.deepEqual(ids("12345678000190"), ["1"], "Unformatted search finds formatted CNPJ");
assert.deepEqual(ids("98.765.432/0001-10"), ["2"], "Formatted search finds unformatted CNPJ");
assert.deepEqual(ids("alfa protecta"), ["2"], "Search terms across both names");
assert.deepEqual(ids("inexistente"), []);
assert.deepEqual(empresas.map((empresa) => empresa.id), ["1", "2", "3"], "Does not mutate source array");
console.log("Contribution company search: 9 checks passed.");
