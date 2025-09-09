# Production Next.js multistage build for AWS Elastic Beanstalk
# Optimized for minimal runtime image size and security

# ---- Dependencies stage ----
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production --frozen-lockfile

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Set build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install all dependencies (including dev) for build
RUN npm ci --frozen-lockfile

# Build the application with standalone output
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Install curl and wget for health checks
RUN apk add --no-cache curl wget

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application files
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build output with correct permissions
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "server.js"]