// Offline lesson storage (Phase 3 item 8). Plain IndexedDB rather than a
// library — the surface area needed here is tiny (put/get/delete/list by
// lesson id) and it avoids adding another dependency for something this
// small. One object store, keyed by lessonId.
//
// Scope, deliberately: this can only reliably store what doesn't have a
// cross-origin problem. Text lessons are safe (their content already comes
// through our own API). Video lessons are only downloadable when video_url
// is a direct file — not a YouTube or Bunny iframe embed (see Learn.jsx's
// isYouTube/isBunnyEmbed), since those aren't files at all, they're pages.
// Even a direct file URL can still fail — fetching the bytes as a blob
// requires the video's host to allow cross-origin reads via CORS, which
// this app doesn't control and can't guarantee for an arbitrary pasted
// URL. saveVideo() surfaces that failure clearly rather than pretending it
// always works.

const DB_NAME = "edubd-offline";
const STORE = "lessons";
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "lessonId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const offlineStore = {
  isSupported() {
    return typeof indexedDB !== "undefined";
  },

  async saveText({ lessonId, courseTitle, title, content }) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ lessonId, kind: "text", courseTitle, title, content, downloadedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /** @throws if the fetch fails or the host doesn't allow cross-origin reads */
  async saveVideo({ lessonId, courseTitle, title, videoUrl }) {
    const response = await fetch(videoUrl, { mode: "cors" });
    if (!response.ok) throw new Error(`Video host returned ${response.status}`);
    const blob = await response.blob();

    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ lessonId, kind: "video", courseTitle, title, blob, downloadedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async get(lessonId) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(lessonId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async list() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async remove(lessonId) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(lessonId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
