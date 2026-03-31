import { useState, useMemo } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Package, 
  User,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReviewQueuePage() {
  const { pendingItems, isLoading, reviewItem } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({});

  const tabs = ['All', 'Electronics', 'Wallet/Money', 'Documents', 'Jewellery', 'Clothing', 'Vehicle', 'Other'];

  const filteredItems = useMemo(() => {
    return pendingItems.filter(item => {
      const matchesSearch = 
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const categoryMap: Record<string, string> = {
        'electronics': 'Electronics',
        'wallet': 'Wallet/Money',
        'documents': 'Documents',
        'jewellery': 'Jewellery',
        'clothing': 'Clothing',
        'vehicles': 'Vehicle',
        'keys': 'Other',
        'musical_instruments': 'Other',
        'glasses': 'Other',
        'person': 'Other',
        'pets': 'Other',
        'bags': 'Other',
        'other': 'Other'
      };

      const mappedCategory = categoryMap[item.category] || 'Other';
      const matchesTab = activeTab === 'All' || mappedCategory === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [pendingItems, searchQuery, activeTab]);

  const handleRejectClick = (id: string) => {
    setShowRejectInput(prev => ({ ...prev, [id]: true }));
  };

  const handleConfirmReject = (id: string) => {
    const note = rejectNotes[id];
    if (!note || note.trim() === '') {
      // Trigger visual error state (could add a red border class)
      const input = document.getElementById(`reject-input-${id}`);
      if (input) {
        input.classList.add('border-red-500', 'ring-red-500');
        setTimeout(() => input.classList.remove('border-red-500', 'ring-red-500'), 2000);
      }
      return;
    }
    reviewItem(id, 'reject', note);
    setShowRejectInput(prev => ({ ...prev, [id]: false }));
    setRejectNotes(prev => ({ ...prev, [id]: '' }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#E85D24] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search pending items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E85D24] focus:border-transparent outline-none transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors">
            <Filter className="w-4 h-4" /> Sort: Newest
          </button>
        </div>
        
        <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'bg-[#1a1a18] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Queue is empty</h3>
            <p className="text-gray-500">No pending items match your filters.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
              {/* LEFT: Photo */}
              <div className="w-24 h-24 bg-gray-100 rounded-xl shrink-0 overflow-hidden flex items-center justify-center">
                {item.photoData ? (
                  <img src={item.photoData} alt={item.category} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-gray-400" />
                )}
              </div>
              
              {/* RIGHT: Details */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Row 1 */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {item.brand ? `${item.brand} ${item.model || ''}` : item.category}
                  </h3>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider shrink-0">
                    Pending
                  </span>
                </div>
                
                {/* Row 2 */}
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
                
                {/* Row 3 */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {item.description}
                </p>
                
                {/* Row 4 */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                    {item.userId.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-700">User ID: {item.userId.substring(0, 8)}...</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>Submitted {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'recently'}</span>
                </div>
                
                <hr className="border-gray-100 mb-4" />
                
                {/* Row 5: Actions */}
                <div className="flex items-center gap-3 mt-auto">
                  {!showRejectInput[item.id] ? (
                    <>
                      <button
                        onClick={() => reviewItem(item.id, 'approve')}
                        className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectClick(item.id)}
                        className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
                      <input
                        id={`reject-input-${item.id}`}
                        type="text"
                        placeholder="Reason for rejection (required)..."
                        value={rejectNotes[item.id] || ''}
                        onChange={(e) => setRejectNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                        autoFocus
                      />
                      <button
                        onClick={() => handleConfirmReject(item.id)}
                        className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
                      >
                        Confirm reject
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectInput(prev => ({ ...prev, [item.id]: false }));
                          setRejectNotes(prev => ({ ...prev, [item.id]: '' }));
                        }}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
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
