import { useEffect } from 'react';
import L from 'leaflet';

/**
 * Ensures the default marker icon images load correctly in many bundlers.
 * react-leaflet otherwise may render an invisible marker.
 */
export function LeafletMarkerFix() {
  useEffect(() => {
    // @ts-expect-error - leaflet types don't always expose these paths
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  return null;
}

