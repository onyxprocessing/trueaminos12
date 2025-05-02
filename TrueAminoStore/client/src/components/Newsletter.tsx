import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) return
    
    setIsSubmitting(true)
    
    try {
      // Submit to the contact form API endpoint with type="newsletter"
      const response = await apiRequest<{success: boolean, message: string}>('/api/contact', {
        method: 'POST',
        data: {
          name: "",
          email: email.trim(),
          subject: "Newsletter Subscription",
          message: "Newsletter subscription request",
          type: "newsletter" // Adds the 'newsletter' value to the type field in Airtable
        }
      });
      
      if (response && response.success) {
        toast({
          title: "Success!",
          description: "You've been subscribed to our newsletter.",
        });
        setEmail('');
      } else {
        throw new Error("Subscription failed");
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <section className="py-12 md:py-16 bg-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-heading font-bold text-3xl mb-3 text-white">Stay Updated</h2>
          <p className="text-white text-opacity-90 mb-6">
            Subscribe to our newsletter for exclusive offers and research updates.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-2">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button 
              type="submit" 
              variant="secondary"
              className="px-6 py-3 whitespace-nowrap"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
          <p className="text-white text-opacity-75 text-sm mt-4">We respect your privacy. No spam, ever.</p>
        </div>
      </div>
    </section>
  )
}

export default Newsletter
