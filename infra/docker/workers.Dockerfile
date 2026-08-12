# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* turbo.json ./
COPY apps/workers/package.json apps/workers/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/schemas/package.json packages/schemas/package.json
RUN npm install --workspace=@seguros/workers --workspace=@seguros/database --workspace=@seguros/schemas --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build --workspace=@seguros/workers

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S worker -G nodejs

COPY --from=build /repo/apps/workers/dist ./dist
COPY --from=build /repo/apps/workers/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules

USER worker
CMD ["node", "dist/index.js"]
