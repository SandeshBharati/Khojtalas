import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControllerProps {
  district: string;
  city: string;
}

export default function MapController({ district, city }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!district) return;

    const searchQuery = city ? `${city}, ${district}, Nepal` : `${district}, Nepal`;
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          map.flyTo([parseFloat(lat), parseFloat(lon)], city ? 14 : 11, {
            duration: 2
          });
        }
      })
      .catch(err => console.error('Map controller search error:', err));
  }, [district, city, map]);

  return null;
}
