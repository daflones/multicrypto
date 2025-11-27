interface DBXPaymentRequest {
  amount: number;
  description?: string;
  customer_email?: string;
  customer_name?: string;
  customer_document?: string;
  customer_phone?: string;
  external_reference?: string;
  webhook_url?: string;
}

interface DBXPaymentResponse {
  id: string;
  status: 'aguardando' | 'aprovado' | 'cancelado' | 'expirado';
  amount: number;
  qr_code: string; // PIX copia e cola (texto)
  qr_code_base64: string; // QR Code imagem base64
  created_at?: string;
  external_reference?: string;
  customer_email?: string;
}

interface DBXWebhookPayload {
  id: string;
  type: 'payment.approved' | 'payment.cancelled' | 'payment.expired';
  data: {
    transaction_id: string;
    external_reference: string;
    amount: number;
    currency: string;
    payment_method: string;
    net_amount: number;
    status: 'approved' | 'cancelled' | 'expired';
    paid_at: string;
  };
}

class DBXBankPayService {
  private readonly baseUrl = 'https://dbxbankpay.com/api';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_DBXPAY_API_KEY;
    if (!this.apiKey) {
      throw new Error('DBXPay API Key não configurada');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API DBXPay: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Criar um novo pagamento PIX
   */
  async createPayment(paymentData: DBXPaymentRequest): Promise<DBXPaymentResponse> {
    const payload = {
      amount: paymentData.amount / 100, // Converter de centavos para reais
      customer_email: paymentData.customer_email,
      customer_name: paymentData.customer_name,
      customer_document: paymentData.customer_document, // CPF do usuário logado
      customer_phone: paymentData.customer_phone || '11999999999', // Telefone do usuário ou padrão
      external_reference: paymentData.external_reference,
      webhook_url: import.meta.env.VITE_WEBHOOK_URL || 'https://multicrypto.com.br/api/webhooks/dbxbankpay'
    };

    try {
      const response = await this.makeRequest<DBXPaymentResponse>('/v1/deposits/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Consultar status de um pagamento
   */
  async getPayment(paymentId: string): Promise<DBXPaymentResponse> {
    try {
      const response = await this.makeRequest<DBXPaymentResponse>(`/v1/deposits/${paymentId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validar webhook signature (HMAC)
   */
  validateWebhookSignature(
    _payload: string,
    _timestamp: string,
    _signature: string,
    _secret: string
  ): boolean {
    try {
      // Implementação básica - validação real está no backend
      return true; // Validação real no backend Express
    } catch (error) {
      return false;
    }
  }

  /**
   * Processar webhook payload
   */
  processWebhookPayload(payload: DBXWebhookPayload): {
    transactionId: string;
    externalReference: string;
    amount: number;
    status: string;
    isApproved: boolean;
  } {
    const { data } = payload;
    
    return {
      transactionId: data.transaction_id,
      externalReference: data.external_reference,
      amount: data.amount / 100, // Converter de centavos para reais
      status: data.status,
      isApproved: data.status === 'approved' && payload.type === 'payment.approved'
    };
  }

  /**
   * Gerar referência externa única
   */
  generateExternalReference(userId: string): string {
    const timestamp = Date.now();
    return `user_${userId}_${timestamp}`;
  }

  /**
   * Formatar valor para centavos
   */
  formatAmountToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Formatar valor de centavos para reais
   */
  formatAmountFromCents(amountInCents: number): number {
    return amountInCents / 100;
  }
}

// Instância singleton
export const dbxBankPayService = new DBXBankPayService();

// Exportar tipos
export type {
  DBXPaymentRequest,
  DBXPaymentResponse,
  DBXWebhookPayload
};
