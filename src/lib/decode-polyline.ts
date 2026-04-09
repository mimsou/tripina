/**
 * Décode une polyline encodée (algorithme Google / OpenRouteService, précision 5 par défaut).
 * Retourne des paires [longitude, latitude] pour GeoJSON LineString.
 */
export function decodeEncodedPolyline(encoded: string, precision = 5): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = 10 ** precision;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lng / factor, lat / factor]);
  }

  return coordinates;
}
