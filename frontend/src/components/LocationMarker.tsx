import React, { useEffect } from 'react';
import { Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { MapPin } from 'lucide-react';

interface LocationMarkerProps {
  position: { lat: number; lng: number } | null;
  setPosition: (latlng: { lat: number; lng: number }) => void;
  label?: string;
}

export default function LocationMarker({ position, setPosition, label = "Selected Location" }: LocationMarkerProps) {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom(), {
        duration: 1
      });
    },
  });

  useEffect(() => {
    if (position) {
      // Don't fly here automatically on every position change to avoid fighting with MapSearch
      // MapSearch already flies to the location.
    }
  }, [position]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <div className="flex items-center gap-2 font-bold text-brand-orange">
          <MapPin className="w-4 h-4" />
          <span>{label}</span>
        </div>
      </Popup>
    </Marker>
  );
}
