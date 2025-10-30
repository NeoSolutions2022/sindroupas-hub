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

# Expose the default HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
