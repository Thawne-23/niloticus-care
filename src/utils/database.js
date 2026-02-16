import * as SQLite from 'expo-sqlite';

// Initialize the database
export const initDatabase = async () => {
  try {
    console.log('[Database] Initializing via ensureDatabase...');
    await ensureDatabase();
    console.log('[Database] Initialization complete');
  } catch (error) {
    console.error('[Database] Initialization error:', error.message);
    throw error;
  }
};

// New: Add scan with multiple detections (normalized schema)
export const addScanWithDetections = async (entry) => {
  const db = await getDatabase();
  try {
    console.log('[Database] Starting transaction for addScanWithDetections...');
    await db.runAsync('BEGIN TRANSACTION');

    // Insert Scan
    const scanResult = await db.runAsync(
      'INSERT INTO scans (user_id, image_uri, image_width, image_height, scanned_at) VALUES (?, ?, ?, ?, ?)',
      [entry.userId || 1, entry.imageUri, entry.imageWidth, entry.imageHeight, new Date().toISOString()]
    );
    const scanId = scanResult.lastInsertRowId;
    console.log(`[Database] Scan inserted with ID: ${scanId}`);

    // Insert Detections
    if (entry.detections && entry.detections.length > 0) {
      for (let i = 0; i < entry.detections.length; i++) {
        const det = entry.detections[i];
        await db.runAsync(
          'INSERT INTO detections (scan_id, disease_name, confidence, bbox_x, bbox_y, bbox_width, bbox_height, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [scanId, det.className, det.confidence, det.x, det.y, det.width, det.height, i === 0 ? 1 : 0]
        );
      }
      console.log(`[Database] Inserted ${entry.detections.length} detections`);
    }

    await db.runAsync('COMMIT');
    return { success: true, id: scanId };
  } catch (error) {
    console.error('[Database] Error adding scan with detections:', error);
    try { await db.runAsync('ROLLBACK'); } catch (e) { /* ignore */ }
    return { success: false, error: error.message };
  }
};

// New: Get scan history with grouped detections
export const getScanHistory = async (userId) => {
  const db = await getDatabase();
  try {
    const rows = await db.getAllAsync(`
      SELECT s.*, d.id as det_id, d.disease_name, d.confidence, d.bbox_x, d.bbox_y, d.bbox_width, d.bbox_height, d.is_primary 
      FROM scans s 
      LEFT JOIN detections d ON s.id = d.scan_id 
      WHERE s.user_id = ? 
      ORDER BY s.scanned_at DESC
    `, [userId]);

    const scansMap = new Map();
    rows.forEach(row => {
      if (!scansMap.has(row.id)) {
        scansMap.set(row.id, {
          id: row.id,
          imageUri: row.image_uri,
          imageWidth: row.image_width,
          imageHeight: row.image_height,
          timestamp: row.scanned_at,
          detections: []
        });
      }
      if (row.det_id) {
        scansMap.get(row.id).detections.push({
          id: row.det_id,
          className: row.disease_name,
          confidence: row.confidence,
          x: row.bbox_x,
          y: row.bbox_y,
          width: row.bbox_width,
          height: row.bbox_height,
          isPrimary: !!row.is_primary
        });
      }
    });

    return Array.from(scansMap.values());
  } catch (error) {
    console.error('Error getting scan history:', error);
    return [];
  }
};

// History helpers
export const addHistoryEntry = async (entry) => {
  try {
    const db = await getDatabase();
    
    console.log('[Database] Entry received:', {
      imageUri: entry.imageUri ? 'OK' : 'MISSING',
      className: entry.className ? 'OK' : 'MISSING',
      confidence: typeof entry.confidence === 'number' ? 'OK' : `INVALID(${typeof entry.confidence})`,
      scientificName: entry.scientificName ? 'OK' : 'EMPTY',
      careTips: Array.isArray(entry.careTips) ? `${entry.careTips.length} items` : `INVALID(${typeof entry.careTips})`,
      detections: Array.isArray(entry.detections) ? `${entry.detections.length} items` : `INVALID(${typeof entry.detections})`,
      imageWidth: typeof entry.imageWidth === 'number' ? 'OK' : `INVALID(${typeof entry.imageWidth})`,
      imageHeight: typeof entry.imageHeight === 'number' ? 'OK' : `INVALID(${typeof entry.imageHeight})`,
      annotations: entry.annotations ? 'OK' : 'EMPTY'
    });
    
    const { 
      imageUri, 
      className, 
      confidence, 
      scientificName = '', 
      careTips = [],
      detections = [],
      imageWidth = 0,
      imageHeight = 0,
      annotations = {}
    } = entry;
    
    // Serialize each field individually and log
    let param1, param2, param3, param4, param5, param6, param7, param8, param9;
    
    try {
      param1 = String(imageUri || '');
      console.log('[Database] Param1 (imageUri):', param1.substring(0, 30), typeof param1);
    } catch (e) {
      console.error('[Database] ERROR serializing param1:', e);
      throw e;
    }
    
    try {
      param2 = String(className || '');
      console.log('[Database] Param2 (className):', param2, typeof param2);
    } catch (e) {
      console.error('[Database] ERROR serializing param2:', e);
      throw e;
    }
    
    try {
      param3 = Number(confidence || 0);
      console.log('[Database] Param3 (confidence):', param3, typeof param3);
    } catch (e) {
      console.error('[Database] ERROR serializing param3:', e);
      throw e;
    }
    
    try {
      param4 = String(scientificName || '');
      console.log('[Database] Param4 (scientificName):', param4, typeof param4);
    } catch (e) {
      console.error('[Database] ERROR serializing param4:', e);
      throw e;
    }
    
    try {
      param5 = JSON.stringify(Array.isArray(careTips) ? careTips : []);
      console.log('[Database] Param5 (careTips):', param5.substring(0, 50), typeof param5);
    } catch (e) {
      console.error('[Database] ERROR serializing param5:', e);
      throw e;
    }
    
    try {
      param6 = JSON.stringify(Array.isArray(detections) ? detections : []);
      console.log('[Database] Param6 (detections):', param6.substring(0, 50), typeof param6);
    } catch (e) {
      console.error('[Database] ERROR serializing param6:', e);
      throw e;
    }
    
    try {
      param7 = Number(imageWidth || 0);
      console.log('[Database] Param7 (imageWidth):', param7, typeof param7);
    } catch (e) {
      console.error('[Database] ERROR serializing param7:', e);
      throw e;
    }
    
    try {
      param8 = Number(imageHeight || 0);
      console.log('[Database] Param8 (imageHeight):', param8, typeof param8);
    } catch (e) {
      console.error('[Database] ERROR serializing param8:', e);
      throw e;
    }
    
    try {
      param9 = JSON.stringify(typeof annotations === 'object' && annotations !== null ? annotations : {});
      console.log('[Database] Param9 (annotations):', param9.substring(0, 50), typeof param9);
    } catch (e) {
      console.error('[Database] ERROR serializing param9:', e);
      throw e;
    }
    
    console.log('[Database] All params serialized successfully');
    console.log('[Database] DB instance available:', db !== null && db !== undefined);
    
    console.log('[Database] Executing INSERT statement...');
    const result = await db.runAsync(
      'INSERT INTO history (imageUri, className, confidence, scientificName, careTips, detections, imageWidth, imageHeight, annotations, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [param1, param2, param3, param4, param5, param6, param7, param8, param9, new Date().toISOString()]
    );
    
    console.log(`[Database] INSERT successful, ID: ${result.lastInsertRowId}`);
    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
    console.error('[Database] FATAL ERROR in addHistoryEntry:', error.message);
    if (error.stack) {
      console.error('[Database] Stack trace:', error.stack);
    }
    return { success: false, error: error.message };
  }
};

export const deleteHistoryByIds = async (ids) => {
  try {
    const db = await getDatabase();
    if (!ids.length) return { success: true };
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(`DELETE FROM history WHERE id IN (${placeholders})`, ids);
    return { success: true };
  } catch (error) {
    console.error('deleteHistoryByIds error:', error);
    return { success: false, error };
  }
};


export const getHistoryEntries = async ({ includeArchived = false } = {}) => {
  try {
    const db = await getDatabase();
    
    // Fetch history with optional archive filter
    const where = includeArchived ? '' : 'WHERE archived IS NULL OR archived = 0';

    const query = `SELECT * FROM history ${where} ORDER BY datetime(createdAt) DESC`;
    
    const rows = await db.getAllAsync(query) || [];
    
    return rows.map(r => ({
      ...r,
      careTips: (() => { 
        try { 
          return r.careTips ? JSON.parse(r.careTips) : []; 
        } catch (e) { 
          console.warn('Error parsing careTips:', e);
          return []; 
        }
      })(),
      detections: (() => {
        try {
          return r.detections ? JSON.parse(r.detections) : [];
        } catch (e) {
          console.warn('Error parsing detections:', e);
          return [];
        }
      })(),
      annotations: (() => {
        try {
          return r.annotations ? JSON.parse(r.annotations) : {};
        } catch (e) {
          console.warn('Error parsing annotations:', e);
          return {};
        }
      })(),
    }));
  } catch (error) {
    console.error('Error in getHistoryEntries:', error);
    return [];
  }
};

// Database instance and state
let dbInstance = null;
let isInitializing = false;
let initPromise = null;

// Initialize the database (idempotent)
const ensureDatabase = async () => {
  if (dbInstance) {
    console.log('[Database] ensureDatabase: Using cached instance');
    return dbInstance;
  }
  if (isInitializing) {
    console.log('[Database] ensureDatabase: Already initializing, waiting...');
    return initPromise;
  }
  
  isInitializing = true;
  initPromise = (async () => {
    try {
      console.log('[Database] ensureDatabase: Opening connection...');
      dbInstance = await SQLite.openDatabaseAsync('niloticus_care.db');
      console.log('[Database] ensureDatabase: Connection opened');
      
      // Create users table
      console.log('[Database] ensureDatabase: Creating users table...');
      await dbInstance.execAsync('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, email TEXT UNIQUE, password TEXT, createdAt TEXT);');
      console.log('[Database] ensureDatabase: Users table created');
      
      // Create history table
      console.log('[Database] ensureDatabase: Creating history table...');
      await dbInstance.execAsync('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, imageUri TEXT, className TEXT, confidence REAL, scientificName TEXT, careTips TEXT, detections TEXT, imageWidth INTEGER, imageHeight INTEGER, annotations TEXT, archived INTEGER, createdAt TEXT);');
      console.log('[Database] ensureDatabase: History table created');
      
      // Create scans table (New)
      console.log('[Database] ensureDatabase: Creating scans table...');
      await dbInstance.execAsync('CREATE TABLE IF NOT EXISTS scans (id INTEGER PRIMARY KEY, user_id INTEGER, image_uri TEXT, image_width INTEGER, image_height INTEGER, scanned_at TEXT);');
      
      // Create detections table (New)
      console.log('[Database] ensureDatabase: Creating detections table...');
      await dbInstance.execAsync('CREATE TABLE IF NOT EXISTS detections (id INTEGER PRIMARY KEY, scan_id INTEGER, disease_name TEXT, confidence REAL, bbox_x REAL, bbox_y REAL, bbox_width REAL, bbox_height REAL, is_primary INTEGER, FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE);');

      console.log('[Database] ensureDatabase: Tables ready');
      return dbInstance;
    } catch (error) {
      console.error('[Database] ensureDatabase error:', error.message);
      if (error.stack) {
        console.error('[Database] ensureDatabase stack:', error.stack);
      }
      dbInstance = null;  // Reset on error
      throw error;
    } finally {
      isInitializing = false;
    }
  })();
  
  return initPromise;
};

// Get database instance
const getDatabase = async () => {
  if (!dbInstance) {
    await ensureDatabase();
  }
  return dbInstance;
};

export const archiveHistoryEntry = async (id, shouldArchive = true) => {
  const db = await getDatabase();
  try {
    await db.runAsync('UPDATE history SET archived = ? WHERE id = ?', [shouldArchive ? 1 : 0, id]);
    return { success: true };
  } catch (error) {
    console.error('Error archiving history entry', error);
    return { success: false, error: error.message };
  }
};

export const deleteHistoryEntry = async (id) => {
  const db = await getDatabase();
  try {
    await db.runAsync('DELETE FROM history WHERE id = ?', [id]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting history entry', error);
    return { success: false, error: error.message };
  }
};

export const clearHistory = async () => {
  const db = await getDatabase();
  try {
    await db.runAsync('DELETE FROM history');
    return { success: true };
  } catch (error) {
    console.error('Error clearing history', error);
    return { success: false, error: error.message };
  }
};

export const deleteArchivedHistory = async (id = null) => {
  const db = await getDatabase();
  try {
    if (id) {
      await db.runAsync('DELETE FROM history WHERE id = ? AND archived = 1', [id]);
    } else {
      await db.runAsync('DELETE FROM history WHERE archived = 1');
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting archived history', error);
    return { success: false, error: error.message };
  }
};

export const addUser = async (user) => {
  const db = await getDatabase();
  try {
    const result = await db.runAsync(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [user.username, user.email, user.password]
    );
    return { success: true, userId: result.lastInsertRowId };
  } catch (error) {
    console.error('Error adding user', error);
    throw { success: false, error: 'Email already exists' };
  }
};

export const findUserByEmail = async (email) => {
  const db = await getDatabase();
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return result || null;
  } catch (error) {
    console.error('Error finding user by email', error);
    throw error;
  }
};

export const verifyUser = async (email, password) => {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // In a real app, you should use proper password hashing (e.g., bcrypt)
    if (user.password === password) {
      return { success: true, user };
    } else {
      return { success: false, error: 'Invalid credentials' };
    }
  } catch (error) {
    console.error('Error verifying user', error);
    throw error;
  }
};

export default getDatabase;