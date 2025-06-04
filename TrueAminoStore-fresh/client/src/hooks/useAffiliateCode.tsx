import React, { createContext, useContext, useState, useEffect } from 'react';

interface AffiliateContextType {
  affiliateCode: string | null;
  discountPercentage: number;
  setAffiliateCode: (code: string, discount: number) => void;
  clearAffiliateCode: () => void;
  hasAffiliateDiscount: boolean;
}

const AffiliateContext = createContext<AffiliateContextType | undefined>(undefined);

export const AffiliateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [affiliateCode, setAffiliateCodeState] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);

  // Load affiliate code from localStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('affiliateCode');
    const savedDiscount = localStorage.getItem('affiliateDiscount');
    
    if (savedCode && savedDiscount) {
      setAffiliateCodeState(savedCode);
      setDiscountPercentage(parseInt(savedDiscount));
    }
  }, []);

  const setAffiliateCode = (code: string, discount: number) => {
    setAffiliateCodeState(code);
    setDiscountPercentage(discount);
    localStorage.setItem('affiliateCode', code);
    localStorage.setItem('affiliateDiscount', discount.toString());
  };

  const clearAffiliateCode = () => {
    setAffiliateCodeState(null);
    setDiscountPercentage(0);
    localStorage.removeItem('affiliateCode');
    localStorage.removeItem('affiliateDiscount');
  };

  const hasAffiliateDiscount = affiliateCode !== null && discountPercentage > 0;

  return (
    <AffiliateContext.Provider value={{
      affiliateCode,
      discountPercentage,
      setAffiliateCode,
      clearAffiliateCode,
      hasAffiliateDiscount
    }}>
      {children}
    </AffiliateContext.Provider>
  );
};

export const useAffiliateCode = () => {
  const context = useContext(AffiliateContext);
  if (context === undefined) {
    throw new Error('useAffiliateCode must be used within an AffiliateProvider');
  }
  return context;
};