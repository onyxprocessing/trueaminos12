// Production-optimized logger that reduces compute usage
const isProduction = process.env.NODE_ENV === 'production' || process.env.DISABLE_LOGGING === 'true';

export const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  }
};