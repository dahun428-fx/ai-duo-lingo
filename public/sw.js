const BUILD_ID = "b757fc1cee";
// ^ 첫 줄은 그대로 둔다. build.py가 빌드 id로 바꿔서 public/sw.js를 만든다.
// 앱 껍데기를 폰에 저장해 두어 인터넷이 없어도 레슨과 연습이 열리게 한다.
// - 페이지 열기: 네트워크 먼저, 안 되면 저장본
// - 같은 출처의 나머지 파일: 저장본 먼저, 뒤에서 새로 받아 둠
// - 구글 폰트: 한 번 받은 것은 저장본 사용
const CACHE = "aiduo-" + BUILD_ID;
const SHELL = ["./", "index.html", "manifest.webmanifest", "vendor/marked.min.js", "vendor/katex.min.js", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("aiduo-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
async function put(req, res) {
  if (res && (res.ok || res.type === "opaque")) { const c = await caches.open(CACHE); await c.put(req, res.clone()); }
  return res;
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (!same && !FONT_HOSTS.includes(url.hostname)) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => put(req, r)).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => put(req, r)).catch(() => hit);
    return hit || net;
  }));
});
