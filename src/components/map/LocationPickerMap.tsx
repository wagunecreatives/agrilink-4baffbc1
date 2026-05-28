import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { reverseGeocodeCountyVillage } from '@/lib/reverseGeocode';

export interface LatLng {
  lat: number;
  lng: number;
}

type ReverseGeocodeResult = { county?: string; village?: string } | null;

function LocationClickHandler({
  onPick,
  onReverseGeocode,
}: {
  onPick: (coords: LatLng) => void;
  onReverseGeocode?: (result: ReverseGeocodeResult) => void;
}) {
  useMapEvents({
    click(e) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      onPick(coords);

      if (onReverseGeocode) {
        reverseGeocodeCountyVillage(coords.lat, coords.lng)
          .then((r) => onReverseGeocode({ county: r.county, village: r.village }))
          .catch(() => onReverseGeocode(null));
      }
    },
  });

  return null;
}

export interface LocationPickerMapProps {
  value?: LatLng | null;
  onChange: (coords: LatLng | null) => void;
  heightPx?: number;
  zoom?: number;
  initialCenter?: LatLng;
  markerLabel?: string;
  onReverseGeocode?: (result: ReverseGeocodeResult) => void;
}

export function LocationPickerMap({
  value,
  onChange,
  heightPx = 260,
  zoom = 12,
  initialCenter = { lat: -1.2921, lng: 36.8219 },
  markerLabel,
  onReverseGeocode,
}: LocationPickerMapProps) {
  const [picked, setPicked] = useState<LatLng | null>(value ?? null);

  useEffect(() => {
    setPicked(value ?? null);
  }, [value]);

  const center = useMemo(() => picked ?? initialCenter, [picked, initialCenter]);

  return (
    <div className="w-full">
      {/* Keep the map visually in sync when `picked` changes from text input geocoding */}
      {/* react-leaflet will update center prop, but this ensures animation/actual move */}
      {/* eslint-disable-next-line react/no-children-prop */}
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

        <LocationClickHandler
          onPick={(coords) => {
            setPicked(coords);
            onChange(coords);
          }}
          onReverseGeocode={onReverseGeocode}
        />

        {picked ? (
          <Marker position={picked}>
            {markerLabel ? <div>{markerLabel}</div> : null}
          </Marker>
        ) : null}
      </MapContainer>

      <div className="mt-3 text-sm text-muted-foreground">
        {picked ? (
          <span>
            Selected: <span className="font-medium">{picked.lat.toFixed(6)}</span>,{' '}
            <span className="font-medium">{picked.lng.toFixed(6)}</span>
          </span>
        ) : (
          <span>Click on the map to select your farm location.</span>
        )}
      </div>
    </div>
  );
}

