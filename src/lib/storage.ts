import type { Analytics } from './analytics/types'

/**
 * Local persistence — PRODUCT.md §37.
 *
 * Nothing is written unless the user has opted in. What we store is the
 * computed analytics object, never the message text: once a report exists the
 * raw conversation has served its purpose, so we drop it. That keeps the
 * privacy copy literally true rather than aspirational.
 *
 * IndexedDB rather than localStorage because a large chat's analytics comfortably
 * exceeds the 5 MB localStorage ceiling.
 */

const DB_NAME = 'we-bloom'
const DB_VERSION = 1
const STORE = 'reports'
const CONSENT_KEY = 'we-bloom:save-locally'
const CURRENT_ID = 'current'

export interface StoredReport {
  id: string
  savedAt: number
  label: string
  analytics: Analytics
  aliases: Record<string, string>
}

export function hasConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'yes'
  } catch {
    return false
  }
}

export function setConsent(value: boolean): void {
  try {
    if (value) localStorage.setItem(CONSENT_KEY, 'yes')
    else localStorage.removeItem(CONSENT_KEY)
  } catch {
    // Private browsing with storage disabled. Nothing to do; we simply don't persist.
  }
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null)
    let req: IDBOpenDBRequest
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION)
    } catch {
      return resolve(null)
    }
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
    req.onblocked = () => resolve(null)
  })
}

export async function saveReport(report: Omit<StoredReport, 'id' | 'savedAt'>): Promise<boolean> {
  if (!hasConsent()) return false
  const db = await openDb()
  if (!db) return false

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put({ ...report, id: CURRENT_ID, savedAt: Date.now() })
      tx.oncomplete = () => {
        db.close()
        resolve(true)
      }
      tx.onerror = () => {
        db.close()
        resolve(false)
      }
    } catch {
      db.close()
      resolve(false)
    }
  })
}

export async function loadReport(): Promise<StoredReport | null> {
  if (!hasConsent()) return null
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(CURRENT_ID)
      req.onsuccess = () => {
        db.close()
        resolve((req.result as StoredReport) ?? null)
      }
      req.onerror = () => {
        db.close()
        resolve(null)
      }
    } catch {
      db.close()
      resolve(null)
    }
  })
}

/** Wipes everything We Bloom has ever written, consent flag included. */
export async function deleteEverything(): Promise<void> {
  setConsent(false)
  const db = await openDb()
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
    db.close()
  }
  try {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    })
  } catch {
    // Nothing else to clean up.
  }
}
