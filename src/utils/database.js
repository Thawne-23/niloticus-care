import * as SQLite from 'expo-sqlite';

// Initialize the database
export const initDatabase = async () => {
  try {
    // Open the database asynchronously
    const db = await SQLite.openDatabaseAsync('niloticus_care.db');
    
    // Create tables if they don't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imageUri TEXT NOT NULL,
        className TEXT NOT NULL,
        confidence REAL NOT NULL,
        scientificName TEXT,
        careTips TEXT,
        createdAt TEXT DEFAULT (datetime('now', 'localtime'))
      );
    `);
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// History helpers
export const addHistoryEntry = async (entry) => {
  const db = await getDatabase();
  try {
    const { imageUri, className, confidence, scientificName = '', careTips = [] } = entry;
    const result = await db.runAsync(
      'INSERT INTO history (imageUri, className, confidence, scientificName, careTips) VALUES (?, ?, ?, ?, ?)',
      [imageUri, className, confidence, scientificName, JSON.stringify(careTips)]
    );
    return { success: true, id: result.lastInsertRowId };
  } catch (error) {
    console.error('Error adding history entry', error);
    return { success: false, error: error.message };
  }
};

export const getHistoryEntries = async () => {
  const db = await getDatabase();
  try {
    const rows = await db.getAllAsync('SELECT * FROM history ORDER BY datetime(createdAt) DESC');
    return rows.map(r => ({
      ...r,
      careTips: (() => { try { return JSON.parse(r.careTips || '[]'); } catch { return []; } })(),
    }));
  } catch (error) {
    console.error('Error fetching history entries', error);
    return [];
  }
};

// Get database instance
let dbInstance = null;

export const getDatabase = async () => {
  if (!dbInstance) {
    dbInstance = await initDatabase();
  }
  return dbInstance;
};

// Initialize the database when this module is imported
const initializeDb = async () => {
  try {
    dbInstance = await initDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

initializeDb();

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