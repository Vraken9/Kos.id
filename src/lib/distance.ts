/**
 * Calculate distance between two points using Haversine formula
 * @returns distance in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // round to 1 decimal
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * SQL fragment for Haversine distance calculation
 * Use with parameterized query: [campusLat, campusLon, campusLat]
 */
export const HAVERSINE_SQL = `(
  6371 * ACOS(
    LEAST(1, GREATEST(-1,
      COS(RADIANS(?)) *
      COS(RADIANS(k.latitude)) *
      COS(RADIANS(k.longitude) - RADIANS(?)) +
      SIN(RADIANS(?)) *
      SIN(RADIANS(k.latitude))
    ))
  )
)`;
