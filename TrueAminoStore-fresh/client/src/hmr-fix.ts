// Prevent HMR WebSocket connections in production
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // Override WebSocket to prevent connection attempts in production
  const originalWebSocket = window.WebSocket;
  window.WebSocket = class extends originalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      // Block Vite HMR WebSocket connections in production
      if (typeof url === 'string' && (url.includes('localhost') || url.includes('/?token='))) {
        console.log('Blocked Vite HMR WebSocket connection in production');
        // Create a dummy WebSocket that doesn't actually connect
        const dummy = {
          readyState: 3, // CLOSED
          addEventListener: () => {},
          removeEventListener: () => {},
          close: () => {},
          send: () => {},
        };
        return dummy as any;
      }
      super(url, protocols);
    }
  };
}