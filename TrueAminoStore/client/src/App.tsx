import React, { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/empty-toaster"; // Using empty toaster to disable notifications
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/useCart";
import { AffiliateProvider } from "@/hooks/useAffiliateCode";

// Only import the Home component directly for fast initial load - it's our landing page
import Home from "@/pages/Home";

// Lazy load all other page components to reduce initial bundle size
const ProductPage = lazy(() => import("@/pages/ProductPage"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const Cart = lazy(() => import("@/pages/Cart"));
const MultiStepCheckout = lazy(() => import("@/pages/checkout/MultiStepCheckout"));
const SuccessOrderPage = lazy(() => import("@/pages/checkout/SuccessOrderPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const CertificationsPage = lazy(() => import("@/pages/CertificationsPage"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const ShippingPolicy = lazy(() => import("@/pages/ShippingPolicy"));
const ReturnPolicy = lazy(() => import("@/pages/ReturnPolicy"));
const AdminOrdersPage = lazy(() => import("@/pages/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("@/pages/AdminOrderDetailPage"));
const AffiliateRedirect = lazy(() => import("@/pages/AffiliateRedirect"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" 
         aria-label="Loading page content..."></div>
  </div>
);

function Router() {
  return (
    <Switch>
      {/* Home is directly imported for fast initial render */}
      <Route path="/" component={Home} />
      
      {/* All other routes are lazy loaded with Suspense */}
      <Route path="/products">
        <Suspense fallback={<PageLoader />}>
          <ProductsPage />
        </Suspense>
      </Route>
      
      <Route path="/products/:slug">
        <Suspense fallback={<PageLoader />}>
          <ProductPage />
        </Suspense>
      </Route>
      
      <Route path="/category/:slug">
        <Suspense fallback={<PageLoader />}>
          <CategoryPage />
        </Suspense>
      </Route>
      
      <Route path="/cart">
        <Suspense fallback={<PageLoader />}>
          <Cart />
        </Suspense>
      </Route>
      
      <Route path="/checkout/multi-step">
        <Suspense fallback={<PageLoader />}>
          <MultiStepCheckout />
        </Suspense>
      </Route>
      
      <Route path="/checkout">
        <Suspense fallback={<PageLoader />}>
          <MultiStepCheckout />
        </Suspense>
      </Route>
      
      <Route path="/checkout/confirmation">
        <Suspense fallback={<PageLoader />}>
          <SuccessOrderPage />
        </Suspense>
      </Route>
      
      <Route path="/about">
        <Suspense fallback={<PageLoader />}>
          <AboutPage />
        </Suspense>
      </Route>
      
      <Route path="/contact">
        <Suspense fallback={<PageLoader />}>
          <ContactPage />
        </Suspense>
      </Route>
      
      <Route path="/search">
        <Suspense fallback={<PageLoader />}>
          <SearchPage />
        </Suspense>
      </Route>
      
      <Route path="/blog">
        <Suspense fallback={<PageLoader />}>
          <BlogPage />
        </Suspense>
      </Route>
      
      <Route path="/blog/:slug">
        <Suspense fallback={<PageLoader />}>
          <BlogPostPage />
        </Suspense>
      </Route>
      
      <Route path="/certifications">
        <Suspense fallback={<PageLoader />}>
          <CertificationsPage />
        </Suspense>
      </Route>
      
      <Route path="/privacy-policy">
        <Suspense fallback={<PageLoader />}>
          <PrivacyPolicy />
        </Suspense>
      </Route>
      
      <Route path="/terms-of-service">
        <Suspense fallback={<PageLoader />}>
          <TermsOfService />
        </Suspense>
      </Route>
      
      <Route path="/shipping-policy">
        <Suspense fallback={<PageLoader />}>
          <ShippingPolicy />
        </Suspense>
      </Route>
      
      <Route path="/return-policy">
        <Suspense fallback={<PageLoader />}>
          <ReturnPolicy />
        </Suspense>
      </Route>
      
      <Route path="/stripe-test">
        <Suspense fallback={<PageLoader />}>
          {React.createElement(React.lazy(() => import("./pages/StripeTest")))}
        </Suspense>
      </Route>
      
      <Route path="/admin/orders">
        <Suspense fallback={<PageLoader />}>
          <AdminOrdersPage />
        </Suspense>
      </Route>
      
      <Route path="/admin/orders/:id">
        <Suspense fallback={<PageLoader />}>
          <AdminOrderDetailPage />
        </Suspense>
      </Route>
      

      
      <Route>
        <Suspense fallback={<PageLoader />}>
          <NotFound />
        </Suspense>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AffiliateProvider>
          <CartProvider>
            <Toaster />
            <Router />
          </CartProvider>
        </AffiliateProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
