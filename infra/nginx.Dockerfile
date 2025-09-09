# Production nginx container for reverse proxy
FROM nginx:1.25-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf.bak

# Create nginx user and set permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Use non-root user
USER nginx

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
