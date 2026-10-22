# Newsletter Radar Moda e assistente IA

Implementação de 22/10/2026 na branch `codex/ajustes-audios-boletos`.

## Publicação no EasyPanel

O frontend continua com o Dockerfile atual. O serviço Python novo está em `services/intelligence`, no mesmo repositório, e deve ser publicado como **outro serviço**. A API de boletos existente não precisa ser substituída.

1. Aplicar `docs/sql/2026-10-22-email-financeiro.sql` na fonte PostgreSQL do Hasura. Adiciona uma coluna, sem copiar ou alterar e-mails existentes. Recarregar schema e permissões. O frontend tolera a ausência temporária da coluna nas consultas, mas avisa para aplicar o SQL quando alguém tenta salvá-la.
2. Criar serviço com contexto de build na raiz do repositório e Dockerfile `services/intelligence/Dockerfile`. Porta interna 8080, HTTPS, **uma réplica e um worker**.
3. Aplicar `docs/sql/2026-10-22-intelligence-postgres.sql` no banco já conectado ao Hasura. As sete tabelas ficam no schema isolado `sindroupas_intelligence`, sem modificar empresas ou boletos. O serviço exige essas estruturas e não executa migrações automaticamente. Não são necessárias permissões públicas nas tabelas nem volume SQLite. Incluir o schema nos backups existentes do PostgreSQL.
4. Configurar as variáveis do serviço:

   | Variável | Valor |
   | --- | --- |
   | `OPENAI_API_KEY` | Chave do projeto OpenAI, somente no servidor |
   | `OPENAI_MODEL` | `gpt-6.1-sol` por padrão; exige Responses API e function calling |
   | `NEWSLETTER_MODEL` | `gpt-6.1-sol` por padrão; exige `web_search` e Structured Outputs |
   | `AUTH_URL` | Mesma URL-base de autenticação do frontend; valida sessão em `GET /auth/me` |
   | `HASURA_URL` | Endpoint `/v1/graphql` com validação JWT configurada |
   | `CORS_ORIGINS` | Origem HTTPS do frontend; várias origens separadas por vírgula |
   | `DATABASE_URL` | Conexão PostgreSQL do mesmo banco conectado ao Hasura; somente servidor |
   | `EVOLUTION_API_URL` | Mesma URL-base da Evolution usada atualmente |
   | `EVOLUTION_INSTANCE` | A **mesma instância já cadastrada**, sem criar outra |
   | `EVOLUTION_API_KEY` | Chave dessa instância, somente no servidor |

5. Configurar no frontend `VITE_INTELLIGENCE_API_URL` com a URL HTTPS do serviço novo e republicar. O entrypoint já publica essa variável em `env.js`. Sem URL, o chat fica oculto e a página da newsletter informa que o serviço precisa ser conectado.
6. Validar `/health`, autenticação e permissões com uma conta de teste antes de habilitar a agenda. O serviço precisa permanecer ligado às quartas-feiras.

O modelo padrão é `gpt-6.1-sol`, substituível pelas variáveis acima. Nenhuma chave real fica no código. Configuração incompatível resulta em erro no histórico, sem enviar edição incompleta. Os testes usam PostgreSQL local e APIs externas simuladas; não validam as credenciais ou permissões de produção. A chave OpenAI não deve ficar nas variáveis do frontend.

## E-mail financeiro

Disponível no cadastro/edição de empresa, cadastro público e revisão das solicitações de associação. Solicitações usam o `payload` JSON existente; o financeiro é transferido à empresa na aprovação.

Quando preenchido, `email_financeiro` prevalece para criar e reenviar boletos, inclusive lotes e geração automática. O e-mail geral é preservado. Sem o financeiro, mantém-se a escolha de contato antiga dos cadastros legados. O diálogo de e-mail ausente agora salva o endereço financeiro. Detalhes do boleto exibem os dois campos.

## Newsletter

Página administrativa `/dashboard/newsletter`. Agenda inicialmente desativada. Cadastrar fontes adicionais, pautas/notícias, até cinco URLs HTTPS de fotos, legenda, CTA de contato e, opcionalmente, um número com DDD ou grupo.

- Geração às quartas, às 09:00 por padrão, com horário configurável no fuso `America/Fortaleza`.
- Uma edição por semana ISO, mesmo com cliques repetidos. Pesquisa desde a última edição pronta, ou últimos sete dias na primeira geração.
- Prompt editorial fornecido pelo usuário: Ceará 60%, Nordeste 25%, Brasil/global 15%; notícias novas 70%, indicadores 20%, desdobramentos 10%. São prioridades editoriais, sem inventar conteúdo para completar percentuais.
- Pesquisa com `web_search`, histórico e links adicionais. Exige ao menos seis notícias inéditas de três domínios, datas dentro do período e URLs presentes nas fontes retornadas pela pesquisa. Bloqueia repetição de URLs e identificadores dos fatos; desdobramentos precisam ter fato novo.
- Pesquisa insuficiente ou falhada fica com erro e não envia. A interface permite tentar novamente uma edição falhada da semana atual. Links e datas ficam disponíveis para conferência; validação automatizada não substitui revisão editorial.
- Formato WhatsApp RADAR MODA, síntese e CTA configurável. WhatsApp usa texto, sem alinhamento central de botão. O CTA fica em destaque no final; na plataforma, o link de contato é centralizado.
- Histórico preserva texto, fontes e fotos da edição, mesmo após mudar a configuração.
- Opção de versão em imagens: cards PNG renderizados com os mesmos títulos, resumos e links da edição verificada, além de um card de síntese e CTA. Não utiliza geração livre de texto em imagens por IA. Os arquivos ficam em `image_assets` no PostgreSQL e só são acessíveis pela rota autenticada administrativa; seguem junto ao texto pela mesma Evolution.
- Geração usa uma fila persistente por semana. Cliques repetidos não duplicam tarefas. A interface mostra tarefas pendentes, em andamento, bloqueadas ou falhadas; a pesquisa não depende de manter a página aberta. Configuração ausente bloqueia a tarefa, sem perder o pedido. Reinício durante execução exige revisão antes de tentar novamente.
- `docs/sql/2026-10-22-primeira-newsletter.sql` solicita a primeira edição de forma idempotente; não fabrica conteúdo e não envia sem destino cadastrado. A fila só é processada após publicar o serviço com uma chave válida.
- **Sem destino, gera e guarda na plataforma. Com destino cadastrado, envia automaticamente quando pronta**, inclusive na geração manual, que pede confirmação antes de iniciar.
- Grupos consultados por `group/fetchAllGroups/{instance}`, com JID `@g.us`. Números individuais normalizados para `55+DDD+número`.
- Usa `message/sendText/{instance}` e `message/sendMedia/{instance}` na mesma Evolution já usada. Fotos seguem o texto; erro parcial pode significar texto recebido sem todas as fotos.
- Entrega única por edição/destino. Timeout ou reinício durante envio registra **resultado incerto**, sem repetir automaticamente. Conferir no WhatsApp. Esta versão não reenvia ao mesmo destino uma entrega já registrada ou incerta. A edição permanece disponível para copiar.

## Assistente IA

Chat flutuante nas páginas autenticadas quando o serviço estiver conectado.

- Três **novas solicitações do usuário** por dia, com renovação à meia-noite de Fortaleza. Uma solicitação pode executar até sete etapas internas de consultas ao modelo. Aprovar/recusar não consome outra solicitação. Pedidos iniciados que falhem continuam contando. Repetir o mesmo identificador não duplica a cota.
- Quota por ID validado da sessão, persistente e reservada atomicamente, inclusive em solicitações simultâneas e outro navegador.
- Validação da sessão em cada chamada pelo `/auth/me`. Queries e mutations Hasura usam **somente o Bearer token do usuário**, sem admin-secret. O Hasura precisa validar os JWTs da autenticação e expor as operações permitidas ao papel. Se o ambiente hoje aceitar apenas admin-secret, configurar JWT/permissões antes de ativar o agente; não usar segredo administrativo como atalho.
- Introspecção do schema autorizado da sessão, consultas às entidades expostas e paginação até 100 registros por consulta. Limites adicionais e permissões devem ser definidos também no Hasura.
- Propostas de criação simples e edição por ID nos campos escalares/JSON permitidos ao papel. Sem inserções aninhadas e sem exclusão. Requer roots Hasura `insert_<entidade>_one`, `update_<entidade>` e, para editar, `<entidade>_by_pk(id:...)`.
- UI mostra entidade, ID, resumo, valores anteriores e novos. O botão **Confirmar criação/edição** executa a proposta guardada no servidor. Somente o mesmo usuário confirma, em até 30 minutos.
- Na confirmação, revalida sessão/schema e compara os dados. A mutation condiciona a gravação aos valores anteriores para impedir sobrescrita concorrente. Confirmações repetidas não repetem a operação. Resultados incertos exigem conferência antes de nova alteração.
- Emissão, cancelamento, valores e status de boletos devem usar as telas/APIs de domínio existentes; a ferramenta genérica só altera competências em `financeiro_boletos`.
- Histórico por usuário. OpenAI recebe os dados necessários às consultas solicitadas. Usa `store:false` na Responses API; histórico próprio permanece no PostgreSQL conectado ao Hasura. Chave OpenAI não vai ao navegador.

As estruturas novas são criadas exclusivamente pelo SQL revisável. O serviço grava apenas seu schema isolado para configurações, histórico, cotas e fila. Alterações de negócio pelo agente continuam passando pelo JWT do usuário, permissões Hasura e confirmação explícita. O agente não pode editar suas próprias tabelas de cotas ou aprovações. Caso exista uma instalação SQLite anterior, preservar o arquivo e planejar importação separada antes da troca; não há importação nem exclusão automática.

## Testes locais

```powershell
npm run build
npx tsc --noEmit -p tsconfig.app.json
node scripts/test-boleto-financial-email.mjs
# Com Vite na porta 4178 e Edge/Chromium disponível; APIs simuladas:
node scripts/test-mantenedores-flow.mjs
node scripts/test-intelligence-ui.mjs

# Em ambiente virtual Python isolado e com PostgreSQL LOCAL dedicado:
pip install -r services/intelligence/requirements-test.txt
$env:TEST_DATABASE_URL = 'postgresql://test_intelligence@127.0.0.1:55439/intelligence_test'
cd services/intelligence
python -m unittest -v test_service
```

Referências: [function calling](https://developers.openai.com/api/docs/guides/function-calling) e [web search](https://developers.openai.com/api/docs/guides/tools-web-search).
