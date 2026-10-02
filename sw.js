const CACHE_NAME = 'best-note-v7.10';
const SHELL = [
  './',
  './index.html',
  './styles.css?v=7.10',
  './app.js?v=7.10',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './self-check.html',
  './self-check.js'
];

const SHARE_DB_NAME = 'best-note-web-db';
const SHARE_DB_VERSION = 3;
const SHARE_STORE = 'share';

function openShareDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARE_DB_NAME, SHARE_DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('state')) database.createObjectStore('state', { keyPath: 'key' });
      if (!database.objectStoreNames.contains('history')) {
        const history = database.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        history.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!database.objectStoreNames.contains(SHARE_STORE)) database.createObjectStore(SHARE_STORE, { keyPath: 'id' });
      if (!database.objectStoreNames.contains('assets')) database.createObjectStore('assets', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('无法打开分享数据库'));
  });
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('分享数据库操作失败'));
  });
}

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const incoming = [...formData.getAll('image'), ...formData.getAll('files')]
      .filter((item) => item && typeof item.arrayBuffer === 'function');
    const files = [];
    for (const file of incoming) {
      files.push({
        name: file.name || `分享截图-${Date.now()}.png`,
        type: file.type || 'image/png',
        data: await file.arrayBuffer()
      });
    }
    const database = await openShareDatabase();
    const transaction = database.transaction(SHARE_STORE, 'readwrite');
    await idbRequest(transaction.objectStore(SHARE_STORE).put({
      id: 'pending',
      createdAt: new Date().toISOString(),
      text: String(formData.get('text') || formData.get('title') || ''),
      files
    }));
  } catch (error) {
    console.warn('分享内容保存失败：', error);
  }
  return Response.redirect(new URL('./?share=1', self.location.href), 303);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method === 'POST' && url.origin === self.location.origin && url.pathname.endsWith('/share-target')) {
    event.respondWith(handleShareTarget(request));
    return;
  }
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
