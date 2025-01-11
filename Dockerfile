# Build stage
FROM node:16.14.0-alpine AS build
LABEL stage=builder

# Build arguments
ARG BUILD_DATE
ARG NODE_VERSION=16.14.0-alpine
ARG NGINX_VERSION=1.23-alpine

# Environment variables
ENV NODE_ENV=production \
    PATH=/app/node_modules/.bin:$PATH \
    TZ=UTC

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies with security audit
RUN npm ci --production=false \
    && npm cache clean --force \
    && npm audit fix \
    && npm run security:audit || true

# Copy source code
COPY . .

# Build production bundle with optimizations
RUN npm run build:prod \
    && npm prune --production

# Production stage
FROM nginx:1.23-alpine AS production
LABEL maintainer="Contract Processing System Team" \
      version="1.0.0" \
      description="Frontend container for Contract Processing System" \
      build.date=${BUILD_DATE} \
      security.scan.date=${BUILD_DATE} \
      vendor="Contract Processing System" \
      component="frontend" \
      environment="production"

# Environment variables
ENV NGINX_WORKER_PROCESSES=auto \
    NGINX_WORKER_CONNECTIONS=1024 \
    TZ=UTC

# Install additional security packages
RUN apk add --no-cache \
    curl \
    tzdata \
    tini \
    && rm -rf /var/cache/apk/*

# Create nginx user and group with restricted permissions
RUN addgroup -g 101 -S nginx \
    && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=build --chown=nginx:nginx /app/dist/contract-processing-system /usr/share/nginx/html

# Create required directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html \
    && chmod -R 755 /var/log/nginx

# Security hardening
RUN rm -rf /usr/share/nginx/html/index.html.default \
    && rm -rf /etc/nginx/conf.d/default.conf \
    && rm -rf /docker-entrypoint.d

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl --fail http://localhost:80/health || exit 1

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Use tini as init process
ENTRYPOINT ["/sbin/tini", "--"]

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]