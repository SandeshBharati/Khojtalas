import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Link as LinkIcon, 
  LogOut 
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

export default function AdminLayout() {
  const { profile } = useAuth();
  const location = useLocation();
  const { stats } = useAdmin();

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!profile) {
    return <Navigate to="/login" />;
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/pending', label: 'Pending review', icon: Clock, badge: stats?.pending || 0 },
    { path: '/admin/approved', label: 'Approved', icon: CheckCircle2 },
    { path: '/admin/rejected', label: 'Rejected', icon: XCircle },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/matches', label: 'Matches', icon: LinkIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[200px] bg-[#1a1a18] text-white flex flex-col shrink-0">
        <div className="p-6">
          <Link to="/" className="flex flex-col">
            <div className="text-2xl font-black tracking-tighter">
              <span className="text-white">Khoj</span>
              <span className="text-[#E85D24]">Talas</span>
            </div>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Admin panel</span>
          </Link>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${
                      isActive 
                        ? 'text-white bg-white/5 border-l-4 border-[#E85D24]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-[#E85D24] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="mb-4 px-2">
            <p className="text-xs text-gray-500 mb-1">Logged in as</p>
            <p className="text-sm text-gray-300 truncate">{profile.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 capitalize">
              {location.pathname === '/admin' ? 'Dashboard' : location.pathname.split('/').pop()?.replace('-', ' ')}
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
              {profile.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700">{profile.email}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
