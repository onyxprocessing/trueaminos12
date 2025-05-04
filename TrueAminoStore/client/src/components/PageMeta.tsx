import { Helmet } from 'react-helmet-async';

interface PageMetaProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonicalPath?: string;
  type?: 'website' | 'article' | 'product';
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
}

export default function PageMeta({
  title,
  description,
  keywords = '',
  ogImage = '/facebook-card.svg',
  canonicalPath = '',
  type = 'website',
  publishedAt,
  updatedAt,
  author = 'TrueAminos',
}: PageMetaProps) {
  // Build the full title with brand name - keep it under 60 chars for better SEO
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
      <meta name="author" content={author} />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#4169E1" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Favicon and App Icons */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
      
      {/* Google SEO Specific */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      {publishedAt && <meta name="article:published_time" content={publishedAt} />}
      {updatedAt && <meta name="article:modified_time" content={updatedAt} />}
      <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      
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
      <meta property="og:site_name" content="TrueAminos" />
      <meta property="og:locale" content="en_US" />
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {updatedAt && <meta property="article:modified_time" content={updatedAt} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={twitterImage} />
      <meta name="twitter:site" content="@TrueAminos" />
      
      {/* JSON-LD structured data markers for Google */}
      {type === 'website' && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": baseUrl,
            "name": "TrueAminos",
            "description": "Premium research peptides, SARMs, and supplements for scientific study.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${baseUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      )}
      
      {type === 'product' && canonicalPath.includes('/products/') && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": title,
            "description": description,
            "image": fbImage,
            "brand": {
              "@type": "Brand",
              "name": "TrueAminos"
            },
            "offers": {
              "@type": "Offer",
              "url": canonicalUrl,
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            }
          })}
        </script>
      )}
    </Helmet>
  );
}