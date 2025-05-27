import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAffiliateCode } from '@/hooks/useAffiliateCode';
import { Loader2 } from 'lucide-react';

const AffiliateRedirect: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { setAffiliateCode } = useAffiliateCode();
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateAndApplyAffiliateCode = async () => {
      if (!code) {
        setLocation('/');
        return;
      }

      try {
        setIsValidating(true);
        
        // Validate the affiliate code with the server
        const response = await fetch(`/api/affiliate/validate/${code}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          // Apply the discount
          setAffiliateCode(data.code, data.discount);
          
          // Show success message briefly then redirect to home
          setTimeout(() => {
            setLocation('/');
          }, 1500);
        } else {
          setError(data.message || 'Invalid affiliate code');
          setTimeout(() => {
            setLocation('/');
          }, 3000);
        }
      } catch (err) {
        console.error('Error validating affiliate code:', err);
        setError('Error validating affiliate code');
        setTimeout(() => {
          setLocation('/');
        }, 3000);
      } finally {
        setIsValidating(false);
      }
    };

    validateAndApplyAffiliateCode();
  }, [code, setAffiliateCode, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {isValidating ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Validating Affiliate Code</h2>
            <p className="text-gray-600">Applying your discount...</p>
          </>
        ) : error ? (
          <>
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2 text-red-600">Invalid Code</h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to home page...</p>
          </>
        ) : (
          <>
            <div className="text-green-500 text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2 text-green-600">Discount Applied!</h2>
            <p className="text-gray-600">Your affiliate discount has been activated.</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to shop...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AffiliateRedirect;