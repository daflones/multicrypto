const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware para capturar raw body
const rawBodyMiddleware = (req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBody = data;
    try {
      req.body = JSON.parse(data);
    } catch (e) {
      req.body = {};
    }
    next();
  });
};

// Webhook DBXBankPay
router.post('/dbxbankpay', rawBodyMiddleware, async (req, res) => {
  // Log da requisição
  console.log('🚨 DBXBankPay WEBHOOK CHAMADO!', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: req.headers,
    ip: req.ip
  });

  try {
    const webhookPayload = req.body;
    const rawBody = req.rawBody;

    console.log('📥 Payload recebido:', webhookPayload);

    // Verificar assinatura HMAC do DBXBankPay
    const timestamp = req.headers['x-dbxpay-timestamp'];
    const signature = req.headers['x-dbxpay-signature'];
    const webhookSecret = process.env.DBXPAY_WEBHOOK_SECRET;

    if (signature && timestamp && webhookSecret) {
      console.log('🔐 Validando assinatura DBXBankPay HMAC...');
      
      // Criar payload para verificação: timestamp + '.' + raw_body
      const payloadToVerify = `${timestamp}.${rawBody}`;
      
      // Criar HMAC SHA256
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadToVerify)
        .digest('hex');
      
      const receivedSignature = signature.replace('v1=', '');
      
      if (receivedSignature !== expectedSignature) {
        console.log('❌ Assinatura DBXBankPay inválida', {
          expected: expectedSignature.substring(0, 10) + '...',
          received: receivedSignature.substring(0, 10) + '...',
          timestamp,
          payloadLength: rawBody.length
        });
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      console.log('✅ Assinatura DBXBankPay válida');
    } else if (webhookSecret) {
      console.log('⚠️ Headers DBXBankPay faltando:', {
        hasTimestamp: !!timestamp,
        hasSignature: !!signature,
        hasSecret: !!webhookSecret
      });
    }

    // Extrair dados do payload conforme documentação
    const { event, transaction_id, external_reference, status, amount } = webhookPayload;
    
    console.log('📥 Dados do webhook:', {
      event,
      transaction_id,
      external_reference,
      status,
      amount
    });

    // Buscar email do usuário pela external_reference
    let customerEmail = '';
    let userId = '';

    if (external_reference && external_reference.startsWith('user_')) {
      userId = external_reference.split('_')[1];
      console.log('👤 Extraindo userId da referência:', userId);

      // Buscar usuário no Supabase
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (user && !userError) {
        customerEmail = user.email;
        console.log(`✅ Email encontrado para usuário ${userId}: ${customerEmail}`);
      } else {
        console.log(`⚠️ Usuário não encontrado: ${userId}`, userError);
      }
    }

    if (!customerEmail) {
      console.log('❌ Email do cliente não encontrado');
      return res.status(200).json({
        error: 'Customer email not found',
        received: true,
        processed: false
      });
    }

    // Processar apenas pagamentos aprovados
    const isApproved = status === 'approved';
    
    console.log('🔍 Verificação de aprovação DBXBankPay:', { 
      status, 
      event,
      isApproved,
      transaction_id,
      amount,
      customerEmail
    });
    
    if (isApproved) {
      // Chamar função de processamento de webhook
      const { data: result, error } = await supabase.rpc('process_payment_webhook', {
        p_event_type: 'payment.approved',
        p_payment_id: transaction_id,
        p_user_email: customerEmail,
        p_amount: amount,
        p_gateway_data: JSON.stringify(webhookPayload)
      });

      if (error) {
        console.error('❌ Erro ao processar webhook:', error);
        return res.status(200).json({
          error: 'Erro interno do servidor',
          details: error.message,
          received: true,
          processed: false
        });
      }

      console.log('✅ Webhook processado com sucesso:', result);

      // Resposta de sucesso
      return res.status(200).json({
        received: true,
        processed: true,
        message: 'Pagamento processado com sucesso',
        transaction_id: transaction_id,
        amount: amount,
        user_email: customerEmail
      });
    } else {
      console.log('ℹ️ Evento não processado:', { status, event });
      
      return res.status(200).json({
        received: true,
        processed: false,
        message: 'Evento não requer processamento',
        event_type: event,
        status: status
      });
    }

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return res.status(200).json({
      error: 'Erro interno do servidor',
      details: errorMessage,
      received: true,
      processed: false
    });
  }
});

// Endpoint de teste
router.get('/dbxbankpay', (req, res) => {
  console.log('✅ GET request - teste do DBXBankPay');
  res.json({
    status: 'ok',
    message: 'DBXBankPay Webhook funcionando',
    timestamp: new Date().toISOString(),
    service: 'CryptoYield',
    url: 'https://multicrypto.com.br'
  });
});

module.exports = router;
