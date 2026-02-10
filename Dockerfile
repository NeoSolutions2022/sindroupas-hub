# syntax=docker/dockerfile:1

# Build stage: install dependencies and generate the production bundle
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies based on the lockfile
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code and build the application
COPY . .
RUN npm run build

# Runtime stage: serve the static assets with nginx
FROM nginx:1.27-alpine AS runner

# Copy the built assets from the previous stage
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

# Expose the default HTTP port
EXPOSE 80

COPY docker-entrypoint.sh /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
