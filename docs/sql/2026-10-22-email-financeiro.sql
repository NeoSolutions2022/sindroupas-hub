-- Executar na fonte PostgreSQL do Hasura antes de usar o novo campo.
-- Não copia nem altera e-mails existentes. Não cria novas tabelas.
BEGIN;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS email_financeiro text;
COMMENT ON COLUMN public.empresas.email_financeiro IS
  'Destinatário preferencial dos boletos. Independente do e-mail geral da empresa.';
COMMIT;

-- Após executar: recarregar o metadata/schema no Hasura.
-- Nas permissões de empresas, liberar email_financeiro para os mesmos papéis
-- administrativos que já podem consultar, inserir e editar o e-mail geral.
-- Não liberar esta coluna para papéis públicos sem necessidade.
-- Solicitações de associação guardam esse valor em payload (jsonb) já existente.
