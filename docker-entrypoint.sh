#!/bin/sh
set -eu

cat > /usr/share/nginx/html/env.js <<EOC
window.__ENV__ = {
  VITE_AUTH_URL: "${VITE_AUTH_URL:-}",
  VITE_HASURA_URL: "${VITE_HASURA_URL:-}",
  VITE_HASURA_ADMIN_SECRET: "${VITE_HASURA_ADMIN_SECRET:-}",
  AUTH_URL: "${AUTH_URL:-}",
  HASURA_URL: "${HASURA_URL:-}",
  HASURA_ADMIN_SECRET: "${HASURA_ADMIN_SECRET:-}"
};
EOC

exec nginx -g 'daemon off;'
