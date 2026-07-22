export function formatMapLocationLabel(location: string, country: string) {
  if (!country || location.includes(country)) return location;
  return `${location}, ${country}`;
}

export function mapsSearchUrl(latitude: number, longitude: number, label?: string) {
  const query = label ? `${label}@${latitude},${longitude}` : `${latitude},${longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function isApproximateMapPin(item: { approximateLocation?: boolean }) {
  return item.approximateLocation !== false;
}
