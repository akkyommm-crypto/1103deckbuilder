/* S03-U114 note: this U108 test's saved-deck fixtures (deck1103:Alpha / yg1103_decks / work1103:current) never
   covered the deck builder's current storage (deck1103v2:<id>), so its PASS did not prove the user's device case.
   The builder-contract coverage is tools/test_s03_u114_saved_decks_v2.js; card-effect Xyz detach coverage is
   tools/test_s03_u114_xyz_detach_choice.js (this file only drives the manual openXyzDetachPick UI). */
const harness = require('./astra_harness');

const COMMON = String.raw`
function replayOk(label){
  const pkg = v41ReplayPackage(gameState);
  const a = v44ReplayAuditPackage(pkg);
  ok(label, pkg.actions.length > 0 && a.ok, JSON.stringify(a).slice(0, 220));
}
function storageWith(values){
  const m = new Map(Object.entries(values || {}).map(([k,v])=>[k,String(v)]));
  return {
    get length(){ return m.size; },
    key(i){ return Array.from(m.keys())[i] || null; },
    getItem(k){ return m.has(k) ? m.get(k) : null; },
    setItem(k,v){ m.set(k,String(v)); },
    removeItem(k){ m.delete(k); }
  };
}
function savedDeck(name, cardName, q){
  return {name, date:'2026-09-23T00:00:00.000Z', cards:[{n:cardName,q:q||6},{n:'No.39 希望皇ホープ',q:1}]};
}
`;

harness(COMMON + String.raw`
resetA();
globalThis.localStorage = storageWith({
  'deck1103:Alpha': JSON.stringify(savedDeck('Alpha','セイバーザウルス',6)),
  'yg1103_decks': JSON.stringify([{title:'Beta', main:[{name:'ジェネティック・ワーウルフ',qty:6}]}]),
  'work1103:current': JSON.stringify(savedDeck('Work','クリッター',6)),
  'yg1103_duel_autosave': JSON.stringify({players:[{hand:[1]}]})
});
const decks = listSavedDecks();
ok('A: saved deck list reads prefix and collection schemas without treating autosave as a deck',
  decks.some(d=>d.name==='Alpha') && decks.some(d=>d.name==='Beta') && !decks.some(d=>d.name==='undefined'),
  JSON.stringify(decks.map(d=>({name:d.name,sourceKey:d.sourceKey}))));
ok('A: work deck fallback is visible', getWorkDeck().name === 'Work');
openDeckLoad('saved', 1);
ok('A/B: DUEL deck selection screen renders saved decks and Player2 target without starting a duel',
  String(sheet.innerHTML).includes('Player2') && String(sheet.innerHTML).includes('Alpha') && String(sheet.innerHTML).includes('Beta') &&
  gameState.players[0].hand.length === 0 && gameState.players[1].hand.length === 0,
  String(sheet.innerHTML).slice(0, 500));
openDeckLoad('text', 1);
ok('B: text deck UI no longer offers immediate draw/start from the load screen',
  String(sheet.innerHTML).includes('次回開始用に選択') && !String(sheet.innerHTML).includes('読込＆5枚ドロー'),
  String(sheet.innerHTML).slice(0, 500));

gameState.players[0].hand = [mk('ライオウ',0)];
gameState.players[0].deck = [mk('サイクロン',0)];
gameState.players[1].hand = [mk('ワーム・ゼクス',1)];
gameState.players[1].deck = [mk('ワーム・ヤガン',1)];
const before = JSON.stringify({
  p0h:gameState.players[0].hand.map(cardName),
  p0d:gameState.players[0].deck.map(cardName),
  p1h:gameState.players[1].hand.map(cardName),
  p1d:gameState.players[1].deck.map(cardName),
  turn:gameState.turn,
  phase:gameState.phase,
  active:gameState.activePlayer
});
DECK_LOAD_PLAYER = 1;
loadSaved(0);
const after = JSON.stringify({
  p0h:gameState.players[0].hand.map(cardName),
  p0d:gameState.players[0].deck.map(cardName),
  p1h:gameState.players[1].hand.map(cardName),
  p1d:gameState.players[1].deck.map(cardName),
  turn:gameState.turn,
  phase:gameState.phase,
  active:gameState.activePlayer
});
ok('B: selecting a saved deck for Player2 records next-start selection only and does not replace the current duel',
  before === after && gameState.players[1].loadedDeckV32 && gameState.players[1].loadedDeckV32.name === 'Alpha',
  JSON.stringify({before,after,loaded:gameState.players[1].loadedDeckV32}));

DECK_LOAD_PLAYER = 0;
loadSaved(1);
ok('B: Player1 can independently select a different saved deck for next start',
  gameState.players[0].loadedDeckV32.name === 'Beta' && gameState.players[1].loadedDeckV32.name === 'Alpha',
  JSON.stringify([gameState.players[0].loadedDeckV32, gameState.players[1].loadedDeckV32]));
startSelectedDeckDuel(1);
ok('B: explicit selected-deck new duel initializes both selected decks and draws opening hands',
  gameState.players[0].hand.length === 5 && gameState.players[1].hand.length === 5 &&
  gameState.players[0].loadedDeckV32.name === 'Beta' && gameState.players[1].loadedDeckV32.name === 'Alpha' &&
  gameState.firstPlayer === 1,
  JSON.stringify({p0h:gameState.players[0].hand.length,p1h:gameState.players[1].hand.length,first:gameState.firstPlayer}));
replayOk('B: deck selection/start action journal replays cleanly');
`);

harness(COMMON + String.raw`
resetA();
const xyz = mk('No.39 希望皇ホープ',0);
const m0 = mk('セイバーザウルス',0), m1 = mk('ワーム・ゼクス',1), m2 = mk('ジェネティック・ワーウルフ',0);
xyz.xyz = [m0,m1,m2];
gameState.players[0].mz = [xyz];
baselineA();
let captured = null;
openPick = (title,sub,cands)=>{ captured = {title,sub,cands}; };
openXyzDetachPick(0,0);
ok('C: multiple Xyz materials open a material choice instead of auto-detaching',
  captured && captured.cands.length === 3 && captured.title.includes('取り除く素材'),
  JSON.stringify(captured && {title:captured.title,labels:captured.cands.map(c=>c.label)}));
captured.cands[1].onPick();
ok('C: chosen material UID is detached, sent to its owner grave, and unchosen materials stay attached',
  xyz.xyz.length === 2 && xyz.xyz[0] === m0 && xyz.xyz[1] === m2 &&
  gameState.players[1].grave.includes(m1) && !gameState.players[0].grave.includes(m1),
  JSON.stringify({attached:xyz.xyz.map(cardName),p0g:gameState.players[0].grave.map(cardName),p1g:gameState.players[1].grave.map(cardName)}));
replayOk('C: selected Xyz material detach replays cleanly');

const xyz2 = mk('No.39 希望皇ホープ',0);
const only = mk('セイバーザウルス',0);
xyz2.xyz = [only];
gameState = newGame();
gameState.players[0].mz = [xyz2];
baselineA();
captured = null;
openXyzDetachPick(0,0);
ok('C: single-material detach remains direct and does not add an unnecessary choice',
  !captured && xyz2.xyz.length === 0 && gameState.players[0].grave.includes(only),
  JSON.stringify({captured:!!captured,xyz:(xyz2.xyz||[]).length,grave:gameState.players[0].grave.map(cardName)}));
`);
