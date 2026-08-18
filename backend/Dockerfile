FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci
COPY backend backend
RUN npm run build -w backend && npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S api -G nodejs
COPY --from=builder --chown=api:nodejs /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=api:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=api:nodejs /app/backend/package.json ./backend/package.json
COPY --from=builder --chown=api:nodejs /app/backend/dist ./backend/dist
USER api
EXPOSE 5000
CMD ["node", "backend/dist/server.js"]
