import React, { useState } from 'react';
import { 
  HelpCircle, Search, MessageCircle, DollarSign, ShieldCheck, 
  Clock, Edit3, Zap, Lock, CheckCircle,
  UserPlus, ClipboardList, RefreshCw, Handshake,
  Mail, MapPin, Github, Linkedin, Twitter, Facebook, Instagram, Send
} from 'lucide-react';
import { toast } from 'sonner';

export default function FAQ() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send an email via a backend service
    console.log('Form submitted:', formData);
    toast.success('Message sent successfully! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const steps = [
    {
      title: "1. Sign Up",
      description: "Create your free account to start reporting and tracking your items securely.",
      icon: UserPlus
    },
    {
      title: "2. Report Item",
      description: "Fill out a simple form for your lost or found item with details, photos, and location.",
      icon: ClipboardList
    },
    {
      title: "3. Smart Match",
      description: "Our system automatically scans for potential matches based on your report details.",
      icon: RefreshCw
    },
    {
      title: "4. Connect",
      description: "If a match is found, verify the details and securely message the other party.",
      icon: MessageCircle
    },
    {
      title: "5. Safe Return",
      description: "Arrange to meet in a safe, public place to return the item to its rightful owner.",
      icon: Handshake
    }
  ];

  const faqs = [
    {
      question: "How do I report a lost item?",
      icon: Search,
      answer: "You can report a lost item by clicking on the \"Report Lost Item\" button in the navigation bar or footer. You will need to provide details about the item, including its category, description, and the location where it was lost."
    },
    {
      question: "How do I report a found item?",
      icon: ShieldCheck,
      answer: "Click on the \"Report Found Item\" button and fill out the form with the item's details, where you found it, and a photo if possible. This helps the original owner identify their belongings."
    },
    {
      question: "Is this service free?",
      icon: DollarSign,
      answer: "Yes, KhojTalas is completely free to use for reporting and finding lost items."
    },
    {
      question: "How do I contact the person who found my item?",
      icon: MessageCircle,
      answer: "Once a match is found or you identify your item in the browse section, you can use the secure messaging system to contact the finder and arrange for the safe return of your item."
    },
    {
      question: "What happens after I report an item?",
      icon: Clock,
      answer: "After reporting, your item is listed in our database and our matching algorithm starts looking for potential matches. You will receive a notification if a likely match is found."
    },
    {
      question: "Can I edit my report after submitting?",
      icon: Edit3,
      answer: "Yes, you can edit your reports at any time from your User Dashboard. Simply find the item in your list and click the edit icon."
    },
    {
      question: "How does the matching system work?",
      icon: Zap,
      answer: "Our system uses location data, categories, and keywords from descriptions to find similarities between lost and found reports. The more detail you provide, the better the matching works."
    },
    {
      question: "Is my personal information safe?",
      icon: Lock,
      answer: "We take privacy seriously. Your contact information is never shown publicly. Communication happens through our secure internal messaging system until you choose to share more details."
    },
    {
      question: "What should I do if I find my lost item?",
      icon: CheckCircle,
      answer: "If you've successfully recovered your item, please mark it as 'Resolved' in your dashboard. This helps us keep our database up to date and stops further matching attempts."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Hero Section */}
          <div className="relative bg-brand-orange/10 px-8 py-16 text-center border-b border-brand-orange/20 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            </div>
            
            <div className="relative">
              <div className="inline-flex items-center justify-center p-3 bg-brand-orange/20 rounded-xl mb-4">
                <HelpCircle className="w-8 h-8 text-brand-orange" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Help Center</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Everything you need to know about using KhojTalas to find or return items.
              </p>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-20">
            {/* How it Works Section */}
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">How to Use KhojTalas</h2>
                <p className="text-slate-600">Follow these simple steps to reunite with your belongings.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {steps.map((step, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 h-full hover:border-brand-orange/30 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-orange mb-4 group-hover:scale-110 transition-transform">
                        <step.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                        <div className="w-6 h-px bg-slate-200"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Common Questions</h2>
                <p className="text-slate-600">Quick answers to frequently asked questions.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                {faqs.map((faq, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-orange">
                        <faq.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.question}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-50 border border-slate-200 p-8 md:p-12 text-slate-900">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-orange blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full bg-brand-orange/40 blur-[80px]"></div>
              </div>
              
              <div className="relative max-w-2xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold mb-4">Send us a Message</h2>
                  <p className="text-slate-600">
                    Have a specific question or need assistance? Our team is here to help you.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Name"
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-orange transition-colors text-slate-900"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-orange transition-colors text-slate-900"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Subject"
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-orange transition-colors text-slate-900"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                  <textarea
                    placeholder="Your message..."
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-orange transition-colors text-slate-900 resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-4 bg-brand-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-brand-orange/90 transition-all shadow-lg shadow-brand-orange/20"
                  >
                    Send Message
                    <Send className="w-5 h-5" />
                  </button>
                </form>

                <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                  <p className="text-sm font-medium text-slate-500 mb-6 uppercase tracking-wider">Connect with us</p>
                  <div className="flex justify-center gap-6">
                    {[
                      { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com' },
                      { icon: Twitter, label: 'X', href: 'https://x.com' },
                      { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com' }
                    ].map((social, i) => (
                      <a 
                        key={i} 
                        href={social.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:bg-brand-orange hover:text-white hover:border-brand-orange hover:scale-110 transition-all duration-300"
                      >
                        <social.icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}