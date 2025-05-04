import React, { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/empty-toaster"; // Using empty toaster to disable notifications
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/useCart";

// Only import the Home component directly for fast initial load - it's our landing page
import Home from "@/pages/Home";

// Lazy load all other page components to reduce initial bundle size
const ProductPage = lazy(() => import("@/pages/ProductPage"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const Cart = lazy(() => import("@/pages/Cart"));
const MultiStepCheckout = lazy(() => import("@/pages/checkout/MultiStepCheckout"));
const SuccessOrderPage = lazy(() => import("@/pages/checkout/SuccessOrderPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const CertificationsPage = lazy(() => import("@/pages/CertificationsPage"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const ShippingPolicy = lazy(() => import("@/pages/ShippingPolicy"));
const AdminOrdersPage = lazy(() => import("@/pages/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("@/pages/AdminOrderDetailPage"));
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
      <Route path="/" component={Home} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/products/:slug" component={ProductPage} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout/multi-step" component={MultiStepCheckout} />
      <Route path="/checkout" component={MultiStepCheckout} />
      <Route path="/checkout/confirmation" component={SuccessOrderPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/certifications" component={CertificationsPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/shipping-policy" component={ShippingPolicy} />
      <Route path="/stripe-test">
        <React.Suspense fallback={<div className="container py-10 text-center">Loading Stripe test tools...</div>}>
          {React.createElement(React.lazy(() => import("./pages/StripeTest")))}
        </React.Suspense>
      </Route>
      <Route path="/admin/orders" component={AdminOrdersPage} />
      <Route path="/admin/orders/:id" component={AdminOrderDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Router />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
