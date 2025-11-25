-- =====================================================
-- SISTEMA DE WEBHOOK PARA GATEWAY DE PAGAMENTO
-- =====================================================

-- 1. Criar tabela para logs de webhook
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  payment_id VARCHAR(100),
  user_id UUID REFERENCES public.users(id),
  amount DECIMAL(10,2),
  status VARCHAR(20) NOT NULL, -- 'received', 'processed', 'failed'
  gateway_data JSONB NOT NULL, -- Dados completos da gateway
  signature VARCHAR(255), -- Assinatura HMAC para validação
  processed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON public.webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON public.webhook_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at);

-- 3. Função para processar webhook de pagamento
CREATE OR REPLACE FUNCTION process_payment_webhook(
  p_event_type VARCHAR(50),
  p_payment_id VARCHAR(100),
  p_user_email VARCHAR(255),
  p_amount DECIMAL(10,2),
  p_gateway_data JSONB,
  p_signature VARCHAR(255) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_record RECORD;
  v_webhook_log_id UUID;
  v_transaction_id UUID;
  v_result JSONB;
BEGIN
  -- Validar parâmetros obrigatórios
  IF p_event_type IS NULL OR p_payment_id IS NULL OR p_user_email IS NULL OR p_amount IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Parâmetros obrigatórios faltando',
      'code', 'MISSING_PARAMS'
    );
  END IF;

  -- Buscar usuário pelo email
  SELECT id, email, balance INTO v_user_record
  FROM users 
  WHERE email = p_user_email;

  IF NOT FOUND THEN
    -- Log do webhook mesmo se usuário não encontrado
    INSERT INTO webhook_logs (
      event_type, payment_id, amount, status, gateway_data, signature, error_message
    ) VALUES (
      p_event_type, p_payment_id, p_amount, 'failed', p_gateway_data, p_signature,
      'Usuário não encontrado: ' || p_user_email
    ) RETURNING id INTO v_webhook_log_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado',
      'code', 'USER_NOT_FOUND',
      'webhook_log_id', v_webhook_log_id
    );
  END IF;

  v_user_id := v_user_record.id;

  -- Verificar se o pagamento já foi processado
  IF EXISTS (
    SELECT 1 FROM webhook_logs 
    WHERE payment_id = p_payment_id 
    AND status = 'processed'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pagamento já processado',
      'code', 'ALREADY_PROCESSED'
    );
  END IF;

  -- Criar log inicial do webhook
  INSERT INTO webhook_logs (
    event_type, payment_id, user_id, amount, status, gateway_data, signature
  ) VALUES (
    p_event_type, p_payment_id, v_user_id, p_amount, 'received', p_gateway_data, p_signature
  ) RETURNING id INTO v_webhook_log_id;

  -- Processar apenas eventos de pagamento aprovado
  IF p_event_type IN ('payment.approved', 'payment_approved', 'payment.completed') THEN
    BEGIN
      -- Atualizar saldo do usuário
      UPDATE users 
      SET balance = balance + p_amount 
      WHERE id = v_user_id;

      -- Criar transação de depósito
      INSERT INTO transactions (
        user_id,
        type,
        amount,
        payment_method,
        status,
        data
      ) VALUES (
        v_user_id,
        'deposit',
        p_amount,
        'gateway', -- Método de pagamento via gateway
        'approved',
        jsonb_build_object(
          'payment_id', p_payment_id,
          'webhook_log_id', v_webhook_log_id,
          'gateway_data', p_gateway_data,
          'processed_via', 'webhook'
        )
      ) RETURNING id INTO v_transaction_id;

      -- Atualizar log como processado
      UPDATE webhook_logs 
      SET 
        status = 'processed',
        processed_at = NOW()
      WHERE id = v_webhook_log_id;

      -- Criar notificação para o usuário
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        v_user_id,
        'deposit_approved',
        'Recarga Aprovada! 💰',
        'Sua recarga de ' || p_amount::TEXT || ' foi aprovada e creditada em sua conta.',
        jsonb_build_object(
          'amount', p_amount,
          'payment_id', p_payment_id,
          'transaction_id', v_transaction_id
        )
      );

      v_result := jsonb_build_object(
        'success', true,
        'message', 'Pagamento processado com sucesso',
        'user_id', v_user_id,
        'amount', p_amount,
        'new_balance', v_user_record.balance + p_amount,
        'transaction_id', v_transaction_id,
        'webhook_log_id', v_webhook_log_id
      );

      RAISE NOTICE 'Webhook processado: User %, Amount %, Payment ID %', v_user_id, p_amount, p_payment_id;

    EXCEPTION WHEN OTHERS THEN
      -- Em caso de erro, atualizar log
      UPDATE webhook_logs 
      SET 
        status = 'failed',
        error_message = SQLERRM,
        processed_at = NOW()
      WHERE id = v_webhook_log_id;

      v_result := jsonb_build_object(
        'success', false,
        'error', 'Erro ao processar pagamento: ' || SQLERRM,
        'code', 'PROCESSING_ERROR',
        'webhook_log_id', v_webhook_log_id
      );
    END;
  ELSE
    -- Evento não é de pagamento aprovado
    UPDATE webhook_logs 
    SET 
      status = 'processed',
      processed_at = NOW(),
      error_message = 'Evento ignorado: ' || p_event_type
    WHERE id = v_webhook_log_id;

    v_result := jsonb_build_object(
      'success', true,
      'message', 'Evento recebido mas não processado',
      'event_type', p_event_type,
      'webhook_log_id', v_webhook_log_id
    );
  END IF;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Log de erro geral
  INSERT INTO webhook_logs (
    event_type, payment_id, user_id, amount, status, gateway_data, signature, error_message
  ) VALUES (
    p_event_type, p_payment_id, v_user_id, p_amount, 'failed', p_gateway_data, p_signature, SQLERRM
  );

  RETURN jsonb_build_object(
    'success', false,
    'error', 'Erro interno: ' || SQLERRM,
    'code', 'INTERNAL_ERROR'
  );
END;
$$;

-- 4. Função para validar assinatura HMAC (opcional, para segurança)
CREATE OR REPLACE FUNCTION validate_webhook_signature(
  p_payload TEXT,
  p_signature VARCHAR(255),
  p_secret VARCHAR(255)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_expected_signature VARCHAR(255);
BEGIN
  -- Calcular HMAC SHA256
  v_expected_signature := encode(
    hmac(p_payload::bytea, p_secret::bytea, 'sha256'),
    'hex'
  );
  
  -- Comparar assinaturas
  RETURN v_expected_signature = p_signature;
END;
$$;

-- 5. Função para reprocessar webhooks falhados
CREATE OR REPLACE FUNCTION retry_failed_webhooks()
RETURNS TABLE(
  webhook_log_id UUID,
  payment_id VARCHAR(100),
  result JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_webhook RECORD;
  v_result JSONB;
BEGIN
  -- Buscar webhooks falhados com menos de 3 tentativas
  FOR v_webhook IN 
    SELECT * FROM webhook_logs 
    WHERE status = 'failed' 
    AND retry_count < 3
    AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at DESC
  LOOP
    -- Incrementar contador de retry
    UPDATE webhook_logs 
    SET retry_count = retry_count + 1
    WHERE id = v_webhook.id;

    -- Tentar reprocessar
    SELECT process_payment_webhook(
      v_webhook.event_type,
      v_webhook.payment_id,
      (SELECT email FROM users WHERE id = v_webhook.user_id),
      v_webhook.amount,
      v_webhook.gateway_data,
      v_webhook.signature
    ) INTO v_result;

    -- Retornar resultado
    webhook_log_id := v_webhook.id;
    payment_id := v_webhook.payment_id;
    result := v_result;
    
    RETURN NEXT;
  END LOOP;
END;
$$;

-- 6. Criar view para monitoramento de webhooks
CREATE OR REPLACE VIEW webhook_stats AS
SELECT 
  DATE(created_at) as date,
  event_type,
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM webhook_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type, status
ORDER BY date DESC, event_type, status;

-- 7. Comentários e documentação
COMMENT ON TABLE webhook_logs IS 'Log de todos os webhooks recebidos da gateway de pagamento';
COMMENT ON FUNCTION process_payment_webhook IS 'Processa webhooks de pagamento e atualiza saldo do usuário';
COMMENT ON FUNCTION validate_webhook_signature IS 'Valida assinatura HMAC do webhook para segurança';
COMMENT ON FUNCTION retry_failed_webhooks IS 'Reprocessa webhooks que falharam';

-- =====================================================
-- EXEMPLO DE USO:
-- =====================================================
/*
-- Processar um webhook de pagamento aprovado:
SELECT process_payment_webhook(
  'payment.approved',
  'PAY_123456789',
  'usuario@email.com',
  100.00,
  '{"gateway": "mercadopago", "transaction_id": "123456"}'::jsonb,
  'abc123signature'
);

-- Ver estatísticas de webhooks:
SELECT * FROM webhook_stats WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- Reprocessar webhooks falhados:
SELECT * FROM retry_failed_webhooks();
*/
