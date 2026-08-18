FROM node:22-alpine AS builder
WORKDIR /app
ARG API_PROXY_TARGET=http://backend:5000
ENV API_PROXY_TARGET=$API_PROXY_TARGET
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci
COPY frontend frontend
RUN npm run build -w frontend && npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S web -G nodejs
COPY --from=builder --chown=web:nodejs /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=web:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=web:nodejs /app/frontend/package.json ./frontend/package.json
COPY --from=builder --chown=web:nodejs /app/frontend/next.config.mjs ./frontend/next.config.ts
COPY --from=builder --chown=web:nodejs /app/frontend/public ./frontend/public
COPY --from=builder --chown=web:nodejs /app/frontend/.next ./frontend/.next
USER web
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "frontend"]
