import { createRoot } from "react-dom/client";
import { Suspense, lazy } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import "./index.css";

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

// Rendering with fallback loading state
createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Helmet>
      <title>TrueAminos | Research Peptides & SARMs | Franklin, TN</title>
      <meta name="description" content="TrueAminos offers premium research peptides, SARMs, and supplements for scientific study. Shop BPC-157, NAD+, Sermorelin, GLP1, and more with guaranteed quality and fast shipping." />
      <meta name="keywords" content="research peptides, SARMs, BPC-157, NAD+, Sermorelin, GLP1, Semax, mk677, rad 140, peptides for sale, research chemicals, quality peptides" />
      
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
    </Helmet>
    <Suspense fallback={
      <div className="loading-placeholder">
        <div className="loading-spinner"></div>
      </div>
    }>
      <App />
    </Suspense>
  </HelmetProvider>
);
