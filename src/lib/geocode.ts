const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address?.trim()) return null;

  const params = new URLSearchParams({
    address,
    region: "za",
    key: process.env.GOOGLE_MAPS_API_KEY!,
  });

  try {
    const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) return null;

    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  } catch {
    return null;
  }
}
