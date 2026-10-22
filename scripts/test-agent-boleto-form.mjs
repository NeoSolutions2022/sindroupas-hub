import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:4178";
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === "win32" ? "msedge" : undefined) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], writes = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const empresas = [
    { id: "m1", razao_social: "Mantenedora Alfa", nome_fantasia: "Alfa", tipo_vinculo: "Mantenedor", valor_mensalidade_vinculo: 500, associada: false },
    { id: "a1", razao_social: "Associada Beta", nome_fantasia: "Beta", tipo_vinculo: "Associado", associada: true, data_associacao: "2018-01-01", faixa_id: "f1" },
  ].map((empresa) => ({ ...empresa, cnpj: "12345678000190", email: "geral@example.com", email_financeiro: "financeiro@example.com", responsaveis: [], colaboradores: [] }));
  const actions = empresas.map((empresa) => ({ kind: "boleto_form", id: empresa.id, empresa_id: empresa.id, empresa_nome: empresa.nome_fantasia, tipo: "mensalidade", periodicidade: "Mensal", competencia: "2026-10", vencimento: "2026-10-30", valor_avulso: "", motivo: "" }));
  await page.addInitScript(({ baseUrl }) => {
    localStorage.setItem("sindroupas_auth_token", `test.${btoa(JSON.stringify({ role: "admin" }))}.test`);
    window.__ENV__ = { VITE_AUTH_URL: `${baseUrl}/mock/auth`, VITE_HASURA_URL: `${baseUrl}/mock/graphql`, VITE_HASURA_ADMIN_SECRET: "test", VITE_BOLETOS_API_URL: `${baseUrl}/mock`, VITE_INTELLIGENCE_API_URL: `${baseUrl}/mock/intelligence` };
  }, { baseUrl });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseUrl).origin) return route.abort();
    if (!url.pathname.startsWith("/mock/")) return route.continue();
    if (url.pathname === "/mock/boletos") { writes.push(route.request().postDataJSON()); return route.fulfill({ json: { ok: true } }); }
    if (url.pathname.startsWith("/mock/auth")) return route.fulfill({ json: { user: { id: "qa", role: "admin", status: "active", email: "qa@example.com" } } });
    if (url.pathname === "/mock/intelligence/agent/history") return route.fulfill({ json: { quota: { remaining: 3 }, items: [{ request_id: "qa", message: "Prepare os boletos", answer: "Revise no formulário. Nada emitido.", proposals: [], actions }] } });
    if (url.pathname === "/mock/intelligence/newsletter") return route.fulfill({ json: { settings: { enabled: false, time: "09:00", source_links: [], photo_urls: [], number: "" }, editions: [] } });
    const body = route.request().postDataJSON();
    if (body?.query?.trim().startsWith("mutation")) writes.push(body);
    return route.fulfill({ json: { data: { financeiro_boletos: [], contribuicoes_assistenciais: [], empresas, faixas: [{ id: "f1", label: "1–50", min_colaboradores: 1, max_colaboradores: 50, valor_mensalidade: 94 }], atividades: [] } } });
  });
  await page.goto(`${baseUrl}/dashboard/financeiro`);
  for (const empresa of empresas) {
    await page.getByRole("button", { name: "Assistente IA", exact: true }).click();
    const suggestion = page.getByText(`Preparar boleto: ${empresa.nome_fantasia}`, { exact: true }).locator("..");
    await suggestion.getByRole("button", { name: "Abrir formulário para revisar" }).click();
    const modal = page.getByRole("dialog", { name: "Criar Boleto", exact: true });
    await expect(modal).toBeVisible();
    await expect(modal.locator("#empresaSearch")).toHaveValue(new RegExp(empresa.nome_fantasia));
    await expect(modal.getByRole("radio", { name: /Mensalidade de vínculo/ })).toBeChecked();
    await modal.getByRole("button", { name: "Próximo", exact: true }).click();
    await expect(modal.locator("#mensalidadePeriodicidade")).toHaveText("Mensal");
    await expect(modal.getByText(empresa.id === "m1" ? "R$ 500,00" : "R$ 94,00", { exact: true }).first()).toBeVisible();
    await expect(modal.getByText("1 competência(s)", { exact: true })).toBeVisible();
    assert.equal(writes.length, 0, "Preparar e revisar não pode emitir nem gravar no banco");
    await modal.getByRole("button", { name: "Cancelar", exact: true }).click();
  }
  assert.deepEqual(errors, []);
  assert.equal(writes.length, 0);
  console.log("Atalho do agente: mantenedor e associado, valores do formulário e revisão sem emissão passaram.");
} finally { await browser.close(); }
