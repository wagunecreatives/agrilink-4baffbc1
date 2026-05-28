export type ReverseGeocodeResult = {
  county?: string;
  village?: string;
  displayName?: string;
};

/**
 * Reverse geocode coordinates into {county, village} using OpenStreetMap Nominatim.
 *
 * Note: In production, you should consider rate limiting and/or moving this to a server
 * to avoid exposing browser IPs / API limits.
 */
export async function reverseGeocodeCountyVillage(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  // Nominatim usage: https://nominatim.org/release-docs/develop/api/Reverse/
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      String(lat)
    )}&lon=${encodeURIComponent(String(lng))}&zoom=14&addressdetails=1`;

  const res = await fetch(url, {
    headers: {
      // Some setups require a UA; browsers will set one, but keep explicit.
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'User-Agent': 'agrilink/1.0',
    } as any,
  });

  if (!res.ok) {
    return {};
  }

  const json = (await res.json()) as any;
  const address = json?.address ?? {};

  // These keys vary by region.
  const county =
    address.county ??
    address.state_district ??
    address.state ??
    address.region;

  const village =
    address.village ??
    address.town ??
    address.city_district ??
    address.suburb;

  const displayName = json?.display_name;

  return {
    county: county ? String(county) : undefined,
    village: village ? String(village) : undefined,
    displayName: displayName ? String(displayName) : undefined,
  };
}

