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

  useEffect(() => {
    // Show notification when affiliate code is detected
    if (affiliateCode && discountPercentage > 0) {
      setShowNotification(true);
      setIsVisible(true);
      
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [affiliateCode, discountPercentage]);

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
    <div className={`fixed top-6 right-6 z-50 transition-all duration-300 ease-in-out ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
    }`}>
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-xl p-4 max-w-sm border border-green-400">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold mb-1">
                Discount Code Applied!
              </h3>
              <p className="text-sm opacity-90">
                Use code <span className="font-bold text-white bg-white/20 px-2 py-1 rounded text-xs uppercase">{affiliateCode}</span> for <span className="font-bold">{discountPercentage}% off</span> your order
              </p>
              <p className="text-xs opacity-75 mt-1">
                Discount will be applied at checkout
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AffiliateNotification;