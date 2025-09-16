# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Copy package files and install all dependencies (including devDependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

ARG NEXT_PUBLIC_PROFESSORS_API_SERVICE
ENV NEXT_PUBLIC_PROFESSORS_API_SERVICE=$NEXT_PUBLIC_PROFESSORS_API_SERVICE

# Build the application
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Minimal runtime deps
RUN apk add --no-cache curl wget libc6-compat

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000
# Cap V8 heap to avoid OOM on small instances (tune if needed)
ENV NODE_OPTIONS=--max-old-space-size=384

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# --- Copy artifacts from builder ---
# 1) Place standalone server at /app/server.js (+ node_modules subset)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 2) ALSO include the entire .next for any paths Next 15 expects
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# 3) Public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Entry script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NEXT_PUBLIC_PROFESSORS_API_SERVICE=/api
ENV PROFESSORS_API_SERVICE=http://django:8000

USER nextjs
EXPOSE 3000

# Healthcheck: keep it simple to avoid false negatives
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]