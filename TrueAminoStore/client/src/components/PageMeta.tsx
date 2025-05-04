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
      
      {/* Performance Optimizations */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" media="print" />
      
      {/* Font display swap for faster perceived load times */}
      <style>
        {`
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url(https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2) format('woff2');
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: url(https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2) format('woff2');
          }
        `}
      </style>
      
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