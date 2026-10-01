import { 
  PaymentGateway, 
  InitiatePaymentParams, 
  InitiatePaymentResult, 
  CallbackVerificationResult 
} from './payment-gateway.interface.ts';

export class AirtelMoneyGateway implements PaymentGateway {
  private clientId: string;
  private clientSecret: string;
  private country: string;
  private currency: string;
  private baseUrl: string;

  constructor() {
    this.clientId = process.env.AIRTEL_API_KEY || '';
    this.clientSecret = process.env.AIRTEL_SECRET || '';
    this.country = process.env.AIRTEL_COUNTRY || 'TZ';
    this.currency = process.env.AIRTEL_CURRENCY || 'TZS';
    this.baseUrl = 'https://openapi.airtel.africa';
  }

  private normalizePhone(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('255')) clean = clean.slice(3);
    if (clean.startsWith('0')) clean = clean.slice(1);
    return clean; // 9 digits: e.g. 782123456
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    if (!this.clientId || !this.clientSecret) {
      return {
        success: false,
        gatewayReference: '',
        status: 'FAILED',
        message: 'Airtel Money API credentials (AIRTEL_API_KEY / AIRTEL_SECRET) are missing.',
      };
    }

    try {
      const airtelMsisdn = this.normalizePhone(params.phone);
      // Generate Airtel Push Request
      const response = await fetch(`${this.baseUrl}/merchant/v1/payments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Country': this.country,
          'X-Currency': this.currency,
          'Authorization': `Bearer ${this.clientId}`,
        },
        body: JSON.stringify({
          reference: params.transactionReference,
          subscriber: {
            country: this.country,
            currency: this.currency,
            msisdn: airtelMsisdn,
          },
          transaction: {
            amount: params.amount,
            country: this.country,
            currency: this.currency,
            id: params.transactionReference,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.status?.code === '200') {
        return {
          success: true,
          gatewayReference: data.data?.transaction?.id || `AIRTEL_${Date.now()}`,
          status: 'PENDING',
          message: 'Airtel Money USSD prompt dispatched to phone',
          ussdPromptInstructions: `Please approve prompt on +255${airtelMsisdn} with your Airtel Money PIN.`,
        };
      }

      return {
        success: false,
        gatewayReference: '',
        status: 'FAILED',
        message: data.status?.message || 'Airtel Money gateway declined transaction',
      };
    } catch (err: any) {
      return {
        success: false,
        gatewayReference: '',
        status: 'FAILED',
        message: `Airtel Money connection error: ${err.message}`,
      };
    }
  }

  async verifyCallback(headers: Record<string, any>, payload: any): Promise<CallbackVerificationResult> {
    const tx = payload?.transaction || payload;
    const isSuccess = tx?.status_code === 'TS' || tx?.status === 'SUCCESS' || tx?.status === '200';

    return {
      isValid: true,
      transactionReference: tx?.id || tx?.reference || '',
      gatewayReference: tx?.airtel_money_id || '',
      amount: Number(tx?.amount || 0),
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      message: tx?.message || (isSuccess ? 'Airtel Money transaction confirmed' : 'Payment failed'),
      rawPayload: payload,
    };
  }

  async checkStatus(gatewayReference: string, transactionReference: string) {
    return {
      status: 'PENDING' as const,
      message: 'Awaiting Airtel webhook confirmation',
    };
  }
}
