# Multi-stage build
FROM node:20-alpine AS builder

# Build-time variables (passadas pelo EasyPanel)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_DBXPAY_API_KEY
ARG VITE_WEBHOOK_URL
ARG VITE_PIX_KEY
ARG VITE_BEP20_KEY
ARG VITE_TRC20_KEY
ARG VITE_PUBLIC_SITE_URL

# Tornar disponíveis como ENV para o build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_DBXPAY_API_KEY=$VITE_DBXPAY_API_KEY
ENV VITE_WEBHOOK_URL=$VITE_WEBHOOK_URL
ENV VITE_PIX_KEY=$VITE_PIX_KEY
ENV VITE_BEP20_KEY=$VITE_BEP20_KEY
ENV VITE_TRC20_KEY=$VITE_TRC20_KEY
ENV VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL

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
