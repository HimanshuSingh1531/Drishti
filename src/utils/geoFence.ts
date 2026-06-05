import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

// ─── India bounds ───
const INDIA_BOUNDS = {
  minLat: 8.0,
  maxLat: 37.6,
  minLon: 68.0,
  maxLon: 97.5,
};

export interface GeoResult {
  allowed: boolean;
  zoneName: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  stateRegion: string;
}

// ─── Detect region name from coordinates ───
function detectRegion(lat: number, lon: number): string {
  if (lat >= 26.0 && lat <= 30.2 && lon >= 69.5 && lon <= 78.3) return 'Rajasthan';
  if (lat >= 28.4 && lat <= 28.9 && lon >= 76.8 && lon <= 77.4) return 'Delhi NCR';
  if (lat >= 18.8 && lat <= 19.3 && lon >= 72.7 && lon <= 73.1) return 'Mumbai Region';
  if (lat >= 12.7 && lat <= 13.2 && lon >= 77.4 && lon <= 77.8) return 'Bangalore Region';
  if (lat >= 22.0 && lat <= 26.5 && lon >= 78.0 && lon <= 84.5) return 'Madhya Pradesh';
  if (lat >= 17.0 && lat <= 22.0 && lon >= 76.0 && lon <= 80.5) return 'Maharashtra';
  if (lat >= 20.0 && lat <= 27.5 && lon >= 83.0 && lon <= 87.5) return 'Odisha/Jharkhand';
  if (lat >= 22.5 && lat <= 27.5 && lon >= 85.0 && lon <= 92.0) return 'West Bengal';
  if (lat >= 26.0 && lat <= 31.5 && lon >= 75.0 && lon <= 81.0) return 'Uttar Pradesh';
  if (lat >= 29.5 && lat <= 33.5 && lon >= 74.0 && lon <= 79.5) return 'Punjab/Himachal';
  if (lat >= 8.0 && lat <= 13.5 && lon >= 76.5 && lon <= 80.5) return 'Tamil Nadu/Kerala';
  if (lat >= 13.0 && lat <= 19.5 && lon >= 76.5 && lon <= 84.5) return 'Andhra/Telangana';
  if (lat >= 20.0 && lat <= 24.0 && lon >= 68.5 && lon <= 74.5) return 'Gujarat';
  if (lat >= 22.0 && lat <= 26.5 && lon >= 84.5 && lon <= 88.5) return 'Bihar/Jharkhand';
  if (lat >= 10.5 && lat <= 14.0 && lon >= 74.0 && lon <= 77.5) return 'Karnataka';
  return 'India Field Zone';
}

// ─── Check if coordinates are within India ───
function isInIndia(lat: number, lon: number): boolean {
  return (
    lat >= INDIA_BOUNDS.minLat &&
    lat <= INDIA_BOUNDS.maxLat &&
    lon >= INDIA_BOUNDS.minLon &&
    lon <= INDIA_BOUNDS.maxLon
  );
}

// ─── Request Location Permission ───
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'DRISHTI Location Permission',
        message: 'DRISHTI needs location to capture GPS coordinates for attendance.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

// ─── Main GeoFence Validation ───
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

        // Detect region name
        const stateRegion = detectRegion(latitude, longitude);

        // Check if in India
        const inIndia = isInIndia(latitude, longitude);

        resolve({
          // ─── Always allowed in India-wide mode ───
          allowed: true,
          zoneName: stateRegion,
          distanceMeters: 0,
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          stateRegion,
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