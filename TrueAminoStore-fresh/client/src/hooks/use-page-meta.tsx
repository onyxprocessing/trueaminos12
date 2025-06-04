import { useLocation } from 'react-router-dom';
import { 
  HOME_META,
  ABOUT_META, 
  SHOP_META, 
  CONTACT_META, 
  CART_META,
  PEPTIDES_CATEGORY_META,
  SARMS_CATEGORY_META,
  BPC157_META,
  NAD_META,
  SERMORELIN_META,
  TB500_META,
  DEFAULT_META
} from '../data/pageMeta';

interface PageMeta {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
  canonicalPath: string;
  type: 'website' | 'article' | 'product';
}

/**
 * A hook that returns the appropriate meta data based on the current route
 * or the product/category being viewed
 */
export function usePageMeta(
  productSlug?: string, 
  categorySlug?: string,
  overrideMeta?: Partial<PageMeta>
): PageMeta {
  const location = useLocation();
  const path = location.pathname;
  
  // Helper to determine the base meta for the current page
  const getBaseMeta = (): PageMeta => {
    // Check for product pages
    if (productSlug) {
      if (productSlug === 'bpc-157') return BPC157_META;
      if (productSlug === 'nad') return NAD_META;
      if (productSlug === 'sermorelin') return SERMORELIN_META;
      if (productSlug === 'tb-500') return TB500_META;
    }
    
    // Check for category pages
    if (categorySlug) {
      if (categorySlug === 'peptides') return PEPTIDES_CATEGORY_META;
      if (categorySlug === 'sarms') return SARMS_CATEGORY_META;
    }
    
    // Check path-based pages
    if (path === '/') return HOME_META;
    if (path === '/about') return ABOUT_META;
    if (path === '/shop') return SHOP_META;
    if (path === '/contact') return CONTACT_META;
    if (path === '/cart') return CART_META;
    
    // Use default for any other routes
    return DEFAULT_META;
  };
  
  // Get the base meta for this page
  const baseMeta = getBaseMeta();
  
  // Merge with any override properties
  return {
    ...baseMeta,
    ...overrideMeta,
  };
}