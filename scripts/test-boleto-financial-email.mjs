import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const load = async (path, transform = (source) => source) => {
  const source = transform(readFileSync(new URL(path, import.meta.url), "utf8"));
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
};
const { chooseBoletoContact } = await load("../src/lib/boleto-contact.ts");
const empresa = {
  razao_social: "Empresa Teste",
  email: "geral@example.com",
  email_financeiro: " financeiro@example.com ",
  whatsapp: "85999999999",
  responsaveis: [{ nome: "Responsável", email: "responsavel@example.com", whatsapp: "85888888888", contato_principal: true }],
};
assert.equal(chooseBoletoContact(empresa).email, "financeiro@example.com");
assert.equal(chooseBoletoContact(empresa).whatsapp, "85888888888");
assert.equal(empresa.email, "geral@example.com");
assert.equal(chooseBoletoContact({ ...empresa, email_financeiro: "" }).email, "responsavel@example.com");
assert.equal(chooseBoletoContact({ ...empresa, responsaveis: [] }).email, "financeiro@example.com");
assert.equal(chooseBoletoContact({ ...empresa, email_financeiro: null, responsaveis: [] }).email, "geral@example.com");

// Simula o intervalo entre publicação do front e aplicação do SQL.
const { hasuraRequest } = await load("../src/lib/api/hasura.ts", (source) => source.replace(
  /import .*from "@\/lib\/env";/,
  'const getHasuraAdminSecret = () => "test"; const getHasuraUrl = () => "http://test.local/graphql";',
));
const calls = [];
globalThis.fetch = async (_url, options) => {
  const body = JSON.parse(options.body);
  calls.push(body);
  return {
    ok: true,
    json: async () => body.query.includes("email_financeiro") || body.query.includes("mutation")
      ? { errors: [{ message: "field 'email_financeiro' not found in type: 'empresas'" }] }
      : { data: { empresas: [{ id: "test", email: "geral@example.com" }] } },
  };
};
const result = await hasuraRequest({ query: "query Empresas {\n empresas {\n id\n email\n email_financeiro\n }\n}", token: "session" });
assert.equal(result.empresas[0].email, "geral@example.com");
assert.equal(calls.length, 2);
assert.ok(!calls[1].query.includes("email_financeiro"));
const mutation = "mutation Editar($input: empresas_set_input!) { update_empresas(_set: $input) { affected_rows } }";
await assert.rejects(() => hasuraRequest({ query: mutation, variables: { input: { email_financeiro: "novo@example.com" } } }), /Aplique o SQL/);
assert.equal(calls.length, 3, "Não tentar novamente uma mutation removendo o dado financeiro");
console.log("E-mail financeiro: prioridade, compatibilidade legada e proteção das mutations passaram.");
