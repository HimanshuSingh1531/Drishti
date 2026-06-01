import SQLite from 'react-native-sqlite-storage';
import { DB_CONFIG, TABLES, CREATE_TABLES_SQL, DEFAULT_CONFIG } from '../database/dbConfig';
import { encryptRecord, decryptRecord, hashEmpId } from './encryptionHelper';

SQLite.enablePromise(true);

export interface AttendanceRecord {
  id?: number;
  empId: string;
  empName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  locationZone: string;
  livenessScore: number;
  photoPath: string;
  synced: number;
  encryptedHash?: string;
  deviceId?: string;
  shiftId?: string;
}

// ─── Open DB ───
async function openDB() {
  return await SQLite.openDatabase({
    name: DB_CONFIG.name,
    location: DB_CONFIG.location,
  });
}

// ─── Init All Tables ───
export async function initDB(): Promise<void> {
  const db = await openDB();

  // Create all tables
  await db.executeSql(CREATE_TABLES_SQL.ATTENDANCE);
  await db.executeSql(CREATE_TABLES_SQL.EMPLOYEES);
  await db.executeSql(CREATE_TABLES_SQL.SYNC_LOG);
  await db.executeSql(CREATE_TABLES_SQL.APP_CONFIG);

  // Insert default config if not exists
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    await db.executeSql(
      `INSERT OR IGNORE INTO ${TABLES.APP_CONFIG} (key, value, updatedAt)
       VALUES (?, ?, ?)`,
      [key, value, new Date().toISOString()],
    );
  }
}

// ─── Save Attendance with Encryption ───
export async function saveAttendance(
  record: AttendanceRecord,
): Promise<void> {
  const db = await openDB();

  // Encrypt sensitive fields
  const encryptedHash = await encryptRecord({
    empId: record.empId,
    timestamp: record.timestamp,
    latitude: record.latitude,
    longitude: record.longitude,
    livenessScore: record.livenessScore,
  });

  // Hash empId for extra privacy
  const hashedEmpId = await hashEmpId(record.empId);

  await db.executeSql(
    `INSERT INTO ${TABLES.ATTENDANCE}
      (empId, empName, timestamp, latitude, longitude,
       locationZone, livenessScore, photoPath, synced,
       encryptedHash, deviceId, shiftId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [
      record.empId,
      record.empName,
      record.timestamp,
      record.latitude,
      record.longitude,
      record.locationZone,
      record.livenessScore,
      record.photoPath,
      encryptedHash,
      `DRISHTI_${hashedEmpId.substring(0, 8)}`,
      record.shiftId || 'DEFAULT',
    ],
  );

  // Log to sync_log
  await db.executeSql(
    `INSERT INTO ${TABLES.SYNC_LOG}
      (syncedAt, recordCount, status, errorMessage)
     VALUES (?, ?, ?, ?)`,
    [new Date().toISOString(), 1, 'PENDING', null],
  );
}

// ─── Get All Unsynced Records ───
export async function getUnsyncedRecords(): Promise<AttendanceRecord[]> {
  const db = await openDB();
  const [result] = await db.executeSql(
    `SELECT * FROM ${TABLES.ATTENDANCE}
     WHERE synced = 0
     ORDER BY timestamp DESC`,
  );
  const records: AttendanceRecord[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    records.push(result.rows.item(i));
  }
  return records;
}

// ─── Get All Records for Dashboard ───
export async function getAllRecords(): Promise<AttendanceRecord[]> {
  const db = await openDB();
  const [result] = await db.executeSql(
    `SELECT * FROM ${TABLES.ATTENDANCE}
     ORDER BY timestamp DESC
     LIMIT 50`,
  );
  const records: AttendanceRecord[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    records.push(result.rows.item(i));
  }
  return records;
}

// ─── Mark Records as Synced ───
export async function markAsSynced(ids: number[]): Promise<void> {
  const db = await openDB();
  const placeholders = ids.map(() => '?').join(',');
  await db.executeSql(
    `UPDATE ${TABLES.ATTENDANCE}
     SET synced = 1
     WHERE id IN (${placeholders})`,
    ids,
  );

  // Update sync log
  await db.executeSql(
    `INSERT INTO ${TABLES.SYNC_LOG}
      (syncedAt, recordCount, status, errorMessage)
     VALUES (?, ?, ?, ?)`,
    [new Date().toISOString(), ids.length, 'SUCCESS', null],
  );
}

// ─── Purge Synced Records ───
export async function purgeSyncedRecords(): Promise<void> {
  const db = await openDB();
  await db.executeSql(
    `DELETE FROM ${TABLES.ATTENDANCE} WHERE synced = 1`,
  );
}

// ─── Today's Count ───
export async function getTodayCount(): Promise<number> {
  const db = await openDB();
  const today = new Date().toISOString().split('T')[0];
  const [result] = await db.executeSql(
    `SELECT COUNT(*) as count FROM ${TABLES.ATTENDANCE}
     WHERE timestamp LIKE ?`,
    [`${today}%`],
  );
  return result.rows.item(0).count;
}

// ─── Get App Config Value ───
export async function getConfig(key: string): Promise<string | null> {
  const db = await openDB();
  const [result] = await db.executeSql(
    `SELECT value FROM ${TABLES.APP_CONFIG} WHERE key = ?`,
    [key],
  );
  if (result.rows.length > 0) {
    return result.rows.item(0).value;
  }
  return null;
}

// ─── Save Employee (for offline face matching) ───
export async function saveEmployee(
  empId: string,
  empName: string,
  department: string,
  designation: string,
  faceEmbedding: number[],
): Promise<void> {
  const db = await openDB();
  await db.executeSql(
    `INSERT OR REPLACE INTO ${TABLES.EMPLOYEES}
      (empId, empName, department, designation, faceEmbedding, isActive, createdAt)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [
      empId,
      empName,
      department,
      designation,
      JSON.stringify(faceEmbedding),
      new Date().toISOString(),
    ],
  );
}

// ─── Get All Employees ───
export async function getAllEmployees(): Promise<any[]> {
  const db = await openDB();
  const [result] = await db.executeSql(
    `SELECT * FROM ${TABLES.EMPLOYEES} WHERE isActive = 1`,
  );
  const employees = [];
  for (let i = 0; i < result.rows.length; i++) {
    const emp = result.rows.item(i);
    emp.faceEmbedding = JSON.parse(emp.faceEmbedding || '[]');
    employees.push(emp);
  }
  return employees;
}