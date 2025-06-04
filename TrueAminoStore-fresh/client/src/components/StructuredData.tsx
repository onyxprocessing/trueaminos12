import { Helmet } from 'react-helmet-async';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  slug: string;
}

interface StructuredDataProps {
  type: 'website' | 'product' | 'organization';
  data?: any;
  product?: Product;
}

export default function StructuredData({ type, data, product }: StructuredDataProps) {
  // Default organization data
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TrueAminos",
    "url": "https://trueaminos.com",
    "logo": "https://trueaminos.com/favicon-32x32.png",
    "description": "Premium quality research peptides and SARMs for scientific purposes.",
    ...(data || {})
  };
  
  // Website data
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TrueAminos",
    "url": "https://trueaminos.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://trueaminos.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    ...(data || {})
  };
  
  // Product data (requires a product to be passed)
  const productData = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "productID": product.id.toString(),
    "name": product.name,
    "description": product.description,
    "url": `https://trueaminos.com/product/${product.slug}`,
    "image": product.imageUrl || "https://trueaminos.com/facebook-card.svg",
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": `https://trueaminos.com/product/${product.slug}`
    },
    "brand": {
      "@type": "Brand",
      "name": "TrueAminos"
    },
    ...(data || {})
  } : {};
  
  // Select the correct data structure based on type
  const jsonLdData = type === 'product' && product 
    ? productData 
    : type === 'organization' 
      ? organizationData 
      : websiteData;
  
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLdData)}
      </script>
    </Helmet>
  );
}