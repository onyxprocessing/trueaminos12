import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();

// Rate limiting middleware - simple implementation to reduce compute usage
const rateLimitMap = new Map();

const rateLimit = (options: { windowMs: number; max: number }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Clean old entries
    const requests = rateLimitMap.get(ip) || [];
    const validRequests = requests.filter((time: number) => time > windowStart);
    
    if (validRequests.length >= options.max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    validRequests.push(now);
    rateLimitMap.set(ip, validRequests);
    next();
  };
};

// Rate limiting disabled temporarily - will implement targeted protection later
// app.use('/api/cart', rateLimit({ windowMs: 5 * 60 * 1000, max: 100 }));
// app.use('/api', rateLimit({ windowMs: 5 * 60 * 1000, max: 200 }));
// app.use(rateLimit({ windowMs: 5 * 60 * 1000, max: 500 }));

// Advanced compression settings for better performance
const compressFilter = (req: Request, res: Response) => {
  if (req.headers['x-no-compression']) {
    return false;
  }
  
  // Always compress API responses and HTML
  if (req.path.startsWith('/api') || req.path.endsWith('.html')) {
    return true;
  }
  
  // Compress JS, CSS, SVG, and JSON files (typically compressible)
  if (req.path.match(/\.(js|css|svg|json)$/i)) {
    return true;
  }
  
  // Default compression behavior for all other responses
  return compression.filter(req, res);
};

// Enable enhanced compression for all responses - reducing file size significantly
app.use(compression({
  level: 6, // Higher compression level (0-9, with 9 being max compression but slower)
  threshold: 512, // Only compress responses larger than 512 bytes
  filter: compressFilter,
  memLevel: 8, // Memory level (1-9, where 9 uses more memory for better compression)
  strategy: 0, // Compression strategy (0 = default, 1 = filtered, 2 = huffman only, 3 = RLE, 4 = fixed)
  windowBits: 15 // Window size (8-15, higher values use more memory but provide better compression)
}) as any);

// Enable proper JSON handling
app.use(express.json({
  limit: '2mb' // Increase limit for larger payloads
}));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Add intelligent cache control headers for API routes
app.use((req, res, next) => {
  const url = req.url;
  
  if (url.startsWith('/api/')) {
    // Cache static content like products, categories for better performance
    if (url.startsWith('/api/products') || url.startsWith('/api/categories')) {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5 minutes
    }
    // Cache image proxy responses aggressively
    else if (url.startsWith('/api/image-proxy')) {
      res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // 1 day
    }
    // Don't cache dynamic user-specific content
    else if (url.startsWith('/api/cart') || url.startsWith('/api/checkout')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
    // Default: short cache for other API responses
    else {
      res.set('Cache-Control', 'public, max-age=60'); // 1 minute
    }
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
