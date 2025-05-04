import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { visualizer } from 'rollup-plugin-visualizer';
import { createHtmlPlugin } from 'vite-plugin-html';
import compression from 'vite-plugin-compression';

// Define environment
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
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
      },
      // Fast refresh in development
      fastRefresh: !isProd
    }),
    
    // Development-specific plugins
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer())]
      : []
    ),
    
    // Production-specific plugins
    ...(isProd ? [
      // Generate gzipped bundles for better delivery performance
      compression({ 
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024, // Only compress files > 1kb
        deleteOriginFile: false
      }),
      
      // Generate brotli bundles for even better compression
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false
      }),
      
      // Add preload directives to HTML for critical resources
      createHtmlPlugin({
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
          minifyCSS: true,
          minifyJS: true
        },
        inject: {
          data: {
            BUILD_TIMESTAMP: new Date().toISOString(),
          }
        }
      }),
      
      // Enable bundle visualization in production builds
      visualizer({
        filename: '../dist/stats.html', 
        open: false,
        gzipSize: true
      })
    ] : [])
  ],
  
  // Configure path resolution
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      // Optimize for faster module resolution
      "react": isProd ? "react/prod-index" : "react",
      "react-dom": isProd ? "react-dom/profiling" : "react-dom"
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
        
        // Implement more precise code splitting
        manualChunks: (id) => {
          // Critical vendor packages for faster loading of core functionality
          if (id.includes('node_modules')) {
            // React core - the most essential package
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('scheduler/')) {
              return 'critical-vendor-react-core';
            }
            
            // UI component libraries
            if (id.includes('lucide-react') || id.includes('@radix-ui') || id.includes('tailwind')) {
              return 'vendor-ui-components';
            }
            
            // Network and data handling
            if (id.includes('axios') || id.includes('stripe') || id.includes('fetch') || id.includes('query')) {
              return 'vendor-network';
            }
            
            // Form handling and validation
            if (id.includes('formik') || id.includes('yup') || id.includes('validator') || id.includes('form')) {
              return 'vendor-forms';
            }
            
            // Router (critical navigation)
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            
            // State management
            if (id.includes('redux') || id.includes('zustand') || id.includes('mobx') || id.includes('recoil')) {
              return 'vendor-state';
            }
            
            // Everything else (less critical)
            return 'vendor-other';
          }
          
          // Application code splitting for better code organization and loading
          
          // Core UI components (buttons, inputs, etc)
          if (id.includes('/components/ui/') || id.includes('/components/common/')) {
            return 'app-ui-core';
          }
          
          // Pages by feature area for better lazy loading
          if (id.includes('/pages/')) {
            if (id.includes('/pages/checkout/')) {
              return 'app-pages-checkout';
            }
            if (id.includes('/pages/product')) {
              return 'app-pages-product';
            }
            if (id.includes('/pages/account')) {
              return 'app-pages-account';
            }
            return 'app-pages-other';
          }
          
          // Utility code
          if (id.includes('/hooks/') || id.includes('/lib/') || id.includes('/utils/')) {
            return 'app-utils';
          }
          
          // API and data services
          if (id.includes('/api/') || id.includes('/services/')) {
            return 'app-services';
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
    hmr: {
      overlay: true
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
      '@tanstack/react-query'
    ],
    // Force-included deps that might have dynamic imports
    force: [
      'react-helmet-async',
      'lucide-react'
    ],
    // Exclude content-heavy packages from optimization
    exclude: [
      'sharp'
    ]
  },
  
  // Optimizations for dependencies
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
      '@tanstack/react-query'
    ],
    // Force-included deps that might have dynamic imports
    force: [
      'react-helmet-async',
      'lucide-react'
    ],
    // Exclude content-heavy packages from optimization
    exclude: [
      'sharp'
    ]
  }
});
