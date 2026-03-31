import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAdmin } from '../../hooks/useAdmin';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Clock, 
  User, 
  Calendar,
  Package
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AdminItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reviewItem } = useAdmin();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'items', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate('/admin');
        }
      } catch (error) {
        console.error('Error fetching item:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, navigate]);

  const handleApprove = async () => {
    if (!item) return;
    await reviewItem(item.id, 'approve');
    setItem(prev => ({ ...prev, status: 'approved' }));
  };

  const handleReject = async () => {
    if (!item) return;
    if (!rejectNote.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    await reviewItem(item.id, 'reject', rejectNote);
    setItem(prev => ({ ...prev, status: 'rejected', admin_note: rejectNote }));
    setShowRejectInput(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#E85D24] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) return null;

  const extraFields = Object.entries(item).filter(([key]) => {
    const hiddenKeys = ['id', 'userId', 'type', 'category', 'description', 'status', 'createdAt', 'updatedAt', 'photoData', 'videoData', 'locationFromLat', 'locationFromLng', 'locationToLat', 'locationToLng', 'district', 'city', 'timeFrom', 'timeTo', 'reviewed_by', 'reviewed_at', 'admin_note', 'contactName', 'contactEmail', 'contactPhone'];
    return !hiddenKeys.includes(key) && item[key] !== undefined && item[key] !== null && item[key] !== '';
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/pending" className="p-2 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {item.brand ? `${item.brand} ${item.model || ''}` : item.category}
          </h1>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full">
            {item.category}
          </span>
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
            item.status === 'pending' ? 'bg-amber-100 text-amber-800' :
            item.status === 'approved' ? 'bg-green-100 text-green-800' :
            item.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {item.status}
          </span>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Media</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {item.photoData ? (
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity">
              <img src={item.photoData} alt="Item" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-square rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <Package className="w-8 h-8 mb-2" />
              <span className="text-xs font-medium">No photo</span>
            </div>
          )}
          {item.videoData && (
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <video src={item.videoData} controls className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Details Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Item Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
              </div>
              
              {extraFields.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Extra Fields</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {extraFields.map(([key, value]) => (
                      <div key={key}>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Map */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Location Map</h2>
            <div className="h-[300px] rounded-xl overflow-hidden border border-gray-200 z-0 relative">
              <MapContainer 
                center={[item.locationFromLat, item.locationFromLng]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[item.locationFromLat, item.locationFromLng]}>
                  <Popup>From: {item.district}, {item.city}</Popup>
                </Marker>
                {item.locationToLat && item.locationToLng && (
                  <>
                    <Marker position={[item.locationToLat, item.locationToLng]}>
                      <Popup>To Location</Popup>
                    </Marker>
                    <Polyline 
                      positions={[
                        [item.locationFromLat, item.locationFromLng],
                        [item.locationToLat, item.locationToLng]
                      ]} 
                      color="#E85D24" 
                      weight={3} 
                      dashArray="5, 10" 
                    />
                  </>
                )}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time Range */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" /> Time Range
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">From</span>
                <span className="text-sm font-medium text-gray-900">{item.timeFrom}</span>
              </div>
              {item.timeTo && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Until</span>
                  <span className="text-sm font-medium text-gray-900">{item.timeTo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submitter Details */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" /> Submitter
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                  {item.contactName ? item.contactName.substring(0, 1).toUpperCase() : item.userId.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.contactName || 'Anonymous'}</p>
                  <p className="text-xs text-gray-500">ID: {item.userId.substring(0, 8)}...</p>
                </div>
              </div>
              
              {item.contactEmail && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Email</span>
                  <span className="text-sm font-medium text-gray-900">{item.contactEmail}</span>
                </div>
              )}

              {item.contactPhone && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Phone</span>
                  <span className="text-sm font-medium text-gray-900">{item.contactPhone}</span>
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Submitted On</span>
                <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions Panel (Sticky Bottom) */}
      <div className="fixed bottom-0 left-[200px] right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500">Current Status:</span>
            <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
              item.status === 'pending' ? 'bg-amber-100 text-amber-800' :
              item.status === 'approved' ? 'bg-green-100 text-green-800' :
              item.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {item.status}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {item.status === 'pending' && !showRejectInput && (
              <>
                <button
                  onClick={handleApprove}
                  className="px-6 py-2.5 bg-[#E85D24] text-white hover:bg-[#d15320] rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve this item
                </button>
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="px-6 py-2.5 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Reject this item
                </button>
              </>
            )}
            
            {showRejectInput && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
                <input
                  type="text"
                  placeholder="Reason for rejection (required)..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-64 px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  autoFocus
                />
                <button
                  onClick={handleReject}
                  className="px-6 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shadow-sm"
                >
                  Confirm reject
                </button>
                <button
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectNote('');
                  }}
                  className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-bold"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {item.status !== 'pending' && (
              <div className="text-sm text-gray-500 italic">
                {item.status === 'approved' && 'This item is currently visible on the public feed.'}
                {item.status === 'rejected' && `Rejected: ${item.admin_note || 'No reason provided'}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
