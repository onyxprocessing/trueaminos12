import 'express-session';

declare module 'express-session' {
  interface SessionData {
    paymentIntentId?: string;
    checkoutId?: string;
    checkoutStep?: string;
    personalInfo?: any;
    shippingInfo?: any;
  }
}