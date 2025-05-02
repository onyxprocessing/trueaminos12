import { Helmet } from 'react-helmet-async';
import { Product } from '@shared/schema';
import StructuredData from './StructuredData';

interface ProductSEOProps {
  product: Product;
}

export default function ProductSEO({ product }: ProductSEOProps) {
  // Use the custom meta description if available, otherwise use the product description
  // The meta field contains our custom SEO descriptions for each product
  const metaDescription = product.meta || product.description;
  
  // Generate product-specific title
  const title = `${product.name} - Research Peptide | TrueAminos`;
  
  // Generate keywords based on product name and description
  const keywords = `${product.name}, ${product.name.toLowerCase()} research, peptide research, buy ${product.name.toLowerCase()}, true aminos ${product.name.toLowerCase()}`;
  
  // Use product image for og:image if available
  const ogImage = product.imageUrl || '/facebook-card.svg';
  const twitterImage = product.imageUrl || '/twitter-card.svg';
  
  // Canonical URL for this product
  const canonicalUrl = `https://trueaminos.com/product/${product.slug}`;
  
  // Format price for structured data
  const productPrice = product.price5mg || product.price || '0';
  
  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={keywords} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={ogImage} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={twitterImage} />
      </Helmet>
      
      {/* Add Structured Data for this product */}
      <StructuredData 
        type="product" 
        product={{
          id: product.id,
          name: product.name,
          description: metaDescription,
          price: productPrice,
          imageUrl: product.imageUrl,
          slug: product.slug
        }} 
      />
    </>
  );
}