-- Identifica se a folha usada na contribuição foi repetida do ano anterior.
-- Execute no Hasura em Data > SQL antes de publicar o frontend desta branch.

BEGIN;

ALTER TABLE public.contribuicoes_assistenciais
  ADD COLUMN IF NOT EXISTS folha_repetida_ano_anterior boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.contribuicoes_assistenciais.folha_repetida_ano_anterior IS
  'True quando a folha de agosto não foi informada no ano e foi repetida do registro do ano anterior.';

COMMIT;

-- Após executar:
-- 1. Hasura > Data > contribuicoes_assistenciais > Modify: confirme que a coluna está rastreada.
-- 2. Hasura > Permissions: conceda select/insert/update às mesmas roles que já
--    acessam os demais campos de contribuicoes_assistenciais.
