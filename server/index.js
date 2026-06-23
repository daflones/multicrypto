const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Backend usa porta 3001

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Suporte para dados urlencoded

// Middleware de Log Global - "O Espião"
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] Recebido: ${req.method} ${req.originalUrl}`);
  // Se for POST, tenta mostrar o body (se já tiver sido parseado) ou avisa
  if (req.method === 'POST') {
    console.log('📦 Body inicial:', JSON.stringify(req.body).substring(0, 200) + '...');
  }
  next();
});

// Servir arquivos estáticos do React com tipos MIME corretos
app.use(express.static(path.join(__dirname, '../dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    } else if (filePath.endsWith('.webmanifest')) {
      res.setHeader('Content-Type', 'application/manifest+json; charset=UTF-8');
    }
  }
}));

// Routes
const webhooksRouter = require('./routes/webhooks');
app.use('/api/webhooks', webhooksRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CryptoYield API'
  });
});

// Servir React app para todas as outras rotas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`💳 Rota de Webhook ativa em: /api/webhooks/dbxbankpay`);
  console.log(`✅ Health check disponível em: /api/health`);
});
