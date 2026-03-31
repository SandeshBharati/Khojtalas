import { useEffect } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Package, 
  ArrowRight,
  User,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { stats, pendingItems, isLoading, reviewItem } = useAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#E85D24] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1a1a18] rounded-2xl p-6 text-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Pending</h3>
            <Clock className="w-5 h-5 text-[#E85D24]" />
          </div>
          <p className="text-4xl font-black text-[#E85D24]">{stats.pending}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Approved Today</h3>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-4xl font-black text-green-500">{stats.approved_today}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Rejected Today</h3>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-4xl font-black text-red-500">{stats.rejected_today}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Items</h3>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-4xl font-black text-gray-900">{stats.total_items}</p>
        </div>
      </div>

      {/* Quick Action Queue */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Pending Items</h2>
          <Link to="/admin/pending" className="text-sm font-medium text-[#E85D24] hover:underline flex items-center gap-1">
            View all queue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {pendingItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Queue is empty</h3>
            <p className="text-gray-500">All caught up! No items pending review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingItems.slice(0, 5).map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0 overflow-hidden flex items-center justify-center">
                  {item.photoData ? (
                    <img src={item.photoData} alt={item.category} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#E85D24]">{item.category}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                          Pending
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {item.brand ? `${item.brand} ${item.model || ''}` : item.category}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{item.district}, {item.city}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => reviewItem(item.id, 'approve')}
                      className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => {
                        const note = window.prompt("Reason for rejection (required):");
                        if (note) {
                          reviewItem(item.id, 'reject', note);
                        }
                      }}
                      className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <Link
                      to={`/admin/items/${item.id}`}
                      className="px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-bold transition-colors ml-auto"
                    >
                      View full →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
