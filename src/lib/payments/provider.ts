export interface PaymentDetails {
  orderId: string;
  orderNumber: number;
  amountPaise: number;
  currency: 'INR';
  customerPhone?: string | null;
  customerName?: string | null;
}

export interface PaymentInitResult {
  provider: 'MANUAL_UPI' | 'CASH' | 'GATEWAY';
  upiDeepLink?: string;
  upiId?: string;
  payeeName?: string;
  qrCodeUrl?: string;
  amountPaise: number;
  amountFormatted: string;
  expiresAt: Date;
  status: 'AWAITING_PAYMENT';
}

export interface PaymentConfirmParams {
  orderId: string;
  method: 'UPI' | 'CASH';
  staffUserId: string;
  utr?: string | null;
  notes?: string | null;
  ipAddress?: string | null;
}

export interface PaymentConfirmResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  warning?: string;
}

export interface PaymentProvider {
  name: string;
  initializePayment(details: PaymentDetails): Promise<PaymentInitResult>;
  confirmPayment(params: PaymentConfirmParams): Promise<PaymentConfirmResult>;
  cancelPayment(orderId: string, reason: string): Promise<boolean>;
}
