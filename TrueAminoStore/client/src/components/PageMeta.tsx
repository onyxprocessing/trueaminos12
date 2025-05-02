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
  keywords,
  ogImage = '/social-share.svg',
  canonicalPath = '',
  type = 'website'
}: PageMetaProps) {
  // Construct the full page title with the site name
  const fullTitle = `${title} | TrueAminos`;
  const baseUrl = 'https://trueaminos.com';
  const fullCanonical = `${baseUrl}${canonicalPath}`;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonical} />
    </Helmet>
  );
}