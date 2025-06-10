export interface GeoResult {
  lat: number;
  lon: number;
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'event-finder-app'
      }
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error('Geocoding failed', err);
  }
  return null;
}
