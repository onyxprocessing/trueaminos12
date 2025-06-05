import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  // Fix type compatibility with Vite server options
  const serverOptions: any = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  // Handle SEO files in development mode
  const publicPath = path.resolve(import.meta.dirname, "..", "public");
  
  // Handle robots.txt with correct content type
  app.get('/robots.txt', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(path.resolve(publicPath, "robots.txt"));
  });
  
  // Handle sitemap.xml with correct content type
  app.get('/sitemap.xml', (req, res) => {
    res.set('Content-Type', 'application/xml');
    res.sendFile(path.resolve(publicPath, "sitemap.xml"));
  });
  
  // Handle SVG files with correct content type
  app.get('/favicon.svg', (req, res) => {
    res.set('Content-Type', 'image/svg+xml');
    res.sendFile(path.resolve(publicPath, "favicon.svg"));
  });
  
  app.get('/facebook-card.svg', (req, res) => {
    res.set('Content-Type', 'image/svg+xml');
    res.sendFile(path.resolve(publicPath, "facebook-card.svg"));
  });
  
  app.get('/twitter-card.svg', (req, res) => {
    res.set('Content-Type', 'image/svg+xml');
    res.sendFile(path.resolve(publicPath, "twitter-card.svg"));
  });
  
  app.get('/apple-touch-icon.svg', (req, res) => {
    res.set('Content-Type', 'image/svg+xml');
    res.sendFile(path.resolve(publicPath, "apple-touch-icon.svg"));
  });
  
  // Handle manifest.json with correct content type
  app.get('/manifest.json', (req, res) => {
    res.set('Content-Type', 'application/json');
    res.sendFile(path.resolve(publicPath, "manifest.json"));
  });

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  const publicPath = path.resolve(import.meta.dirname, "..", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve SEO files directly with proper content types
  // Handle robots.txt with correct content type
  app.get('/robots.txt', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(path.resolve(publicPath, "robots.txt"));
  });
  
  // Handle sitemap.xml with correct content type
  app.get('/sitemap.xml', (req, res) => {
    res.set('Content-Type', 'application/xml');
    res.sendFile(path.resolve(publicPath, "sitemap.xml"));
  });
  
  // Handle SVG files with correct content type
  app.get('/favicon.svg', (req, res) => {
    res.set('Content-Type', 'image/svg+xml');
    res.sendFile(path.resolve(publicPath, "favicon.svg"));
  });
  
  app.get('/facebook-card.svg', (req, res) => {
    res.set('Content-Type', 'image/svg+xml');
    res.sendFile(path.resolve(publicPath, "facebook-card.svg"));
  });
  
  app.get('/twitter-card.svg', (req, res) => {
    res.set('Content-Type', 'image/svg+xml');
    res.sendFile(path.resolve(publicPath, "twitter-card.svg"));
  });
  
  app.get('/apple-touch-icon.svg', (req, res) => {
    res.set('Content-Type', 'image/svg+xml');
    res.sendFile(path.resolve(publicPath, "apple-touch-icon.svg"));
  });
  
  // Handle manifest.json with correct content type
  app.get('/manifest.json', (req, res) => {
    res.set('Content-Type', 'application/json');
    res.sendFile(path.resolve(publicPath, "manifest.json"));
  });

  // Enable aggressive caching for static assets with different strategies per asset type
  app.use(express.static(distPath, {
    etag: true, // Enable ETags for conditional requests
    lastModified: true, // Enable Last-Modified for conditional requests
    maxAge: '1y', // Default to 1 year for immutable assets
    setHeaders: (res, filePath) => {
      // JavaScript and CSS - very aggressive caching for performance
      if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        // Always use 1 year cache for JS/CSS since Vite handles versioning
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
      } 
      // Images - very aggressive caching 
      else if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
      }
      // Fonts - immutable and long-lived (most important for performance)
      else if (filePath.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
      }
      // JSON data - shorter cache with revalidation
      else if (filePath.endsWith('.json')) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
      }

      // Add performance-focused security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }));
  
  // Public folder for assets like favicon, robots.txt, etc
  app.use(express.static(publicPath, { 
    etag: true,
    lastModified: true,
    maxAge: '1y', // Default to 1 year for static assets
    setHeaders: (res, filePath) => {
      // Special handling for important files with proper MIME types
      if (filePath.endsWith('robots.txt')) {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
      } else if (filePath.endsWith('sitemap.xml')) {
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
      } else if (filePath.endsWith('manifest.json')) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
      } else if (filePath.match(/favicon/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
      } else {
        // Default for other static assets
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
