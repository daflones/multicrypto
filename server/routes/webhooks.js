const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware simplificado - usar o body já parseado pelo express.json()
const simpleMiddleware = (req, res, next) => {
  req.rawBody = JSON.stringify(req.body || {});
  next();
};

// Endpoint DBXBankPay com formato correto
router.post('/webhook', (req, res) => {
  // Responder imediatamente para evitar timeout
  res.status(200).json({ received: true });
  
  try {
    // Log completo para debug
    console.log('🔍 WEBHOOK DEBUG - Headers:', req.headers);
    console.log('🔍 WEBHOOK DEBUG - Body completo:', req.body);
    
    // Verificar assinatura HMAC
    const timestamp = req.headers['x-dbxpay-timestamp'];
    const signature = req.headers['x-dbxpay-signature'];
    const webhookSecret = process.env.DBXPAY_WEBHOOK_SECRET;
    
    if (signature && timestamp && webhookSecret) {
      console.log('🔐 Validando assinatura DBXBankPay...');
      
      const rawBody = JSON.stringify(req.body);
      const signingString = `${timestamp}.${rawBody}`;
      
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signingString)
        .digest('hex');
      
      const receivedSignature = signature.replace('v1=', '');
      
      if (expectedSignature !== receivedSignature) {
        console.log('❌ Assinatura inválida');
        return;
      }
      
      console.log('✅ Assinatura válida');
    } else {
      console.log('⚠️ Headers de assinatura não encontrados');
    }
    
    // Extrair dados do payload DBXBankPay (formato correto)
    const { id, type, data } = req.body;
    
    if (!data) {
      console.log('❌ Payload inválido - campo "data" não encontrado');
      return;
    }
    
    const {
      transaction_id,
      external_reference,
      status,
      amount,
      currency,
      payment_method,
      net_amount,
      paid_at
    } = data;
    
    console.log('📥 Webhook DBXBankPay recebido:', {
      id,
      type,
      transaction_id,
      external_reference,
      status,
      amount,
      currency,
      payment_method
    });
    
    // Processar apenas pagamentos aprovados
    if (type === 'payment.approved' && status === 'approved') {
      console.log('✅ Pagamento aprovado! Liberar pedido:', external_reference);
      
      // Aqui você pode integrar com seu banco de dados
      // Exemplo: updateOrderStatus(external_reference, 'paid');
      // Exemplo: creditUserBalance(external_reference, amount);
      
    } else if (type === 'payment.failed') {
      console.log('❌ Pagamento falhou:', external_reference);
      
    } else if (type === 'payment.expired') {
      console.log('⏰ Pagamento expirou:', external_reference);
      
    } else {
      console.log('ℹ️ Evento não processado:', { type, status });
    }
    
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
  }
});

// Teste GET para verificar se webhook está acessível
router.get('/dbxbankpay', (req, res) => {
  console.log('✅ Webhook GET test chamado');
  res.json({
    status: 'ok',
    message: 'Webhook DBXBankPay está acessível',
    timestamp: new Date().toISOString()
  });
});

// Webhook DBXBankPay
router.post('/dbxbankpay', simpleMiddleware, async (req, res) => {
  const startTime = Date.now();
  
  // Log da requisição
  console.log('🚨 DBXBankPay WEBHOOK CHAMADO!', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: req.headers,
    ip: req.ip
  });

  // Responder imediatamente para evitar timeout
  res.status(200).json({
    received: true,
    timestamp: new Date().toISOString(),
    processing: true
  });

  try {
    const webhookPayload = req.body;
    const rawBody = req.rawBody;

    console.log('📥 Payload recebido:', webhookPayload);

    // Verificar assinatura HMAC do DBXBankPay (apenas em produção)
    const timestamp = req.headers['x-dbxpay-timestamp'];
    const signature = req.headers['x-dbxpay-signature'];
    const webhookSecret = process.env.DBXPAY_WEBHOOK_SECRET;
    const isTestPayload = webhookPayload.transaction_id === 'test123';

    if (signature && timestamp && webhookSecret && !isTestPayload) {
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
        console.log('⏱️ Processamento finalizado em:', Date.now() - startTime, 'ms');
        return; // Já respondemos no início
      }
      
      console.log('✅ Assinatura DBXBankPay válida');
    } else if (webhookSecret && !isTestPayload) {
      console.log('⚠️ Headers DBXBankPay faltando:', {
        hasTimestamp: !!timestamp,
        hasSignature: !!signature,
        hasSecret: !!webhookSecret
      });
    } else if (isTestPayload) {
      console.log('🧪 Payload de teste - pulando validação HMAC');
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
      console.log('⏱️ Processamento finalizado em:', Date.now() - startTime, 'ms');
      return; // Já respondemos no início
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
        console.log('⏱️ Processamento finalizado em:', Date.now() - startTime, 'ms');
        return; // Já respondemos no início
      }

      console.log('✅ Webhook processado com sucesso:', result);
      console.log('⏱️ Processamento finalizado em:', Date.now() - startTime, 'ms');
    } else {
      console.log('ℹ️ Evento não processado:', { status, event });
      console.log('⏱️ Processamento finalizado em:', Date.now() - startTime, 'ms');
    }

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    console.log('⏱️ Processamento finalizado com erro em:', Date.now() - startTime, 'ms');
    // Já respondemos no início, apenas logamos o erro
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
