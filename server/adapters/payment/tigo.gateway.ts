import { 
  PaymentGateway, 
  InitiatePaymentParams, 
  InitiatePaymentResult, 
  CallbackVerificationResult 
} from './payment-gateway.interface.ts';

export class TigoPesaGateway implements PaymentGateway {
  private apiKey: string;
  private secret: string;
  private merchantPin: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TIGO_API_KEY || '';
    this.secret = process.env.TIGO_SECRET || '';
    this.merchantPin = process.env.TIGO_MERCHANT_PIN || '1234';
    this.baseUrl = 'https://api.tigopesa.co.tz';
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    if (!this.apiKey || !this.secret) {
      return {
        success: false,
        gatewayReference: '',
        status: 'FAILED',
        message: 'Tigo Pesa credentials (TIGO_API_KEY / TIGO_SECRET) are missing.',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/tigo/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          CustomerMSISDN: params.phone,
          Amount: params.amount,
          Reference: params.transactionReference,
          Remarks: params.description,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ResponseCode === '0') {
        return {
          success: true,
          gatewayReference: data.TransactionID || `TIGO_${Date.now()}`,
          status: 'PENDING',
          message: 'Tigo Pesa push sent to mobile device',
          ussdPromptInstructions: `Confirm payment with your Tigo Pesa PIN on phone ${params.phone}.`,
        };
      }

      return {
        success: false,
        gatewayReference: '',
        status: 'FAILED',
        message: data.ResponseDescription || 'Failed to dispatch Tigo Pesa request',
      };
    } catch (err: any) {
      return {
        success: false,
        gatewayReference: '',
        status: 'FAILED',
        message: `Tigo Pesa error: ${err.message}`,
      };
    }
  }

  async verifyCallback(headers: Record<string, any>, payload: any): Promise<CallbackVerificationResult> {
    const isSuccess = payload?.status === 'SUCCESS' || payload?.Status === '0';
    return {
      isValid: true,
      transactionReference: payload?.Reference || payload?.reference || '',
      gatewayReference: payload?.TransactionID || payload?.transaction_id || '',
      amount: Number(payload?.Amount || 0),
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      message: payload?.Description || (isSuccess ? 'Tigo Pesa payment verified' : 'Payment failed'),
      rawPayload: payload,
    };
  }

  async checkStatus(gatewayReference: string, transactionReference: string) {
    return {
      status: 'PENDING' as const,
      message: 'Pending customer PIN confirmation on Tigo network',
    };
  }
}
