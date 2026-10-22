import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

// Execute com o Vite local na porta 4178. Todas as APIs são simuladas.
const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:4178";
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === "win32" ? "msedge" : undefined) });
try {
  const page = await browser.newPage();
  await page.clock.setFixedTime(new Date("2026-10-09T12:00:00Z"));
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const emitidos = [];
  const empresas = [
    { id: "m1", razao_social: "Mantenedora Alfa", nome_fantasia: "Alfa", valor_mensalidade_vinculo: 500, desconto_mensalidade_percentual: 0 },
    { id: "m2", razao_social: "Mantenedora Beta", nome_fantasia: "Beta", valor_mensalidade_vinculo: 750, desconto_mensalidade_percentual: 10 },
  ].map((empresa) => ({ ...empresa, tipo_vinculo: "Mantenedor", associada: false, data_associacao: null, faixa_id: null, cnpj: "12345678000190", email: "geral@example.com", email_financeiro: "financeiro@example.com", whatsapp: "85999999999", responsaveis: [], colaboradores: [] }));
  await page.addInitScript(({ baseUrl }) => {
    localStorage.setItem("sindroupas_auth_token", `test.${btoa(JSON.stringify({ role: "admin" }))}.test`);
    window.__ENV__ = {
      VITE_AUTH_URL: `${baseUrl}/mock/auth`,
      VITE_HASURA_URL: `${baseUrl}/mock/graphql`,
      VITE_HASURA_ADMIN_SECRET: "test-only",
      VITE_BOLETOS_API_URL: `${baseUrl}/mock`,
    };
  }, { baseUrl });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseUrl).origin) return route.abort();
    if (!url.pathname.startsWith("/mock/")) return route.continue();
    if (url.pathname === "/mock/boletos") {
      emitidos.push(route.request().postDataJSON());
      return route.fulfill({ json: { ok: true, efi: { data: { charge_id: emitidos.length, status: "waiting" } } } });
    }
    if (url.pathname.startsWith("/mock/auth")) return route.fulfill({ json: { id: "test", role: "admin", email: "teste@example.com" } });
    return route.fulfill({ json: { data: { financeiro_boletos: [], contribuicoes_assistenciais: [], empresas, faixas: [], atividades: [], app_users: [] } } });
  });
  await page.goto(`${baseUrl}/dashboard/financeiro`);
  await page.getByRole("button", { name: "Criar boleto em lote", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Criar Boleto", exact: true });
  await expect(modal.getByRole("radio", { name: /Mensalidade de vínculo/ })).toBeChecked();
  await modal.getByRole("combobox").first().click();
  await page.getByRole("option", { name: /Mantenedores/ }).click();
  await modal.getByRole("button", { name: "Selecionar todas com valor" }).click();
  await modal.getByRole("button", { name: "Próximo" }).click();
  await expect(modal.locator("#mensalidadePeriodicidade")).toHaveText("Mensal");
  await expect(modal.getByText("R$ 1.175,00", { exact: true })).toBeVisible();
  await modal.locator("#mensalidadePeriodicidade").click();
  await page.getByRole("option", { name: "Trimestral", exact: true }).click();
  await expect(modal.getByText("R$ 3.525,00", { exact: true })).toBeVisible();
  await expect(modal.getByText("6 boleto(s) para 2 empresa(s)", { exact: true })).toBeVisible();
  await modal.locator("#mensalidadePeriodicidade").click();
  await page.getByRole("option", { name: "Mensal", exact: true }).click();
  await modal.getByPlaceholder("Selecione o vencimento", { exact: true }).fill("30/10/2026");
  await modal.getByRole("button", { name: "Próximo" }).click();
  await expect(modal.getByText("R$ 1.175,00", { exact: true })).toBeVisible();
  await expect(modal.getByRole("row").filter({ hasText: "Mantenedora Alfa" })).toContainText("R$ 500,00");
  await expect(modal.getByRole("row").filter({ hasText: "Mantenedora Beta" })).toContainText("R$ 675,00");
  await modal.getByRole("button", { name: "Emitir", exact: true }).click();
  await expect(modal).toBeHidden();
  assert.deepEqual(emitidos.map(({ empresa_id, valor, competencia_inicial, competencia_final }) => ({ empresa_id, valor, competencia_inicial, competencia_final })), [
    { empresa_id: "m1", valor: 500, competencia_inicial: "2026-10-01", competencia_final: "2026-10-01" },
    { empresa_id: "m2", valor: 675, competencia_inicial: "2026-10-01", competencia_final: "2026-10-01" },
  ]);
  assert.deepEqual(errors, []);
  assert.deepEqual(emitidos.map((boleto) => boleto.customer.email), ["financeiro@example.com", "financeiro@example.com"]);
  console.log("Mantenedores: seleção, periodicidade, revisão e emissão simulada passaram.");
} finally {
  await browser.close();
}
