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

// Endpoint DBXBankPay - EXATAMENTE como na documentação
router.post('/dbxbankpay', (req, res) => {
  try {
    console.log('📥 DBXBankPay webhook recebido');
    
    // Verificar assinatura HMAC (exatamente como na documentação)
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
    }
    
    // Processar payload (formato exato da documentação)
    const { id, type, data } = req.body;
    
    console.log('Webhook payload:', {
      id,
      type,
      transaction_id: data?.transaction_id,
      external_reference: data?.external_reference,
      amount: data?.amount,
      status: data?.status
    });
    
    // Processar eventos
    if (type === 'payment.approved' && data?.status === 'approved') {
      console.log('✅ Pagamento aprovado! Liberar pedido:', data.external_reference);
      
      // Integrar com seu banco de dados aqui
      // updateOrderStatus(data.external_reference, 'paid');
      
    } else if (type === 'payment.failed') {
      console.log('❌ Pagamento falhou:', data?.external_reference);
      
    } else if (type === 'payment.expired') {
      console.log('⏰ Pagamento expirou:', data?.external_reference);
      
    } else if (type === 'payment.pending') {
      console.log('⏳ Pagamento pendente:', data?.external_reference);
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
