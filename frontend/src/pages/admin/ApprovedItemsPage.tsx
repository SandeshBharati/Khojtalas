import { useEffect, useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Package, 
  Filter,
  RefreshCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ApprovedItemsPage() {
  const { approvedItems, isLoading, fetchApprovedItems, revokeItem } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApprovedItems();
  }, []);

  const filteredItems = approvedItems.filter(item => {
    return item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#E85D24] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search approved items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors">
            <Filter className="w-4 h-4" /> Sort: Newest
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No approved items</h3>
            <p className="text-gray-500">Items you approve will appear here.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
              <div className="w-24 h-24 bg-gray-100 rounded-xl shrink-0 overflow-hidden flex items-center justify-center">
                {item.photoData ? (
                  <img src={item.photoData} alt={item.category} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {item.brand ? `${item.brand} ${item.model || ''}` : item.category}
                  </h3>
                  <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wider shrink-0">
                    Approved
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{item.district} → {item.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{item.timeFrom}</span>
                  </div>
                  <div className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold uppercase tracking-wider text-gray-600">
                    {item.category}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {item.description}
                </p>
                
                <div className="flex items-center gap-3 mt-auto">
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to revoke approval for this item? It will be moved back to the pending queue.')) {
                        revokeItem(item.id);
                      }
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" /> Revoke approval
                  </button>
                  <Link
                    to={`/admin/items/${item.id}`}
                    className="px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-bold transition-colors ml-auto whitespace-nowrap"
                  >
                    View full →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
