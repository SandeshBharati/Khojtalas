import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { Search, Loader2, MapPin, X, Navigation } from 'lucide-react';
import { toast } from 'sonner';

interface MapSearchProps {
  onLocationSelect: (latlng: { lat: number; lng: number }) => void;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function MapSearch({ onLocationSelect }: MapSearchProps) {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setShowResults(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=np`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setResults(data);
        // Automatically move to the first result
        const firstResult = data[0];
        const newPos = { lat: parseFloat(firstResult.lat), lng: parseFloat(firstResult.lon) };
        map.flyTo([newPos.lat, newPos.lng], 16, {
          duration: 1.5
        });
        onLocationSelect(newPos);
      } else {
        setResults([]);
        toast.error('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (result: SearchResult) => {
    const newPos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    map.flyTo([newPos.lat, newPos.lng], 16, {
      duration: 1.5
    });
    onLocationSelect(newPos);
    setQuery(result.display_name);
    setShowResults(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = { lat: latitude, lng: longitude };
        map.flyTo([latitude, longitude], 16, { duration: 1.5 });
        onLocationSelect(newPos);
        setLoading(false);
        toast.success('Located your current position');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to retrieve your location');
        setLoading(false);
      }
    );
  };

  return (
    <div ref={searchRef} className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-2xl">
      <div className="relative">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && results.length > 0 && setShowResults(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Search for a location (e.g. Kathmandu Mall)"
              className="w-full pl-12 pr-28 py-4 bg-white border-none shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl focus:ring-2 focus:ring-brand-orange outline-none text-base transition-all font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-brand-orange transition-colors" />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={loading}
                className="bg-brand-orange text-white px-6 py-2.5 rounded-xl hover:bg-brand-orange/90 transition-all disabled:bg-slate-300 flex items-center gap-2 text-sm font-bold shadow-lg shadow-brand-orange/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLocateMe}
            title="Locate Me"
            className="p-4 bg-white text-brand-orange rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-orange-50 transition-all group"
          >
            <Navigation className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-64 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => selectLocation(result)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-start gap-3 transition-colors border-b border-slate-50 last:border-0"
                >
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">
                      {result.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {result.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
