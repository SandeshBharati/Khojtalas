import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MapPin, Calendar, Share2, ArrowLeft, Gift, Mail, User, Search, Package } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

// Fix leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Item {
  id: string;
  userId: string;
  type: 'lost' | 'found';
  category: string;
  brand?: string;
  model?: string;
  color?: string;
  secondaryColor?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  description: string;
  lostLocationDescription?: string;
  foundLocationDescription?: string;
  timeFrom: string;
  timeTo?: string;
  locationFromLat: number;
  locationFromLng: number;
  locationToLat?: number;
  locationToLng?: number;
  photoData?: string;
  videoData?: string;
  status: string;
  createdAt: any;
  name?: string;
  estimatedValue?: string;
  district?: string;
  city?: string;
  os?: string;
  storage?: string;
  height?: string;
  lastSeenWearing?: string;
  microchipId?: string;
  collarColor?: string;
  contents?: string;
  jewelryWeight?: string;
  documentType?: string;
  age?: string;
  gender?: string;
  breed?: string;
  size?: string;
  material?: string;
  numberOfKeys?: string;
  keyType?: string;
  keychain?: string;
  itemName?: string;
  vehicleType?: string;
  licensePlate?: string;
  vin?: string;
  instrumentType?: string;
  serialNumber?: string;
  eyewearType?: string;
  frameColor?: string;
  lensColor?: string;
}

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [similarItems, setSimilarItems] = useState<Item[]>([]);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'items', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const itemData = { id: docSnap.id, ...docSnap.data() } as Item;
          
          // Check access: Only owner, admin, or if item is approved/resolved can view
          const isOwner = user?.uid === itemData.userId;
          const isAdmin = profile?.role === 'admin';
          const isPubliclyVisible = itemData.status === 'approved' || itemData.status === 'resolved';

          if (!isPubliclyVisible && !isOwner && !isAdmin) {
            toast.error('This item is not available for public viewing yet.');
            navigate('/');
            return;
          }

          setItem(itemData);
          
          // Fetch owner profile
          const userRef = doc(db, 'users', itemData.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setOwnerProfile(userSnap.data());
          }

          // Fetch similar items
          fetchSimilarItems(itemData);
        } else {
          toast.error('Item not found');
          navigate('/');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `items/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate]);

  const fetchSimilarItems = async (currentItem: Item) => {
    try {
      const q = query(
        collection(db, 'items'),
        where('category', '==', currentItem.category),
        where('status', '==', 'approved'),
        limit(4)
      );
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Item))
        .filter(i => i.id !== currentItem.id)
        .slice(0, 3);
      
      setSimilarItems(items);
    } catch (error) {
      console.error('Error fetching similar items:', error);
    }
  };

  const handleActionClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (item?.type === 'lost') {
      navigate('/report-found');
    } else {
      navigate('/report-lost');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading item details...</p>
      </div>
    );
  }

  if (!item) return null;

  const title = item.brand ? `${item.color ? item.color + ' ' : ''}${item.brand} ${item.model || ''}` : item.category.charAt(0).toUpperCase() + item.category.slice(1);
  const locationText = item.district && item.city ? `${item.district} → ${item.city}` : (item.type === 'lost' ? item.lostLocationDescription : item.foundLocationDescription) || 'Location not specified';

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Back button */}
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to listings
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content (Left) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Image */}
              <div className="bg-black rounded-2xl overflow-hidden aspect-[16/10] w-full flex items-center justify-center">
                {item.photoData ? (
                  <img src={item.photoData} alt={title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 gap-4">
                    <Package className="w-16 h-16" />
                    <p className="font-medium">No photo available</p>
                  </div>
                )}
              </div>

              {/* Details Card */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    item.type === 'lost' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {item.type}
                  </span>
                  <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>

                <h1 className="text-3xl font-bold text-slate-900">{title}</h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-orange" />
                    <span>{locationText}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{format(item.createdAt?.toDate() || new Date(), 'MMMM d, yyyy')}</span>
                  </div>
                </div>

                {item.estimatedValue && (
                  <div className="bg-orange-50 rounded-xl p-4 flex items-start gap-4 border border-orange-100">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                      <Gift className="w-5 h-5 text-brand-orange" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Reward Offered</h4>
                      <p className="text-slate-600">NPR {item.estimatedValue}</p>
                    </div>
                  </div>
                )}

                {/* Item Specific Details */}
                {(item.brand || item.model || item.color || item.secondaryColor || item.os || item.storage || item.size || item.material || item.documentType || item.name || item.age || item.gender || item.height || item.breed || item.microchipId || item.collarColor || item.jewelryWeight || item.lastSeenWearing || item.contents || item.numberOfKeys || item.keyType || item.keychain || item.itemName || item.vehicleType || item.licensePlate || item.vin || item.instrumentType || item.serialNumber || item.eyewearType || item.frameColor || item.lensColor) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    {item.itemName && (
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Item Name</p>
                        <p className="font-medium text-slate-900">{item.itemName}</p>
                      </div>
                    )}
                    {item.brand && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Brand / Type</p>
                        <p className="font-medium text-slate-900">{item.brand}</p>
                      </div>
                    )}
                    {item.model && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Model</p>
                        <p className="font-medium text-slate-900">{item.model}</p>
                      </div>
                    )}
                    {item.color && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Color</p>
                        <p className="font-medium text-slate-900">{item.color}</p>
                      </div>
                    )}
                    {item.secondaryColor && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Secondary Color</p>
                        <p className="font-medium text-slate-900">{item.secondaryColor}</p>
                      </div>
                    )}
                    {item.os && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">OS</p>
                        <p className="font-medium text-slate-900">{item.os}</p>
                      </div>
                    )}
                    {item.storage && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Storage</p>
                        <p className="font-medium text-slate-900">{item.storage}</p>
                      </div>
                    )}
                    {item.size && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Size</p>
                        <p className="font-medium text-slate-900">{item.size}</p>
                      </div>
                    )}
                    {item.material && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Material</p>
                        <p className="font-medium text-slate-900">{item.material}</p>
                      </div>
                    )}
                    {item.documentType && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Document Type</p>
                        <p className="font-medium text-slate-900">{item.documentType}</p>
                      </div>
                    )}
                    {item.name && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</p>
                        <p className="font-medium text-slate-900">{item.name}</p>
                      </div>
                    )}
                    {item.age && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Age</p>
                        <p className="font-medium text-slate-900">{item.age}</p>
                      </div>
                    )}
                    {item.gender && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</p>
                        <p className="font-medium text-slate-900 capitalize">{item.gender}</p>
                      </div>
                    )}
                    {item.height && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Height</p>
                        <p className="font-medium text-slate-900">{item.height}</p>
                      </div>
                    )}
                    {item.breed && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Breed</p>
                        <p className="font-medium text-slate-900">{item.breed}</p>
                      </div>
                    )}
                    {item.microchipId && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Microchip ID</p>
                        <p className="font-medium text-slate-900">{item.microchipId}</p>
                      </div>
                    )}
                    {item.collarColor && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Collar Color</p>
                        <p className="font-medium text-slate-900">{item.collarColor}</p>
                      </div>
                    )}
                    {item.jewelryWeight && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Weight / Carat</p>
                        <p className="font-medium text-slate-900">{item.jewelryWeight}</p>
                      </div>
                    )}
                    {item.numberOfKeys && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Number of Keys</p>
                        <p className="font-medium text-slate-900">{item.numberOfKeys}</p>
                      </div>
                    )}
                    {item.keyType && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Key Type</p>
                        <p className="font-medium text-slate-900">{item.keyType}</p>
                      </div>
                    )}
                    {item.keychain && (
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Keychain Description</p>
                        <p className="font-medium text-slate-900">{item.keychain}</p>
                      </div>
                    )}
                    {item.vehicleType && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vehicle Type</p>
                        <p className="font-medium text-slate-900">{item.vehicleType}</p>
                      </div>
                    )}
                    {item.licensePlate && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">License Plate</p>
                        <p className="font-medium text-slate-900">{item.licensePlate}</p>
                      </div>
                    )}
                    {item.vin && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">VIN</p>
                        <p className="font-medium text-slate-900">{item.vin}</p>
                      </div>
                    )}
                    {item.instrumentType && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Instrument Type</p>
                        <p className="font-medium text-slate-900">{item.instrumentType}</p>
                      </div>
                    )}
                    {item.serialNumber && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Serial Number</p>
                        <p className="font-medium text-slate-900">{item.serialNumber}</p>
                      </div>
                    )}
                    {item.eyewearType && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Eyewear Type</p>
                        <p className="font-medium text-slate-900">{item.eyewearType}</p>
                      </div>
                    )}
                    {item.frameColor && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Frame Color</p>
                        <p className="font-medium text-slate-900">{item.frameColor}</p>
                      </div>
                    )}
                    {item.lensColor && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lens Color</p>
                        <p className="font-medium text-slate-900">{item.lensColor}</p>
                      </div>
                    )}
                    {item.lastSeenWearing && (
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Last Seen Wearing</p>
                        <p className="font-medium text-slate-900">{item.lastSeenWearing}</p>
                      </div>
                    )}
                    {item.contents && (
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contents</p>
                        <p className="font-medium text-slate-900">{item.contents}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900">Description</h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Route Map Card */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
                <h3 className="text-lg font-bold text-slate-900">{item.type === 'lost' ? 'Route Map' : 'Location Found'}</h3>
                {item.type === 'found' && item.foundLocationDescription && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                    <p className="text-sm font-bold text-slate-700 mb-1">Location Description</p>
                    <p className="text-slate-600">{item.foundLocationDescription}</p>
                  </div>
                )}
                {item.type === 'lost' && item.lostLocationDescription && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                    <p className="text-sm font-bold text-slate-700 mb-1">Location Description</p>
                    <p className="text-slate-600">{item.lostLocationDescription}</p>
                  </div>
                )}
                <div className="bg-slate-100 rounded-2xl overflow-hidden relative">
                  <div className="h-[300px] w-full relative z-0">
                    <MapContainer center={[item.locationFromLat, item.locationFromLng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[item.locationFromLat, item.locationFromLng]}>
                        <Popup>
                          <div className="font-bold">
                            {item.type === 'lost' ? 'Lost Here' : 'Found Here'}
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg text-center z-[400] border border-slate-100">
                    <MapPin className="w-6 h-6 text-brand-orange mx-auto mb-1" />
                    <p className="font-bold text-slate-900">{locationText}</p>
                    <p className="text-xs text-slate-500">Interactive map loads with Leaflet integration</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar (Right) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Action Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center space-y-4">
                <h3 className="font-bold text-slate-900">
                  {item.type === 'lost' ? 'Did you find this item?' : 'Is this your item?'}
                </h3>
                <button 
                  onClick={handleActionClick}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                    item.type === 'lost' ? 'bg-[#2ECC71] hover:bg-[#27AE60] shadow-[#2ECC71]/20' : 'bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20'
                  }`}
                >
                  {item.type === 'lost' ? '✋ I Found This!' : '✋ This is Mine!'}
                </button>
                {!user && (
                  <p className="text-xs text-slate-500">
                    You'll need to log in to report a {item.type === 'lost' ? 'found' : 'lost'} item.
                  </p>
                )}
              </div>

              {/* Reported By Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-900">Reported By</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-brand-orange shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.contactName || ownerProfile?.name || 'Anonymous User'}</h4>
                    {user ? (
                      <div className="text-sm text-slate-600 mt-0.5 space-y-1">
                        {item.contactPhone && (
                          <div className="flex items-center gap-1.5">
                            <a href={`tel:${item.contactPhone}`} className="hover:text-brand-orange transition-colors">
                              {item.contactPhone}
                            </a>
                          </div>
                        )}
                        {item.contactEmail && (
                          <div className="flex items-center gap-1.5">
                            <a href={`mailto:${item.contactEmail}`} className="hover:text-brand-orange transition-colors">
                              {item.contactEmail}
                            </a>
                          </div>
                        )}
                        {!item.contactPhone && !item.contactEmail && (
                          <span className="text-slate-400 italic">No contact provided</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Login to see contact info</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Similar Items */}
              {similarItems.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900">Similar Items</h3>
                  <div className="space-y-4">
                    {similarItems.map((similarItem) => (
                      <Link 
                        to={`/item/${similarItem.id}`} 
                        key={similarItem.id}
                        className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group"
                      >
                        <div className="aspect-[4/3] w-full relative bg-slate-100">
                          {similarItem.photoData ? (
                            <img src={similarItem.photoData} alt={similarItem.category} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Search className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white ${
                              similarItem.type === 'lost' ? 'bg-red-500' : 'bg-emerald-500'
                            }`}>
                              {similarItem.type}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className="px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-700 flex items-center gap-1">
                              <Package className="w-3 h-3" /> {similarItem.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <h4 className="font-bold text-slate-900 truncate group-hover:text-brand-orange transition-colors">
                            {similarItem.brand ? `${similarItem.brand} ${similarItem.model || ''}` : similarItem.category}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {similarItem.district && similarItem.city ? `${similarItem.district} → ${similarItem.city}` : 'Location not specified'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{format(similarItem.createdAt?.toDate() || new Date(), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
