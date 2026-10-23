# Radar Moda — direção visual

> A direção atual dos **cards** está em [Editorial Pop Ceará](radar-moda-direcao-editorial-pop.md), com a paleta enviada pelo sindicato, chamadas contextualizadas e fotos opcionais das matérias. Este documento registra o modelo inicial da **tela**, que não foi redesenhada nesta alteração.

Modelo criado com a ferramenta integrada ImageGen e reproduzido em React, sem usar uma imagem estática como interface. Arquivos de referência no diretório `outputs` do workspace: `radar-moda-modelo-ui.png`, `radar-moda-ui-desktop.png` e `radar-moda-ui-mobile.png`.

## Prompt do modelo de tela (ImageGen, ui-mockup)

Create one polished high-fidelity desktop web app screenshot for the SindRoupas newsletter page “Radar Moda”. Premium calm SaaS editorial interface, warm off-white, forest green and sage, rounded cards, thin borders, whitespace and strong typography. Preserve the existing sidebar and navigation. Header: small “INTELIGÊNCIA DE MERCADO”, title “Radar Moda”, subtitle “Uma nova perspectiva sobre o setor.”, outlined “Configurações” button. Short forest banner: “O que move a moda, em uma só leitura.”, generation button and subtle textile illustration. Editorial workspace: featured portrait carousel on the left, prominent center slide with partial neighboring cards, arrows, pagination, download; numbered short headlines and source names on the right. Separate sharing panel and compact edition archive. Large headlines, illustrative visuals, almost no body copy on cards. Settings collapsed. Responsive, clear controls, no clutter, no glassmorphism or oversized metrics.

## Prompt da base ilustrativa (ImageGen, illustration-story)

Elegant editorial still-life collage for a fashion-industry newsletter: sculptural folded sage and forest fabrics, ivory linen, terracotta spool of sewing thread, sewing-machine detail, paper pattern shapes and an abstract Ceará sun motif. Premium magazine art direction, tactile paper-cut and semi-realistic objects, textile textures, daylight shadows. Palette forest #183e35, ivory #f4f0e7, sage #b9c5a2, terracotta #c5784d. Clear hierarchy, generous open space for typography rendered in code. No text, logo, watermark, invented news or people. Center-right objects suitable for cropping. Saved project asset: `public/images/radar-editorial.png`.

## Geração na plataforma

O prompt dinâmico usado na API está em `services/intelligence/newsletter_images.py`, constante `ART_DIRECTION`. Recebe o contexto de cada notícia como dado, cria apenas a ilustração e deixa títulos, identificação e fontes para o código. As notícias continuam no modelo de texto configurado; as imagens usam um modelo de imagem separado. A opção gratuita é determinística e não faz chamadas de geração de imagens.

As manchetes de demonstração nos testes e nas capturas são fictícias: não constituem uma edição publicada. As ilustrações por IA não são fotografias documentais dos acontecimentos.
