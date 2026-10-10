/* S03-U114: DUEL saved-deck list vs. the 1103 deck builder's CURRENT storage contract (v90).
   User report (reproduced on device): DUEL only read the legacy `deck1103:` keys; the builder stores decks at
   `deck1103v2:<internal id>` (plus the marker `deck1103v2:migrated`). U108's test only had `deck1103:Alpha`,
   `yg1103_decks`, `work1103:current` fixtures, so its PASS never covered the current format.
   All records below are written by the builder's own storage code (tools/fixtures/deckbuilder_v90_storage.js,
   extracted verbatim from the builder's index.html, SHA256 recorded there) — no invented shapes. */
const harness=require('./astra_harness');
const BUILDER=require('./fixtures/deckbuilder_v90_storage.js');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function storageWith(values){
  const m = new Map(Object.entries(values || {}).map(([k,v])=>[k,String(v)]));
  return {
    get length(){ return m.size; },
    key(i){ return Array.from(m.keys())[i] || null; },
    getItem(k){ return m.has(k) ? m.get(k) : null; },
    setItem(k,v){ m.set(k,String(v)); },
    removeItem(k){ m.delete(k); },
    _keys(){ return Array.from(m.keys()); }
  };
}
/* main 6 + extra 1 (the builder keeps Main and Extra together in "cards") */
function cardsA(){ return [{n:'セイバーザウルス',q:3},{n:'サイクロン',q:2},{n:'ワイト',q:1},{n:'No.39 希望皇ホープ',q:1}]; }
function cardsB(){ return [{n:'ジェネティック・ワーウルフ',q:3},{n:'ライオウ',q:2},{n:'クリッター',q:1}]; }
function sideA(){ return [{n:'ライオウ',q:2}]; }
function html(){ return String(sheet.innerHTML); }
function rowKeys(){ return Array.from(html().matchAll(/data-deck-key="([^"]*)"/g)).map(m=>m[1]); }
function loaded(p){ return gameState.players[p].loadedDeckV32||null; }
`;

/* ===== Test 1: v2 only (no legacy key at all) — listed, selectable, correct Main/Extra, id/name/side/date kept ===== */
harness(COMMON+BUILDER+String.raw`
resetA();
globalThis.localStorage = storageWith({'deck1103v2:migrated':'1'});
const rec = DECK_BUILDER_V90.saveDeckRecord({id:'deck_test_1', name:'V2テストデッキ', cards:cardsA(), side:sideA(), candidates:[], memo:'m'});
ok('T1 setup: the builder wrote exactly deck1103v2:deck_test_1 (+ the marker), no legacy key',
  JSON.stringify(localStorage._keys().sort())===JSON.stringify(['deck1103v2:deck_test_1','deck1103v2:migrated']),JSON.stringify(localStorage._keys()));
const L = listSavedDecks();
ok('T1: the v2 deck is listed once, with the builder id / name / date',
  L.length===1 && L[0].id==='deck_test_1' && L[0].key==='v2:deck_test_1' && L[0].name==='V2テストデッキ' && L[0].date===rec.date,
  JSON.stringify(L.map(d=>({id:d.id,key:d.key,name:d.name,date:d.date,src:d.source}))));
openDeckLoad('saved',0);
ok('T1: the DUEL deck-selection sheet shows it, selectable by its stable id',
  html().includes('V2テストデッキ') && html().includes("loadSavedById('v2:deck_test_1')"), html().slice(0,600));
loadSavedById('v2:deck_test_1');
const d0 = loaded(0);
ok('T1: selecting it sets Player1\'s next deck — Main 6 / Extra 1 — and keeps id and side',
  d0 && d0.main.length===6 && d0.ex.length===1 && d0.deckId==='deck_test_1' && d0.name==='V2テストデッキ'
  && JSON.stringify(d0.side)===JSON.stringify([{n:'ライオウ',q:2}]),
  JSON.stringify(d0));
ok('T1: the current duel is not touched (next-start selection only)',gameState.players[0].hand.length===0&&gameState.players[0].deck.length===0);
`);

/* ===== Test 2: the migration marker is never a deck ===== */
harness(COMMON+BUILDER+String.raw`
resetA();
globalThis.localStorage = storageWith({'deck1103v2:migrated':'1'});
DECK_BUILDER_V90.saveDeck('マーカー確認', cardsA(), [], [], 'deck_marker_check');
const L = listSavedDecks();
ok('T2: deck1103v2:migrated never appears in the list',
  L.length===1 && !L.some(d=>d.sourceKey==='deck1103v2:migrated' || d.id==='migrated'),JSON.stringify(L.map(d=>d.sourceKey)));
openDeckLoad('saved',0);
ok('T2: … nor on the sheet',!html().includes('migrated'),html().slice(0,400));
`);

/* ===== Test 3: legacy + v2 copy of the same deck → exactly one row, the v2 one ===== */
harness(COMMON+BUILDER+String.raw`
resetA();
/* an old device: only the legacy name-keyed record, never opened in the v90 builder yet */
globalThis.localStorage = storageWith({'deck1103:旧キー': JSON.stringify({name:'旧キー', cards:cardsA(), side:[], date:'2026-01-01T00:00:00.000Z'})});
let L = listSavedDecks();
ok('T3a: legacy-only storage still lists the deck (backward compatible)',L.length===1&&L[0].name==='旧キー'&&L[0].source==='legacy'&&L[0].key==='legacy:'+legacyDeckIdS03('旧キー'),JSON.stringify(L));
/* the user opens the v90 builder once: it migrates non-destructively (the legacy key stays) */
const bl = DECK_BUILDER_V90.listDecks();
ok('T3 setup: the builder migrated it to deck1103v2:'+DECK_BUILDER_V90.legacyDeckId('旧キー')+' and kept the legacy key',
  localStorage.getItem('deck1103:旧キー')!==null && localStorage.getItem('deck1103v2:'+DECK_BUILDER_V90.legacyDeckId('旧キー'))!==null && localStorage.getItem('deck1103v2:migrated')==='1' && bl.length===1,
  JSON.stringify(localStorage._keys()));
L = listSavedDecks();
ok('T3: legacy + v2 copies of the same deck are shown once, and the v2 record wins',
  L.length===1 && L[0].source==='v2' && L[0].id===DECK_BUILDER_V90.legacyDeckId('旧キー'),JSON.stringify(L.map(d=>({key:d.key,src:d.source}))));
/* the user edits and re-saves it in the builder (same id, new cards) → still one row, the edited v2 content */
const re = DECK_BUILDER_V90.getDeckById(DECK_BUILDER_V90.legacyDeckId('旧キー'));
re.cards = cardsA().concat([{n:'クリッター',q:1}]);
DECK_BUILDER_V90.saveDeckRecord(re);
L = listSavedDecks();
ok('T3: after editing the migrated deck in the builder, still one row with the edited (v2) cards',
  L.length===1 && L[0].source==='v2' && L[0].cards.some(e=>e.n==='クリッター'),JSON.stringify(L.map(d=>({key:d.key,src:d.source,n:d.cards.length}))));
`);

/* ===== Test 4: same display name, different internal ids → both listed and each selectable ===== */
harness(COMMON+BUILDER+String.raw`
resetA();
globalThis.localStorage = storageWith({'deck1103v2:migrated':'1'});
DECK_BUILDER_V90.saveDeck('同名デッキ', cardsA(), [], [], 'deck_same_a');
DECK_BUILDER_V90.saveDeck('同名デッキ', cardsB(), [], [], 'deck_same_b');
const L = listSavedDecks();
ok('T4: both same-name decks are listed',L.length===2&&L.every(d=>d.name==='同名デッキ')&&new Set(L.map(d=>d.id)).size===2,JSON.stringify(L.map(d=>d.id)));
openDeckLoad('saved',0);
ok('T4: both rows are on the sheet with distinct keys',JSON.stringify(rowKeys().sort())===JSON.stringify(['v2:deck_same_a','v2:deck_same_b']),JSON.stringify(rowKeys()));
loadSavedById('v2:deck_same_b');
ok('T4: selecting the second loads its own cards',loaded(0).deckId==='deck_same_b'&&loaded(0).main.length===6&&loaded(0).ex.length===0,JSON.stringify(loaded(0)));
DECK_LOAD_PLAYER=1; loadSavedById('v2:deck_same_a');
ok('T4: selecting the first for Player2 loads the other one',loaded(1).deckId==='deck_same_a'&&loaded(1).ex.length===1,JSON.stringify(loaded(1)));
`);

/* ===== Test 5: real builder flows end to end + selection does not depend on enumeration order + explicit start ===== */
harness(COMMON+BUILDER+String.raw`
resetA();
globalThis.localStorage = storageWith({
  'deck1103:レガシーA': JSON.stringify({name:'レガシーA', cards:cardsB(), date:'2026-02-01T00:00:00.000Z'}),
  'work1103:current': JSON.stringify({id:'deck_work', name:'編集中X', cards:cardsA(), side:[], candidates:[], memo:'', date:'2026-09-23T00:00:00.000Z'})
});
DECK_BUILDER_V90.listDecks();                                   /* builder startup: migration */
const p1 = DECK_BUILDER_V90.saveDeck('P1用デッキ', cardsA(), sideA(), [], null);   /* new deck: builder-generated id */
const p2 = DECK_BUILDER_V90.saveDeck('P2用デッキ', cardsB(), [], [], null);
const builderIds = DECK_BUILDER_V90.listDecks().map(d=>d.id).sort();
const duelIds = listSavedDecks().map(d=>d.id).sort();
ok('T5: DUEL lists exactly the builder\'s decks (same internal ids, legacy copy not duplicated)',
  JSON.stringify(builderIds)===JSON.stringify(duelIds) && duelIds.length===3,JSON.stringify({builderIds,duelIds}));
ok('T5: work1103:current is still offered as the deck being edited',getWorkDeck()&&getWorkDeck().name==='編集中X');
/* reorder localStorage enumeration (rebuild the store in reverse key order) — keys still select the same decks */
const entries = localStorage._keys().map(k=>[k,localStorage.getItem(k)]).reverse();
globalThis.localStorage = storageWith(Object.fromEntries(entries));
openDeckLoad('saved',0);
ok('T5: rows carry the builder ids',rowKeys().includes('v2:'+p1.id)&&rowKeys().includes('v2:'+p2.id),JSON.stringify(rowKeys()));
loadSavedById('v2:'+p1.id);
DECK_LOAD_PLAYER=1; loadSavedById('v2:'+p2.id);
ok('T5: Player1 / Player2 get their own decks regardless of storage order',
  loaded(0).deckId===p1.id && loaded(1).deckId===p2.id && loaded(0).ex.length===1 && loaded(1).ex.length===0,
  JSON.stringify({p0:loaded(0)&&loaded(0).deckId,p1:loaded(1)&&loaded(1).deckId}));
ok('T5: nothing started yet',gameState.players[0].hand.length===0&&gameState.players[1].hand.length===0);
const started = startSelectedDeckDuel(0);
ok('T5: the explicit start begins the duel with both selected decks (5-card hands, Extra Decks)',
  started===true && gameState.players[0].hand.length===5 && gameState.players[1].hand.length===5
  && gameState.players[0].ex.length===1 && gameState.players[1].ex.length===0
  && gameState.players[0].deck.length===1 && gameState.players[1].deck.length===1,
  JSON.stringify({h:[gameState.players[0].hand.length,gameState.players[1].hand.length],ex:[gameState.players[0].ex.length,gameState.players[1].ex.length]}));
`);
