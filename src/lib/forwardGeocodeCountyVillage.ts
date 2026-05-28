export type ForwardGeocodeResult = {
  lat: number;
  lng: number;
  displayName?: string;
} | null;

/**
 * Forward geocode county + village into coordinates using OpenStreetMap Nominatim.
 *
 * This is best-effort (Nominatim can return multiple candidates).
 */
export async function forwardGeocodeCountyVillage(
  county?: string,
  village?: string
): Promise<ForwardGeocodeResult> {
  const q = [village, county].filter(Boolean).join(', ');
  if (!q) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
    q
  )}&addressdetails=0&extratags=0`;

  const res = await fetch(url, {
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'User-Agent': 'agrilink/1.0',
    } as any,
  });

  if (!res.ok) return null;

  const json = (await res.json()) as any[];
  const first = json?.[0];
  if (!first) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const displayName = first.display_name ? String(first.display_name) : undefined;

  return { lat, lng, displayName };
}


