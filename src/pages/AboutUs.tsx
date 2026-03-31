import React from 'react';
import { Target, Users, Rocket, Smartphone, Brain, Map } from 'lucide-react';

export default function AboutUs() {
  const developers = [
    {
      name: 'Kushal Bhandari',
      role: 'Full Stack Developer',
      bio: 'Passionate about building scalable web applications and creating intuitive user experiences. Kushal leads the core architecture of KhojTalas.',
      image: 'https://picsum.photos/seed/kushal/400/400'
    },
    {
      name: 'Sandesh Bharati',
      role: 'Frontend Engineer',
      bio: 'Specializes in crafting beautiful, responsive, and accessible user interfaces. Sandesh ensures KhojTalas is easy to use for everyone.',
      image: 'https://picsum.photos/seed/sandesh/400/400'
    },
    {
      name: 'Bishal Magar',
      role: 'Backend Developer',
      bio: 'Expert in database design and server-side logic. Bishal manages the secure data flow and matching algorithms behind the scenes.',
      image: 'https://picsum.photos/seed/bishal/400/400'
    }
  ];

  const futurePlans = [
    {
      title: 'Mobile Application',
      description: 'Launching dedicated iOS and Android apps for on-the-go reporting and instant push notifications.',
      icon: Smartphone
    },
    {
      title: 'AI Image Recognition',
      description: 'Implementing advanced AI to automatically match lost and found items based on uploaded photos.',
      icon: Brain
    },
    {
      title: 'Smart Drop-off Points',
      description: 'Partnering with local businesses to create verified safe drop-off zones for found items.',
      icon: Map
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-brand-orange/10 px-8 py-16 text-center border-b border-brand-orange/20">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">About KhojTalas</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Your trusted community platform for reuniting people with their lost belongings. We believe that losing something valuable shouldn't mean it's gone forever.
            </p>
          </div>

          <div className="p-8 md:p-12 space-y-16">
            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Target className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Our mission is to create a seamless, community-driven network where finding and returning lost items is easy, secure, and efficient. By leveraging location-based matching and detailed item categorization, we maximize the chances of successful reunions.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Our Community</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  KhojTalas is built on trust and community support. We encourage everyone to help out their neighbors and make the world a little bit better by returning lost items to their rightful owners.
                </p>
              </div>
            </div>

            {/* Developers Section */}
            <div>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Meet the Developers</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  The passionate team behind KhojTalas, working hard to bring this community platform to life.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {developers.map((dev) => (
                  <div key={dev.name} className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100 hover:shadow-md transition-shadow">
                    <img 
                      src={dev.image} 
                      alt={dev.name} 
                      referrerPolicy="no-referrer"
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-sm"
                    />
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{dev.name}</h3>
                    <p className="text-brand-orange font-medium text-sm mb-4">{dev.role}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{dev.bio}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Future Plans Section */}
            <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl mb-4">
                  <Rocket className="w-6 h-6 text-brand-orange" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Future Plans</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  We are constantly evolving to make KhojTalas even better. Here is a sneak peek at what we are building next.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {futurePlans.map((plan) => (
                  <div key={plan.title} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <plan.icon className="w-8 h-8 text-brand-orange mb-4" />
                    <h3 className="text-lg font-bold mb-2">{plan.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{plan.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
