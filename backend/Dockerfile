# =============================================================================
# backend/Dockerfile
# Multi-stage build for the Express / Prisma backend
# =============================================================================

# ── Development stage (used by docker-compose.dev.yml) ──────────────────────
FROM node:20-alpine AS development

WORKDIR /app

# Install OS deps needed by some native addons (e.g. bcrypt, canvas)
RUN apk add --no-cache python3 make g++ openssl

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client for the current platform
RUN npx prisma generate

EXPOSE 3001 9229

# nodemon with inspect for live-reload + debugger
CMD ["npx", "nodemon", "--inspect=0.0.0.0:9229", "src/app.js"]

# ── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Only the packages needed to run OpenSSL (Prisma requires it at runtime)
RUN apk add --no-cache openssl

# Copy manifests and install production deps only
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy source
COPY . .

# Generate Prisma client (must run after node_modules exist)
RUN npx prisma generate

# Drop to a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001

CMD ["node", "src/app.js"]
