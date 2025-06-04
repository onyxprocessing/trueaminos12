import React from 'react'
import { Link } from 'wouter'
import { Category } from '@shared/schema'

interface CategoryCardProps {
  category: Category
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const getDescription = (slug: string): string => {
    switch (slug) {
      case 'peptides':
        return 'BPC-157, GLP-1, Semax & more'
      case 'sarms':
        return 'MK-677, RAD-140, capsules & droppers'
      case 'supplements':
        return 'NAD+, Methylene Blue & more'
      case 'accessories':
        return 'Bacteriostatic water, syringes & more'
      default:
        return 'Research compounds'
    }
  }
  
  return (
    <Link href={`/category/${category.slug}`}>
      <a className="relative h-64 rounded-lg overflow-hidden group block">
        <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
          {category.imageUrl ? (
            <img 
              src={category.imageUrl} 
              alt={category.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error("Category image failed to load:", category.imageUrl);
                const imgElement = e.target as HTMLImageElement;
                
                // Remove the failed image
                imgElement.style.display = 'none';
                
                // Create and insert placeholder
                const placeholderDiv = document.createElement('div');
                placeholderDiv.className = 'w-full h-full flex items-center justify-center bg-gray-200';
                placeholderDiv.innerHTML = `
                  <div class="w-16 h-16 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                `;
                
                // Insert the placeholder after the image
                imgElement.parentNode?.insertBefore(placeholderDiv, imgElement.nextSibling);
              }}
            />
          ) : (
            <div className="w-16 h-16 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-heading font-semibold text-xl text-white">{category.name}</h3>
          <p className="text-gray-200 text-sm">{getDescription(category.slug)}</p>
        </div>
        <div className="absolute inset-0 bg-primary bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </a>
    </Link>
  )
}

export default CategoryCard
