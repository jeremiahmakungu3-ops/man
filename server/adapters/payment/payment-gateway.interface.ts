import { PaymentStatus } from '../../../src/types/index.ts';

export interface InitiatePaymentParams {
  transactionReference: string;
  phone: string; // E.164 or national format (e.g., 2557XXXXXXXX or 07XXXXXXXX)
  amount: number; // in TZS
  description: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export interface InitiatePaymentResult {
  success: boolean;
  gatewayReference: string;
  status: PaymentStatus;
  message: string;
  checkoutUrl?: string;
  ussdPromptInstructions?: string;
}

export interface CallbackVerificationResult {
  isValid: boolean;
  transactionReference: string;
  gatewayReference: string;
  amount: number;
  status: PaymentStatus;
  message: string;
  rawPayload: any;
}

export interface PaymentGateway {
  initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verifyCallback(headers: Record<string, any>, payload: any): Promise<CallbackVerificationResult>;
  checkStatus(gatewayReference: string, transactionReference: string): Promise<{
    status: PaymentStatus;
    message: string;
  }>;
}
