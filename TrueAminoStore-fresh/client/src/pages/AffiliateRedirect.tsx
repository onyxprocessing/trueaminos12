import React, { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAffiliateCode } from '@/hooks/useAffiliateCode';

const AffiliateRedirect: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { setAffiliateCode } = useAffiliateCode();

  useEffect(() => {
    const applyAffiliateCode = () => {
      if (!code) {
        setLocation('/');
        return;
      }

      // Store the affiliate code (will be validated at checkout)
      setAffiliateCode(code, 0); // Set discount to 0 for now, will be validated later
      
      // Redirect to home page immediately
      setLocation('/');
    };

    applyAffiliateCode();
  }, [code, setAffiliateCode, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Applying Affiliate Code</h2>
        <p className="text-gray-600">Please wait while we set up your discount...</p>
      </div>
    </div>
  );
};

export default AffiliateRedirect;