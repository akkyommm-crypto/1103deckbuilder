// 1103 Deck Builder Service Worker
// 方針:
//  - index.html / carddata.json 等の本体は network-first（オンラインでは常に最新版を優先）
//  - index.html と carddata.json は install 時にも先行キャッシュして、分離後のオフライン起動を安定化
//  - 重いカード画像(images/cards*)は cache-first でオフライン&高速化
//  - SW_VERSION を変えると古いシェルキャッシュを破棄
const SW_VERSION = 'v68';
const IMG_CACHE = 'ygo1103-img-v1';
const SHELL_CACHE = 'ygo1103-shell-' + SW_VERSION;

// carddata.json を外部化したため、最低限この4つを先行キャッシュする。
// 個別取得にしているので、1ファイルの失敗だけでSW全体のinstallを失敗させない。
const CORE_ASSETS = [
  './',
  'index.html',
  'carddata.json',
  'manifest.webmanifest'
];

self.addEventListener('message', function(e){
  if(e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(SHELL_CACHE).then(function(cache){
      return Promise.all(CORE_ASSETS.map(function(path){
        return fetch(path, {cache:'reload'}).then(function(res){
          if(res && res.ok) return cache.put(path, res.clone());
          return null;
        }).catch(function(){
          // オンライン状態や一時的な取得失敗でSWのinstall自体は止めない
          return null;
        });
      }));
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k === IMG_CACHE || k === SHELL_CACHE) return null;
        return caches.delete(k);
      }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  if(e.request.method !== 'GET') return;

  // カード画像は cache-first
  // cards と cards_small の両方を対象にする。
  if(url.origin === self.location.origin &&
     (url.pathname.indexOf('/images/cards/') !== -1 ||
      url.pathname.indexOf('/images/cards_small/') !== -1)){
    e.respondWith(
      caches.open(IMG_CACHE).then(function(cache){
        return cache.match(e.request).then(function(hit){
          if(hit) return hit;
          return fetch(e.request).then(function(res){
            if(res && res.status === 200) cache.put(e.request, res.clone());
            return res;
          }).catch(function(){
            return hit || Response.error();
          });
        });
      })
    );
    return;
  }

  // 本体・JSON・裁定DB・battle等は network-first。
  // 成功時は同一オリジンだけ保存し、オフライン時は直近キャッシュへフォールバック。
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res && res.status === 200 && url.origin === self.location.origin){
        var copy = res.clone();
        caches.open(SHELL_CACHE).then(function(cache){
          cache.put(e.request, copy);
        });
      }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        if(hit) return hit;

        // /repo/ のようなナビゲーションURLは index.html にフォールバック。
        if(e.request.mode === 'navigate' && url.origin === self.location.origin){
          return caches.match('index.html');
        }
        return Response.error();
      });
    })
  );
});
