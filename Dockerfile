FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-openpyxl postgresql-client ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY --from=build /app/dist ./dist
COPY server ./server
COPY database ./database
COPY lib ./lib
COPY scripts ./scripts
COPY integrations ./integrations
ENV NODE_ENV=production APP_HOST=0.0.0.0 APP_PORT=3000
USER node
EXPOSE 3000
CMD ["node","--experimental-strip-types","server/index.mjs"]
