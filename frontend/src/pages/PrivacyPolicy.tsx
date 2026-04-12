import React from 'react';
import { Shield, Database, Share2, Lock, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "1. Information We Collect",
      icon: Database,
      content: "We collect information you provide directly to us, such as when you create or modify your account, report an item, or communicate with us."
    },
    {
      title: "2. How We Use Your Information",
      icon: Shield,
      content: "We use the information we collect to provide, maintain, and improve our services, to process transactions, and to communicate with you."
    },
    {
      title: "3. Information Sharing",
      icon: Share2,
      content: "We do not share your personal information with third parties except as described in this privacy policy or with your consent."
    },
    {
      title: "4. Data Security",
      icon: Lock,
      content: "We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction."
    },
    {
      title: "5. Contact Us",
      icon: Mail,
      content: "If you have any questions about this Privacy Policy, please contact us at support@khojtalas.com."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-brand-orange/10 px-8 py-16 text-center border-b border-brand-orange/20">
            <div className="inline-flex items-center justify-center p-3 bg-brand-orange/20 rounded-xl mb-4">
              <Shield className="w-8 h-8 text-brand-orange" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="p-8 md:p-12">
            <div className="space-y-10">
              {sections.map((section, index) => (
                <div key={index} className="flex gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-orange">
                      <section.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">{section.title}</h2>
                    <p className="text-slate-600 leading-relaxed">{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
