import { Link, useNavigate } from 'react-router-dom';
import { Search, LogOut, ShieldAlert, LogIn, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import NotificationBell from './common/NotificationBell';
import { useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-8">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center shadow-sm">
            <Search className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Khoj<span className="text-brand-orange">Talas</span>
          </span>
        </Link>
        
        <form onSubmit={handleSearch} className="hidden md:flex flex-grow max-w-xl relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-orange transition-colors" />
          <input 
            type="text" 
            placeholder="Search lost items..." 
            className="w-full bg-slate-100 border-none rounded-lg py-3 pl-12 pr-10 focus:ring-2 focus:ring-brand-orange/20 focus:bg-white outline-none transition-all text-slate-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/report-lost" className="text-slate-600 hover:text-brand-orange font-medium transition-colors">Report Lost</Link>
            <Link to="/report-found" className="text-slate-600 hover:text-brand-orange font-medium transition-colors">Report Found</Link>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" /> Admin
                  </Link>
                )}
                <Link to="/user" className="text-slate-600 hover:text-brand-orange font-medium transition-colors">
                  User Panel
                </Link>
                <NotificationBell />
                <button onClick={handleLogout} className="text-slate-600 hover:text-red-600 font-medium flex items-center gap-1 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-brand-orange text-white px-6 py-2.5 rounded-lg hover:bg-brand-orange/90 font-semibold transition-all shadow-sm flex items-center gap-2">
                <LogIn className="w-5 h-5" /> Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
