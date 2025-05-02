import React, { useState } from 'react'
import Layout from '@/components/Layout'
import FDADisclaimer from '@/components/FDADisclaimer'
import Newsletter from '@/components/Newsletter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Phone, Mail, Clock, CheckCircle2 } from 'lucide-react'

const ContactPage: React.FC = () => {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    
    try {
      // Submit form data to Airtable via our API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message')
      }
      
      toast({
        title: 'Message sent!',
        description: 'We have received your message and will get back to you soon.',
      })
      
      setSubmitted(true)
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      console.error('Contact form submission error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send your message. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Layout
      title="Contact Us | TrueAminos Research Peptides & SARMs"
      description="Get in touch with TrueAminos for questions about our research peptides, SARMs, and supplements. Located in Franklin, TN."
    >
      {/* Contact Hero */}
      <section className="bg-gradient-to-r from-primary to-accent py-16">
        <div className="container mx-auto px-4 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg opacity-90">
              Have questions about our research compounds? Get in touch with our team.
            </p>
          </div>
        </div>
      </section>
      
      {/* Contact Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div>
              <h2 className="font-heading text-2xl font-bold mb-6">Contact Information</h2>
              
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 text-primary flex-shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Address</h3>
                      <p className="text-gray-600">342 Cool Springs Blvd<br />Franklin, TN 37067</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 text-primary flex-shrink-0">
                      <Phone size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Phone</h3>
                      <p className="text-gray-600">615-812-9999</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 text-primary flex-shrink-0">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Email</h3>
                      <p className="text-gray-600">info@trueaminos.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 text-primary flex-shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Business Hours</h3>
                      <p className="text-gray-600">Monday - Friday: 9AM - 5PM CST<br />Weekend: Closed</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-6">
                <h3 className="font-heading font-medium text-lg mb-3">Important Notice</h3>
                <p className="text-gray-700 text-sm">
                  TrueAminos products are sold strictly for in-vitro research purposes only. By contacting us, 
                  you acknowledge that you are a qualified researcher or represent a research facility. 
                  We cannot provide advice on human consumption or application of our compounds.
                </p>
              </div>
            </div>
            
            {/* Contact Form */}
            <div>
              <h2 className="font-heading text-2xl font-bold mb-6">Send Us a Message</h2>
              
              <Card>
                <CardContent className="pt-6">
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                      <p className="text-gray-600 max-w-md mb-6">
                        Thank you for contacting TrueAminos. Our team will review your message and get back to you shortly.
                      </p>
                      <Button onClick={() => setSubmitted(false)}>Send Another Message</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Your Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Your Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Select a subject</option>
                          <option value="Product Inquiry">Product Inquiry</option>
                          <option value="Order Status">Order Status</option>
                          <option value="Technical Question">Technical Question</option>
                          <option value="Return/Refund">Return/Refund</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={6}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        ></textarea>
                      </div>
                      
                      <div className="bg-yellow-50 p-3 rounded-md flex items-start">
                        <div className="mt-1 mr-2 text-yellow-500 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-xs text-yellow-800">
                          By submitting this form, you acknowledge that all products are for research purposes only.
                        </p>
                      </div>
                      
                      <Button 
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading text-2xl font-bold mb-6 text-center">Our Location</h2>
            <div className="bg-white rounded-lg shadow-sm p-2">
              <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden bg-gray-200">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3223.693367616933!2d-86.81840882377556!3d35.957433414196444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8864749aaaaaaaa%3A0x000000000000000!2s342%20Cool%20Springs%20Blvd%2C%20Franklin%2C%20TN%2037067!5e0!3m2!1sen!2sus!4v1688495433136!5m2!1sen!2sus" 
                  style={{ border: 0, width: '100%', height: '400px' }}
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="TrueAminos Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FDA Disclaimer */}
      <FDADisclaimer variant="box" />
      
      {/* Newsletter */}
      <Newsletter />
    </Layout>
  )
}

export default ContactPage
