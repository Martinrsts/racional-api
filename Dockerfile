FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY drizzle ./drizzle
COPY tsconfig.json drizzle.config.ts ./
COPY src ./src

RUN npm run build

# --- PRODUCTION ---

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/index.js"]
