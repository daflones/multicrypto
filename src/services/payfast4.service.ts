interface PayFast4PaymentResponse {
  id: string;
  amount: number;
  created_at: string;
  expires_at: string;
  pix_code: string; // PIX copy-paste code
  qr_code: string; // same as pix_code
  qr_code_base64: string; // base64 image for QR code
  status: string;
}

interface PayFast4PaymentRequest {
  amount: number;
  customer_email: string;
  customer_name: string;
  customer_document: string;
  customer_phone: string;
  external_reference: string;
  webhook_url: string;
}

class PayFast4Service {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_PAYFAST4_API_KEY || '';
    this.apiUrl = 'https://payfast4.com/api/v1/deposits/create';
  }

  generateExternalReference(userId: string): string {
    const timestamp = Date.now();
    return `user_${userId}_${timestamp}`;
  }

  async createPayment(paymentData: PayFast4PaymentRequest): Promise<PayFast4PaymentResponse> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          customer_email: paymentData.customer_email,
          customer_name: paymentData.customer_name,
          customer_document: paymentData.customer_document,
          customer_phone: paymentData.customer_phone,
          external_reference: paymentData.external_reference,
          webhook_url: paymentData.webhook_url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar pagamento');
      }

      const data = await response.json();
      console.log('PayFast4 API Response:', data);
      return data;
    } catch (error: any) {
      console.error('PayFast4 API Error:', error);
      throw new Error(error.message || 'Erro ao processar pagamento com PayFast4');
    }
  }
}

export const payfast4Service = new PayFast4Service();
export type { PayFast4PaymentResponse, PayFast4PaymentRequest };
