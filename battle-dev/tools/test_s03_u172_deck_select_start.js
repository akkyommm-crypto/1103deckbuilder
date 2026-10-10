/* S03-U172 (user report): 「player2のデッキがサンプルの兎ラギアしか選ぶことができない。他のデッキを選ぶとデッキが空の状態でデュエルが
   開始される」. Outside the builder flow, choosing a saved deck only set the next deck and closed the sheet; the only visible start
   was 「兎ラギアと対戦開始」 (Player2 = the sample), and Player2's chosen deck could not be started without the hidden menu entry.
   Now the normal selection leads to the same start confirmation as the builder flow (startSelectedDeckDuel). */
const harness=require('./astra_harness');
const BUILDER=require('./fixtures/deckbuilder_v90_storage.js');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
setTimeout=(f)=>{ if(typeof f==='function') f(); return 0; };
function storageWith(values){
  const m = new Map(Object.entries(values || {}).map(([k,v])=>[k,String(v)]));
  return { get length(){ return m.size; }, key(i){ return Array.from(m.keys())[i] || null; },
    getItem(k){ return m.has(k) ? m.get(k) : null; }, setItem(k,v){ m.set(k,String(v)); }, removeItem(k){ m.delete(k); } };
}
function html(){ return String(sheet.innerHTML); }
function names(p,zone){ return gameState.players[p][zone].map(c=>cardName(c)); }
/* two 40-card decks written by the builder's own storage code */
function deckA(){ return [{n:'ワイト',q:3},{n:'ゴブリン突撃部隊',q:3},{n:'ギガンテス',q:3},{n:'青眼の白龍',q:3},{n:'クィーンズ・ナイト',q:3},{n:'セイバーザウルス',q:3},{n:'ワイルド・ラプター',q:3},
  {n:'サイクロン',q:3},{n:'ハウンド・ドラゴン',q:3},{n:'ヤマドラン',q:3},{n:'ゼラの戦士',q:3},{n:'鎧武者斬鬼',q:3},{n:'セイント・バード',q:3},{n:'ひょうすべ',q:1}]; }
function deckB(){ return [{n:'ワイトキング',q:3},{n:'D・ビデオン',q:3},{n:'サイバー・ジラフ',q:3},{n:'X－ヘッド・キャノン',q:3},{n:'Y－ドラゴン・ヘッド',q:3},{n:'Z－メタル・キャタピラー',q:3},
  {n:'エーリアン・グレイ',q:3},{n:'トマボー',q:3},{n:'デスガエル',q:3},{n:'鬼ガエル',q:3},{n:'ガスタの巫女 ウィンダ',q:3},{n:'ナチュル・アントジョー',q:3},{n:'ナチュル・スタッグ',q:3},{n:'幻獣王ガゼル',q:1}]; }
`;
harness(COMMON+BUILDER+String.raw`
resetA();
globalThis.localStorage = storageWith({'deck1103v2:migrated':'1'});
DECK_BUILDER_V90.saveDeckRecord({id:'deck_a', name:'デッキA', cards:deckA(), side:[], candidates:[], memo:''});
DECK_BUILDER_V90.saveDeckRecord({id:'deck_b', name:'デッキB', cards:deckB(), side:[], candidates:[], memo:''});
/* A. Player1 → prompt for Player2; Player2 → start confirmation */
openDeckLoad('saved',0);
loadSavedById('v2:deck_a');
ok('A: after Player1\'s deck, the next step is offered (Player2のデッキを選ぶ / 兎ラギアと対戦開始)',/Player2のデッキを選ぶ/.test(html())&&/兎ラギアと対戦開始/.test(html())&&/デッキA/.test(html()),html().slice(0,200));
openDeckLoad('saved',1);
loadSavedById('v2:deck_b');
ok('A: after Player2\'s deck, the start confirmation shows both decks',/デュエル開始/.test(html())&&/デッキA/.test(html())&&/デッキB/.test(html())&&/相手が先攻で開始/.test(html()),html().slice(0,240));
deckStartS03(1);
const p1all=names(1,'deck').concat(names(1,'hand'));
ok('A: 相手が先攻で開始 — both players 40 cards (35 in the Deck + 5 in hand), Player2 plays デッキB (not the sample, not empty), Player2 first',
  gameState.players[0].deck.length===35&&gameState.players[0].hand.length===5&&gameState.players[1].deck.length===35&&gameState.players[1].hand.length===5
  &&p1all.filter(n=>n==='ワイトキング').length===3&&p1all.indexOf('ワイト')<0&&gameState.firstPlayer===1,
  JSON.stringify({d0:gameState.players[0].deck.length,d1:gameState.players[1].deck.length,fp:gameState.firstPlayer}));
/* B. the sample opponent is still one tap away */
resetA();
openDeckLoad('saved',0);loadSavedById('v2:deck_a');
startRabbitOpponentDuel();
ok('B: 兎ラギアと対戦開始 from the prompt still starts against the sample',gameState.players[1].deck.length+gameState.players[1].hand.length===40&&gameState.players[0].hand.length===5);
/* C. Player2 first → asks for Player1 */
resetA();
openDeckLoad('saved',1);loadSavedById('v2:deck_b');
ok('C: Player2 chosen first → the Player1 selection is offered',/Player1のデッキを選ぶ/.test(html())&&/デッキB/.test(html()));
`);
