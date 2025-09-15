FROM node:20-slim

WORKDIR /app

# Install deps
COPY ie-professors-frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY ie-professors-frontend/ ./
RUN npm run build

# Runtime port
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start Next (expected by Dockerrun command ["npm","start"])
CMD ["npm","start"]