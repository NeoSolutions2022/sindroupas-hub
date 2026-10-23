# Radar Moda — Editorial Pop Ceará

Diretriz atual para os cards da newsletter. Substitui a paleta floresta/bege da primeira versão, sem alterar a identidade geral do painel administrativo. A inspiração cromática vem das referências enviadas pelo SindRoupas; o sistema de composição é próprio.

## Conceito

Uma publicação de inteligência de mercado com energia de editorial de moda brasileiro. Cada notícia recebe uma composição específica, mas pertence à mesma família: cores reconhecíveis, fotografia ou ilustração relevante, blocos editoriais de alto contraste, tipografia consistente e crédito discreto. Evitar repetir um carretel ou uma máquina de costura em toda pauta.

**Modo premium por IA:** o modelo desenha o post completo, incluindo tipografia, fotografia/visual, chamada e composição. Não produz apenas um fundo para o código recobrir com caixas fixas. Capa, notícias e encerramento recebem arte própria, em qualidade alta. O código apenas normaliza o arquivo final para 1080×1350 e guarda o resultado. O gratuito continua como uma montagem simples e não serve como referência de qualidade do modo IA.

Estudo visual criado com ImageGen a partir das duas referências fornecidas: `outputs/radar-moda-ia-estudo-editorial-v2.png` no workspace. É um estudo de direção de arte com notícia antiga usada como exemplo, não uma newsletter atual nem um registro documental novo. Não foi usada a chave de API do cliente para gerá-lo.

## Paleta aproximada das referências

| Cor | Código | Função |
| --- | --- | --- |
| Pink | `#FF2F92` | Assinatura e acentos |
| Coral | `#FF5C45` | Variação quente |
| Laranja | `#FF9B43` | Energia e contraponto |
| Verde-sálvia | `#CDD8BE` | Base calma e respiro |
| Branco quente | `#FAFAF2` | Superfície de leitura |
| Preto | `#202020` | Texto e rodapé |
| Lilás | `#B85DEB` | Acento ocasional, nunca dominante |

Usar uma ou duas cores expressivas por arte, com sálvia/branco equilibrando a composição. Não colocar texto pequeno branco sobre pink/laranja. A fotografia preserva suas cores naturais: não pintar pele, roupas ou produtos para forçar a paleta.

## Estrutura reconhecível, variação por pauta

- Formato 1080×1350, margens de segurança de 54–96 px.
- Assinatura superior “RADAR MODA” e numeração da série.
- Área visual predominante: fotografia da matéria, detalhe de material ou colagem editorial relevante.
- Lâmina clara assimétrica, com um recorte diagonal, integrada ao bloco fotográfico: categoria, manchete e uma frase de contexto. Na IA, posição, recorte e equilíbrio são dirigidos pelo modelo conforme a pauta, não pelo template gratuito.
- Rodapé preto com SindRoupas, domínio da fonte, data e crédito da foto quando houver. URLs completas permanecem clicáveis na legenda e no texto.
- Três direções de composição para a IA alternar: close fotográfico de material com traços expressivos, colagem editorial assimétrica, natureza-morta fotográfica com respiro. Mesma paleta/iluminação, não a mesma imagem repetida. Evitar ícones de camiseta, formas geométricas como protagonistas e caixas arredondadas de aplicativo.
- Tipografia alta e bem condensada, preta, em linguagem de editorial de moda. Não usar a aparência de Arial larga em negrito como direção do modo IA.
- Pautas de artesanato podem explorar renda/tramas; produção, modelagem/materiais; varejo, exposição de peças; inovação, o material/processo citado. Indicadores não podem virar gráficos com valores inventados.

## Chamada que funciona sem abrir o link

O título jornalístico original continua preservado. A edição passa a produzir campos próprios para a arte:

- `card_headline`: chamada de 6–14 palavras, específica, autossuficiente e baseada na notícia. Não copiar automaticamente o título do portal.
- `card_context`: uma frase de 12–24 palavras, identificando quem fez o quê e dando o contexto que falta à chamada. Não repetir a manchete nem inventar impacto.
- `visual_theme`: até 20 palavras descrevendo elementos visuais pertinentes, não uma instrução para fabricar fotos de acontecimentos.

Exemplo editorial baseado na referência enviada, não uma notícia nova para a edição atual:

> **Renda de bilro aproxima universidade e artesãs no Ceará**
>
> Parceria entre UFC e CeArt leva os saberes das rendeiras à pesquisa e à formação acadêmica.

O exemplo se apoia na [matéria da SPS de 10/03/2026](https://www.ce.gov.br/sps/2026/03/10/renda-de-saberes-parceria-entre-ufc-e-ceart-fortalece-a-renda-de-bilro-como-patrimonio-vivo-no-ceara/). Não deve entrar em uma newsletter atual só por servir como referência visual.

Edições antigas, sem esses campos, usam título + contexto já salvos. Não há reescrita oculta, nova pesquisa ou cobrança de texto para atualizar suas artes.

## Fotografia real + arte

A opção “Usar fotos das matérias — confirmo autorização de uso” fica desligada por padrão. Estar disponível em um portal não significa que a imagem possa ser republicada: a autorização deve ser conferida pelo administrador.

Quando habilitada, o serviço tenta obter a imagem de destaque indicada na própria matéria (`og:image`/`twitter:image`). Não pede ao modelo que invente URLs, não usa fotos de outra notícia e não contorna login, paywall ou bloqueios. Usa o crédito fotográfico quando informado em metadados estruturados; não confunde autor do texto com fotógrafo. Se não houver autoria, informa isso e identifica o portal.

No modo **IA**, a fotografia autorizada é enviada à OpenAI como referência em `/v1/images/edits`, para dirigir a composição completa. O prompt manda preservar pessoas, roupas, produtos e acontecimento, mas o processo generativo pode reinterpretar detalhes: o administrador precisa revisar texto, pessoas e produtos antes de compartilhar. A legenda identifica a composição por IA a partir de fotografia e mantém fonte, URL da foto e crédito; não apresenta a arte final como uma nova foto documental. Sem foto, usa `/v1/images/generations` e não fabrica pessoas/eventos como se fossem reportagem.

No modo **gratuito**, a foto permanece local ao serviço e é enquadrada no template em código, sem enviá-la à OpenAI.

Sem foto adequada ou com erro/bloqueio, continua a versão ilustrada. Desativar a opção evita por completo essas consultas aos portais. Downloads aceitam somente HTTPS público, com IP validado e fixado à conexão TLS, revalidação de redirecionamentos, limites de tamanho/tempo e formatos raster. Rede privada, credenciais em URL, SVG e imagens animadas são bloqueados.

## Implementação e limites

- Prompt de direção de arte: `services/intelligence/newsletter_images.py`, `ART_DIRECTION`.
- Prompt editorial e campos estruturados: `services/intelligence/newsletter.py`, `EDITORIAL` e `ARTICLE_SCHEMA`.
- Extração opcional e protegida de fotos: `services/intelligence/source_media.py`.
- Mesmos modos IA/gratuito, fila, confirmações e preservação do texto/envios. Sem tabelas ou colunas novas: os campos editoriais ficam no JSON de artigos e a opção no JSON de configurações.
- A IA recebe assunto, contexto, tema visual, variação compositiva e o texto literal a compor (`post_copy`). Se a opção de fotos autorizadas estiver ativa, recebe também a fotografia como arquivo de referência. Credenciais de banco/portais e chave de API não entram no prompt.
- O modo IA faz uma geração em qualidade alta por arte: notícias + capa + encerramento. A confirmação informa essa quantidade e o custo na conta OpenAI. Não há reenvio/repetição automática em caso de falha. A cota de três mensagens do chat não limita o carrossel.
- Não se deve publicar a arte sem revisar a tipografia gerada. O texto exato e os links continuam preservados na legenda e na edição textual.

## Referências pesquisadas

- [Pentagram — Fashion for Good](https://www.pentagram.com/work/fashion-for-good): identidade tipográfica, paleta e regras consistentes que permitem expressão por aplicação. Inspiração de sistema, não cópia de arte.
- [Pentagram — Viren](https://www.pentagram.com/work/viren): cor expressiva e clareza na identidade de moda. Não adotar sua paleta; usar a do SindRoupas.
- [OpenAI — Image prompting](https://developers.openai.com/api/docs/guides/image-prompting): briefing com composição, restrições e separação clara entre conteúdo e estilo.
- [OWASP — SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html): validação de destinos e redirecionamentos nas consultas de mídia.
