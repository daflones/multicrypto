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

// Função para creditar saldo do usuário usando external_reference, email ou CPF
async function creditUserBalanceByReference(externalReference, amount, customerEmail, customerDocument, paymentId, gateway = 'dbxbankpay') {
  try {
    let user = null;
    
    // Estratégia 1: Tentar extrair ID da referência (formato: user_{userId}_{timestamp})
    const userIdMatch = externalReference ? externalReference.match(/^user_([^_]+)_/) : null;
    
    if (userIdMatch) {
      const userId = userIdMatch[1];
      const { data, error } = await supabase
        .from('users')
        .select('id, email, balance')
        .eq('id', userId)
        .single();
        
      if (data && !error) {
        user = data;
        console.log(`✅ Usuário encontrado via ID na referência: ${user.email}`);
      }
    }
    
    // Estratégia 2: Tentar pelo Email (se falhou a 1)
    if (!user && customerEmail) {
      console.log(`🔍 Referência não padrão. Tentando encontrar usuário pelo email: ${customerEmail}`);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, balance')
        .eq('email', customerEmail)
        .single();
        
      if (data && !error) {
        user = data;
        console.log(`✅ Usuário encontrado via Email: ${user.email}`);
      }
    }
    
    // Estratégia 3: Tentar pelo CPF (se falhou a 1 e 2)
    if (!user && customerDocument) {
      // Remove pontuação do CPF recebido e do banco se necessário (ajuste conforme seu banco)
      console.log(`🔍 Tentando encontrar usuário pelo CPF: ${customerDocument}`);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, balance')
        .eq('cpf', customerDocument)
        .single();
        
      if (data && !error) {
        user = data;
        console.log(`✅ Usuário encontrado via CPF: ${user.email}`);
      }
    }
    
    if (!user) {
      console.error('❌ Usuário não encontrado para crédito (Ref, Email ou CPF falharam).');
      return false;
    }
    
    // Verificar se já foi processado (idempotência)
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'deposit')
      .contains('data', { payment_id: paymentId })
      .limit(1);
    
    if (existingTransaction && existingTransaction.length > 0) {
      console.log('⚠️ Transação já processada anteriormente.');
      return true;
    }
    
    // Calcular novo saldo
    const currentBalance = Number(user.balance) || 0;
    const newBalance = currentBalance + Number(amount);
    
    console.log(`💰 Atualizando saldo: ${currentBalance} + ${amount} = ${newBalance}`);
    
    // Atualizar saldo do usuário
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar saldo:', updateError);
      return false;
    }
    
    console.log('✅ Saldo atualizado no banco de dados com sucesso');
    
    // Registrar transação
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount: amount,
        payment_method: 'pix',
        status: 'approved',
        data: {
          payment_id: paymentId,
          external_reference: externalReference,
          customer_email: customerEmail,
          customer_document: customerDocument,
          gateway: gateway,
          processed_at: new Date().toISOString()
        }
      });
    
    if (transactionError) {
      console.error('Erro ao registrar transação:', transactionError);
      // Não retornamos false aqui pois o saldo JÁ foi atualizado
    }
    
    return true;
    
  } catch (error) {
    console.error('Erro interno no processamento:', error);
    return false;
  }
}

// Função para creditar saldo do usuário (método antigo - manter para compatibilidade)
async function creditUserBalance(email, amount, reference, paymentId) {
  try {
    // Buscar usuário por email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, balance')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      return false;
    }
    
    // Verificar se já foi processado (idempotência)
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'deposit')
      .contains('data', { payment_id: paymentId })
      .limit(1);
    
    if (existingTransaction && existingTransaction.length > 0) {
      return true;
    }
    
    // Calcular novo saldo
    const newBalance = (user.balance || 0) + amount;
    
    // Atualizar saldo do usuário
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id);
    
    if (updateError) {
      return false;
    }
    
    // Registrar transação
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount: amount,
        payment_method: 'pix',
        status: 'approved',
        data: {
          payment_id: paymentId,
          external_reference: reference,
          gateway: 'dbxbankpay',
          processed_at: new Date().toISOString()
        }
      });
    
    if (transactionError) {
      return false;
    }
    
    return true;
    
  } catch (error) {
    return false;
  }
}

// Endpoint PayFast4 - Webhook de confirmação de pagamento
router.post('/payfast4', async (req, res) => {
  try {
    console.log('🔔 Webhook PayFast4 recebido!');
    console.log('Payload:', JSON.stringify(req.body, null, 2));

    const { event, transaction_id, external_reference, status, amount } = req.body;
    
    console.log('📦 Processando webhook PayFast4:', {
      event,
      transaction_id,
      external_reference,
      status,
      amount
    });
    
    if (status === 'approved' || status === 'aprovado') {
      console.log('💰 Pagamento PayFast4 aprovado detectado. Iniciando crédito...');
      
      // Creditar saldo do usuário automaticamente
      const success = await creditUserBalanceByReference(
        external_reference, 
        amount, 
        req.body.customer_email || null, 
        req.body.customer_document || null, 
        transaction_id,
        'payfast4'
      );
      
      if (success) {
        console.log(`✅ Saldo creditado com sucesso para referência: ${external_reference}`);
      } else {
        console.error(`❌ Falha ao creditar saldo para referência: ${external_reference}`);
      }
    } else {
      console.log('⚠️ Status não é aprovado, ignorando webhook.');
    }
    
    // Sempre responder com 200 OK rapidamente
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Erro ao processar webhook PayFast4:', error);
    res.status(200).json({ received: true, error: error.message });
  }
});

// Endpoint GET para teste PayFast4
router.get('/payfast4', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PayFast4 webhook endpoint',
    timestamp: new Date().toISOString()
  });
});

// Endpoint DBXBankPay - Formato REAL do payload
router.post('/dbxbankpay', async (req, res) => {
  try {
    console.log('🔔 Webhook DBX recebido!');
    console.log('Payload:', JSON.stringify(req.body, null, 2));

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
        console.warn('⚠️ Assinatura HMAC inválida, mas continuando para fins de debug.');
        // return res.status(401).json({ error: "Invalid signature" }); // Descomentar em produção
      } else {
        console.log('✅ Assinatura HMAC válida.');
      }
    } else {
      console.log('ℹ️ Headers de assinatura ausentes ou segredo não configurado.');
    }
    
    // Processar payload REAL do DBXBankPay
    const { event, timestamp: eventTimestamp, data } = req.body;
    
    if (!data) {
      console.error('❌ Payload inválido: campo "data" ausente.');
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

    console.log(`📦 Processando evento: ${event}, Status: ${status}, Ref: ${external_reference}, Valor: ${amount}`);
    
    // Processar eventos baseado no formato real
    if (event === 'payment.approved' && status === 'approved') {
      console.log('💰 Pagamento aprovado detectado. Iniciando crédito...');
      // Creditar saldo do usuário automaticamente
      const success = await creditUserBalanceByReference(external_reference, amount, customer_email, id);
      if (success) {
        console.log(`✅ Saldo creditado com sucesso para referência: ${external_reference}`);
      } else {
        console.error(`❌ Falha ao creditar saldo para referência: ${external_reference}`);
      }
    } else {
      console.log('⚠️ Evento ignorado (não é payment.approved ou status não é approved).');
    }
    
    // Sempre responder com 200 OK rapidamente
    res.status(200).json({ received: true });
    
  } catch (error) {
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
