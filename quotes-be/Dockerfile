# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS production

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN npm prune --omit=dev

RUN addgroup -S app && \
	adduser -S app -G app && \
	chown -R root:root /app && \
	chmod -R u=rwX,go=rX /app

USER app
EXPOSE 3000

CMD ["node", "dist/main.js"]
