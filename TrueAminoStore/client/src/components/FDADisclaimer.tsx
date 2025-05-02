import React from 'react'

interface FDADisclaimerProps {
  variant?: 'banner' | 'box'
  className?: string
}

const FDADisclaimer: React.FC<FDADisclaimerProps> = ({ variant = 'banner', className = '' }) => {
  if (variant === 'banner') {
    return (
      <div className={`bg-blue-100 text-blue-800 p-3 shadow-sm z-10 ${className}`}>
        <div className="container mx-auto px-4">
          <p className="font-medium text-center text-sm md:text-base">
            FDA Disclaimer: These products are for research purposes only. Not for human consumption.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <section className={`py-8 bg-gray-100 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white p-5 md:p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <h3 className="font-heading font-semibold text-lg md:text-xl mb-2">FDA Disclaimer</h3>
          <p className="text-gray-700 mb-4 text-sm md:text-base">
            These products are NOT intended for human or veterinary use. These products are for laboratory research and development purposes only. 
            Purchase of these items requires acceptance of our terms that the purchaser is solely responsible for ensuring products are used 
            in a lawful manner and according to relevant regulations.
          </p>
          <p className="text-gray-700 text-sm md:text-base">
            All products sold by TrueAminos.com are intended for in-vitro research and development use only. Products are NOT for human 
            consumption or any form of in-vivo research or medical use.
          </p>
        </div>
      </div>
    </section>
  )
}

export default FDADisclaimer
