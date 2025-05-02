import React from 'react';
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
  let structuredData = {};

  // Website Schema
  if (type === 'website') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'TrueAminos',
      url: 'https://trueaminos.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://trueaminos.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    };
  }

  // Organization Schema
  if (type === 'organization') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'TrueAminos',
      url: 'https://trueaminos.com',
      logo: 'https://trueaminos.com/favicon-32x32.png',
      sameAs: [
        'https://facebook.com/trueaminos',
        'https://instagram.com/trueaminos',
        'https://twitter.com/trueaminos'
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Franklin',
        addressRegion: 'TN',
        addressCountry: 'US'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@trueaminos.com'
      }
    };
  }

  // Product Schema
  if (type === 'product' && product) {
    const productPrice = parseFloat(product.price);
    const imageUrl = product.imageUrl || 'https://trueaminos.com/social-share.svg';
    
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: imageUrl,
      sku: `TA-${product.id}`,
      mpn: `TA-${product.id}`,
      brand: {
        '@type': 'Brand',
        name: 'TrueAminos'
      },
      offers: {
        '@type': 'Offer',
        url: `https://trueaminos.com/product/${product.slug}`,
        priceCurrency: 'USD',
        price: productPrice,
        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'TrueAminos'
        }
      }
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}