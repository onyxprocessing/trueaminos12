import { createRoot } from "react-dom/client";
import { Suspense, lazy, useEffect, Fragment } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import "./index.css";

// Preload critical assets
function preloadAssets() {
  const images = [
    '/logo.svg',
    '/favicon-32x32.png'
  ];
  
  const resources = [
    { rel: 'preload', as: 'style', href: '/assets/index.css', id: 'critical-css' },
  ];
  
  // Preload key images
  images.forEach(image => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = image;
    document.head.appendChild(link);
  });
  
  // Add other resource hints
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = resource.rel;
    link.as = resource.as;
    link.href = resource.href;
    if (resource.id) link.id = resource.id;
    document.head.appendChild(link);
  });
}

// Initialize performance optimizations
function initPerformanceOptimizations() {
  // Prefetch important routes for faster navigation
  const routes = [
    '/products',
    '/categories/peptides',
    '/checkout'
  ];
  
  // Delay prefetching to not compete with critical resources
  setTimeout(() => {
    routes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }, 5000); // 5-second delay to prioritize initial render
}

// Lazy load main app component to reduce initial bundle size
const App = lazy(() => import("./App"));

// Performance metrics tracking
if (process.env.NODE_ENV === 'production') {
  // Report performance metrics only in production
  const reportWebVitals = () => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      // Get paint metrics
      const paintMetrics = performance.getEntriesByType('paint');
      const FCP = paintMetrics.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      
      // LCP may not be available via this API in all browsers
      let LCP = 0;
      try {
        // @ts-ignore - Type safety handled at runtime
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries && lcpEntries.length > 0) {
          LCP = lcpEntries[lcpEntries.length - 1]?.startTime || 0;
        }
      } catch (e) {
        // Silently handle if browser doesn't support this entry type
      }
      
      console.log('Paint Metrics:', {
        FCP: Math.round(FCP) + 'ms',
        LCP: LCP ? Math.round(LCP) + 'ms' : 'unavailable',
      });
      
      // Check if navigation timing is available
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming;
        const TTFB = navEntry.responseStart - navEntry.requestStart;
        console.log('Navigation Metrics:', {
          TTFB: Math.round(TTFB) + 'ms',
          DOMContentLoaded: Math.round(navEntry.domContentLoadedEventEnd) + 'ms',
          Load: Math.round(navEntry.loadEventEnd) + 'ms',
        });
      }
    }
  };
  
  // Report metrics after load
  window.addEventListener('load', () => {
    // Use setTimeout to not block the main thread
    setTimeout(reportWebVitals, 3000);
  });
}

// Apply performance optimizations immediately
if (typeof window !== 'undefined') {
  // Performance optimizations in browser environment
  preloadAssets();
  
  // Performance optimizations after initial load
  window.addEventListener('load', () => {
    // Initialize prefetching after the page is fully loaded
    initPerformanceOptimizations();
  });
}

// Enhanced loading component with priority styling
const OptimizedLoadingIndicator = () => (
  <div className="loading-placeholder" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100%', 
    background: '#ffffff',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999
  }}>
    <div className="loading-spinner" style={{
      width: '50px',
      height: '50px',
      border: '3px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '50%',
      borderTop: '3px solid #3498db',
      animation: 'spin 1s linear infinite'
    }}></div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Rendering with optimized fallback loading state
createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Helmet>
      <title>TrueAminos | Research Peptides & SARMs | Franklin, TN</title>
      <meta name="description" content="TrueAminos offers premium research peptides, SARMs, and supplements for scientific study. Shop BPC-157, NAD+, Sermorelin, GLP1, and more with guaranteed quality and fast shipping." />
      <meta name="keywords" content="research peptides, SARMs, BPC-157, NAD+, Sermorelin, GLP1, Semax, mk677, rad 140, peptides for sale, research chemicals, quality peptides" />
      
      {/* Critical preloads for faster rendering */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preload" href="/assets/logo.svg" as="image" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://trueaminos.com" />
      <meta property="og:title" content="TrueAminos | Premium Research Peptides & SARMs" />
      <meta property="og:description" content="Premium quality research compounds for scientific purposes. BPC-157, NAD+, Sermorelin, GLP1, Semax, and more with verified purity." />
      <meta property="og:image" content="https://trueaminos.com/facebook-card.svg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content="TrueAminos" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="https://trueaminos.com" />
      <meta name="twitter:title" content="TrueAminos | Premium Research Peptides & SARMs" />
      <meta name="twitter:description" content="Premium quality research compounds for scientific purposes. BPC-157, NAD+, Sermorelin, GLP1, Semax, and more with verified purity." />
      <meta name="twitter:image" content="https://trueaminos.com/twitter-card.svg" />
      <meta name="twitter:image:alt" content="TrueAminos - Premium Research Peptides" />
      
      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="TrueAminos" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="geo.region" content="US-TN" />
      <meta name="geo.placename" content="Franklin" />
      
      {/* Canonical & Favicon */}
      <link rel="canonical" href="https://trueaminos.com" />
      <link rel="icon" href="/favicon-32x32.png" type="image/png" />
      <link rel="shortcut icon" href="/favicon-32x32.png" type="image/png" />
      
      {/* Performance optimizations - Cache control */}
      <meta httpEquiv="Cache-Control" content="public, max-age=31536000, immutable" />
    </Helmet>
    <Suspense fallback={<OptimizedLoadingIndicator />}>
      <App />
    </Suspense>
  </HelmetProvider>
);
