import React from 'react';
import { FileText, UserCheck, AlertTriangle, Shield, Scale } from 'lucide-react';

export default function TermsOfService() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      icon: FileText,
      content: "By accessing and using KhojTalas, you accept and agree to be bound by the terms and provision of this agreement."
    },
    {
      title: "2. User Responsibilities",
      icon: UserCheck,
      content: "Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account."
    },
    {
      title: "3. Reporting Items",
      icon: AlertTriangle,
      content: "When reporting lost or found items, you agree to provide accurate and truthful information. False reporting may result in account suspension."
    },
    {
      title: "4. Privacy",
      icon: Shield,
      content: "Your use of KhojTalas is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices."
    },
    {
      title: "5. Modifications",
      icon: Scale,
      content: "We reserve the right to modify these terms at any time. Your continued use of the service following any changes indicates your acceptance of the new terms."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-brand-orange/10 px-8 py-16 text-center border-b border-brand-orange/20">
            <div className="inline-flex items-center justify-center p-3 bg-brand-orange/20 rounded-xl mb-4">
              <FileText className="w-8 h-8 text-brand-orange" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
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
