# Single-stage Next.js build for development and testing
FROM node:20-alpine
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl wget libc6-compat

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install all dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]