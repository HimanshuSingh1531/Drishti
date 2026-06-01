// ─── Database Configuration for DRISHTI ───

export const DB_CONFIG = {
  name: 'drishti_offline.db',
  location: 'default' as const,
  version: 1,
};

// ─── Table Names ───
export const TABLES = {
  ATTENDANCE: 'attendance',
  EMPLOYEES: 'employees',
  SYNC_LOG: 'sync_log',
  APP_CONFIG: 'app_config',
};

// ─── SQL Queries ───
export const CREATE_TABLES_SQL = {

  // Attendance table
  ATTENDANCE: `
    CREATE TABLE IF NOT EXISTS ${TABLES.ATTENDANCE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empId TEXT NOT NULL,
      empName TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      locationZone TEXT NOT NULL,
      livenessScore REAL NOT NULL,
      photoPath TEXT,
      synced INTEGER DEFAULT 0,
      encryptedHash TEXT,
      deviceId TEXT,
      shiftId TEXT
    );
  `,

  // Employees table (pre-loaded offline)
  EMPLOYEES: `
    CREATE TABLE IF NOT EXISTS ${TABLES.EMPLOYEES} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empId TEXT UNIQUE NOT NULL,
      empName TEXT NOT NULL,
      department TEXT,
      designation TEXT,
      faceEmbedding TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT
    );
  `,

  // Sync log table
  SYNC_LOG: `
    CREATE TABLE IF NOT EXISTS ${TABLES.SYNC_LOG} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      syncedAt TEXT NOT NULL,
      recordCount INTEGER NOT NULL,
      status TEXT NOT NULL,
      errorMessage TEXT,
      awsResponse TEXT
    );
  `,

  // App config table
  APP_CONFIG: `
    CREATE TABLE IF NOT EXISTS ${TABLES.APP_CONFIG} (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT
    );
  `,
};

// ─── Default App Config Values ───
export const DEFAULT_CONFIG = {
  ALLOWED_ZONE_RADIUS: '200',
  LIVENESS_THRESHOLD: '0.85',
  MAX_OFFLINE_DAYS: '7',
  AUTO_SYNC: 'true',
  SHIFT_STRICT_MODE: 'true',
};