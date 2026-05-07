export function getDistanceMiles(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null
  ) {
    return null;
  }

  const earthRadiusMiles = 3958.8;
  const deltaLat = (lat2 - lat1) * (Math.PI / 180);
  const deltaLng = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

export function estimateEtaMinutes(distanceMiles, averageSpeedMph = 20) {
  if (!distanceMiles || distanceMiles <= 0) {
    return 0;
  }

  return Math.max(1, Math.round((distanceMiles / averageSpeedMph) * 60));
}

export function formatEta(minutes) {
  if (minutes === null || minutes === undefined) {
    return "ETA unavailable";
  }

  if (minutes === 0) {
    return "Arriving now";
  }

  return `${minutes} min ETA`;
}
