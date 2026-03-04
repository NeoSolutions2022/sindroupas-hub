# Plano teórico de integração EFI (boletos) com Hasura mantendo acesso direto no frontend

## Objetivo
Ajustar a integração da página **Financeiro > Boletos** para respeitar a regra operacional:
1. **Frontend continua com requests diretas ao Hasura** (fonte oficial da listagem).
2. **Backend autenticado atua apenas como ponte para EFI** (criação/consulta/ações).
3. Frontend recebe retorno da ponte e **grava/atualiza no Hasura**.
4. Se o boleto **já existe no Hasura**, não consultar backend/EFI desnecessariamente.

> Premissa: a URL do backend de autenticação já existe nas envs atuais e será reutilizada para os endpoints de ponte EFI.

---

## 1) Arquitetura alvo (sem quebrar modelo atual)

### Fluxo principal
- **Leitura da tela (listagem/filtros):** frontend -> Hasura (como já é hoje).
- **Comandos EFI (criar/cancelar/reenviar/etc.):** frontend -> backend auth (ponte) -> EFI.
- **Persistência de resultado:** frontend -> Hasura (insert/update com dados retornados pela ponte).

### Princípio de decisão de consulta
Antes de chamar backend/EFI:
1. procurar boleto por `efi_charge_id` (ou chave equivalente) no Hasura;
2. se encontrado e dado estiver válido para a ação/listagem, **usar dado local**;
3. se não encontrado (ou quando usuário força sincronização), chamar backend ponte.

### Benefícios desse desenho
- Mantém o fluxo já adotado com Hasura como base de dados e consulta.
- Evita retrabalho de migrar todas as queries para API REST própria.
- Isola segredo da EFI no backend, sem expor credenciais no frontend.

---

## 2) Contrato recomendado da ponte no backend de autenticação

> Base URL: mesma URL de autenticação já configurada em env no frontend.

### 2.1 Criar boleto na EFI
- `POST /api/efi/boletos`
- Entrada: **body alinhado ao `BoletoForm` atual da tela Financeiro** (detalhado na seção 3).
- Backend executa:
  1. `POST /v1/charge`
  2. `PUT /v1/charge/:id/billet`
- Saída (normalizada): `efi_charge_id`, status EFI, linha digitável, link/pdf, vencimento, valor, payload resumido.
- **Frontend** grava retorno no Hasura (`financeiro_boletos`).

### 2.2 Consultar 1 boleto na EFI
- `GET /api/efi/boletos/:efiChargeId`
- Backend chama `GET /v1/charge/:id`.
- Retorna dados normalizados.
- **Frontend** usa para atualização pontual e faz update no Hasura.

### 2.3 Executar ação no boleto
- `POST /api/efi/boletos/:efiChargeId/acoes`
- Body com `acao` e contexto (detalhado na seção 3.4).
- Mapeamento sugerido:
  - `cancelar` -> `PUT /v1/charge/:id/cancel`
  - `reenviar_boleto` -> `POST /v1/charge/:id/billet/resend`
  - `historico` -> `POST /v1/charge/:id/history`
  - `registrar_pagamento` -> `POST /v1/charge/:id/pay`
  - `baixar_manual` -> `PUT /v1/charge/:id/settle`
- **Frontend** persiste o novo estado no Hasura após sucesso.

### 2.4 Sincronização sob demanda
- `POST /api/efi/boletos/sync`
- Entrada: lista de `efi_charge_id` (ou filtros de período, se suportado).
- Backend consulta EFI e devolve coleção normalizada.
- **Frontend** faz upsert em lote no Hasura.

---

## 3) Bodies específicos que o módulo de auth deve receber (baseado no frontend atual)

> Esta seção descreve **payload de entrada da ponte** sem alterar os dados já usados na tela atual.

### 3.1 Body de criação (`POST /api/efi/boletos`)

#### 3.1.1 Campos esperados (espelho do `BoletoForm`)
```json
{
  "tipo": "mensalidade | contribuicao",
  "empresaId": "uuid",
  "empresaNome": "string",
  "competenciaInicial": "string",
  "competenciaFinal": "string",
  "dataVencimento": "string",
  "faixaId": "uuid|string",
  "unificarCompetencias": "Sim|Não",
  "mensagemPersonalizada": "string",
  "anoContribuicao": "string",
  "periodicidade": "Mensal|Trimestral|Semestral|Anual|string",
  "parcelas": "string numerica",
  "baseCalculo": "string numerica",
  "percentual": "string numerica",
  "descontos": "string numerica",
  "valorCalculado": 0,
  "pesquisaContribuicaoFeita": true
}
```

#### 3.1.2 Regras de validação (sem mudar dados do front)
- `tipo` obrigatório: `mensalidade` ou `contribuicao`.
- `empresaId` obrigatório quando houver vínculo de empresa no frontend.
- `dataVencimento` obrigatório (o frontend atualmente pode enviar em `yyyy-MM-dd` no gerar novo e em texto de input no wizard).
- `valorCalculado` obrigatório e numérico.
- Para `mensalidade`:
  - usar `competenciaInicial`, `competenciaFinal`, `faixaId`, `unificarCompetencias`, `mensagemPersonalizada`.
- Para `contribuicao`:
  - usar `anoContribuicao`, `periodicidade`, `parcelas`, `baseCalculo`, `percentual`, `descontos`.

#### 3.1.3 Exemplo realista – mensalidade
```json
{
  "tipo": "mensalidade",
  "empresaId": "6aa4dc25-3f8f-4f90-9a0a-b345f3f3028a",
  "empresaNome": "Empresa Exemplo LTDA",
  "competenciaInicial": "01/2025",
  "competenciaFinal": "03/2025",
  "dataVencimento": "2025-03-10",
  "faixaId": "faixa-03",
  "unificarCompetencias": "Não",
  "mensagemPersonalizada": "Referente ao trimestre inicial de 2025",
  "anoContribuicao": "",
  "periodicidade": "",
  "parcelas": "",
  "baseCalculo": "",
  "percentual": "",
  "descontos": "",
  "valorCalculado": 850,
  "pesquisaContribuicaoFeita": true
}
```

#### 3.1.4 Exemplo realista – contribuição
```json
{
  "tipo": "contribuicao",
  "empresaId": "6aa4dc25-3f8f-4f90-9a0a-b345f3f3028a",
  "empresaNome": "Empresa Exemplo LTDA",
  "competenciaInicial": "",
  "competenciaFinal": "",
  "dataVencimento": "30/11/2025",
  "faixaId": "",
  "unificarCompetencias": "Não",
  "mensagemPersonalizada": "",
  "anoContribuicao": "2025",
  "periodicidade": "Anual",
  "parcelas": "1",
  "baseCalculo": "20000",
  "percentual": "1.5",
  "descontos": "0",
  "valorCalculado": 300,
  "pesquisaContribuicaoFeita": true
}
```

### 3.2 Body para gerar novo boleto a partir de um existente

No frontend atual, o modal “Gerar novo” remonta um `BoletoForm` reaproveitando os campos do boleto original e alterando `dataVencimento`.

- Endpoint: `POST /api/efi/boletos`
- Body: mesmo formato da seção 3.1
- Diferença prática: `dataVencimento` vem formatado em `yyyy-MM-dd`.

### 3.3 Body de sincronização (`POST /api/efi/boletos/sync`)

#### Formato sugerido
```json
{
  "items": [
    { "efiChargeId": "1234567890", "empresaId": "uuid-opcional" },
    { "efiChargeId": "1234567891" }
  ],
  "force": false,
  "motivo": "backfill-manual | reconciliacao | acao-usuario"
}
```

#### Regras
- `items` obrigatório com ao menos um `efiChargeId`.
- `force=true` permite ignorar cache local e forçar consulta remota.
- O retorno deve vir normalizado para facilitar upsert no Hasura.

### 3.4 Body de ações (`POST /api/efi/boletos/:efiChargeId/acoes`)

#### Envelope único
```json
{
  "acao": "cancelar | reenviar_boleto | historico | registrar_pagamento | baixar_manual",
  "contexto": {
    "canal": "ui-financeiro",
    "requestId": "uuid-opcional",
    "usuarioId": "uuid-opcional"
  },
  "payload": {}
}
```

#### Payload por ação

1) `cancelar`
```json
{
  "acao": "cancelar",
  "payload": {
    "motivo": "Solicitação da empresa"
  }
}
```

2) `reenviar_boleto`
```json
{
  "acao": "reenviar_boleto",
  "payload": {
    "email": "financeiro@empresa.com",
    "mensagem": "Segue segunda via do boleto"
  }
}
```

3) `historico`
```json
{
  "acao": "historico",
  "payload": {
    "descricao": "Contato de cobrança realizado por WhatsApp"
  }
}
```

4) `registrar_pagamento`
```json
{
  "acao": "registrar_pagamento",
  "payload": {
    "dataPagamento": "2025-03-10",
    "valor": 850,
    "observacao": "Pago no caixa"
  }
}
```

5) `baixar_manual`
```json
{
  "acao": "baixar_manual",
  "payload": {
    "dataLiquidacao": "2025-03-10",
    "valorLiquidado": 850
  }
}
```

> Observação: os campos internos de `payload` podem ser flexibilizados conforme exigência exata da EFI, mas o **envelope** (`acao`, `contexto`, `payload`) deve permanecer estável para o frontend.

### 3.5 Resposta padrão da ponte (recomendada)

Para facilitar persistência no Hasura sem transformação excessiva no frontend:

```json
{
  "ok": true,
  "acao": "criar|consultar|cancelar|reenviar_boleto|historico|registrar_pagamento|baixar_manual|sync",
  "boleto": {
    "efi_charge_id": "1234567890",
    "status_efi_raw": "waiting",
    "status_ui": "Pendente",
    "valor": 850,
    "vencimento": "2025-03-10",
    "linha_digitavel": "34191...",
    "pdf_url": "https://...",
    "link_boleto": "https://...",
    "last_synced_at": "2026-02-11T10:00:00Z"
  },
  "raw": {}
}
```

---

## 4) O que muda no frontend (conceitual)

### Mantém
- Queries de listagem, filtros e leitura geral continuam no Hasura (`hasuraRequest`).

### Ajusta
- Botões que hoje criam/atualizam boleto passam a:
  1. chamar backend ponte (URL de auth já existente);
  2. com resposta em mãos, persistir no Hasura;
  3. invalidar query para refletir na tabela.

### Regra “não consultar se já existe no Hasura”
- No fluxo de listagem padrão: **nunca** chamar EFI diretamente.
- No fluxo de detalhe/ação:
  - se já há `efi_charge_id` + status suficiente localmente, executar ação sem consulta prévia;
  - consultar backend apenas quando necessário para confirmar estado remoto, resolver inconsistência ou sincronização manual.

---

## 5) Estratégia para boletos legados (existem fora do Hasura)

Como há boletos antigos que ainda não estão no Hasura, o plano é realizar ingestão inicial sem mudar a fonte de leitura da tela.

### 5.1 Backfill inicial
Duas opções teóricas:
- **A)** Se EFI disponibilizar listagem global/paginada na documentação ativa, usar essa rota para importar por janela de datas.
- **B)** Se somente consulta por ID estiver disponível no escopo adotado:
  - obter IDs legados (planilha, export, sistema anterior, logs);
  - consultar cada `charge_id` via backend ponte;
  - fazer upsert no Hasura com chave única `efi_charge_id`.

### 5.2 Upsert no Hasura (campos mínimos)
- `efi_charge_id` (unique)
- `status_efi_raw`
- `status_ui` (normalizado)
- `valor`
- `vencimento`
- `linha_digitavel`
- `pdf_url` / `link_boleto`
- `last_synced_at`
- `payload_raw` (opcional, jsonb)

### 5.3 Reconciliação contínua
- Job backend (ou rotina operacional) para atualizar boletos pendentes/atrasados.
- Resultado da reconciliação retorna em lote e é persistido no Hasura.
- UI continua lendo apenas Hasura.

---

## 6) Segurança e configuração

### Backend (ponte)
- guarda credenciais EFI em runtime env:
  - `EFI_BASE_URL`
  - `EFI_CLIENT_ID`
  - `EFI_CLIENT_SECRET`
  - `EFI_CERT_PATH` / `EFI_CERT_PASS` (se exigido)
- valida token/perfil do usuário para comandos financeiros.
- aplica timeout/retry controlado e logs auditáveis.

### Frontend
- mantém env atual de autenticação/base API para chamar a ponte EFI.
- **não** recebe segredo da EFI.

---

## 7) Sequência de implementação recomendada

1. Criar endpoints de ponte no backend auth (`/api/efi/boletos...`).
2. Implementar validação dos bodies da seção 3 no módulo de auth.
3. Padronizar payload de resposta (seção 3.5) para persistência em Hasura.
4. Ajustar botões de criação/ação no frontend para chamar ponte + salvar no Hasura.
5. Implementar processo de backfill dos boletos legados para Hasura.
6. Implementar rotina de reconciliação periódica para estados pendentes.
7. Adicionar mecanismo de “sincronização manual” na UI quando necessário.

---

## 8) Critérios de pronto (DoD)

- Listagem da página continua estável via Hasura sem depender de consulta online na EFI.
- Criar boleto pela UI chama backend ponte e persiste retorno no Hasura.
- Ações (cancelar/reenviar/pagar/settle) atualizam Hasura após retorno da ponte.
- Boletos legados passam a aparecer após backfill.
- Se boleto já existe no Hasura, não há consulta redundante à EFI no fluxo normal.
- Módulo auth aceita e valida os corpos definidos nesta documentação.

---

## 9) Riscos e mitigação

- **Risco:** inconsistência entre status local (Hasura) e remoto (EFI).
  - **Mitigação:** reconciliação periódica + botão de sync manual.
- **Risco:** duplicidade em criação.
  - **Mitigação:** idempotência no backend + unique key `efi_charge_id` no Hasura.
- **Risco:** custo operacional no backfill por ID.
  - **Mitigação:** execução em lotes, checkpoint e reprocessamento incremental.

---

## 10) Próximo passo prático

Fechar primeiro o contrato de ponte (`criar`, `consultar`, `ação`, `sync`) na URL de auth já existente e implementar os validadores dos bodies na seção 3. Em seguida, ajustar os botões do frontend para o fluxo **ponte EFI -> persistência Hasura** e iniciar backfill dos boletos antigos para que a listagem oficial continue 100% baseada no Hasura.

---

## 11) O que precisa ser alterado no módulo de auth (hoje somente autenticação)

Para suportar o fluxo proposto, o módulo de auth precisa ganhar **um submódulo de integração EFI** sem mudar sua responsabilidade de autenticação existente.

### 11.1 Novos componentes no backend auth

1. **Router de ponte EFI**
   - Criar rotas sob `/api/efi/boletos`.
   - Rotas mínimas:
     - `POST /api/efi/boletos`
     - `GET /api/efi/boletos/:efiChargeId`
     - `POST /api/efi/boletos/:efiChargeId/acoes`
     - `POST /api/efi/boletos/sync`

2. **Middleware de segurança reutilizando o auth atual**
   - Reusar validação de JWT/sessão que já existe.
   - Acrescentar autorização por escopo/role (ex.: `financeiro:write` para criar/ações).

3. **Validador de payloads**
   - Validar os bodies da seção 3 (com os mesmos campos do frontend atual).
   - Rejeitar payload inválido com `422` e resposta padronizada.

4. **Cliente EFI dedicado**
   - Serviço interno para:
     - obter token OAuth da EFI,
     - cachear token até expiração,
     - executar chamadas `charge`, `billet`, `cancel`, `resend`, `history`, `pay`, `settle`.

5. **Normalizador de resposta**
   - Converter retorno bruto da EFI para o shape da seção 3.5.
   - Retornar sempre `status_ui` + `status_efi_raw`.

6. **Logs e correlação**
   - Gerar `requestId` por requisição.
   - Logar rota, ação, `efiChargeId`, duração e resultado (sem segredo).

### 11.2 Variáveis de ambiente novas no auth

Além das envs já existentes de autenticação, incluir no deploy do auth:
- `EFI_BASE_URL`
- `EFI_CLIENT_ID`
- `EFI_CLIENT_SECRET`
- `EFI_CERT_PATH` (se necessário)
- `EFI_CERT_PASS` (se necessário)
- `EFI_TIMEOUT_MS` (ex.: 10000)

### 11.3 Códigos de resposta recomendados

- `200`/`201`: sucesso.
- `400`: body inválido semanticamente.
- `401`: token ausente/inválido.
- `403`: sem permissão para ação financeira.
- `404`: `efiChargeId` não encontrado na EFI.
- `409`: conflito/idempotência (tentativa duplicada).
- `422`: falha de validação de campos.
- `502`: erro retornado pela EFI.
- `504`: timeout de integração com EFI.

### 11.4 Fluxo ponta a ponta após ajuste do auth

1. Frontend carrega listagem via Hasura (sem mudança).
2. Usuário clica em criar/ação.
3. Frontend envia body ao auth (`/api/efi/boletos...`).
4. Auth valida token + payload + permissão.
5. Auth chama EFI e normaliza resposta.
6. Frontend recebe resposta e faz upsert no Hasura.
7. Frontend invalida query e renderiza estado atualizado.

### 11.5 Checklist objetivo de implementação no auth

- [ ] Criar rotas `/api/efi/boletos...`.
- [ ] Reusar middleware de autenticação atual nas novas rotas.
- [ ] Implementar autorização por role/escopo financeiro.
- [ ] Implementar validador dos bodies da seção 3.
- [ ] Implementar cliente EFI com token cacheado.
- [ ] Implementar normalizador para resposta padrão (seção 3.5).
- [ ] Implementar tratamento de erros com os status da seção 11.3.
- [ ] Adicionar logs com `requestId` e métricas básicas.
- [ ] Publicar envs EFI no ambiente de execução do auth.

> Com isso, o auth deixa de ser “só login” e passa a ser também **gateway financeiro controlado** para EFI, enquanto o Hasura permanece como fonte de leitura da UI.
