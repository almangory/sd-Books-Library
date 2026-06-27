/**
 * Simple IndexedDB wrapper for caching PDF files (Blobs) locally.
 * This allows reading custom and cached Google Drive PDFs offline.
 */

const DB_NAME = "FlipbookOfflineDB";
const STORE_NAME = "books_cache";
const DB_VERSION = 1;

export function initOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open offline database"));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function cacheBookBlob(bookId: string, blob: Blob): Promise<void> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, bookId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to cache book with ID: ${bookId}`));
    });
  } catch (error) {
    console.error("IndexedDB Cache Error:", error);
  }
}

export async function getCachedBookBlob(bookId: string): Promise<Blob | null> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(bookId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(new Error(`Failed to retrieve book with ID: ${bookId}`));
      };
    });
  } catch (error) {
    console.error("IndexedDB Read Error:", error);
    return null;
  }
}

export async function removeCachedBookBlob(bookId: string): Promise<void> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(bookId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete book with ID: ${bookId}`));
    });
  } catch (error) {
    console.error("IndexedDB Delete Error:", error);
  }
}

export async function getAllCachedBookIds(): Promise<string[]> {
  try {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve((request.result as string[]) || []);
      };
      request.onerror = () => {
        reject(new Error("Failed to retrieve cached book keys"));
      };
    });
  } catch (error) {
    console.error("IndexedDB keys fetch error:", error);
    return [];
  }
}

