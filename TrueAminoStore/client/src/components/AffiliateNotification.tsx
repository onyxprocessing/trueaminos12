import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { useAffiliateCode } from '@/hooks/useAffiliateCode';

interface AffiliateNotificationProps {
  onClose?: () => void;
}

const AffiliateNotification: React.FC<AffiliateNotificationProps> = ({ onClose }) => {
  const { affiliateCode, discountPercentage } = useAffiliateCode();
  const [isVisible, setIsVisible] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [hasShownForCurrentCode, setHasShownForCurrentCode] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a ref parameter in the current URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasRefParam = urlParams.has('ref') || urlParams.has('affiliate') || urlParams.has('code');
    
    // Only show notification if:
    // 1. There's an affiliate code with a discount
    // 2. There was a ref parameter in the URL (meaning they came from an affiliate link)
    // 3. We haven't already shown the notification for this specific code
    if (affiliateCode && discountPercentage > 0 && hasRefParam && hasShownForCurrentCode !== affiliateCode) {
      setShowNotification(true);
      setIsVisible(true);
      setHasShownForCurrentCode(affiliateCode);
      
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [affiliateCode, discountPercentage, hasShownForCurrentCode]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowNotification(false);
      onClose?.();
    }, 300); // Wait for animation to complete
  };

  if (!showNotification || !affiliateCode || discountPercentage <= 0) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ease-in-out ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto border border-green-400 pointer-events-auto transform transition-all duration-300 ease-in-out ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold mb-2">
                Discount Code Applied!
              </h3>
              <p className="text-base opacity-95 mb-1">
                Use code <span className="font-bold text-white bg-white/30 px-3 py-1 rounded-md text-sm uppercase tracking-wide">{affiliateCode}</span>
              </p>
              <p className="text-lg font-semibold mb-2">
                Get <span className="text-yellow-200">{discountPercentage}% OFF</span> your order
              </p>
              <p className="text-sm opacity-80">
                Discount will be applied automatically at checkout
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-3 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AffiliateNotification;