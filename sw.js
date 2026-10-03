const CACHE_NAME = 'best-note-v7.28';
const SHELL = [
  './',
  './index.html',
  './styles.css?v=7.28',
  './app.js?v=7.28',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './self-check.html',
  './self-check.js',
  './ocr-ab-test.html',
  './ocr-ab-lib.js',
  './ocr-onnx-lib.js',
  './ocr-onnx-engine.js',
  './stitch-crop-lib.js'
];

// OCR 引擎脚本与模型来自第三方 CDN，浏览器缓存并不可靠（清理缓存后要重新下载十几 MB）。
// 这里用独立的 Cache Storage 缓存一次，之后即使离线也能直接识别。
const ENGINE_CACHE = 'best-note-engines-v1';
const ENGINE_HOSTS = [
  'cdn.jsdelivr.net',
  'unpkg.com',
  'huggingface.co',
  'hf-mirror.com',
  'raw.githubusercontent.com',
  'cdn-lfs.huggingface.co'
];

function isEngineRequest(url) {
  if (ENGINE_HOSTS.includes(url.hostname)) return true;
  if (url.hostname.endsWith('.hf-mirror.com')) return true;
  return false;
}

async function cacheFirstEngine(request) {
  const cache = await caches.open(ENGINE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cacheable = response.ok || (response.type === 'opaque' && request.mode === 'no-cors');
    if (cacheable) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (error) {
    return cached || Promise.reject(error);
  }
}

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
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME && key !== ENGINE_CACHE).map((key) => caches.delete(key))
    ))
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
  if (request.method === 'GET' && url.origin !== self.location.origin && isEngineRequest(url)) {
    event.respondWith(cacheFirstEngine(request));
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
