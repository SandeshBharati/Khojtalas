import { Link } from 'react-router-dom';
import { Search, Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-slate-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center shadow-sm">
                <Search className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Khoj<span className="text-brand-orange">Talas</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed">
              Nepal's trusted Lost & Found platform. Connecting people with their lost belongings through community and technology.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-orange transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-orange transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-orange transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li><Link to="/" className="hover:text-brand-orange transition-colors">Home</Link></li>
              <li><Link to="/report-lost" className="hover:text-brand-orange transition-colors">Report Lost Item</Link></li>
              <li><Link to="/report-found" className="hover:text-brand-orange transition-colors">Report Found Item</Link></li>
              <li><Link to="/browse" className="hover:text-brand-orange transition-colors">Browse Items</Link></li>
              <li><Link to="/user" className="hover:text-brand-orange transition-colors">My Profile</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Legal</h3>
            <ul className="space-y-4">
              <li><Link to="/terms" className="hover:text-brand-orange transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-brand-orange transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-brand-orange transition-colors">Cookie Policy</Link></li>
              <li><Link to="/faq" className="hover:text-brand-orange transition-colors">FAQ</Link></li>
              <li><Link to="/about" className="hover:text-brand-orange transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-orange" />
                <span>support@khojtalas.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-orange" />
                <span>+977-1-4XXXXXX</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} KhojTalas. Made with ❤️ in Nepal.</p>
        </div>
      </div>
    </footer>
  );
}
