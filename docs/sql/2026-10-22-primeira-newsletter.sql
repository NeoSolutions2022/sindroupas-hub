-- Enfileira a primeira edição; não inventa conteúdo nem envia mensagens.
-- O worker usa a chave OpenAI no servidor e o destino cadastrado na configuração.
INSERT INTO sindroupas_intelligence.generation_jobs
  (id, week, status, requested_by, created_at)
VALUES (
  'primeira-newsletter-2026-10-22',
  to_char(now() AT TIME ZONE 'America/Fortaleza', 'IYYY-IW'),
  'pending', 'solicitacao-administrador',
  to_char(now() AT TIME ZONE 'America/Fortaleza', 'YYYY-MM-DD"T"HH24:MI:SS') || '-03:00'
) ON CONFLICT (week) DO NOTHING;
SELECT id, week, status, created_at FROM sindroupas_intelligence.generation_jobs
ORDER BY created_at DESC LIMIT 3;
