import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:4178";
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === "win32" ? "msedge" : undefined) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let settings = { enabled: false, time: "09:00", destination_type: "number", number: "", cta_label: "Fale com o sindicato", cta_url: "", source_links: [], notes: "", photo_url: "", photo_urls: [], photo_caption: "" };
  let generated = 0;
  let decisions = 0;
  let items = [];
  const editions = [];
  await page.addInitScript(({ baseUrl }) => {
    localStorage.setItem("sindroupas_auth_token", `test.${btoa(JSON.stringify({ role: "admin" }))}.test`);
    window.__ENV__ = { VITE_AUTH_URL: `${baseUrl}/mock/auth`, VITE_HASURA_URL: `${baseUrl}/mock/graphql`, VITE_HASURA_ADMIN_SECRET: "test", VITE_INTELLIGENCE_API_URL: `${baseUrl}/mock/intelligence` };
  }, { baseUrl });
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== new URL(baseUrl).origin) return route.abort();
    const path = url.pathname;
    if (!path.startsWith("/mock/")) return route.continue();
    if (path.startsWith("/mock/auth")) return route.fulfill({ json: { id: "test", role: "admin", email: "teste@example.com" } });
    if (path === "/mock/intelligence/newsletter" && request.method() === "GET") return route.fulfill({ json: { settings, editions } });
    if (path === "/mock/intelligence/newsletter/settings") {
      settings = request.postDataJSON();
      return route.fulfill({ json: settings });
    }
    if (path === "/mock/intelligence/newsletter/groups") return route.fulfill({ json: [{ id: "120363123456789@g.us", name: "Diretoria SindRoupas" }] });
    if (path === "/mock/intelligence/newsletter/generate") { generated += 1; return route.fulfill({ json: { accepted: true } }); }
    if (path === "/mock/intelligence/agent/history") return route.fulfill({ json: { items, quota: { used: items.length, limit: 3, remaining: 3-items.length, day: "2026-10-22" } } });
    if (path === "/mock/intelligence/agent/chat") {
      const body = request.postDataJSON();
      items = [{ request_id: body.request_id, message: body.message, answer: "Encontrei a empresa. Revise e confirme a correção.", proposals: [{ id: "proposal-1", entity: "empresas", action: "update", status: "pending", values: { email_financeiro: "financeiro@example.com" }, before: { email_financeiro: "antigo@example.com" }, summary: "Corrigir somente o e-mail financeiro." }] }];
      return route.fulfill({ json: { answer: items[0].answer } });
    }
    if (path === "/mock/intelligence/agent/proposals/proposal-1/decision") {
      assert.deepEqual(request.postDataJSON(), { approve: true });
      decisions += 1;
      items[0].proposals[0].status = "executed";
      return route.fulfill({ json: { status: "executed" } });
    }
    return route.fulfill({ json: { data: { empresas: [], atividades: [], financeiro_boletos: [], faixas: [], contribuicoes_assistenciais: [] } } });
  });
  await page.goto(`${baseUrl}/dashboard/newsletter`);
  await expect(page.getByRole("heading", { name: "Radar Moda • Newsletter" })).toBeVisible();
  await page.getByLabel("Links de fontes adicionais").fill("https://www.fiec.org.br\nhttps://www.ibge.gov.br");
  await page.getByRole("radio", { name: "Grupo", exact: true }).check();
  await page.getByRole("button", { name: "Carregar grupos da Evolution" }).click();
  await page.getByLabel("Selecionar grupo Evolution").selectOption("120363123456789@g.us");
  await page.getByLabel("Link de contato do CTA").fill("https://wa.me/5585999999999");
  await page.getByRole("button", { name: "Salvar configuração" }).click();
  await expect(page.getByRole("button", { name: "Salvar configuração" })).toBeEnabled();
  assert.equal(settings.number, "120363123456789@g.us");
  assert.equal(settings.source_links.length, 2);
  await page.getByRole("button", { name: "Gerar edição da semana" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("120363123456789@g.us");
  assert.equal(generated, 0, "Não gerar antes da confirmação");
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect.poll(() => generated).toBe(1);
  await page.getByRole("button", { name: "Assistente IA", exact: true }).click();
  const chat = page.getByRole("region", { name: "Assistente IA" });
  await expect(chat.getByText("3 de 3 solicitações disponíveis hoje")).toBeVisible();
  await chat.getByLabel("Mensagem para o assistente").fill("Corrija o e-mail financeiro da empresa Alfa");
  await chat.getByRole("button", { name: "Enviar solicitação" }).click();
  await expect(chat.getByText("Antes: antigo@example.com")).toBeVisible();
  await expect(chat.getByText("Depois: financeiro@example.com")).toBeVisible();
  assert.equal(decisions, 0, "Não executar antes da confirmação");
  await chat.getByRole("button", { name: "Confirmar edição" }).click();
  await expect(chat.getByText("Alteração concluída", { exact: true })).toBeVisible();
  await expect(chat.getByText("2 de 3 solicitações disponíveis hoje")).toBeVisible();
  assert.equal(decisions, 1);
  assert.deepEqual(errors, []);
  console.log("Newsletter e chat: fontes, grupo, CTA, confirmação de geração e aprovação de edição passaram.");
} finally {
  await browser.close();
}
