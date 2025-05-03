import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/useCart";
import Home from "@/pages/Home";
import ProductPage from "@/pages/ProductPage";
import CategoryPage from "@/pages/CategoryPage";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
// Import the new checkout pages
import CheckoutPage from "@/pages/checkout/CheckoutPage";
import MultiStepCheckout from "@/pages/checkout/MultiStepCheckout";
import SuccessPage from "@/pages/checkout/SuccessPage";
import ProductsPage from "@/pages/ProductsPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import CertificationsPage from "@/pages/CertificationsPage";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import ShippingPolicy from "@/pages/ShippingPolicy";
import AdminOrdersPage from "@/pages/AdminOrdersPage";
import AdminOrderDetailPage from "@/pages/AdminOrderDetailPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/products/:slug" component={ProductPage} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout/multi-step" component={MultiStepCheckout} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/checkout/success" component={SuccessPage} />
      <Route path="/checkout/confirmation" component={SuccessPage} />
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
