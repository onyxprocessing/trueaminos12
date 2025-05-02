# TrueAminos.com - Research Peptides & SARMs E-commerce Website

This is a full-stack e-commerce website for TrueAminos, a company selling research peptides, SARMs, and research supplies. The website is built with a modern tech stack and integrates with Airtable for product data management.

## Features

- SEO-optimized website with proper meta tags for search engine visibility
- Product listings categorized by type (peptides, SARMs, supplements, accessories)
- Detailed product pages with FDA disclaimers
- Shopping cart functionality
- Checkout process
- Mobile-responsive design
- Airtable integration for product data management
- Clear FDA disclaimers throughout the site

## Technology Stack

- **Frontend**:
  - React with TypeScript
  - TailwindCSS for styling
  - Shadcn UI components
  - React Query for data fetching
  - React Helmet for SEO
  - Wouter for routing

- **Backend**:
  - Express.js
  - In-memory storage for cart functionality
  - Airtable SDK for product data

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Airtable account with API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/trueaminos.git
   cd trueaminos
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   AIRTABLE_API_KEY=patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Airtable Setup

The website is designed to integrate with Airtable for product management. Follow these steps to set up your Airtable base:

1. Create a new base in Airtable with the following tables:

### Products Table (tbl4pJbIUvWA53Arr)

| Field Name | Type | Description |
|------------|------|-------------|
| id | Number | Unique identifier for the product |
| name | Text | Product name |
| description | Long Text | Product description |
| price | Number | Product price in USD |
| categoryId | Number | Foreign key to Categories table |
| imageUrl | Text | URL to product image (optional) |
| slug | Text | URL-friendly version of product name |
| inStock | Checkbox | Whether the product is in stock |
| featured | Checkbox | Whether the product should be featured on the homepage |

### Categories Table

| Field Name | Type | Description |
|------------|------|-------------|
| id | Number | Unique identifier for the category |
| name | Text | Category name |
| slug | Text | URL-friendly version of category name |
| imageUrl | Text | URL to category image (optional) |

### Initial Categories Data

1. Peptides (id: 1, slug: peptides)
2. SARMs (id: 2, slug: sarms)
3. Supplements (id: 3, slug: supplements)
4. Accessories (id: 4, slug: accessories)

### Sample Products

Add sample products to your Products table for each category:

- BPC-157 (5mg) - Peptides category
- NAD+ (500mg) - Supplements category
- MK-677 (30mL Dropper) - SARMs category
- Sermorelin (5mg) - Peptides category
- Bacteriostatic Water - Accessories category
- RAD-140 Capsules - SARMs category
- GLP-1 (5mg) - Peptides category
- Methylene Blue - Supplements category

## Important Notes

- All products on the website are marked as "for research purposes only" with FDA disclaimers
- The contact information displayed is:
  - Address: 342 Cool Springs Blvd, Franklin, TN 37067
  - Phone: 615-812-9999
  - Email: info@trueaminos.com

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
