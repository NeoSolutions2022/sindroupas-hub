#!/bin/sh
set -eu

cat > /usr/share/nginx/html/env.js <<EOC
window.__ENV__ = {
  VITE_AUTH_URL: "${VITE_AUTH_URL:-}",
  VITE_HASURA_URL: "${VITE_HASURA_URL:-}",
  VITE_HASURA_ADMIN_SECRET: "${VITE_HASURA_ADMIN_SECRET:-}",
  VITE_BOLETOS_API_URL: "${VITE_BOLETOS_API_URL:-}",
  AUTH_URL: "${AUTH_URL:-}",
  HASURA_URL: "${HASURA_URL:-}",
  HASURA_ADMIN_SECRET: "${HASURA_ADMIN_SECRET:-}",
  BOLETOS_API_URL: "${BOLETOS_API_URL:-}"
};
EOC

exec nginx -g 'daemon off;'
