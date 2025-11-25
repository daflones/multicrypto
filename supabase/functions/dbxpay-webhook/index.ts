import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-dbxpay-timestamp, x-dbxpay-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface DBXWebhookPayload {
  // Formato real do DBXPay
  id?: string;
  type?: string;
  data?: {
    transaction_id?: string;
    external_reference?: string;
    amount?: number;
    currency?: string;
    payment_method?: string;
    net_amount?: number;
    status?: string;
    paid_at?: string;
  };
  
  // Campos alternativos (formato antigo)
  event?: string;
  transaction_id?: string;
  external_reference?: string;
  status?: string;
  amount?: number;
  customer_email?: string;
  payment_id?: string;
  reference?: string;
  value?: number;
  email?: string;
}

serve(async (req) => {
  // Log SEMPRE - para debug
  console.log('🚨 WEBHOOK CHAMADO!', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log da requisição para debug
    console.log('📥 Webhook recebido:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    })

    // Aceitar GET para teste do DBXPay
    if (req.method === 'GET') {
      console.log('✅ Teste GET do DBXPay')
      return new Response(
        JSON.stringify({ 
          status: 'ok',
          message: 'DBXPay Webhook funcionando',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }


    // Aceitar GET e POST para teste
    if (req.method === 'GET') {
      console.log('✅ GET request - teste do DBXPay')
      return new Response(
        JSON.stringify({ 
          status: 'ok',
          message: 'DBXPay Webhook funcionando',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method !== 'POST') {
      console.log('❌ Method not allowed:', req.method)
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse do payload primeiro para validar HMAC
    const rawBody = await req.text()
    const webhookPayload: DBXWebhookPayload = JSON.parse(rawBody)

    // Verificar assinatura HMAC do DBXPay
    const timestamp = req.headers.get('x-dbxpay-timestamp')
    const signature = req.headers.get('x-dbxpay-signature')
    const webhookSecret = Deno.env.get('VITE_DBXPAY_WEBHOOK_SECRET')
    
    if (signature && timestamp && webhookSecret) {
      console.log('🔐 Validando assinatura DBXPay HMAC...')
      
      // Criar payload para verificação: timestamp + '.' + raw_body
      const payloadToVerify = `${timestamp}.${rawBody}`
      
      // Criar HMAC SHA256
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      
      const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadToVerify))
      const expectedHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      const receivedSignature = signature.replace('v1=', '')
      
      if (receivedSignature !== expectedHex) {
        console.log('❌ Assinatura DBXPay inválida', {
          expected: expectedHex,
          received: receivedSignature,
          timestamp,
          payloadLength: rawBody.length
        })
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      console.log('✅ Assinatura DBXPay válida')
    } else if (webhookSecret) {
      console.log('⚠️ Headers DBXPay faltando:', {
        hasTimestamp: !!timestamp,
        hasSignature: !!signature,
        hasSecret: !!webhookSecret
      })
    }
    
    console.log('🔔 Webhook DBXPay recebido:', webhookPayload)

    // Normalizar campos (aceitar diferentes formatos)
    // Formato novo: dados dentro de 'data'
    const paymentData = webhookPayload.data || webhookPayload
    
    const transactionId = paymentData.transaction_id || webhookPayload.transaction_id || webhookPayload.id
    const externalReference = paymentData.external_reference || webhookPayload.external_reference || webhookPayload.reference
    const rawAmount = paymentData.amount || webhookPayload.amount || webhookPayload.value
    // Converter de centavos para reais se necessário (DBXPay envia em centavos)
    const amount = rawAmount && rawAmount > 1000 ? rawAmount / 100 : rawAmount
    const status = paymentData.status || webhookPayload.status
    const eventType = webhookPayload.type || webhookPayload.event
    
    console.log('📊 Dados normalizados:', {
      transactionId,
      externalReference, 
      amount,
      status,
      eventType
    })

    // Validar campos obrigatórios
    if (!transactionId || !amount) {
      console.log('⚠️ Campos obrigatórios faltando:', { transactionId, amount })
      return new Response(
        JSON.stringify({ 
          error: 'Campos obrigatórios faltando (transaction_id, amount)',
          received: true,
          processed: false
        }),
        { 
          status: 200, // Retornar 200 para não reenviar
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extrair email do external_reference se não fornecido
    // Formato: user_{user_id}_{timestamp}
    let finalCustomerEmail = webhookPayload.customer_email || webhookPayload.email
    let userId = null
    
    if (!finalCustomerEmail && externalReference && externalReference.startsWith('user_')) {
      // Buscar email pelo user_id no external_reference
      userId = externalReference.split('_')[1]
      
      // Criar cliente Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      if (user && !userError) {
        finalCustomerEmail = user.email
        console.log(`✅ Email encontrado para usuário ${userId}: ${finalCustomerEmail}`)
      } else {
        console.log(`⚠️ Usuário não encontrado: ${userId}`, userError)
      }
    }

    if (!finalCustomerEmail) {
      console.log('❌ Email do cliente não encontrado', { 
        externalReference, 
        userId,
        webhookEmail: webhookPayload.customer_email || webhookPayload.email 
      })
      
      return new Response(
        JSON.stringify({ 
          error: 'Email do cliente não encontrado',
          received: true,
          processed: false
        }),
        { 
          status: 200, // Retornar 200 para não reenviar
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Processar apenas pagamentos aprovados (formato DBXPay)
    const isApproved = status === 'approved'
    const isPaymentApprovedEvent = eventType === 'payment.approved'
    
    console.log('🔍 Verificação de aprovação DBXPay:', { 
      status, 
      eventType, 
      isApproved, 
      isPaymentApprovedEvent,
      transactionId,
      amount 
    })
    
    if (isApproved && isPaymentApprovedEvent) {
      // Criar cliente Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Chamar função de processamento de webhook
      const { data, error } = await supabase.rpc('process_payment_webhook', {
        p_event_type: 'payment.approved',
        p_payment_id: transactionId,
        p_user_email: finalCustomerEmail,
        p_amount: amount,
        p_gateway_data: JSON.stringify(webhookPayload)
      })

      if (error) {
        console.error('❌ Erro ao processar webhook:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Erro interno ao processar pagamento',
            details: error.message,
            received: false 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('✅ Webhook processado com sucesso:', data)
      
      return new Response(
        JSON.stringify({ 
          received: true,
          processed: true,
          message: 'Pagamento processado com sucesso',
          transaction_id: transactionId,
          amount: amount,
          user_email: finalCustomerEmail
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      // Status não é 'approved', apenas logar
      console.log(`ℹ️ Webhook recebido mas não processado. Status: ${status}`)
      
      return new Response(
        JSON.stringify({ 
          received: true,
          processed: false,
          message: `Status ${status} não requer processamento`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ Erro no webhook DBXPay:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: errorMessage,
        received: true,
        processed: false
      }),
      { 
        status: 200, // Retornar 200 para evitar reenvios
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

