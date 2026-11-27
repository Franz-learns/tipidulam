// API #4 — OpenStreetMap Overpass: supermarkets and palengke near a point.
import { haversineKm } from '../utils/format.js';

export const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export const PH_CITIES = [
  { id: 'qc', name: 'Quezon City', lat: 14.676, lon: 121.0437 },
  { id: 'manila', name: 'Manila', lat: 14.5995, lon: 120.9842 },
  { id: 'cebu', name: 'Cebu City', lat: 10.3157, lon: 123.8854 },
  { id: 'davao', name: 'Davao City', lat: 7.1907, lon: 125.4553 },
];

/** Offline sample stores (approximate coordinates) used if Overpass is busy. */
const SAMPLE_STORES = [
  { name: 'SM Supermarket North EDSA', type: 'supermarket', lat: 14.6566, lon: 121.0296 },
  { name: 'Puregold Cubao', type: 'supermarket', lat: 14.6206, lon: 121.0531 },
  { name: 'Robinsons Supermarket Magnolia', type: 'supermarket', lat: 14.6152, lon: 121.0389 },
  { name: "Farmers' Market Cubao", type: 'marketplace', lat: 14.6192, lon: 121.0548 },
  { name: 'Commonwealth Market', type: 'marketplace', lat: 14.6962, lon: 121.0886 },
  { name: 'Muñoz Market', type: 'marketplace', lat: 14.6577, lon: 121.0207 },
  { name: 'Quinta Market (Quiapo)', type: 'marketplace', lat: 14.5967, lon: 120.9839 },
  { name: 'Carbon Market', type: 'marketplace', lat: 10.2925, lon: 123.8985 },
  { name: 'Agdao Public Market', type: 'marketplace', lat: 7.0868, lon: 125.6235 },
];

/**
 * Supermarkets (shop=supermarket) and wet markets (amenity=marketplace) within `radiusM` of a point.
 * Queries nodes AND ways (many big stores are mapped as building outlines), using their center point.
 * @returns {Promise<{stores: object[], isFallback: boolean}>}
 */
export async function findNearbyStores(lat, lon, radiusM = 3000) {
  const query = `
    [out:json][timeout:25];
    (
      node["shop"="supermarket"](around:${radiusM},${lat},${lon});
      way["shop"="supermarket"](around:${radiusM},${lat},${lon});
      node["amenity"="marketplace"](around:${radiusM},${lat},${lon});
      way["amenity"="marketplace"](around:${radiusM},${lat},${lon});
    );
    out center tags 80;`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: query }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const stores = (data.elements ?? [])
      .map((el) => {
        const sLat = el.lat ?? el.center?.lat;
        const sLon = el.lon ?? el.center?.lon;
        if (sLat == null || sLon == null) return null;
        const t = el.tags ?? {};
        const type = t.amenity === 'marketplace' ? 'marketplace' : 'supermarket';
        return {
          id: `${el.type}/${el.id}`,
          name: t.name || t.brand || (type === 'marketplace' ? 'Unnamed palengke' : 'Unnamed supermarket'),
          type,
          address: [t['addr:housenumber'], t['addr:street'], t['addr:city']].filter(Boolean).join(' '),
          hours: t.opening_hours ?? '',
          lat: sLat,
          lon: sLon,
          distanceKm: haversineKm(lat, lon, sLat, sLon),
          mapUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return { stores, isFallback: false };
  } catch (err) {
    console.warn('[storeLocatorApi] Overpass unavailable, using samples:', err.message);
    const stores = SAMPLE_STORES.map((s, i) => ({
      ...s,
      id: `sample-${i}`,
      address: '',
      hours: '',
      distanceKm: haversineKm(lat, lon, s.lat, s.lon),
      mapUrl: `https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=17/${s.lat}/${s.lon}`,
    }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 6);
    return { stores, isFallback: true };
  } finally {
    clearTimeout(timer);
  }
}

/** Wraps the browser Geolocation API in a promise. */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation is not supported by this browser.'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Location permission denied.')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}
