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

# Build the application
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install system dependencies for runtime
RUN apk add --no-cache curl wget libc6-compat

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy the static assets from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy public folder if it exists
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy and set up entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

# Health check - probe both server and static assets
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ && \
      find .next/static/chunks -name "webpack-*.js" | head -1 | xargs -I {} wget --no-verbose --tries=1 --spider "http://localhost:3000/_next/static/chunks/$(basename {})" || exit 1

# Start the application
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]