/**
 * Serviço de integração com DBXBankPay
 * Documentação: https://dbxbankpay.com/docs
 */

export interface DBXPaymentRequest {
  amount: number;
  description: string;
  customer_email: string;
  customer_name: string;
  customer_document: string;
  customer_phone: string;
  webhook_url?: string;
  external_id?: string;
}

export interface DBXPaymentResponse {
  id: string; // transaction_id
  status: 'aguardando' | 'aprovado' | 'cancelado' | 'expirado';
  amount: number;
  qr_code: string; // PIX Copia e Cola (string)
  qr_code_base64: string; // Base64 da imagem QR Code
  pix_code: string; // PIX Copia e Cola (mesmo que qr_code)
  created_at: string;
  expires_at: string;
}

export interface DBXWebhookPayload {
  event: string;
  transaction_id: string;
  external_reference: string;
  status: 'approved' | 'cancelled' | 'expired';
  amount: number;
  customer_email?: string;
  payment_id?: string;
}

class DBXPayService {
  private readonly baseURL = 'https://dbxbankpay.com/api/v1';
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor() {
    // Essas variáveis devem ser configuradas no ambiente
    this.apiKey = import.meta.env.VITE_DBXPAY_API_KEY || '';
    this.webhookSecret = import.meta.env.VITE_DBXPAY_WEBHOOK_SECRET || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ DBXPay API Key não configurada');
    }
  }

  /**
   * Criar um novo pagamento PIX
   */
  async createPayment(paymentData: DBXPaymentRequest): Promise<DBXPaymentResponse> {
    try {
      console.log('🏦 Criando pagamento DBXPay:', paymentData);

      const response = await fetch(`${this.baseURL}/deposits/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...paymentData,
          webhook_url: paymentData.webhook_url || this.getWebhookUrl(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DBXPay API Error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result: DBXPaymentResponse = await response.json();
      console.log('✅ Pagamento DBXPay criado:', result.id);
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao criar pagamento DBXPay:', error);
      throw new Error(`Erro ao criar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Consultar status de um pagamento
   */
  async getPayment(paymentId: string): Promise<DBXPaymentResponse> {
    try {
      const response = await fetch(`${this.baseURL}/deposits/${paymentId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DBXPay API Error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao consultar pagamento DBXPay:', error);
      throw new Error(`Erro ao consultar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Cancelar um pagamento
   */
  async cancelPayment(paymentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/deposits/${paymentId}/cancel`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DBXPay API Error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      console.log('✅ Pagamento cancelado:', paymentId);
    } catch (error) {
      console.error('❌ Erro ao cancelar pagamento DBXPay:', error);
      throw new Error(`Erro ao cancelar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Validar assinatura do webhook
   */
  validateWebhookSignature(_payload: string, signature: string): boolean {
    try {
      // Implementar validação HMAC SHA256
      // A implementação exata depende de como o DBXPay envia a assinatura
      
      // Por enquanto, retorna true se tiver assinatura
      // TODO: Implementar validação real quando tiver a documentação completa
      return !!(signature && signature.length > 0);
    } catch (error) {
      console.error('❌ Erro ao validar assinatura webhook:', error);
      return false;
    }
  }

  /**
   * Processar webhook recebido
   */
  async processWebhook(webhookPayload: DBXWebhookPayload): Promise<boolean> {
    try {
      console.log('🔔 Processando webhook DBXPay:', webhookPayload.event, webhookPayload.transaction_id);

      // Processar apenas pagamentos aprovados
      if (webhookPayload.status === 'approved') {
        console.log('💰 Pagamento aprovado via webhook:', {
          transactionId: webhookPayload.transaction_id,
          externalReference: webhookPayload.external_reference,
          amount: webhookPayload.amount,
          customerEmail: webhookPayload.customer_email,
        });

        // TODO: Integrar com a função process_payment_webhook do Supabase
        // Exemplo de como chamar:
        /*
        await supabase.rpc('process_payment_webhook', {
          p_event_type: 'payment.approved',
          p_payment_id: webhookPayload.transaction_id,
          p_user_email: webhookPayload.customer_email,
          p_amount: webhookPayload.amount,
          p_gateway_data: webhookPayload
        });
        */
        
        return true;
      }

      console.log('ℹ️ Webhook recebido mas não processado:', webhookPayload.status);
      return true;
    } catch (error) {
      console.error('❌ Erro ao processar webhook DBXPay:', error);
      return false;
    }
  }

  /**
   * Obter URL do webhook configurada
   */
  private getWebhookUrl(): string {
    // URL do seu webhook endpoint
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${baseUrl}/api/webhooks/dbxpay`;
  }

  /**
   * Formatar valor para a API (centavos para reais)
   */
  static formatAmount(amountInCents: number): number {
    return amountInCents / 100;
  }

  /**
   * Formatar CPF/CNPJ removendo caracteres especiais
   */
  static formatDocument(document: string): string {
    return document.replace(/[^\d]/g, '');
  }

  /**
   * Formatar telefone removendo caracteres especiais
   */
  static formatPhone(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }

  /**
   * Verificar se a API está configurada
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Obter informações de configuração (para debug)
   */
  getConfig() {
    return {
      hasApiKey: !!this.apiKey,
      hasWebhookSecret: !!this.webhookSecret,
      baseURL: this.baseURL,
      webhookUrl: this.getWebhookUrl(),
    };
  }
}

// Instância singleton
export const dbxPayService = new DBXPayService();

// Exportar classe para testes
export { DBXPayService };

// Tipos auxiliares
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'expired';
export type WebhookEvent = 'payment.paid' | 'payment.cancelled' | 'payment.expired';
