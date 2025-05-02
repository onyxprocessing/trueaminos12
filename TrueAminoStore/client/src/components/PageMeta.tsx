import { Helmet } from 'react-helmet-async';

interface PageMetaProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonicalPath?: string;
  type?: 'website' | 'article' | 'product';
}

export default function PageMeta({
  title,
  description,
  keywords = '',
  ogImage = '/facebook-card.svg',
  canonicalPath = '',
  type = 'website',
}: PageMetaProps) {
  // Build the full title with brand name
  const fullTitle = title.includes('TrueAminos')
    ? title
    : `${title} | TrueAminos`;
    
  // Build the canonical URL
  const baseUrl = 'https://trueaminos.com';
  const canonicalUrl = baseUrl + (canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`);
  
  // Different image depending on platform
  const fbImage = type === 'product' && ogImage.startsWith('/images/') 
    ? `${baseUrl}${ogImage}` 
    : `${baseUrl}/facebook-card.svg`;
  
  const twitterImage = type === 'product' && ogImage.startsWith('/images/') 
    ? `${baseUrl}${ogImage}` 
    : `${baseUrl}/twitter-card.svg`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fbImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={twitterImage} />
    </Helmet>
  );
}