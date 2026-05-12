const CACHE_NAME = 'ru-tax-calculator-v1'
const APP_SHELL = [
  '/',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(request.url)
  const sameOrigin = requestUrl.origin === self.location.origin

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (sameOrigin) {
    event.respondWith(cacheFirst(request))
  }
})

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put('/', response.clone())
    }

    return response
  } catch {
    const cachedResponse = await cache.match('/')
    if (cachedResponse) {
      return cachedResponse
    }

    throw new Error('Offline page is not cached')
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    updateCache(request, cache)
    return cachedResponse
  }

  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
  }

  return response
}

function updateCache(request, cache) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        return cache.put(request, response)
      }

      return undefined
    })
    .catch(() => undefined)
}
