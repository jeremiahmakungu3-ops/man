import { 
  PaymentGateway, 
  InitiatePaymentParams, 
  InitiatePaymentResult, 
  CallbackVerificationResult 
} from './payment-gateway.interface.ts';

export class SelcomGateway implements PaymentGateway {
  private vendorKey: string;
  private vendorSecret: string;
  private baseUrl: string;

  constructor() {
    this.vendorKey = process.env.SELCOM_API_KEY || '';
    this.vendorSecret = process.env.SELCOM_SECRET || '';
    this.baseUrl = 'https://api.selcom.net/v1';
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    if (!this.vendorKey || !this.vendorSecret) {
      return {
        success: false,
        gatewayReference: '',
        status: 'FAILED',
        message: 'Selcom Pay credentials (SELCOM_API_KEY / SELCOM_SECRET) are missing.',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/checkout/create-order-minimal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `SELCOM ${this.vendorKey}`,
        },
        body: JSON.stringify({
          vendor: this.vendorKey,
          order_id: params.transactionReference,
          buyer_email: 'customer@xcloud.tz',
          buyer_name: 'Hotspot Customer',
          buyer_phone: params.phone,
          amount: params.amount,
          currency: 'TZS',
          no_of_items: 1,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.result === 'SUCCESS') {
        return {
          success: true,
          gatewayReference: data.reference || `SELCOM_${Date.now()}`,
          status: 'PENDING',
          message: 'Selcom checkout generated successfully',
          checkoutUrl: data.payment_gateway_url,
          ussdPromptInstructions: `Pay via Selcom Pay using order ${params.transactionReference}.`,
        };
      }

      return {
        success: false,
        gatewayReference: '',
        status: 'FAILED',
        message: data.message || 'Selcom Pay declined request',
      };
    } catch (err: any) {
      return {
        success: false,
        gatewayReference: '',
        status: 'FAILED',
        message: `Selcom error: ${err.message}`,
      };
    }
  }

  async verifyCallback(headers: Record<string, any>, payload: any): Promise<CallbackVerificationResult> {
    const isSuccess = payload?.result === 'SUCCESS' || payload?.payment_status === 'COMPLETED';
    return {
      isValid: true,
      transactionReference: payload?.order_id || '',
      gatewayReference: payload?.transid || payload?.reference || '',
      amount: Number(payload?.amount || 0),
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      message: payload?.result_description || (isSuccess ? 'Selcom transaction confirmed' : 'Failed'),
      rawPayload: payload,
    };
  }

  async checkStatus(gatewayReference: string, transactionReference: string) {
    return {
      status: 'PENDING' as const,
      message: 'Pending Selcom payment confirmation',
    };
  }
}
