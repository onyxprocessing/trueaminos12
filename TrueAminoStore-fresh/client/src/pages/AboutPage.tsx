import React from 'react'
import Layout from '@/components/Layout'
import FDADisclaimer from '@/components/FDADisclaimer'
import Newsletter from '@/components/Newsletter'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, FlaskRound, Shield, ShieldCheck } from 'lucide-react'

const AboutPage: React.FC = () => {
  return (
    <Layout
      title="About Us | TrueAminos Research Peptides & SARMs"
      description="Learn about TrueAminos.com, a trusted provider of premium research peptides, SARMs, and supplements for scientific research purposes."
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent py-16">
        <div className="container mx-auto px-4 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">About TrueAminos</h1>
            <p className="text-lg opacity-90">
              Your trusted source for premium research peptides and compounds
            </p>
          </div>
        </div>
      </section>
      
      {/* Mission Statement */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-gray-600">
                At TrueAminos, we're dedicated to providing researchers with the highest quality compounds for 
                advancing scientific knowledge. Our commitment to purity, accurate documentation, and 
                exceptional customer service sets us apart in the research chemical industry.
              </p>
            </div>
            
            <Card className="mb-12">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 text-primary">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-lg mb-2">Quality Assurance</h3>
                      <p className="text-gray-600">
                        All our products undergo rigorous third-party testing to ensure maximal purity and research efficacy.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 text-primary">
                      <FlaskRound size={24} />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-lg mb-2">Research Focus</h3>
                      <p className="text-gray-600">
                        Our products are designed exclusively for laboratory research and scientific exploration.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 text-primary">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-lg mb-2">Compliance</h3>
                      <p className="text-gray-600">
                        We maintain strict adherence to industry regulations and responsible distribution practices.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 text-primary">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-lg mb-2">Transparency</h3>
                      <p className="text-gray-600">
                        We provide comprehensive documentation and clear communication about all our products.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Company Story */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl font-bold mb-8 text-center">Our Story</h2>
            
            <div className="prose max-w-none">
              <p>
                Founded by a team of biochemists and research enthusiasts, TrueAminos began with a simple mission: 
                to provide research laboratories with compounds they could trust. We noticed a gap in the market 
                for consistently high-quality peptides and SARMs that researchers could rely on for their scientific work.
              </p>
              
              <p>
                Since our founding, we've expanded our catalog to include a comprehensive selection of research peptides, 
                SARMs, and auxiliary research supplies. Our team includes experts in peptide synthesis, quality control, 
                and biological research, ensuring that every product we offer meets the highest standards.
              </p>
              
              <p>
                Based in Franklin, Tennessee, our facility is equipped with modern storage and handling capabilities 
                to maintain the integrity of delicate compounds. We work with leading manufacturers and testing 
                laboratories to verify the purity and composition of every batch.
              </p>
              
              <p>
                At TrueAminos, we believe that advancing scientific research requires reliable tools. That's why 
                we're committed to being more than just a supplier—we aim to be a trusted partner in your research journey.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Quality Standards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl font-bold mb-8 text-center">Quality Standards</h2>
            
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="mt-1 mr-4 text-secondary flex-shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <p>
                      <span className="font-semibold">Purity Verification:</span> All compounds undergo HPLC (High-Performance Liquid Chromatography) 
                      testing to confirm purity levels exceeding 98%.
                    </p>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="mt-1 mr-4 text-secondary flex-shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <p>
                      <span className="font-semibold">Mass Spectrometry:</span> We use MS analysis to verify molecular composition and structural integrity.
                    </p>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="mt-1 mr-4 text-secondary flex-shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <p>
                      <span className="font-semibold">Sterility Testing:</span> Bacteriostatic water and injectable-grade compounds are tested 
                      to ensure they're free from microbial contamination.
                    </p>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="mt-1 mr-4 text-secondary flex-shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <p>
                      <span className="font-semibold">Temperature-Controlled Storage:</span> All sensitive compounds are stored in climate-controlled 
                      conditions to maintain stability and potency.
                    </p>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="mt-1 mr-4 text-secondary flex-shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <p>
                      <span className="font-semibold">Batch Documentation:</span> Every product is assigned a batch number for traceability and quality control.
                    </p>
                  </li>
                </ul>
              </CardContent>
            </Card>
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

export default AboutPage
