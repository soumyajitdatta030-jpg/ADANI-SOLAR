import { User } from '../types';

export interface PaymentRequestParams {
  apiKey?: string;
  instanceId?: string;
  apiUrl?: string;
  amount: number;
  orderId: string;
  phone: string;
  name: string;
  email: string;
  redirectUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  qrCodeUrl?: string;
  upiId?: string;
  message?: string;
}

export const paymentService = {
  /**
   * Initiates a live transaction request securely through our server proxy to avoid CORS and credential exposure
   */
  async createTransaction(params: PaymentRequestParams): Promise<PaymentResponse> {
    try {
      console.log('Initiating secure Rupayex transaction via server proxy for order:', params.orderId);

      const response = await fetch('/api/pay/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          amount: params.amount,
          orderId: params.orderId,
          phone: params.phone,
          name: params.name,
          email: params.email || `${params.phone}@rupayex-user.com`,
          redirectUrl: params.redirectUrl,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status ${response.status}`);
      }

      const data: PaymentResponse = await response.json();
      return data;
    } catch (error: any) {
      console.error('Secure payment integration error:', error);
      return {
        success: false,
        message: error.message || 'Failed to establish live payment gateway connection.'
      };
    }
  },

  /**
   * Verifies UTR payment on backend
   */
  async verifyUTR(orderId: string, utr: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/pay/verify-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, utr })
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to verify UTR on backend server' };
    }
  },

  /**
   * Checks order status from backend server
   */
  async checkOrderStatus(orderId: string): Promise<{ success: boolean; order?: any }> {
    try {
      const response = await fetch(`/api/pay/status/${orderId}`);
      const data = await response.json();
      return data;
    } catch {
      return { success: false };
    }
  },

  /**
   * Generates a native, client-side UPI deep-link QR code if the API fails or is unconfigured
   */
  generateUPIPayment(amount: number, orderId: string, phone: string): { upiLink: string; upiId: string; qrCodeUrl: string } {
    // Generate standard UPI payload for Indian UPI apps (PhonePe, GPay, Paytm)
    const upiId = import.meta.env.VITE_RUPAYEX_UPI_ID || 'rupayex.payment@icici';
    const payeeName = import.meta.env.VITE_RUPAYEX_PAYEE_NAME || 'Adani Green Power Payments';
    const transactionNote = encodeURIComponent(`Recharge-${orderId}`);
    
    // Standard UPI URI format
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&tr=${orderId}&tn=${transactionNote}&cu=INR`;
    
    // QR Code URL using standard Google Chart / QR Server API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;

    return {
      upiLink,
      upiId,
      qrCodeUrl
    };
  }
};
