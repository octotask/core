# Multi-stage Dockerfile for OctoTask Core packages

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY hyperdeploy/package*.json ./hyperdeploy/
COPY cdn/package*.json ./cdn/
COPY resolver/package*.json ./resolver/
COPY registry-sync/package*.json ./registry-sync/

# Install dependencies
RUN npm ci --prefer-offline --no-audit && \
    cd hyperdeploy && npm ci --prefer-offline --no-audit && cd .. && \
    cd cdn && npm ci --prefer-offline --no-audit && cd .. && \
    cd resolver && npm ci --prefer-offline --no-audit && cd .. && \
    cd registry-sync && npm ci --prefer-offline --no-audit && cd ..

# Copy source files
COPY . .

# Build packages
RUN cd hyperdeploy && npm run build && cd .. && \
    cd cdn && npm run build 2>/dev/null || true && cd .. && \
    cd resolver && npm run build 2>/dev/null || true && cd .. && \
    cd registry-sync && npm run build 2>/dev/null || true && cd ..

# Stage 2: Runtime - Registry Sync
FROM node:20-alpine AS registry-sync

WORKDIR /app

COPY --from=builder /app/registry-sync /app

# Install only production dependencies
RUN npm ci --only=production --prefer-offline --no-audit

EXPOSE 6379
ENV REDIS_URL=redis://redis:6379

ENTRYPOINT ["npm", "start"]
CMD ["registry-sync"]

# Stage 3: Runtime - Hyperdeploy
FROM node:20-alpine AS hyperdeploy

WORKDIR /app

COPY --from=builder /app/hyperdeploy /app

ENV NODE_ENV=production

EXPOSE 8080

ENTRYPOINT ["node"]
CMD ["dist/hyperdeploy.js"]

# Stage 4: Development
FROM node:20-alpine AS development

WORKDIR /app

COPY . .

# Install all dependencies
RUN npm ci --prefer-offline && \
    cd hyperdeploy && npm ci --prefer-offline && cd .. && \
    cd cdn && npm ci --prefer-offline && cd .. && \
    cd resolver && npm ci --prefer-offline && cd .. && \
    cd registry-sync && npm ci --prefer-offline && cd ..

EXPOSE 3000 8080

CMD ["npm", "run", "dev"]
