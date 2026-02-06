// Browser-local persistence layer for uploaded media using IndexedDB
// Stores hero background, 43 image memories, 6 video memories, and background song

const DB_NAME = 'BirthdayMediaStore';
const DB_VERSION = 1;
const STORE_NAME = 'media';

export type MediaSlotType = 'hero' | 'image' | 'video' | 'song';

export interface MediaSlot {
  type: MediaSlotType;
  index: number; // 0 for hero and song, 1-43 for images, 1-6 for videos
  blob: Blob;
  timestamp: number;
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

function makeKey(type: MediaSlotType, index: number): string {
  return `${type}-${index}`;
}

export async function saveMedia(type: MediaSlotType, index: number, blob: Blob): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const key = makeKey(type, index);
  const data: MediaSlot = { type, index, blob, timestamp: Date.now() };

  return new Promise((resolve, reject) => {
    const request = store.put({ key, ...data });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMedia(type: MediaSlotType, index: number): Promise<Blob | null> {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  const key = makeKey(type, index);

  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.blob : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAllMediaOfType(type: MediaSlotType): Promise<Map<number, Blob>> {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index('type');

  return new Promise((resolve, reject) => {
    const request = index.getAll(IDBKeyRange.only(type));
    request.onsuccess = () => {
      const results = request.result as (MediaSlot & { key: string })[];
      const map = new Map<number, Blob>();
      results.forEach((item) => {
        map.set(item.index, item.blob);
      });
      resolve(map);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearMedia(type: MediaSlotType, index: number): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const key = makeKey(type, index);

  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllMediaOfType(type: MediaSlotType): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index('type');

  return new Promise((resolve, reject) => {
    const request = index.openCursor(IDBKeyRange.only(type));
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}
