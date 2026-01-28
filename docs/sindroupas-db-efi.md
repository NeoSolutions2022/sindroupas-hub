# Documentação de dados (PostgreSQL) + integração EFÍ (Gerencianet)

Documento simples e direto para orientar **migrations** no módulo de autenticação (NodeJS) e o uso de **Hasura** para CRUDs nas telas atuais. Não inclui funcionalidades além das já existentes no produto.

## 1) Premissas
- **Banco**: PostgreSQL.  
- **Autenticação**: módulo NodeJS básico com migrations (tabelas de auth + tabelas do domínio abaixo).  
- **CRUDs**: via Hasura (última versão), com roles `admin` e `superadmin`.  
- **Integração de boletos**: API EFÍ (antigo Gerencianet) para emissão de boletos, consulta de status e conciliação de pagamentos/inadimplência.  

## 2) Tabelas e relacionamentos mínimos (para todas as telas)

### 2.1 Autenticação (NodeJS)
**Tabelas**
- `admin_users`  
  - `id uuid pk`, `email unique not null`, `password_hash`, `name`, `role` (enum `superadmin|admin`), `status` (enum `active|blocked`), `mfa_secret` nullable, `created_at`, `updated_at`.
  
**Relacionamentos**
- N/A (apenas usuários admin).  

---

### 2.2 Empresas
**Tabelas**
- `faixas`  
  - `id`, `label`, `min_colaboradores`, `max_colaboradores`, `valor_mensalidade`.
- `empresas`  
  - `id`, `razao_social`, `nome_fantasia`, `cnpj`, `porte`, `capital_social`, `faixa_id fk`, `associada bool`,  
    `situacao_financeira`, `data_fundacao`, `data_associacao`, `data_desassociacao`,  
    `email`, `whatsapp`, `endereco`, `logo_url`, `observacoes`, `created_at`, `updated_at`.
- `responsaveis`  
  - `id`, `empresa_id fk`, `nome`, `whatsapp`, `email`, `data_aniversario`.
- `colaboradores`  
  - `id`, `empresa_id fk`, `nome`, `cpf`, `whatsapp`, `cargo`, `email`, `observacoes`.

**Relacionamentos**
- `empresas.faixa_id → faixas.id`  
- `responsaveis.empresa_id → empresas.id`  
- `colaboradores.empresa_id → empresas.id`  

---

### 2.3 CRM / Alertas
**Sem módulo dedicado neste momento.**  
Se as telas de CRM (timeline, benefícios, notas) precisarem persistência no banco, será necessário reintroduzir tabelas específicas (ex.: interações, observações e benefícios).  

---

### 2.4 Financeiro (boletos, contribuições, inadimplência)
**Tabelas**
- `financeiro_boletos`  
  - `id`, `empresa_id`, `tipo` (ex.: `mensalidade|contribuicao`), `valor`, `vencimento`,  
    `status` enum `emitido|pago|atrasado|cancelado`,  
    `competencia_inicial`, `competencia_final`, `faixa_id`, `descricao`,  
    `linha_digitavel`, `pdf_url`,  
    **integração EFÍ:** `efi_charge_id`, `efi_status`, `efi_barcode`, `efi_pix_txid` (nullable),  
    `created_at`, `updated_at`.
- `contribuicoes_assistenciais`  
  - `id`, `empresa_id`, `ano`, `periodicidade`, `parcelas`, `base_calculo`, `percentual`, `descontos`,  
    `valor_total`, `vencimento`, `situacao`, `created_at`, `updated_at`.
- `financeiro_export_jobs`  
  - `id`, `admin_id`, `tipo` enum `pdf|excel|csv`, `filtro jsonb`,  
    `status` enum `pendente|processando|concluido|erro`, `resultado_url`, `created_at`, `updated_at`.

**Relacionamentos**
- `financeiro_boletos.empresa_id → empresas.id`  
- `financeiro_boletos.faixa_id → faixas.id`  
- `contribuicoes_assistenciais.empresa_id → empresas.id`  
- `financeiro_export_jobs.admin_id → admin_users.id`  

**Inadimplência (regra simples)**
- Um boleto é considerado **inadimplente** quando `status != pago` e `vencimento < hoje`.  
- O indicador de inadimplência por empresa é o **count** de boletos vencidos em aberto.  

---

### 2.5 Relacionamentos (parceiros/mantenedores/fornecedores)
**Tabelas**
- `relacionamentos` (`id`, `tipo` enum `parceiro|mantenedor|fornecedor`, `nome`, `cnpj`, `categoria`, `status`, `descricao`, `ultima_mov`, `contrapartidas`, `observacoes`, `created_at`, `updated_at`)  
- `relacionamento_contatos` (`id`, `relacionamento_id`, `email`, `whatsapp`, `nome`)  
- `relacionamento_aportes` (`id`, `relacionamento_id`, `valor`, `data`, `descricao`)  
- `relacionamento_pagamentos` (`id`, `relacionamento_id`, `valor`, `data`, `descricao`)

**Relacionamentos**
- `relacionamento_contatos.relacionamento_id → relacionamentos.id`  
- `relacionamento_aportes.relacionamento_id → relacionamentos.id`  
- `relacionamento_pagamentos.relacionamento_id → relacionamentos.id`  

---

### 2.6 Arquivos (apoio)
**Tabela**
- `files` (`id`, `owner_type`, `owner_id`, `file_url`, `content_type`, `metadata`, `created_at`)  

---

## 3) Integração EFÍ (Gerencianet) — Boleto e inadimplência
Objetivo: emissão de boleto, armazenamento dos dados essenciais e conciliação automática de pagamentos.

### 3.1 O que precisa ser persistido
Na tabela `financeiro_boletos`:
- `efi_charge_id`: id da cobrança na EFÍ (inteiro/uuid conforme API).  
- `efi_status`: status retornado pela EFÍ (ex.: `ACTIVE`, `PAID`, `CANCELED` — normalizar).  
- `efi_barcode`: código de barras (se fornecido).  
- `efi_pix_txid`: txid quando boleto híbrido/com PIX (se aplicável).  
- `linha_digitavel` e `pdf_url` para acesso rápido no front.  

### 3.2 Fluxo básico (Actions no Hasura + webhooks)
1. **Criar boleto** (Hasura Action → serviço Node):  
   - Recebe dados do boleto (empresa, valor, vencimento, instruções).  
   - Chama EFÍ **Create Charge** e **Generate Boleto**.  
   - Persiste `financeiro_boletos` com `efi_charge_id`, `linha_digitavel`, `pdf_url`, `efi_status`.  
2. **Consulta de status**:  
   - Endpoint de sincronização (job ou Action) consulta **Get Charge** na EFÍ e atualiza `efi_status` + `status` local.  
3. **Conciliação automática (webhook)**:  
   - EFÍ envia evento de pagamento.  
   - Serviço Node atualiza `financeiro_boletos.status = pago` + datas relevantes.  

### 3.3 Mapeamento de status (mínimo)
| EFÍ | Local (`financeiro_boletos.status`) |
| --- | --- |
| `PAID` | `pago` |
| `CANCELED` | `cancelado` |
| `ACTIVE` + vencido | `atrasado` |
| `ACTIVE` + não vencido | `emitido` |

### 3.4 Consultas de inadimplência
- **Por empresa**: `count(*)` de boletos em `atrasado` (ou `emitido` com vencimento passado).  
- **Geral**: total de boletos vencidos e valor total em aberto para dashboards.  

---

## 4) Hasura (CRUDs)
- Rastrear todas as tabelas e seus relacionamentos FK.  
- Criar **Views** (opcional) para dashboards: inadimplência por faixa, boletos em atraso por empresa.  
- Actions: emissão de boleto EFÍ, exportações (PDF/Excel/CSV).  

---

## 5) Observações finais
- Não incluir tabelas ou fluxos fora dos módulos existentes.  
- O módulo Node de autenticação também pode abrigar o serviço de integração EFÍ (Actions + webhooks).  
- Sem tabelas de sessão/reset/auditoria, o módulo de auth fica reduzido a login básico (sem refresh token persistido e sem recuperação de senha).  

---

## 6) Integração Hasura + Auth (variáveis de ambiente)
Definir no backend e no front:
- `AUTH_URL`: URL do serviço de autenticação (ex.: `http://localhost:3001`).  
- `HASURA_URL`: URL do Hasura (ex.: `http://localhost:8080/v1/graphql`).  
- `HASURA_ADMIN_SECRET`: credencial `x-hasura-admin-secret` (server-side).  

---

## 7) Exemplos de curl (Auth)

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sindroupas@email.com","password":"admin123%"}'
```

### Me
```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## 8) Manual de integração (CRUD no front)
As tabelas abaixo são expostas pelo Hasura para CRUD. O front deve consumir o GraphQL gerado pelo Hasura (queries, mutations e subscriptions) usando os nomes das tabelas.

### Auth
- **admin_users**: usuários admins do sistema. Campos principais: `id`, `email`, `name`, `role`, `status`, `created_at`, `updated_at`.

### Empresas
- **faixas**: faixas de contribuição por quantidade de colaboradores e valor. Campos: `label`, `min_colaboradores`, `max_colaboradores`, `valor_mensalidade`.
- **empresas**: cadastro principal da empresa. Campos de identificação (`razao_social`, `cnpj`, `nome_fantasia`), vínculo (`faixa_id`, `associada`), dados administrativos e contatos.
- **responsaveis**: pessoas responsáveis por cada empresa (relacionamento por `empresa_id`).
- **colaboradores**: colaboradores ligados à empresa (relacionamento por `empresa_id`), com `cpf`, `cargo` e observações.

### Financeiro
- **financeiro_boletos**: boletos emitidos por empresa (relacionamento `empresa_id`), com status e competência.
- **contribuicoes_assistenciais**: registros de contribuições por empresa (`empresa_id`) com periodicidade, parcelas e valores.
- **financeiro_export_jobs**: filas de exportação para admins (`admin_id`) com `tipo`, `filtro` e `status`.

### Relacionamentos
- **relacionamentos**: cadastro de parceiros/mantenedores/fornecedores (campo `tipo`).
- **relacionamento_contatos**: contatos associados a um relacionamento (`relacionamento_id`).
- **relacionamento_aportes**: aportes registrados por relacionamento (`relacionamento_id`).
- **relacionamento_pagamentos**: pagamentos registrados por relacionamento (`relacionamento_id`).

### Arquivos
- **files**: anexos genéricos por `owner_type` e `owner_id` com `file_url`, `content_type` e `metadata`.
