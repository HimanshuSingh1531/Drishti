import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

// ─── Allowed Zones ───
// Demo mode: 50km radius — judges kahin bhi test kar sakte hain
// Production mein: radius 200m kar do aur AWS se zones load karo
export const ALLOWED_ZONES = [
  {
    id: 'RAJASTHAN_ZONE',
    name: 'Rajasthan Field Zone',
    latitude: 25.3550,
    longitude: 74.6313,
    radiusMeters: 100000, // 100km — Hurda bhi cover ho jayega!
  },
  {
    id: 'DELHI_HQ',
    name: 'Delhi Headquarters',
    latitude: 28.6139,
    longitude: 77.2090,
    radiusMeters: 100000,
  },
  {
    id: 'MUMBAI_ZONE',
    name: 'Mumbai Field Zone',
    latitude: 19.0760,
    longitude: 72.8777,
    radiusMeters: 100000,
  },
  {
    id: 'BANGALORE_ZONE',
    name: 'Bangalore Field Zone',
    latitude: 12.9716,
    longitude: 77.5946,
    radiusMeters: 100000,
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

        // Check each allowed zone — closest zone find karo
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