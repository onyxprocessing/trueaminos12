import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import './favicon-32x32.png';

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
      <meta property="og:image" content="https://trueaminos.com/social-share.svg" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content="https://trueaminos.com" />
      <meta property="twitter:title" content="TrueAminos | Premium Research Peptides & SARMs" />
      <meta property="twitter:description" content="Premium quality research compounds for scientific purposes. BPC-157, NAD+, Sermorelin, GLP1, Semax, and more with verified purity." />
      <meta property="twitter:image" content="https://trueaminos.com/social-share.svg" />
      
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
    <App />
  </HelmetProvider>
);
