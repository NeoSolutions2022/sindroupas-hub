# Plano detalhado de backend para autenticação de admins e CRUDs operacionais

Este documento descreve, em português e de forma exaustiva, tudo que é necessário para implementar uma API de autenticação de administradores e os CRUDs de suporte às telas existentes do SindRoupas (exceto Comunicação), usando Hasura como backend (GraphQL) e uma API dedicada para autenticação e geração de migrations.

## 1) Arquitetura geral
- **Banco**: PostgreSQL versionado por migrations (Hasura CLI).  
- **Hasura**: camadas de GraphQL, permissões por role, Actions para lógicas customizadas (ex.: emissão de boleto) e Event Triggers quando necessário.  
- **API de Autenticação**: serviço Node/TypeScript (ou equivalente) exposto via `/auth/*`, responsável por login, refresh, logout, recuperação de senha e MFA. Gera JWT com claims `x-hasura-*` consumidos pelo Hasura.  
- **Identidades**: apenas admins (internos). Usuários finais não estão no escopo.  
- **Observabilidade**: log estruturado, trilha de auditoria (`audit_log`) e métricas básicas (tempo de login, falhas, latência de mutations críticas).  
- **Segurança**: hashing forte (Argon2/Bcrypt), política de senha, lockout por tentativas, refresh tokens com rotação e revogação, proteção contra replay (hash + salt por sessão), MFA opcional.

## 2) Modelagem de autenticação
### 2.1 Tabelas
- `admin_users`  
  - `id uuid pk`, `email unique not null`, `password_hash`, `name`, `role` (enum: `superadmin`, `admin`), `status` (enum: `active`, `blocked`), `mfa_secret` (nullable), `created_at`, `updated_at`.  
- `admin_sessions`  
  - `id uuid pk`, `admin_id fk -> admin_users`, `refresh_token_hash`, `user_agent`, `ip`, `expires_at`, `revoked_at`, `created_at`.  
- `password_resets`  
  - `id uuid pk`, `admin_id fk`, `reset_token_hash`, `expires_at`, `used_at`, `created_at`.  
- `audit_log`  
  - `id uuid pk`, `actor_id fk -> admin_users`, `action` (ex.: `login`, `logout`, `create_empresa`), `entity`, `entity_id`, `metadata jsonb`, `created_at`.

### 2.2 Fluxos suportados
- **Login**: valida credenciais, checa `status`, gera access JWT (curto) + refresh (persistido em `admin_sessions`), retorna refresh em cookie HttpOnly + access em header/corpo.  
- **Refresh**: valida sessão (hash), expiração e revogação; emite novo access e opcionalmente rotaciona refresh (novo registro + revogação do anterior).  
- **Logout**: marca `revoked_at` e invalida cookies.  
- **Recuperação de senha**: gera token único (hash) com expiração curta, envia link; endpoint de reset valida token, grava `used_at`, força rotação de senha e invalida sessões.  
- **MFA (opcional)**: secret TOTP em `mfa_secret` e verificação após senha.  
- **Tentativas/lockout**: contagem em cache ou tabela auxiliar; bloquear após N falhas (configurável) com cooldown.

### 2.3 JWT e claims Hasura
- Payload mínimo: `sub = admin_id`, `role`, `status`.  
- Claims Hasura: `x-hasura-user-id`, `x-hasura-default-role`, `x-hasura-allowed-roles` (ex.: `admin`, `superadmin`).  
- Opções: inclusão de `session_id` para permitir revogação fina via webhook de autorização opcional no Hasura.

### 2.4 Permissões sugeridas
- `superadmin`: CRUD completo em todas as tabelas, inclusive `admin_users`, `admin_sessions`, `audit_log`.  
- `admin`: acesso a domínios operacionais (empresas, financeiro, CRM, relacionamentos), leitura parcial de auditoria (se necessário), sem gerenciar usuários/sessões.

## 3) Entidades operacionais e CRUDs
### 3.1 Empresas
- **Tabelas**:  
  - `faixas` (`id`, `label`, `min_colaboradores`, `max_colaboradores`, `valor_mensalidade`).  
  - `empresas` (`id`, `razao_social`, `nome_fantasia`, `cnpj`, `porte`, `capital_social`, `faixa_id fk`, `associada bool`, `situacao_financeira`, `data_fundacao`, `data_associacao`, `data_desassociacao`, `email`, `whatsapp`, `endereco`, `logo_url`, `observacoes`, `created_at`, `updated_at`).  
  - `responsaveis` (`id`, `empresa_id fk`, `nome`, `whatsapp`, `email`, `data_aniversario`).  
  - `colaboradores` (`id`, `empresa_id fk`, `nome`, `cpf`, `whatsapp`, `cargo`, `email`, `observacoes`).
- **CRUDs**: criação/edição/exclusão de empresa; gerenciamento de `faixas`; criação/edição/exclusão de `responsaveis` e `colaboradores`; filtros por datas e faixa; upload/download de planilhas (via Action ou endpoint auxiliar).  
- **Views/Aggregates**: view de total de colaboradores por empresa; agregados por faixa e situação.

### 3.2 CRM / Alertas
- **Tabelas**:  
  - `empresa_tags` (`id`, `empresa_id`, `texto`).  
  - `empresa_observacoes` (`id`, `empresa_id`, `conteudo`, `tipo` enum `padrao|manual`, `created_at`, `created_by`).  
  - `interacoes` (`id`, `empresa_id`, `autor_id`, `descricao`, `created_at`).  
  - `alertas` (`id`, `empresa_id`, `titulo`, `descricao`, `categoria`, `status` enum `aberto|resolvido`, `created_at`, `resolved_at`).  
  - `beneficios` (`id`, `nome`, `descricao`).  
  - `empresa_beneficios` (`id`, `empresa_id`, `beneficio_id`, `status` enum `pendente|utilizado|expirado`, `updated_at`).  
  - `datas_importantes` (`id`, `empresa_id`, `tipo` enum `fundacao|aniversario_responsavel|outro`, `data`, `descricao`).
- **CRUDs**: adicionar/remover tags; registrar e editar observações; registrar interações; criar/fechar alertas; marcar uso de benefício; manter datas importantes.  
- **Views**: `crm_empresas_view` combinando empresa, status financeiro, benefícios pendentes, alertas abertos e datas importantes para dashboards.

### 3.3 Financeiro
- **Tabelas**:  
  - `financeiro_boletos` (`id`, `empresa_id`, `tipo`, `valor`, `vencimento`, `status` enum `emitido|pago|atrasado|cancelado`, `competencia_inicial`, `competencia_final`, `faixa_id`, `descricao`, `linha_digitavel`, `pdf_url`, `created_at`, `updated_at`).  
  - `contribuicoes_assistenciais` (`id`, `empresa_id`, `ano`, `periodicidade`, `parcelas`, `base_calculo`, `percentual`, `descontos`, `valor_total`, `vencimento`, `situacao`, `created_at`, `updated_at`).  
  - `financeiro_export_jobs` (`id`, `admin_id`, `tipo` enum `pdf|excel|csv`, `filtro jsonb`, `status` enum `pendente|processando|concluido|erro`, `resultado_url`, `created_at`, `updated_at`).
- **CRUDs**: emitir boleto (criação + status inicial); atualizar status (pagamento/atraso/cancelamento); geração de contribuições com wizard de periodicidade/parcelas; gerenciamento de faixas de contribuição; rastrear exports; recalcular prévias.  
- **Actions/Eventos**: para integração com gateway de boletos, usar Action de emissão e Event Trigger para conciliação de pagamentos.

### 3.4 Relacionamentos (Parceiros/Mantenedores/Fornecedores)
- **Tabelas**:  
  - `relacionamentos` (`id`, `tipo` enum `parceiro|mantenedor|fornecedor`, `nome`, `cnpj`, `categoria`, `status`, `descricao`, `ultima_mov`, `contrapartidas`, `observacoes`, `created_at`, `updated_at`).  
  - `relacionamento_contatos` (`id`, `relacionamento_id`, `email`, `whatsapp`, `nome`).  
  - `relacionamento_aportes` (`id`, `relacionamento_id`, `valor`, `data`, `descricao`).  
  - `relacionamento_pagamentos` (`id`, `relacionamento_id`, `valor`, `data`, `descricao`).
- **CRUDs**: criar/editar/excluir relacionamento; adicionar contatos; registrar aportes/pagamentos; alterar status; ver histórico de movimentações.

### 3.5 Outras estruturas de apoio
- **Enums e catálogos**: status de boleto, tipos de relacionamento, periodicidade de contribuição, portes e faixas.  
- **Arquivos**: tabela `files` (`id`, `owner_type`, `owner_id`, `file_url`, `content_type`, `metadata`, `created_at`) ou uso de storage externo; útil para logos e comprovantes.  
- **Auditoria**: todas as mutations sensíveis registram em `audit_log` via Event Trigger ou lógica na API.

## 4) Configuração Hasura
- **Rastreamento**: rastrear todas as tabelas e relacionamentos FK; criar views para dashboards (ex.: `crm_empresas_view`).  
- **Permissões por role**:  
  - `superadmin`: seleção, inserção, atualização e deleção sem restrições; acesso total a colunas.  
  - `admin`: restrições por linha quando aplicável (ex.: bloquear tabelas de usuários/sessões); permitir CRUD em dados operacionais.  
- **Claims**: mapear `x-hasura-default-role` e `x-hasura-allowed-roles` a partir do JWT.  
- **Actions**:  
  - Emissão de boleto (integração externa).  
  - Upload/download de planilhas (se não for direto pelo Hasura).  
  - Autenticação pode permanecer na API separada; Hasura consome apenas o JWT.  
- **Event Triggers**:  
  - `audit_log` (opcional) para propagar para SIEM/observabilidade.  
  - Conciliação de pagamentos e mudanças de status financeiro.  
- **Metadata**: versionar permissões, Actions e Event Triggers junto das migrations no repositório.

## 5) API de autenticação (HTTP)
- **Endpoints**:  
  - `POST /auth/login` – recebe `email`, `password`, opcional `mfa_code`; retorna access JWT + refresh cookie.  
  - `POST /auth/refresh` – requer refresh cookie; retorna novo access; pode rotacionar refresh.  
  - `POST /auth/logout` – revoga sessão atual (ou todas se `all=true`).  
  - `POST /auth/forgot-password` – gera token de reset e envia email (ou integração interna).  
  - `POST /auth/reset-password` – troca senha via token de reset.  
  - Admin extra (restrito a `superadmin`): `POST /auth/admin-users` (criar), `PATCH /auth/admin-users/:id`, `DELETE /auth/admin-users/:id`, `GET /auth/admin-users`.
- **Boas práticas**:  
  - Cookies HttpOnly/SameSite, CORS fechado, rate limiting e captcha opcional.  
  - Logs sem PII sensível (hash/mascaramento).  
  - Tests automatizados de fluxos de login/refresh/reset.

## 6) Migrations e dados iniciais
- **Hasura CLI**: usar `hasura migrate` para gerar/aplicar schema e `hasura metadata` para permissões/Actions/Event Triggers.  
- **Seeds**:  
  - Criar `superadmin` inicial com senha forte (rotacionar em produção).  
  - Popular enums/catálogos (faixas, portes, status financeiros, tipos de relacionamento, periodicidades).  
- **Índices**: em FKs (`empresa_id`, `relacionamento_id`), datas (`vencimento`, `created_at`), campos de busca (`cnpj`, `email`).  
- **Política de integridade**: FKs com `ON DELETE CASCADE` para entidades filhas (contatos, colaboradores) quando apropriado; restrição de unicidade para CNPJ e emails únicos.

## 7) Integração com o front-end
- **Fluxo de login**: substituir mock por chamada a `/auth/login`; guardar refresh em cookie HttpOnly e access em memória/`localStorage` (avaliar segurança); injetar header `Authorization: Bearer <access>` nas requisições GraphQL ao Hasura.  
- **Renovação**: interceptar 401/expired e chamar `/auth/refresh`.  
- **Autorização**: usar roles nas queries/mutations; esconder ações não permitidas pelo `role` presente no JWT.  
- **CRUDs**: mapear cada formulário/lista para mutations Hasura (empresas, faixas, responsáveis, colaboradores, tags, observações, alertas, benefícios, boletos, contribuições, relacionamentos, aportes, pagamentos, exports).  
- **Uploads/Exports**: se usarem Actions, garantir UI de progresso e leitura de `financeiro_export_jobs`.

## 8) Governança e segurança adicionais
- **Proteção de PII**: mascarar CPF/CNPJ em logs; criptografar dados sensíveis se necessário.  
- **Retenção**: políticas para `password_resets` usados/expirados e `admin_sessions` revogadas.  
- **Backups**: snapshots de banco e restauração testada.  
- **Monitoramento**: alarmes para falhas de login, picos de 401, e latência de Actions financeiras.  
- **Conformidade**: registrar consentimento/uso de dados conforme LGPD (se aplicável).  

## 9) Roteiro de implementação
1. **Modelagem**: criar migrations das tabelas acima + enums.  
2. **Hasura**: rastrear tabelas, definir relacionamentos e permissões para `admin` e `superadmin`; configurar Actions/Event Triggers.  
3. **API de Auth**: implementar endpoints, JWT, refresh rotation, lockout e testes automatizados.  
4. **Seeds**: inserir `superadmin` e catálogos iniciais; revisar índices e FKs.  
5. **Integração front**: substituir mock de login; apontar chamadas para Hasura com tokens; ativar fluxos de refresh/logout/reset.  
6. **Observabilidade**: habilitar logs estruturados, `audit_log` e alertas de saúde.  
7. **Go-live**: revisar segurança (CORS, cookies, rate limiting), rodar smoke tests end-to-end e documentar credenciais iniciais.
