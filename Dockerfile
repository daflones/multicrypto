# Multi-stage build
FROM node:20-alpine AS builder

# Build frontend
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copiar frontend buildado
COPY --from=builder /app/dist ./dist

# Copiar e instalar backend
COPY server ./server
WORKDIR /app/server
RUN npm install --production

# Expor porta
EXPOSE 3000

# Servir frontend e backend
CMD ["node", "index.js"]
