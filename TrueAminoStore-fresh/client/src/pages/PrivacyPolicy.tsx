import React from 'react'
import Layout from '@/components/Layout'
import PageMeta from '@/components/PageMeta'

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageMeta
        title="Privacy Policy | TrueAminos"
        description="Privacy Policy for TrueAminos. Learn how we collect, use, and protect your information on trueaminos.com."
        keywords="privacy policy, TrueAminos privacy, data protection, customer privacy"
        canonicalPath="/privacy-policy"
        type="website"
      />
      
      <Layout title="Privacy Policy">
        <div className="container px-6 md:px-8 mx-auto max-w-3xl py-12">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              Last Updated: May 2, 2025
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Introduction</h2>
            <p>
              TrueAminos ("we," "our," or "us") respects your privacy and is committed to protecting it through our compliance with this policy. This policy describes the types of information we may collect from you or that you may provide when you visit trueaminos.com (our "Website") and our practices for collecting, using, maintaining, protecting, and disclosing that information.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Information We Collect</h2>
            <p>
              We collect several types of information from and about users of our Website, including information:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>By which you may be personally identified, such as name, postal address, email address, telephone number, or any other identifier by which you may be contacted online or offline ("personal information");</li>
              <li>That is about you but individually does not identify you, such as your shopping preferences; and</li>
              <li>About your internet connection, the equipment you use to access our Website, and usage details.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">How We Collect Your Information</h2>
            <p>
              We collect this information:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>Directly from you when you provide it to us, including when you create an account, place an order, sign up for our newsletter, or contact us.</li>
              <li>Automatically as you navigate through the Website, including usage details, IP addresses, and information collected through cookies and other tracking technologies.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
            <p>
              We use information that we collect about you or that you provide to us:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>To present our Website and its contents to you.</li>
              <li>To provide you with information, products, or services that you request from us.</li>
              <li>To fulfill any other purpose for which you provide it, including processing and delivering your orders.</li>
              <li>To provide you with notices about your account, including order confirmations and invoices.</li>
              <li>To carry out our obligations and enforce our rights arising from any contracts entered into between you and us.</li>
              <li>To notify you about changes to our Website or any products or services we offer or provide through it.</li>
              <li>To improve our Website, products, services, marketing, and customer relationships.</li>
              <li>In any other way we may describe when you provide the information.</li>
              <li>For any other purpose with your consent.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Disclosure of Your Information</h2>
            <p>
              We may disclose aggregated information about our users, and information that does not identify any individual, without restriction.
            </p>
            <p className="mt-4">
              We may disclose personal information that we collect or you provide as described in this privacy policy:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>To contractors, service providers, and other third parties we use to support our business, such as payment processors and shipping companies.</li>
              <li>To fulfill the purpose for which you provide it.</li>
              <li>For any other purpose disclosed by us when you provide the information.</li>
              <li>With your consent.</li>
              <li>To comply with any court order, law, or legal process, including to respond to any government or regulatory request.</li>
              <li>To enforce or apply our terms of use and other agreements, including for billing and collection purposes.</li>
              <li>If we believe disclosure is necessary or appropriate to protect the rights, property, or safety of TrueAminos, our customers, or others.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Data Security</h2>
            <p>
              We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All payment transactions are encrypted using SSL technology.
            </p>
            <p className="mt-4">
              Unfortunately, the transmission of information via the internet is not completely secure. Although we do our best to protect your personal information, we cannot guarantee the security of your personal information transmitted to our Website. Any transmission of personal information is at your own risk. We are not responsible for circumvention of any privacy settings or security measures contained on the Website.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Your Rights and Choices</h2>
            <p>
              You can review and change your personal information by logging into the Website and visiting your account profile page.
            </p>
            <p className="mt-4">
              You may also send us an email at privacy@trueaminos.com to request access to, correct, or delete any personal information that you have provided to us. We may not accommodate a request to change information if we believe the change would violate any law or legal requirement or cause the information to be incorrect.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Changes to Our Privacy Policy</h2>
            <p>
              It is our policy to post any changes we make to our privacy policy on this page. If we make material changes to how we treat our users' personal information, we will notify you through a notice on the Website home page. The date the privacy policy was last revised is identified at the top of the page.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Contact Information</h2>
            <p>
              To ask questions or comment about this privacy policy and our privacy practices, contact us at:
            </p>
            <p className="mt-3">
              <strong>Email:</strong> privacy@trueaminos.com
            </p>
            <p>
              <strong>Address:</strong> TrueAminos LLC<br />
              123 Health Boulevard<br />
              Wellness City, WL 12345<br />
              United States
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
}