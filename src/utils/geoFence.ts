import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

// ─── Allowed Zones (add karo apne office locations) ───
export const ALLOWED_ZONES = [
  {
    id: 'HQ_DELHI',
    name: 'Delhi Headquarters',
    latitude: 28.6139,
    longitude: 77.2090,
    radiusMeters: 200,
  },
  {
    id: 'FIELD_SITE_1',
    name: 'Field Site Alpha',
    latitude: 28.7041,
    longitude: 77.1025,
    radiusMeters: 500,
  },
];

export interface GeoResult {
  allowed: boolean;
  zoneName: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  accuracy: number;
}

// ─── Haversine Distance Formula ───
function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Request Location Permission ───
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'DRISHTI Location Permission',
        message: 'DRISHTI needs location access to verify you are in an allowed zone.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

// ─── Get Current Location & Validate Zone ───
export function validateGeoFence(): Promise<GeoResult> {
  return new Promise(async (resolve, reject) => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      reject(new Error('Location permission denied'));
      return;
    }

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude, accuracy } = position.coords;

        // Check each allowed zone
        let closestZone = ALLOWED_ZONES[0];
        let closestDistance = Infinity;

        for (const zone of ALLOWED_ZONES) {
          const dist = getDistanceMeters(
            latitude,
            longitude,
            zone.latitude,
            zone.longitude,
          );
          if (dist < closestDistance) {
            closestDistance = dist;
            closestZone = zone;
          }
        }

        const allowed = closestDistance <= closestZone.radiusMeters;

        resolve({
          allowed,
          zoneName: closestZone.name,
          distanceMeters: Math.round(closestDistance),
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
        });
      },
      error => {
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
}