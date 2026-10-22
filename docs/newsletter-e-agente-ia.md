# Newsletter Radar Moda e assistente IA

Implementação de 22/10/2026 na branch `codex/ajustes-audios-boletos`.

## Publicação no EasyPanel

O frontend continua com o Dockerfile atual. O serviço Python novo está em `services/intelligence`, no mesmo repositório, e deve ser publicado como **outro serviço**. A API de boletos existente não precisa ser substituída.

1. Aplicar `docs/sql/2026-10-22-email-financeiro.sql` na fonte PostgreSQL do Hasura. Adiciona uma coluna, sem copiar ou alterar e-mails existentes. Recarregar schema e permissões. O frontend tolera a ausência temporária da coluna nas consultas, mas avisa para aplicar o SQL quando alguém tenta salvá-la.
2. Criar serviço com contexto de build na raiz do repositório e Dockerfile `services/intelligence/Dockerfile`. Porta interna 8080, HTTPS, **uma réplica e um worker**.
3. Montar volume **persistente** em `/data`, gravável pelo UID 10001. Histórico, quota e propostas ficam em SQLite nesse volume. Não usar armazenamento efêmero nem compartilhar o arquivo entre réplicas. Fazer backup do volume.
4. Configurar as variáveis do serviço:

   | Variável | Valor |
   | --- | --- |
   | `OPENAI_API_KEY` | Chave do projeto OpenAI, somente no servidor |
   | `OPENAI_MODEL` | Modelo com Responses API e function calling |
   | `NEWSLETTER_MODEL` | Modelo com Responses API, `web_search` e Structured Outputs |
   | `AUTH_URL` | Mesma URL-base de autenticação do frontend; valida sessão em `GET /auth/me` |
   | `HASURA_URL` | Endpoint `/v1/graphql` com validação JWT configurada |
   | `CORS_ORIGINS` | Origem HTTPS do frontend; várias origens separadas por vírgula |
   | `DATA_PATH` | `/data/intelligence.sqlite` |
   | `EVOLUTION_API_URL` | Mesma URL-base da Evolution usada atualmente |
   | `EVOLUTION_INSTANCE` | A **mesma instância já cadastrada**, sem criar outra |
   | `EVOLUTION_API_KEY` | Chave dessa instância, somente no servidor |

5. Configurar no frontend `VITE_INTELLIGENCE_API_URL` com a URL HTTPS do serviço novo e republicar. O entrypoint já publica essa variável em `env.js`. Sem URL, o chat fica oculto e a página da newsletter informa que o serviço precisa ser conectado.
6. Validar `/health`, autenticação e permissões com uma conta de teste antes de habilitar a agenda. O serviço precisa permanecer ligado às quartas-feiras.

Não há modelo nem chave real fixados no código. Escolher modelos com as ferramentas indicadas. Configuração incompatível resulta em erro no histórico, sem enviar edição incompleta. Os testes usam APIs simuladas; não validam as credenciais ou permissões do ambiente de produção.

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
- Histórico por usuário. OpenAI recebe os dados necessários às consultas solicitadas. Usa `store:false` na Responses API; histórico próprio permanece no volume do serviço. Chave OpenAI não vai ao navegador.

SQLite é inicializado/migrado pelo código apenas no volume do serviço novo. **Não cria tabelas nem altera dados do Hasura automaticamente.** A única mudança no schema principal nesta entrega é o SQL separado de e-mail financeiro.

## Testes locais

```powershell
npm run build
npx tsc --noEmit -p tsconfig.app.json
node scripts/test-boleto-financial-email.mjs
# Com Vite na porta 4178 e Edge/Chromium disponível; APIs simuladas:
node scripts/test-mantenedores-flow.mjs
node scripts/test-intelligence-ui.mjs

# Em ambiente virtual Python isolado:
pip install -r services/intelligence/requirements-test.txt
cd services/intelligence
python -m unittest -v test_service
```

Referências: [function calling](https://developers.openai.com/api/docs/guides/function-calling) e [web search](https://developers.openai.com/api/docs/guides/tools-web-search).
