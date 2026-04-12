import React from 'react';
import { Cookie, Info, Settings, ShieldCheck } from 'lucide-react';

export default function CookiePolicy() {
  const sections = [
    {
      title: "1. What Are Cookies",
      icon: Cookie,
      content: "Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site."
    },
    {
      title: "2. How We Use Cookies",
      icon: Info,
      content: "We use cookies to understand how you use our platform, to remember your preferences, and to improve your overall experience."
    },
    {
      title: "3. Types of Cookies We Use",
      icon: ShieldCheck,
      content: (
        <ul className="list-disc pl-5 text-slate-600 space-y-2 mt-2">
          <li><strong>Essential Cookies:</strong> Required for the operation of our platform.</li>
          <li><strong>Analytical/Performance Cookies:</strong> Allow us to recognize and count the number of visitors and see how visitors move around our platform.</li>
          <li><strong>Functionality Cookies:</strong> Used to recognize you when you return to our platform.</li>
        </ul>
      )
    },
    {
      title: "4. Managing Cookies",
      icon: Settings,
      content: "Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit www.aboutcookies.org or www.allaboutcookies.org."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-brand-orange/10 px-8 py-16 text-center border-b border-brand-orange/20">
            <div className="inline-flex items-center justify-center p-3 bg-brand-orange/20 rounded-xl mb-4">
              <Cookie className="w-8 h-8 text-brand-orange" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Cookie Policy</h1>
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
                    {typeof section.content === 'string' ? (
                      <p className="text-slate-600 leading-relaxed">{section.content}</p>
                    ) : (
                      section.content
                    )}
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
