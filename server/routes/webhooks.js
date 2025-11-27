const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para verificar assinatura DBXBankPay (exatamente como na documentação)
function verifyDbxSignature(rawBody, ts, sig, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${ts}.${rawBody}`)
    .digest("hex");
  return expected === sig.replace(/^v1=/, "");
}

// Endpoint DBXBankPay - Formato REAL do payload
router.post('/dbxbankpay', (req, res) => {
  try {
    console.log('📥 DBXBankPay webhook recebido');
    console.log('🔍 Payload completo:', JSON.stringify(req.body, null, 2));
    
    // Verificar assinatura HMAC
    const rawBody = JSON.stringify(req.body);
    const timestamp = req.headers['x-dbxpay-timestamp'];
    const signature = req.headers['x-dbxpay-signature'];
    const webhookSecret = process.env.DBXPAY_WEBHOOK_SECRET;
    
    if (timestamp && signature && webhookSecret) {
      const isValid = verifyDbxSignature(
        rawBody,
        timestamp,
        signature,
        webhookSecret
      );

      if (!isValid) {
        console.log('❌ Assinatura inválida');
        return res.status(401).json({ error: "Invalid signature" });
      }
      
      console.log('✅ Assinatura válida');
    } else {
      console.log('⚠️ Headers de assinatura não encontrados (modo teste)');
    }
    
    // Processar payload REAL do DBXBankPay
    const { event, timestamp: eventTimestamp, data } = req.body;
    
    if (!data) {
      console.log('❌ Payload inválido - campo "data" não encontrado');
      return res.status(200).json({ received: true, error: 'Invalid payload' });
    }
    
    const {
      id,
      status,
      amount,
      net_amount,
      customer_name,
      customer_email,
      customer_document,
      external_reference,
      paid_at
    } = data;
    
    console.log('📊 Dados do pagamento:', {
      event,
      id,
      status,
      amount,
      net_amount,
      customer_email,
      external_reference,
      paid_at
    });
    
    // Processar eventos baseado no formato real
    if (event === 'payment.approved' && status === 'approved') {
      console.log('✅ Pagamento aprovado!');
      console.log(`💰 Valor: R$ ${amount} (líquido: R$ ${net_amount})`);
      console.log(`👤 Cliente: ${customer_name} (${customer_email})`);
      console.log(`📝 Referência: ${external_reference}`);
      console.log(`⏰ Pago em: ${paid_at}`);
      
      // Aqui você pode integrar com seu banco de dados
      // Exemplo: creditUserBalance(customer_email, net_amount, external_reference);
      
    } else if (event === 'payment.failed') {
      console.log('❌ Pagamento falhou:', external_reference);
      
    } else if (event === 'payment.expired') {
      console.log('⏰ Pagamento expirou:', external_reference);
      
    } else if (event === 'payment.pending') {
      console.log('⏳ Pagamento pendente:', external_reference);
      
    } else {
      console.log('ℹ️ Evento não processado:', { event, status });
    }
    
    // Sempre responder com 200 OK rapidamente
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(200).json({ received: true, error: error.message });
  }
});

// Endpoint GET para teste
router.get('/dbxbankpay', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DBXBankPay webhook endpoint',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
