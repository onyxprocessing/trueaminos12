import 'express-session';

declare module 'express-session' {
  interface SessionData {
    checkoutId?: string;
    checkoutStep?: string;
    personalInfo?: any;
    shippingInfo?: any;
    discountInfo?: {
      code: string;
      percentage: number;
    };
  }
}