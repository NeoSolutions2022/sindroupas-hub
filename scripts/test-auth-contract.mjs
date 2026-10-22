import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/api/auth.ts", import.meta.url), "utf8")
  .replace('import { getAuthUrl } from "@/lib/env";', 'const getAuthUrl = () => "https://auth.test";');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { normalizeAuthUser, meRequest } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const active = { id: "admin-qa", email: "qa@example.com", name: "Administrador QA", role: "admin", status: "active" };
assert.deepEqual(normalizeAuthUser({ user: active }), active);
assert.deepEqual(normalizeAuthUser(active), active);
assert.throws(() => normalizeAuthUser({ user: { ...active, status: "inactive" } }), /não está ativo/);
assert.throws(() => normalizeAuthUser({ user: { ...active, is_active: false } }), /não está ativo/);
for (const payload of [null, [], {}, { user: null }, { user: { role: "admin" } }]) {
  assert.throws(() => normalizeAuthUser(payload), /Resposta inválida/);
}
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://auth.test/auth/me");
    assert.equal(options.headers.Authorization, "Bearer qa-token");
    return { ok: true, json: async () => ({ user: active }) };
  };
  assert.deepEqual(await meRequest("qa-token"), active);
} finally { globalThis.fetch = originalFetch; }
console.log("Contrato /auth/me: envelope real, legado, identidade inválida e inativos passaram.");
