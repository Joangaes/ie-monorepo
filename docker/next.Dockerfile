FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY ie-professors-frontend/package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY ie-professors-frontend/ .

# Build the application (ignore ESLint errors)
RUN npm run build

# Production image
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]

