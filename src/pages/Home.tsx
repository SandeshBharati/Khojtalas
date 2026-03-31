import { useEffect, useState, useMemo } from 'react';
import { MapPin, Clock, Tag, Edit, Sparkles, ShieldCheck, Users, ChevronRight, Search, Loader2, ArrowRight, Calendar, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { nepalLocations } from '../utils/nepalLocations';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, getCountFromServer, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const categoryEmojis: Record<string, string> = {
  electronics: '📱',
  wallet: '👛',
  documents: '📄',
  jewelry: '💍',
  clothing: '👕',
  pets: '🐾',
  person: '👤',
  keys: '🔑',
  vehicles: '🚗',
  musical_instruments: '🎸',
  glasses: '👓',
  other: '📦'
};

interface Item {
  id: string;
  category: string;
  brand?: string;
  model?: string;
  color?: string;
  secondaryColor?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  description: string;
  photoData?: string;
  videoData?: string;
  timeFrom: string;
  timeTo?: string;
  locationFromLat: number;
  locationFromLng: number;
  lostLocationDescription?: string;
  foundLocationDescription?: string;
  itemCondition?: string;
  distinguishingFeatures?: string;
  estimatedValue?: string | number;
  policeReportFiled?: boolean;
  policeReportNumber?: string;
  name?: string;
  userId: string;
  type: 'lost' | 'found';
  district?: string;
  city?: string;
  status?: string;
}

export default function Home() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  
  const [stats, setStats] = useState({
    reported: 0,
    matched: 0
  });

  useEffect(() => {
    const q = query(
      collection(db, 'items'),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData: Item[] = [];
      snapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() } as Item);
      });
      itemsData.sort((a, b) => {
        const dateA = (a as any).createdAt?.toMillis() || 0;
        const dateB = (b as any).createdAt?.toMillis() || 0;
        return dateB - dateA;
      });
      setItems(itemsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'items');
      setLoading(false);
    });

    // Fetch stats and top contributors
    const fetchStats = async () => {
      try {
        const itemsCount = await getCountFromServer(query(collection(db, 'items'), where('status', '==', 'approved')));
        const matchesCount = await getCountFromServer(query(collection(db, 'matches'), where('status', '==', 'confirmed')));
        setStats({
          reported: itemsCount.data().count,
          matched: matchesCount.data().count
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();

    return () => unsubscribe();
  }, []);

  const formatStat = (num: number) => {
    if (num === 0) return '0';
    if (num <= 10) return num.toString();
    const rounded = Math.floor(num / 10) * 10;
    return `${rounded.toLocaleString()}+`;
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesType = item.type === 'lost';
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesDistrict = !filterDistrict || item.district === filterDistrict;
      const matchesCity = !filterCity || item.city === filterCity;
      return matchesType && matchesCategory && matchesDistrict && matchesCity;
    });
  }, [items, filterCategory, filterDistrict, filterCity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-brand-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-orange via-orange-500 to-amber-500 text-white py-24 lg:py-32">
        <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-sm font-medium shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Nepal's #1 Lost & Found Platform</span>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Lost Something? <br />
              KhojTalas Connects You.
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Report lost items, find what others have found, and reconnect with your belongings across all 77 districts of Nepal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/report-lost" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <Search className="w-5 h-5" /> Report Lost Item
            </Link>
            <Link to="/report-found" className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5" /> I Found Something
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto pt-12">
            {[
              { label: 'Items Reported', value: formatStat(stats.reported || 0) },
              { label: 'Items Matched', value: formatStat(stats.matched || 0) },
              { label: 'Districts Covered', value: '77' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-white/70 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-200 rounded-full blur-[120px]"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Smart Matching',
              desc: 'AI-powered matching connects lost items with found reports automatically.',
              icon: <Search className="w-6 h-6 text-brand-orange" />,
            },
            {
              title: 'Verified & Safe',
              desc: 'All reports reviewed by admins. Contact info shared only after verification.',
              icon: <ShieldCheck className="w-6 h-6 text-brand-orange" />,
            },
            {
              title: 'Community Driven',
              desc: 'Thousands of Nepalis helping each other find lost belongings.',
              icon: <Users className="w-6 h-6 text-brand-orange" />,
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4 text-center group hover:border-brand-orange/30 transition-all">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Reports Section */}
      <section className="container mx-auto px-4 py-24 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-slate-900">Recent Lost Items</h2>
          <Link to="/browse" className="inline-flex items-center gap-2 text-brand-orange font-medium hover:gap-3 transition-all">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'electronics', label: 'Electronics' },
              { id: 'wallet', label: 'Wallet/Purse' },
              { id: 'documents', label: 'Documents' },
              { id: 'jewelry', label: 'Jewelry' },
              { id: 'clothing', label: 'Clothing' },
              { id: 'pets', label: 'Pet' },
              { id: 'person', label: 'Person' },
              { id: 'keys', label: 'Keys' },
              { id: 'vehicles', label: 'Vehicles' },
              { id: 'musical_instruments', label: 'Instruments' },
              { id: 'glasses', label: 'Glasses' },
              { id: 'other', label: 'Other' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filterCategory === cat.id 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.id !== 'all' && categoryEmojis[cat.id]} {cat.label}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto shrink-0 gap-2">
            <select 
              value={filterDistrict}
              onChange={(e) => {
                setFilterDistrict(e.target.value);
                setFilterCity('');
              }}
              className="w-full sm:w-40 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-orange/20 outline-none"
            >
              <option value="">All Districts</option>
              {Object.keys(nepalLocations).sort().map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            
            <select 
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              disabled={!filterDistrict}
              className="w-full sm:w-40 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-orange/20 outline-none disabled:opacity-50"
            >
              <option value="">{filterDistrict ? 'All Cities' : 'Select District'}</option>
              {filterDistrict && nepalLocations[filterDistrict]?.sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-32 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No items found</h3>
            <p className="text-slate-500">Try adjusting your filters to find what you're looking for.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <Link to={`/item/${item.id}`} key={item.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {item.photoData ? (
                    <img src={item.photoData} alt={item.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Search className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${
                      item.status === 'matched' ? 'bg-blue-500' :
                      item.type === 'lost' ? 'bg-red-500' : 'bg-emerald-500'
                    }`}>
                      {item.status === 'matched' ? 'Matched' : item.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-slate-700 shadow-sm flex items-center gap-1.5 capitalize">
                      {categoryEmojis[item.category] || <Tag className="w-3 h-3" />} {item.category}
                    </span>
                  </div>

                  {/* Bottom Badge (Reward) */}
                  {item.estimatedValue && (
                    <div className="absolute bottom-3 right-3">
                      <span className="bg-brand-orange text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5">
                        <Gift className="w-3 h-3" /> NPR {item.estimatedValue}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-grow justify-between">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-brand-orange transition-colors">
                      {item.brand ? `${item.brand} ${item.model || ''}` : item.name || item.category}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <MapPin className="w-4 h-4 shrink-0 text-brand-orange" />
                        <span className="line-clamp-1">
                          {item.district ? `${item.district} → ${item.city}` : 'Nepal'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>
                          {item.timeFrom && format(new Date(item.timeFrom), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
