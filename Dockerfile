# ===== Builder stage =====
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build frontend (Vite) + backend (esbuild)
RUN npm run build

# ===== Runner stage =====
FROM node:22-alpine AS runner
WORKDIR /app

# Runtime tools for admin dashboard
RUN apk add --no-cache curl

# Copy production deps
COPY package.json package-lock.json ./
RUN npm ci --production --ignore-scripts

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Non-root user
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/server.cjs"]
