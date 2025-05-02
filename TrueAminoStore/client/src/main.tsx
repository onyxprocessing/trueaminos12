import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import './favicon-32x32.png';

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Helmet>
      <title>TrueAminos | Research Peptides & SARMs | Franklin, TN</title>
      <meta name="description" content="TrueAminos offers high-quality research peptides, SARMs, and supplements. Shop BPC-157, NAD+, Sermorelin, GLP1, and more. Free shipping available." />
      <meta name="keywords" content="research peptides, SARMs, BPC-157, NAD+, Sermorelin, GLP1, Semax, mk677, rad 140" />
      <meta property="og:title" content="TrueAminos | Research Peptides & SARMs" />
      <meta property="og:description" content="Premium quality research compounds for scientific purposes. BPC-157, NAD+, Sermorelin, GLP1, Semax, and more." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://trueaminos.com" />
      <link rel="canonical" href="https://trueaminos.com" />
    </Helmet>
    <App />
  </HelmetProvider>
);
