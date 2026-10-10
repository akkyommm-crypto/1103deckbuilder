/* =========================================================================
   起動
   ========================================================================= */
/* カードデータは姉妹アプリ index.html の <script id="carddata"> から読み込む。
   失敗時は carddata.json を試し、それも駄目ならダミーDBで継続する。
   どのソースで動いているかは起動ログとメニューで確認できる。 */
let DB_SOURCE = "dummy";
const CARD_DB_CACHE_NAME = 'yg1103_carddb_v1';

function extractCarddata(txt){
  const doc = new DOMParser().parseFromString(txt, 'text/html');
  const el = doc.getElementById('carddata');
  if(!el) return null;
  const raw = (el.textContent||"").trim();
  if(!raw) return null;
  const data = JSON.parse(raw);
  return (Array.isArray(data) && data.length) ? data : null;
}
async function loadCardDataFromIndex(){
  const res = await fetch('index.html', {cache:'no-cache'});
  if(!res.ok) throw new Error('index.html HTTP '+res.status);
  const data = extractCarddata(await res.text());
  if(!data) throw new Error('index.html に carddata が見つかりません');
  return data;
}
async function loadCardDataFromJson(){
  const res = await fetch('carddata.json', {cache:'no-cache'});
  if(!res.ok) throw new Error('carddata.json HTTP '+res.status);
  const data = await res.json();
  if(!Array.isArray(data) || !data.length) throw new Error('carddata.json が空です');
  return data;
}

/* v3.2 Acode fallback: card DBをIndexedDBに保存する。
   初回だけファイル選択すれば、次回以降は file:// でも自動復元できる。 */
function cardDbCacheOpen(){
  return new Promise((resolve,reject)=>{
    if(!window.indexedDB){ reject(new Error('IndexedDB非対応')); return; }
    const req=indexedDB.open(CARD_DB_CACHE_NAME,1);
    req.onupgradeneeded=()=>{ const db=req.result; if(!db.objectStoreNames.contains('db')) db.createObjectStore('db'); };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('IndexedDB open failed'));
  });
}
async function loadCachedCardDb(){
  const db=await cardDbCacheOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('db','readonly');
    const req=tx.objectStore('db').get('cards');
    req.onsuccess=()=>{ db.close(); const v=req.result; resolve(Array.isArray(v)&&v.length?v:null); };
    req.onerror=()=>{ db.close(); reject(req.error||new Error('cache read failed')); };
  });
}
async function saveCachedCardDb(data){
  const db=await cardDbCacheOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('db','readwrite');
    tx.objectStore('db').put(data,'cards');
    tx.oncomplete=()=>{ db.close(); resolve(); };
    tx.onerror=()=>{ db.close(); reject(tx.error||new Error('cache write failed')); };
  });
}
async function importCardDbFile(input){
  const file=input && input.files && input.files[0];
  if(!file) return;
  try{
    const txt=await file.text();
    let data=null;
    if(/\.json$/i.test(file.name)) data=JSON.parse(txt);
    else data=extractCarddata(txt);
    if(!Array.isArray(data)||!data.length) throw new Error('カードデータを確認できません');
    await saveCachedCardDb(data);
    sheet.innerHTML=`<div class="grip"></div><h3>カードDBを保存しました</h3><div class="meta">${data.length}種を端末に保存しました。次回から自動で読み込みます。</div><button class="act" onclick="location.reload()">再読み込みして開始</button>`;
  }catch(e){
    sheet.innerHTML=`<div class="grip"></div><h3>読み込み失敗</h3><div class="eff">${escapeHtml(String(e.message||e))}</div><button class="close" onclick="closeSheet()">閉じる</button>`;
  }
}

async function boot(){
  const errors = [];
  let loaded=false;

  /* Acode standalone build: 完全カードDBが同一HTMLに埋め込まれていれば最優先。 */
  if(Array.isArray(window.__EMBEDDED_CARD_DB__) && window.__EMBEDDED_CARD_DB__.length){
    CARD_DB = window.__EMBEDDED_CARD_DB__;
    DB_SOURCE = "embedded";
    loaded=true;
  }

  /* Acodeで一度ファイル選択済みなら端末キャッシュを使う。 */
  if(!loaded){
    try{
      const cached=await loadCachedCardDb();
      if(cached){ CARD_DB=cached; DB_SOURCE='local-cache'; loaded=true; }
    }catch(e){ errors.push('local-cache: '+e.message); }
  }

  /* GitHub Pages等のWeb版は外部DBを読む。 */
  if(!loaded){
    try{
      CARD_DB = await loadCardDataFromJson(); DB_SOURCE = "carddata.json"; loaded=true;
    }catch(e1){
      errors.push('carddata.json: '+e1.message);
      try{
        CARD_DB = await loadCardDataFromIndex(); DB_SOURCE = "index.html"; loaded=true;
      }catch(e2){
        errors.push('index.html: '+e2.message);
      }
    }
  }
  if(!loaded){ CARD_DB = DUMMY_DB.slice(); DB_SOURCE = "dummy"; }

  NAME_INDEX = null;
  MAT_SPEC_CACHE.clear();
  buildMaterialNameSet();
  gameState = newGame();
  if(typeof v41ResetActionJournal==='function') v41ResetActionJournal(gameState);
  turnActions = [];
  if(DB_SOURCE === "dummy"){
    logIt(gameState, `<b>注意</b> カードデータを読めませんでした（お試し用${CARD_DB.length}種で動作中）`);
    errors.forEach(m=>logIt(gameState, `　${m}`));
  }else{
    logIt(gameState, `<b>決闘開始</b> — ${CARD_DB.length}種読込（${DB_SOURCE}）。デッキを読み込んでください`);
  }
  render();
  initViewportSync();
  initSwipe();
  guardBackButton();
  /* S03-U121: デッキビルダーの「このデッキでデュエルする」（?from=builder）は、再開ダイアログより優先する。
     通常の直接起動では builderLaunchS03() が false を返し、従来どおり offerResumeDuel を呼ぶ。 */
  if(DB_SOURCE !== "dummy") setTimeout(()=>{ if(!(typeof builderLaunchS03==='function' && builderLaunchS03())) offerResumeDuel(); }, 200);
  if(DB_SOURCE === "dummy"){
    setTimeout(()=>{
      sheet.innerHTML = `<div class="grip"></div>
        <h3 style="margin-bottom:8px">カードデータがありません</h3>
        <div class="meta" style="margin-bottom:8px">
          Acodeで確認する場合は、初回だけカードDBを選択できます。保存後は次回から自動読み込みします。</div>
        <label class="act" style="display:block;text-align:center;cursor:pointer">
          カードDBを選択
          <input type="file" accept=".json,.html,text/html,application/json" style="display:none" onchange="importCardDbFile(this)">
        </label>
        <div class="meta" style="margin-top:10px">対応: <b>carddata.json</b> / カードデータ入り <b>index.html</b><br>完全内蔵版 battle_acode.html なら選択不要です。</div>
        <button class="close" onclick="closeSheet()">閉じる</button>`;
      veil.classList.add("on");
    }, 300);
  }
}
boot();

/* System v3.1: damage-step legality metadata is finalized after all card scripts are loaded. */
['収縮','突進','禁じられた聖杯'].forEach(n=>{ if(CARD_SCRIPTS[n]) CARD_SCRIPTS[n].damageStepLegal=true; });

