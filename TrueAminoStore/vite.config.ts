import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Define environment
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  define: {
    __VITE_IS_PRODUCTION__: isProd,
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  plugins: [
    // Core React plugin with performance optimizations
    react({
      babel: {
        // Apply additional Babel optimizations in production
        plugins: isProd ? [
          ["transform-remove-console", { exclude: ["error", "warn"] }],
          "@babel/plugin-transform-react-constant-elements",
          "@babel/plugin-transform-react-inline-elements"
        ] : []
      }
    }),
  ],
  
  // Configure path resolution
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      // Keep standard React imports for compatibility
      "react": "react",
      "react-dom": "react-dom"
    },
  },
  
  // Project structure configuration
  root: path.resolve(import.meta.dirname, "client"),
  
  // Optimize builds
  esbuild: {
    // Use esbuild for faster transpilation when possible
    legalComments: 'none',
    target: ['es2020'],
    drop: isProd ? ['console', 'debugger'] : [],
    pure: isProd ? ['console.log', 'console.info', 'console.debug', 'console.trace'] : [],
    treeShaking: true
  },
  
  // Build configuration
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    minify: 'terser',
    target: 'es2020',
    modulePreload: { polyfill: true },
    reportCompressedSize: true,
    
    // Enable lib splitting for better caching
    cssCodeSplit: true,
    
    // Advanced Terser optimization
    terserOptions: {
      compress: {
        drop_console: isProd,
        drop_debugger: isProd,
        pure_funcs: isProd ? [
          'console.log', 
          'console.debug', 
          'console.info', 
          'console.trace',
          'console.time',
          'console.timeEnd'
        ] : [],
        passes: 3,
        ecma: 2020,
        toplevel: true,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_regexp: true,
        keep_infinity: true,
        module: true
      },
      mangle: {
        safari10: true,
        toplevel: true,
        module: true,
        properties: {
          regex: /^_/  // Only mangle properties that start with underscore
        }
      },
      format: {
        comments: false,
        ecma: 2020,
        wrap_iife: true,
        ascii_only: true
      },
      module: true
    },
    
    // Advanced code splitting strategy for optimal loading
    rollupOptions: {
      output: {
        // Generate hashed filenames for better caching
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        
        // Dynamic chunks - break down large features to load only what's needed 
        manualChunks: (id) => {
          // Core vendor packages - used immediately, should be loaded right away
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('scheduler/')) {
              return 'vendor-react-core';
            }
            
            if (id.includes('@radix-ui') || id.includes('class-variance-authority') || 
                id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-ui-core';
            }
            
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            
            if (id.includes('axios') || id.includes('@tanstack/react-query')) {
              return 'vendor-data';
            }
            
            if (id.includes('@stripe/')) {
              return 'vendor-stripe';
            }
            
            return 'vendor-other';
          }
          
          // Application chunks - load features on demand
          
          // MultiStepCheckout is a large component that should be loaded only when needed
          if (id.includes('/pages/checkout/MultiStepCheckout') || id.includes('/pages/checkout/PaymentForm')) {
            return 'app-checkout';
          }
          
          // Core UI components used throughout the app - loaded early 
          if (id.includes('/components/ui/')) {
            return 'app-ui-components';
          }
          
          // Product-related code - defer loading until needed
          if (id.includes('/components/ProductCard') || id.includes('/pages/product')) {
            return 'app-product';
          }
          
          // Home page - loaded immediately but kept small
          if (id.includes('/pages/Home')) {
            return 'app-home';
          }
          
          // Cart functionality - loaded on demand
          if (id.includes('/components/Cart') || id.includes('/hooks/useCart')) {
            return 'app-cart';
          }
          
          // Authentication - loaded on demand
          if (id.includes('/auth/') || id.includes('/login/') || id.includes('/register/')) {
            return 'app-auth';
          }
          
          // Utility functions - grouped to avoid tiny modules  
          if (id.includes('/lib/') || id.includes('/utils/') || id.includes('/hooks/')) {
            return 'app-utils';
          }
        }
      }
    },
    
    // CSS optimization
    cssMinify: true,
    
    // Disable sourcemaps in production for smaller bundles
    sourcemap: !isProd,
    
    // Allow larger chunks in production (modern browsers handle this well)
    chunkSizeWarningLimit: 1500,
  },
  
  // Optimize dev server for faster reloads
  server: {
    port: 5000,
    host: '0.0.0.0', // Required for Replit
    hmr: isProd ? false : {
      overlay: false,
      port: 5000
    },
    watch: {
      usePolling: false,
    },
    open: false,
    cors: true
  },
  
  // Optimize preview mode
  preview: {
    port: 5000,
    host: '0.0.0.0', // Required for Replit
    open: false,
    cors: true
  },
  
  // Cache dependencies for faster builds
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@radix-ui/react-select',
      '@radix-ui/react-dialog',
      'lucide-react',
      'axios',
      'react-helmet-async',
      'tailwind-merge',
      '@tanstack/react-query',
      'wouter',
      'clsx',
      'class-variance-authority',
      '@radix-ui/react-slot'
    ],
    // Exclude content-heavy packages from optimization
    exclude: [
      'sharp'
    ],
    // Optimize entries faster
    esbuildOptions: {
      target: 'es2020',
      treeShaking: true,
      legalComments: 'none',
      logLevel: 'error'
    }
  }
});
