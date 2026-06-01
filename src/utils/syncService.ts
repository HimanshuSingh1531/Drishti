import axios from 'axios';
import {
  getUnsyncedRecords,
  markAsSynced,
  purgeSyncedRecords,
} from './storage';

// ─── Toggle karo: true = demo mode, false = real AWS ───
const USE_MOCK_API = true;

// ─── AWS Config (jab real AWS ready ho tab yahan daalo) ───
const AWS_CONFIG = {
  apiUrl: 'https://your-api-gateway.amazonaws.com/prod',
  apiKey: 'YOUR_AWS_API_KEY',
  region: 'ap-south-1', // Mumbai region — India ke liye best
  timeout: 30000,
};

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  message: string;
  timestamp: string;
}

// ─── Check Internet ───
export async function isInternetAvailable(): Promise<boolean> {
  try {
    await axios.get('https://www.google.com', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// ─── Mock API Upload (demo ke liye) ───
async function mockUploadRecord(): Promise<boolean> {
  // Simulate network delay
  await new Promise(res => setTimeout(res, 300));
  // 95% success rate simulate karo
  return Math.random() > 0.05;
}

// ─── Real AWS Upload ───
async function realUploadRecord(record: any): Promise<boolean> {
  try {
    const response = await axios.post(
      `${AWS_CONFIG.apiUrl}/attendance`,
      {
        empId: record.empId,
        empName: record.empName,
        timestamp: record.timestamp,
        latitude: record.latitude,
        longitude: record.longitude,
        locationZone: record.locationZone,
        livenessScore: record.livenessScore,
        photoPath: record.photoPath,
        deviceId: 'DRISHTI_DEVICE_001',
      },
      {
        timeout: AWS_CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AWS_CONFIG.apiKey,
        },
      },
    );
    return response.status === 200 || response.status === 201;
  } catch {
    return false;
  }
}

// ─── Main Sync Function ───
export async function syncToAWS(): Promise<SyncResult> {
  const timestamp = new Date().toISOString();

  // Step 1: Check internet
  const online = await isInternetAvailable();
  if (!online) {
    return {
      success: false,
      syncedCount: 0,
      failedCount: 0,
      message: 'No internet connection available',
      timestamp,
    };
  }

  // Step 2: Get unsynced records
  const unsyncedRecords = await getUnsyncedRecords();
  if (unsyncedRecords.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      message: 'No records to sync',
      timestamp,
    };
  }

  // Step 3: Upload each record
  const syncedIds: number[] = [];
  let failedCount = 0;

  for (const record of unsyncedRecords) {
    const uploaded = USE_MOCK_API
      ? await mockUploadRecord()
      : await realUploadRecord(record);

    if (uploaded && record.id !== undefined) {
      syncedIds.push(record.id);
    } else {
      failedCount++;
    }
  }

  // Step 4: Mark as synced
  if (syncedIds.length > 0) {
    await markAsSynced(syncedIds);
  }

  // Step 5: Purge synced records
  await purgeSyncedRecords();

  return {
    success: failedCount === 0,
    syncedCount: syncedIds.length,
    failedCount,
    message:
      failedCount === 0
        ? `${syncedIds.length} records synced to AWS & purged successfully`
        : `${syncedIds.length} synced, ${failedCount} failed`,
    timestamp,
  };
}

// ─── Auto Sync on app start ───
export async function autoSyncIfOnline(): Promise<void> {
  try {
    const online = await isInternetAvailable();
    if (online) {
      await syncToAWS();
    }
  } catch {
    // Silent fail — offline mode continues
  }
}