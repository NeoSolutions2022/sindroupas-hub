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
   | `HASURA_ADMIN_SECRET` | Opcional, somente servidor: compatibilidade autorizada para sessões admin validadas por `/auth/me`; não é enviada à OpenAI |
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
- Edição pronta apenas em texto oferece **Gerar imagens desta edição**, com confirmação. Reutiliza notícias, síntese e CTA da própria edição; não pesquisa novamente nem envia WhatsApp. Operação transacional e idempotente: chamadas repetidas retornam os mesmos cards. Sem novas tabelas ou migração SQL.
- Página editorial com carrossel navegável por arraste, teclado, setas e indicadores, manchetes/fontes na lateral, compartilhamento e histórico compacto. Configurações ficam em uma janela lateral, fechada por padrão. Texto completo continua acessível sem ocupar o espaço das artes.
- Duas opções de imagens: **IA premium** (arte completa por notícia, capa e encerramento, em qualidade alta, com cobrança na conta OpenAI) e **montagem gratuita** (template simples em código, sem chamada à API de imagens). Instalações existentes permanecem gratuitas até escolha explícita. A cota de oito mensagens do chat não limita as artes. `NEWSLETTER_IMAGE_MODEL=gpt-image-2` é separado de `NEWSLETTER_MODEL`.
- Carrossel PNG de 1080×1350. Na IA, o modelo dirige a composição inteira e renderiza o texto literal fornecido; o código não recobre a imagem com o template gratuito. Revisar tipografia/fatos visuais antes de compartilhar. No gratuito, tipografia e desenhos são montados em código. Manchete editorial e uma frase de contexto vêm de campos próprios, com compatibilidade para edições antigas; texto completo/links preservados. Paleta pink/coral/laranja/sálvia e direção fotográfica/condensada descritas em `docs/radar-moda-direcao-editorial-pop.md` e `newsletter_images.ART_DIRECTION`.
- Fotos opcionais extraídas da própria matéria, com autorização editorial explícita e desligadas por padrão. No modo IA, são enviadas como referência à OpenAI para composição, podendo haver reinterpretação visual; a interface informa isso. No gratuito, ficam na montagem local. Crédito/URLs preservados e falha de carregamento não bloqueia a edição. Downloads públicos HTTPS com proteção contra SSRF, IP fixado e redirecionamentos revalidados. Nenhuma tabela ou coluna nova.
- Em edição já pronta, **Gerar imagens / Atualizar carrossel** pede confirmação do modo e eventual custo. Substitui apenas as artes depois de renderizar tudo com sucesso, preservando texto, fontes e entregas. Não pesquisa novamente nem envia WhatsApp. As imagens são guardadas em `image_assets` e acessadas por rota administrativa autenticada.
- Imagens de edições existentes usam a mesma fila persistente, com chave textual `images:<modo>:<edição>`. Nenhuma tabela, coluna ou migração nova. Pedidos simultâneos para a mesma edição são deduplicados entre os dois modos. Geração ocorre fora do lock global de cota/aprovações; publicação dos arquivos é atômica. O envio é bloqueado enquanto as artes estão pendentes. Falha preserva as imagens anteriores e não repete chamadas pagas automaticamente. Nova tentativa exige confirmação; conferir consumo se houver timeout.
- Geração usa uma fila persistente por semana. Cliques repetidos não duplicam tarefas. A interface mostra tarefas pendentes, em andamento, bloqueadas ou falhadas; a pesquisa não depende de manter a página aberta. Configuração ausente bloqueia a tarefa, sem perder o pedido. Reinício durante execução exige revisão antes de tentar novamente.
- `docs/sql/2026-10-22-primeira-newsletter.sql` solicita a primeira edição de forma idempotente; não fabrica conteúdo e não envia sem destino cadastrado. A fila só é processada após publicar o serviço com uma chave válida.
- **Sem destino, gera e guarda na plataforma. Com destino cadastrado, envia automaticamente quando pronta**, inclusive na geração manual, que pede confirmação antes de iniciar.
- Grupos consultados por `group/fetchAllGroups/{instance}`, com JID `@g.us`. Números individuais normalizados para `55+DDD+número`.
- Usa `message/sendText/{instance}` e `message/sendMedia/{instance}` na mesma Evolution já usada. Fotos seguem o texto; erro parcial pode significar texto recebido sem todas as fotos.
- Entrega única por edição/destino. Timeout ou reinício durante envio registra **resultado incerto**, sem repetir automaticamente. Conferir no WhatsApp. Esta versão não reenvia ao mesmo destino uma entrega já registrada ou incerta. A edição permanece disponível para copiar.

## Assistente IA

Chat flutuante nas páginas autenticadas quando o serviço estiver conectado.

- Oito **novas solicitações do usuário** por dia, com renovação à meia-noite de Fortaleza. Uma solicitação pode executar até sete etapas internas de consultas ao modelo. Aprovar/recusar não consome outra solicitação. Pedidos iniciados que falhem continuam contando. Repetir o mesmo identificador não duplica a cota. O limite vem de `AGENT_DAILY_LIMIT` no servidor; a interface exibe o valor devolvido pela API.
- Respostas em Markdown com listas, tabelas, código e links HTTP(S). HTML não é executado, imagens remotas não são carregadas e links abrem com isolamento da janela de origem.
- **Limpar histórico do chat** exige confirmação e chama `POST /agent/history/clear`. Arquiva apenas as conversas do usuário autenticado e as retira do contexto enviado ao modelo; recusa propostas pendentes. Mantém auditoria, registros para idempotência e contagem diária. Bloqueia limpeza durante solicitações/execuções em andamento. Usa um marcador no JSON já existente, sem novas tabelas, colunas ou SQL de migração.
- Quota por ID validado da sessão, persistente e reservada atomicamente, inclusive em solicitações simultâneas e outro navegador.
- Validação da sessão em cada chamada pelo `/auth/me`, aceitando o envelope `{ user: ... }` e rejeitando inativos. Por padrão, queries e mutations Hasura usam o Bearer do usuário. Na compatibilidade explicitamente autorizada em 22/10/2026, configurar `HASURA_ADMIN_SECRET` **apenas no serviço intelligence** permite usar a secret somente para sessões administrativas validadas. Usuários comuns continuam usando exclusivamente JWT/permissões Hasura. Isso concede acesso administrativo ao serviço: preferir JWT/permissões mínimas em uma evolução posterior. Nunca enviar a secret à OpenAI ou recebê-la do corpo de uma solicitação.
- Credenciais, usuários de autenticação e controles internos são removidos do schema oferecido ao modelo e bloqueados nas ferramentas. Falhas na conexão/autorização do Hasura antes da chamada ao modelo não reservam a cota; o histórico anterior é preservado.
- Entrada por voz com Web Speech API nativa, sem dependência ou API paga de transcrição. Disponível apenas em navegadores compatíveis e mediante permissão de microfone; pode usar processamento online do fornecedor do navegador. A fala somente preenche o texto, que precisa ser revisado e enviado manualmente. Sem suporte, permanece a digitação.
- Ferramenta `abrir_formulario_boleto`: consulta a empresa por ID e prepara um atalho de navegação. Ao clicar, abre o wizard existente de mensalidade/avulso com os dados sugeridos. Valores de mensalidade, vínculo, descontos e faixa continuam usando a lógica atual. Usuário revisa as etapas e só a confirmação final do wizard emite. Não há emissão por voz, mutation genérica nem clique automático. Formulário em andamento não é sobrescrito. Em ambiguidades, o agente deve pedir qual empresa; o atalho não implementa lotes automáticos.
- Introspecção do schema autorizado da sessão, consultas às entidades expostas e paginação até 100 registros por consulta. Limites adicionais e permissões devem ser definidos também no Hasura.
- Propostas de criação simples e edição por ID nos campos escalares/JSON permitidos ao papel. Sem inserções aninhadas e sem exclusão. Requer roots Hasura `insert_<entidade>_one`, `update_<entidade>` e, para editar, `<entidade>_by_pk(id:...)`.
- UI mostra entidade, ID, resumo, valores anteriores e novos. O botão **Confirmar criação/edição** executa a proposta guardada no servidor. Somente o mesmo usuário confirma, em até 30 minutos.
- Na confirmação, revalida sessão/schema e compara os dados. A mutation condiciona a gravação aos valores anteriores para impedir sobrescrita concorrente. Confirmações repetidas não repetem a operação. Resultados incertos exigem conferência antes de nova alteração.
- Emissão, cancelamento, valores e status de boletos devem usar as telas/APIs de domínio existentes; a ferramenta genérica só altera competências em `financeiro_boletos`.
- Histórico por usuário. OpenAI recebe os dados necessários às consultas solicitadas. Usa `store:false` na Responses API; histórico próprio permanece no PostgreSQL conectado ao Hasura. Chave OpenAI não vai ao navegador.

As estruturas novas são criadas exclusivamente pelo SQL revisável. O serviço grava seu schema isolado para configurações, histórico, cotas e fila. Alterações de negócio pelo agente passam pela sessão validada e confirmação explícita, usando JWT ou a compatibilidade administrativa acima. O agente não pode editar suas próprias tabelas de cotas ou aprovações. Caso exista uma instalação SQLite anterior, preservar o arquivo e planejar importação separada antes da troca; não há importação nem exclusão automática.

## Testes locais

```powershell
npm run build
npx tsc --noEmit -p tsconfig.app.json
node scripts/test-boleto-financial-email.mjs
# Com Vite na porta 4178 e Edge/Chromium disponível; APIs simuladas:
node scripts/test-mantenedores-flow.mjs
# Gerar amostras locais fictícias para o teste visual (sem API/banco):
python scripts/render-newsletter-preview.py
node scripts/test-intelligence-ui.mjs

# Em ambiente virtual Python isolado e com PostgreSQL LOCAL dedicado:
pip install -r services/intelligence/requirements-test.txt
$env:TEST_DATABASE_URL = 'postgresql://test_intelligence@127.0.0.1:55439/intelligence_test'
cd services/intelligence
python -m unittest -v test_service
```

Referências: [function calling](https://developers.openai.com/api/docs/guides/function-calling), [web search](https://developers.openai.com/api/docs/guides/tools-web-search), [image generation](https://developers.openai.com/api/docs/guides/image-generation) e [image prompting](https://developers.openai.com/api/docs/guides/image-prompting).
