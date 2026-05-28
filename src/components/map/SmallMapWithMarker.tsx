import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export interface SmallMapWithMarkerProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  heightPx?: number;
  label?: string;
}

export function SmallMapWithMarker({
  latitude,
  longitude,
  zoom = 12,
  heightPx = 220,
  label,
}: SmallMapWithMarkerProps) {
  const center = useMemo(() => ({ lat: latitude, lng: longitude }), [latitude, longitude]);

  // Leaflet needs its marker icon wiring in many setups; react-leaflet generally handles it.
  // This component intentionally stays minimal.
  useEffect(() => {
    // no-op; keep for future fixes
  }, []);

  return (
    <div className="w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: heightPx, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          {label ? <Popup>{label}</Popup> : null}
        </Marker>
      </MapContainer>
    </div>
  );
}

