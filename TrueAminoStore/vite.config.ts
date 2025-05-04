import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
        passes: 2,
        ecma: 2020,
        toplevel: true,
        unsafe_arrows: true,
        unsafe_methods: true
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false,
        ecma: 2020
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler') || id.includes('prop-types')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            if (id.includes('axios') || id.includes('stripe') || id.includes('fetch')) {
              return 'vendor-apis';
            }
            return 'vendor-other';
          }
          
          // App chunks
          if (id.includes('/components/ui/')) {
            return 'app-ui';
          }
          if (id.includes('/pages/')) {
            return 'app-pages';
          }
          if (id.includes('/hooks/') || id.includes('/lib/')) {
            return 'app-utils';
          }
        }
      }
    },
    cssMinify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
});
