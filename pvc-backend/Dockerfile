# ── PVC Admin Backend (Node/Express) ────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# App source
COPY . .

# Runtime dirs (persisted via volumes in docker-compose)
RUN mkdir -p uploads logs backups

ENV NODE_ENV=production
EXPOSE 4000

# Run DB migrations (idempotent) then start the API.
CMD ["sh", "-c", "npm run migrate && node src/server.js"]
