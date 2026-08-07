-- Tipos de vínculo e mensalidades personalizadas
-- Execute no Hasura em Data > SQL e, em seguida, rastreie as novas colunas.
-- A alteração é aditiva e mantém `associada`, `faixa_id` e os relacionamentos atuais.

BEGIN;

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS tipo_vinculo text,
  ADD COLUMN IF NOT EXISTS categoria_mantenedor text,
  ADD COLUMN IF NOT EXISTS valor_mensalidade_vinculo numeric(12,2);

-- Preserva automaticamente a classificação de quem já é associado.
-- Empresas não associadas ficam sem classificação para revisão manual, evitando
-- classificá-las incorretamente como mantenedor, parceiro ou fornecedor.
UPDATE public.empresas
SET tipo_vinculo = 'Associado'
WHERE associada IS TRUE
  AND tipo_vinculo IS NULL;

ALTER TABLE public.empresas
  DROP CONSTRAINT IF EXISTS empresas_tipo_vinculo_check,
  ADD CONSTRAINT empresas_tipo_vinculo_check
    CHECK (tipo_vinculo IS NULL OR tipo_vinculo IN ('Associado', 'Mantenedor', 'Parceiro', 'Fornecedor')),
  DROP CONSTRAINT IF EXISTS empresas_categoria_mantenedor_check,
  ADD CONSTRAINT empresas_categoria_mantenedor_check
    CHECK (categoria_mantenedor IS NULL OR categoria_mantenedor IN ('Ouro', 'Prata', 'Bronze')),
  DROP CONSTRAINT IF EXISTS empresas_valor_mensalidade_vinculo_check,
  ADD CONSTRAINT empresas_valor_mensalidade_vinculo_check
    CHECK (
      (tipo_vinculo IN ('Mantenedor', 'Parceiro') AND valor_mensalidade_vinculo > 0)
      OR (tipo_vinculo NOT IN ('Mantenedor', 'Parceiro') AND valor_mensalidade_vinculo IS NULL)
      OR tipo_vinculo IS NULL
    ),
  DROP CONSTRAINT IF EXISTS empresas_dados_mantenedor_check,
  ADD CONSTRAINT empresas_dados_mantenedor_check
    CHECK (
      (tipo_vinculo = 'Mantenedor' AND categoria_mantenedor IS NOT NULL AND valor_mensalidade_vinculo IS NOT NULL)
      OR
      (tipo_vinculo IS DISTINCT FROM 'Mantenedor' AND categoria_mantenedor IS NULL)
    ),
  DROP CONSTRAINT IF EXISTS empresas_associado_exclusivo_check,
  ADD CONSTRAINT empresas_associado_exclusivo_check
    CHECK (
      tipo_vinculo IS NULL
      OR (tipo_vinculo = 'Associado' AND associada IS TRUE)
      OR (tipo_vinculo <> 'Associado' AND associada IS FALSE)
    );

COMMENT ON COLUMN public.empresas.tipo_vinculo IS
  'Vínculo exclusivo da empresa: Associado, Mantenedor, Parceiro ou Fornecedor.';
COMMENT ON COLUMN public.empresas.categoria_mantenedor IS
  'Categoria comercial do mantenedor: Ouro, Prata ou Bronze.';
COMMENT ON COLUMN public.empresas.valor_mensalidade_vinculo IS
  'Valor mensal negociado individualmente para mantenedores e parceiros.';

CREATE INDEX IF NOT EXISTS empresas_tipo_vinculo_idx
  ON public.empresas (tipo_vinculo);

COMMIT;

-- Após executar:
-- 1. Hasura > Data > empresas > Modify: confirme que as três colunas estão rastreadas.
-- 2. Hasura > Permissions: conceda select/insert/update às mesmas roles que já
--    acessam os demais campos de empresas.
-- 3. Revise empresas não associadas e escolha manualmente seu tipo de vínculo.
