// Collection of meta data for different pages
// This helps ensure consistent and optimized SEO across the site

interface PageMetaContent {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
  canonicalPath: string;
  type: 'website' | 'article' | 'product';
}

export const HOME_META: PageMetaContent = {
  title: 'Research Peptides & SARMs',
  description: 'TrueAminos offers premium research peptides, SARMs, and supplements for scientific research. Premium BPC-157, NAD+, Sermorelin, TB-500 with guaranteed quality and fast shipping.',
  keywords: 'research peptides, SARMs, BPC-157, NAD+, Sermorelin, GLP1, Semax, mk677, rad 140, peptides for sale, research chemicals',
  canonicalPath: '/',
  type: 'website'
};

export const SHOP_META: PageMetaContent = {
  title: 'Shop Research Peptides & SARMs',
  description: 'Explore our premium selection of research peptides and SARMs. Buy laboratory-tested BPC-157, NAD+, Sermorelin, and more with secure checkout and discreet packaging.',
  keywords: 'buy peptides, SARMs for sale, BPC-157 online, NAD+ supplement, research peptides store, high-quality peptides',
  canonicalPath: '/shop',
  type: 'website'
};

export const ABOUT_META: PageMetaContent = {
  title: 'About TrueAminos - Our Commitment to Quality',
  description: 'Learn about TrueAminos and our dedication to providing the highest quality research compounds. Discover our rigorous testing standards and commitment to scientific advancement.',
  keywords: 'TrueAminos company, peptide quality, research peptide testing, trusted peptide supplier, SARMs quality control',
  canonicalPath: '/about',
  type: 'website'
};

export const CONTACT_META: PageMetaContent = {
  title: 'Contact TrueAminos - Customer Support',
  description: 'Need help with your research peptide order? Contact our knowledgeable customer support team for assistance with products, orders, or scientific inquiries.',
  keywords: 'peptide customer service, research peptide support, contact TrueAminos, peptide questions, SARMs ordering help',
  canonicalPath: '/contact',
  type: 'website'
};

export const CART_META: PageMetaContent = {
  title: 'Your Cart - Research Peptides & SARMs',
  description: 'Review your TrueAminos research peptide and SARM selections. Secure checkout with multiple payment options and discreet shipping available.',
  keywords: 'buy peptides online, peptide checkout, secure peptide ordering, research compounds cart',
  canonicalPath: '/cart',
  type: 'website'
};

// Product category meta
export const PEPTIDES_CATEGORY_META: PageMetaContent = {
  title: 'Research Peptides - Premium Quality',
  description: 'Explore our selection of high-quality research peptides including BPC-157, TB-500, Sermorelin, and more. All products tested for purity and scientific research.',
  keywords: 'research peptides, BPC-157, TB-500, Sermorelin, GLP1, peptides for sale, healing peptides research',
  canonicalPath: '/category/peptides',
  type: 'website'
};

export const SARMS_CATEGORY_META: PageMetaContent = {
  title: 'SARMs - Research Compounds',
  description: 'Browse our premium SARMs for research purposes. High-purity MK-677, RAD-140, and more with certificates of analysis for scientific study.',
  keywords: 'SARMs research, MK-677, RAD-140, SARMs compounds, research SARMs, selective androgen receptor modulators',
  canonicalPath: '/category/sarms',
  type: 'website'
};

// Product-specific meta (examples)
export const BPC157_META: PageMetaContent = {
  title: 'BPC-157 Research Peptide',
  description: 'Premium BPC-157 research peptide with verified purity for scientific study. Available in multiple sizes with certificate of analysis and free shipping.',
  keywords: 'BPC-157, body protection compound, research peptide, healing peptide, BPC 157 peptide, tissue repair research',
  ogImage: '/images/products/bpc-157.jpg',
  canonicalPath: '/product/bpc-157',
  type: 'product'
};

export const NAD_META: PageMetaContent = {
  title: 'NAD+ Research Supplement',
  description: 'Premium NAD+ (Nicotinamide Adenine Dinucleotide) research supplement. Available in multiple concentrations for various scientific applications.',
  keywords: 'NAD+, Nicotinamide Adenine Dinucleotide, NAD supplement, anti-aging research, cellular energy research',
  ogImage: '/images/products/nad.jpg',
  canonicalPath: '/product/nad',
  type: 'product'
};

export const SERMORELIN_META: PageMetaContent = {
  title: 'Sermorelin Peptide for Research',
  description: 'High-quality Sermorelin peptide for scientific research. Growth hormone secretagogue with verified purity and certificate of analysis.',
  keywords: 'Sermorelin, growth hormone secretagogue, GH peptide, anti-aging research peptide, Sermorelin acetate',
  ogImage: '/images/products/sermorelin.jpg',
  canonicalPath: '/product/sermorelin',
  type: 'product'
};

export const TB500_META: PageMetaContent = {
  title: 'TB-500 Research Peptide',
  description: 'Premium TB-500 (Thymosin Beta-4) research peptide. High-purity compound available in multiple sizes for scientific investigation.',
  keywords: 'TB-500, Thymosin Beta-4, healing peptide research, recovery peptide, tissue repair study',
  ogImage: '/images/products/tb-500.jpg',
  canonicalPath: '/product/tb-500',
  type: 'product'
};

// Default meta as fallback
export const DEFAULT_META: PageMetaContent = {
  title: 'TrueAminos Research Compounds',
  description: 'TrueAminos offers high-quality research peptides, SARMs, and supplements for scientific purposes. Explore our premium products with verified purity.',
  keywords: 'research peptides, SARMs, research compounds, scientific research, premium peptides',
  canonicalPath: '',
  type: 'website'
};