-- Banco PostgreSQL da fonte default do Hasura. Não altera tabelas empresariais existentes.
-- Apenas cria as estruturas do Radar Moda e do agente; não concede permissões públicas.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE SCHEMA IF NOT EXISTS sindroupas_intelligence;
CREATE TABLE IF NOT EXISTS sindroupas_intelligence.settings (
  id integer PRIMARY KEY CHECK(id=1), value text NOT NULL
);
CREATE TABLE IF NOT EXISTS sindroupas_intelligence.requests (
  id text PRIMARY KEY, user_id text NOT NULL, day text NOT NULL, message text NOT NULL,
  status text NOT NULL, result text, created_at text NOT NULL
);
CREATE INDEX IF NOT EXISTS requests_quota ON sindroupas_intelligence.requests(user_id, day);
CREATE TABLE IF NOT EXISTS sindroupas_intelligence.proposals (
  id text PRIMARY KEY, request_id text NOT NULL REFERENCES sindroupas_intelligence.requests(id),
  user_id text NOT NULL, status text NOT NULL, payload text NOT NULL, result text, created_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS sindroupas_intelligence.newsletters (
  id text PRIMARY KEY, week text UNIQUE NOT NULL, status text NOT NULL,
  period_start text NOT NULL, period_end text NOT NULL, content text, articles text,
  error text, created_at text NOT NULL, completed_at text, media text, reading text,
  images_enabled boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS sindroupas_intelligence.deliveries (
  id text PRIMARY KEY, newsletter_id text NOT NULL REFERENCES sindroupas_intelligence.newsletters(id),
  number text NOT NULL, status text NOT NULL, error text, created_at text NOT NULL,
  UNIQUE(newsletter_id, number)
);
CREATE TABLE IF NOT EXISTS sindroupas_intelligence.image_assets (
  id text PRIMARY KEY, newsletter_id text NOT NULL REFERENCES sindroupas_intelligence.newsletters(id),
  position integer NOT NULL, content bytea NOT NULL, content_type text NOT NULL DEFAULT 'image/png',
  caption text NOT NULL, created_at text NOT NULL, UNIQUE(newsletter_id, position)
);
CREATE TABLE IF NOT EXISTS sindroupas_intelligence.generation_jobs (
  id text PRIMARY KEY, week text UNIQUE NOT NULL, status text NOT NULL DEFAULT 'pending',
  requested_by text NOT NULL, newsletter_id text, error text, created_at text NOT NULL,
  completed_at text
);
INSERT INTO sindroupas_intelligence.settings(id, value) VALUES (1,
  '{"enabled":false,"time":"09:00","number":"","destination_type":"number","cta_label":"Fale com o SindRoupas","cta_url":"","notes":"","source_links":[],"photo_url":"","photo_urls":[],"photo_caption":"","images_enabled":false}'
) ON CONFLICT (id) DO NOTHING;
COMMENT ON SCHEMA sindroupas_intelligence IS 'Radar Moda, histórico e controles do agente. Acesso pelo serviço autenticado; sem permissões públicas.';
COMMIT;

SELECT table_schema, table_name FROM information_schema.tables
WHERE table_schema='sindroupas_intelligence' ORDER BY table_name;
