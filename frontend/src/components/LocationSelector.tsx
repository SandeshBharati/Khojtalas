import React, { useState, useEffect } from 'react';
import { MapPin, Search, ChevronDown } from 'lucide-react';
import { nepalLocations } from '../utils/nepalLocations';

interface LocationSelectorProps {
  onLocationSelect: (district: string, city: string) => void;
  initialDistrict?: string;
  initialCity?: string;
}

export default function LocationSelector({ onLocationSelect, initialDistrict = '', initialCity = '' }: LocationSelectorProps) {
  const [district, setDistrict] = useState(initialDistrict);
  const [city, setCity] = useState(initialCity);

  useEffect(() => {
    if (initialDistrict) setDistrict(initialDistrict);
    if (initialCity) setCity(initialCity);
  }, [initialDistrict, initialCity]);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    setDistrict(newDistrict);
    setCity(''); // Reset city when district changes
    onLocationSelect(newDistrict, '');
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    setCity(newCity);
    onLocationSelect(district, newCity);
  };

  const districts = Object.keys(nepalLocations).sort();
  const cities = district ? nepalLocations[district].sort() : [];

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 space-y-1">
        <label className="text-xs text-slate-500 uppercase font-semibold">District</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={district}
            onChange={handleDistrictChange}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white appearance-none text-slate-700"
          >
            <option value="">All Districts</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <label className="text-xs text-slate-500 uppercase font-semibold">City / Municipality</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={city}
            onChange={handleCityChange}
            disabled={!district}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-white appearance-none disabled:bg-slate-50 disabled:text-slate-400 text-slate-700"
          >
            <option value="">{district ? 'Select a city' : 'Select a district first'}</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
