// 1103 Deck Builder Service Worker
// 方針:
//  - index.html等の本体は常に network-first（毎回サーバーから最新を取得、失敗時のみキャッシュ）
//  - 重いカード画像(images/)だけ cache-first でオフライン&高速化
//  - SW_VERSION を変えると古いシェルキャッシュが破棄され、本体の更新が確実に反映される
const SW_VERSION = 'v67';
const IMG_CACHE = 'ygo1103-img-v1';                 // 画像は版をまたいで使い回す（重いので）
const SHELL_CACHE = 'ygo1103-shell-' + SW_VERSION;  // 本体は版ごとに分ける

// 本体からのメッセージで新SWを即有効化
self.addEventListener('message', function(e){
  if(e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k === IMG_CACHE || k === SHELL_CACHE) return null;
        return caches.delete(k);
      }));
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
            if(res && res.status === 200) cache.put(e.request, res.clone());
            return res;
          }).catch(function(){ return hit; });
        });
      })
    );
    return;
  }

  // 本体・その他は network-first（最新を優先、失敗時のみキャッシュ）
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res && res.status === 200 && url.origin === self.location.origin){
        var copy = res.clone();
        caches.open(SHELL_CACHE).then(function(cache){ cache.put(e.request, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});
