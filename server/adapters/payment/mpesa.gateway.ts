import { 
  PaymentGateway, 
  InitiatePaymentParams, 
  InitiatePaymentResult, 
  CallbackVerificationResult 
} from './payment-gateway.interface.ts';

export class MpesaGateway implements PaymentGateway {
  private consumerKey: string;
  private consumerSecret: string;
  private shortcode: string;
  private passkey: string;
  private env: string;
  private baseUrl: string;

  constructor() {
    this.consumerKey = process.env.MPESA_API_KEY || '';
    this.consumerSecret = process.env.MPESA_SECRET || '';
    this.shortcode = process.env.MPESA_SHORTCODE || '174379';
    this.passkey = process.env.MPESA_PASSKEY || '';
    this.env = process.env.MPESA_ENV || 'sandbox';
    this.baseUrl = this.env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  private normalizeTanzaniaPhone(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '255' + clean.slice(1);
    } else if (clean.startsWith('+255')) {
      clean = clean.slice(1);
    } else if (!clean.startsWith('255')) {
      clean = '255' + clean;
    }
    return clean;
  }

  private async getAccessToken(): Promise<string> {
    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error('Vodacom M-Pesa API credentials (MPESA_API_KEY / MPESA_SECRET) are missing in environment.');
    }

    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`M-Pesa OAuth failed (HTTP ${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const formattedPhone = this.normalizeTanzaniaPhone(params.phone);
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

    try {
      const token = await this.getAccessToken();
      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(params.amount),
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: params.callbackUrl,
        AccountReference: params.transactionReference,
        TransactionDesc: params.description || 'XCLOUD Hotspot Access',
      };

      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.ResponseCode === '0') {
        return {
          success: true,
          gatewayReference: data.CheckoutRequestID || `ws_CO_${Date.now()}`,
          status: 'PENDING',
          message: 'STK Push sent to mobile device. Customer must enter PIN.',
          ussdPromptInstructions: `Check prompt on +${formattedPhone} and enter M-Pesa PIN to complete payment of TZS ${params.amount.toLocaleString()}.`,
        };
      } else {
        return {
          success: false,
          gatewayReference: '',
          status: 'FAILED',
          message: data.ResponseDescription || 'Failed to dispatch M-Pesa prompt',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        gatewayReference: '',
        status: 'FAILED',
        message: `M-Pesa error: ${err.message}`,
      };
    }
  }

  async verifyCallback(headers: Record<string, any>, payload: any): Promise<CallbackVerificationResult> {
    const stkCallback = payload?.Body?.stkCallback || payload;
    const resultCode = stkCallback?.ResultCode;
    const checkoutId = stkCallback?.CheckoutRequestID || '';
    const ref = stkCallback?.AccountReference || '';

    let amount = 0;
    const items = stkCallback?.CallbackMetadata?.Item;
    if (Array.isArray(items)) {
      const amountItem = items.find((i: any) => i.Name === 'Amount');
      if (amountItem) amount = Number(amountItem.Value);
    }

    const isSuccess = resultCode === 0 || resultCode === '0';

    return {
      isValid: true,
      transactionReference: ref,
      gatewayReference: checkoutId,
      amount,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      message: stkCallback?.ResultDesc || (isSuccess ? 'Payment confirmed by Vodacom M-Pesa' : 'Payment rejected by user'),
      rawPayload: payload,
    };
  }

  async checkStatus(gatewayReference: string, transactionReference: string) {
    try {
      const token = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

      const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: this.shortcode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: gatewayReference,
        }),
      });

      const data = await response.json();
      if (data.ResultCode === '0') {
        return { status: 'SUCCESS' as const, message: 'Transaction confirmed' };
      } else if (data.ResultCode === '1032') {
        return { status: 'CANCELLED' as const, message: 'Transaction cancelled by user' };
      }
      return { status: 'PENDING' as const, message: data.ResultDesc || 'Processing' };
    } catch (err: any) {
      return { status: 'PENDING' as const, message: err.message };
    }
  }
}
