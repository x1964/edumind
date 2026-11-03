/* EduMind service worker — enables installability, fast repeat loads and a
 * friendly offline fallback. Registered by src/components/pwa/pwa-register.tsx
 * as /sw.js?env=dev|prod so development never serves stale build output.
 */

const ENV = new URL(self.location.href).searchParams.get("env") === "dev" ? "dev" : "prod";
const VERSION = "v1";
const STATIC_CACHE = `edumind-static-${ENV}-${VERSION}`;
const PAGE_CACHE = `edumind-pages-${ENV}-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon/icon-192.png",
  "/favicon/icon-512.png",
  "/favicon/icon-maskable-192.png",
  "/favicon/icon-maskable-512.png",
  "/favicon/apple-touch-icon.png",
];

const PUBLIC_PAGES = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/privacy",
  "/terms",
]);

const STATIC_PREFIXES = ["/_next/static/", "/favicon/", "/_next/image"];
const STATIC_FILE = /\.(?:css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined)
        )
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("edumind-") && key !== STATIC_CACHE && key !== PAGE_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isStaticAsset(pathname) {
  return STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || STATIC_FILE.test(pathname);
}

function shouldCachePage(pathname) {
  return PUBLIC_PAGES.has(pathname);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function networkFirstAsset(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok && shouldCachePage(new URL(request.url).pathname)) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Never intercept the backend, auth callbacks, Supabase or other origins.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(ENV === "dev" ? networkFirstAsset(request) : cacheFirst(request));
  }
});
