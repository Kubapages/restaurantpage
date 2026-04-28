import { openDB } from 'idb'

const DB_NAME = 'restaurant_offline'
const DB_VERSION = 1
const STORE_NAME = 'reservations'

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('synced_at', 'synced_at', { unique: false })
        }
      },
    })
  }
  return dbPromise
}

// ─── Save reservations to local DB ───────────────────────────────────────────
export async function saveReservationsLocally(reservations) {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  
  // Clear old data and write fresh
  await tx.store.clear()
  const now = new Date().toISOString()
  for (const res of reservations) {
    await tx.store.put({ ...res, synced_at: now })
  }
  await tx.done
}

// ─── Load reservations from local DB ─────────────────────────────────────────
export async function getLocalReservations() {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

// ─── Update single reservation status locally ─────────────────────────────────
export async function updateLocalReservation(id, changes) {
  const db = await getDB()
  const existing = await db.get(STORE_NAME, id)
  if (existing) {
    await db.put(STORE_NAME, { ...existing, ...changes, _local_change: true })
  }
}

// ─── Get last sync time ────────────────────────────────────────────────────────
export async function getLastSyncTime() {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  if (all.length === 0) return null
  return all[0]?.synced_at || null
}

// ─── Check if DB has any data ─────────────────────────────────────────────────
export async function hasLocalData() {
  const db = await getDB()
  const count = await db.count(STORE_NAME)
  return count > 0
}
