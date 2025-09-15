FROM node:20-slim

WORKDIR /app

# Copy entrypoint script first for better Docker layer caching
COPY docker/next-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Install deps
COPY ie-professors-frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY ie-professors-frontend/ ./
RUN npm run build

# Configure Node.js for optimal logging
# This ensures all console output goes to stdout/stderr for both EB logs and CloudWatch
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--enable-source-maps"

EXPOSE 3000

# Use entrypoint script to wrap npm start with debugging info
ENTRYPOINT ["/entrypoint.sh"]

# Use standalone server for production (required when output: 'standalone' is set)
# The entrypoint will execute whatever command is passed from Dockerrun
CMD ["node", ".next/standalone/server.js"]