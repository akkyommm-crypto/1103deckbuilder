// 1103 Deck Builder Service Worker
// 方針: index.html本体は常にネットワーク優先（更新をすぐ反映）。
//       重いカード画像(images/)だけ cache-first でオフライン&高速化。
const IMG_CACHE = 'ygo1103-img-v1';

self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==IMG_CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  if(e.request.method !== 'GET') return;
  // カード画像は cache-first
  if(url.pathname.indexOf('/images/cards') !== -1){
    e.respondWith(
      caches.open(IMG_CACHE).then(function(cache){
        return cache.match(e.request).then(function(hit){
          if(hit) return hit;
          return fetch(e.request).then(function(res){
            if(res && res.status===200) cache.put(e.request, res.clone());
            return res;
          }).catch(function(){ return hit; });
        });
      })
    );
    return;
  }
  // それ以外（本体・フォント等）はネットワーク優先、失敗時のみキャッシュ
  // 本体はキャッシュしないので、オフライン時は最後に見た画像のみ動く簡易対応
});
