/* CODEX-C13 — user-supplied 1103 Rabbit Laggia sample recipe.
   - The opponent sample must match the requested Main 40 / Extra 15 / Side 15.
   - Starting the sample opponent duel must preserve both players' side-deck
     metadata without putting side cards into a playable zone.
   Real build/start paths, exact multisets, strict-1103 validation and Replay. */
const harness=require('./astra_harness');

const MAIN={
  'ジェネティック・ワーウルフ':3,'セイバーザウルス':3,'ライオウ':3,'レスキューラビット':3,'魔導戦士 ブレイカー':3,
  'サイクロン':2,'ブラック・ホール':1,'強欲で謙虚な壺':3,'禁じられた聖槍':3,'月の書':1,'死者蘇生':1,
  '王宮の弾圧':1,'強制脱出装置':2,'次元幽閉':2,'神の警告':2,'神の宣告':1,'聖なるバリア －ミラーフォース－':1,
  '盗賊の七つ道具':3,'奈落の落とし穴':2
};
const EXTRA={
  'No.16 色の支配者ショック・ルーラー':1,'No.39 希望皇ホープ':1,'イビリチュア・メロウガイスト':1,
  'インヴェルズ・ローチ':1,'ヴァイロン・ディシグマ':1,'エヴォルカイザー・ラギア':2,'カチコチドラゴン':1,
  'キメラテック・フォートレス・ドラゴン':1,'ジェムナイト・パール':2,'ブラック・ローズ・ドラゴン':1,
  '発条機甲ゼンマイスター':1,'氷結界の龍 トリシューラ':1,'氷結界の龍 ブリューナク':1
};
const SIDE={
  'D.D.クロウ':2,'サイバー・ドラゴン':2,'フォッシル・ダイナ パキケファロ':2,'冥府の使者ゴーズ':1,
  '禁じられた聖杯':3,'スキル・サクセサー':1,'マクロコスモス':2,'砂塵の大竜巻':2
};
const COMMON='const WANT_MAIN='+JSON.stringify(MAIN)+';const WANT_EXTRA='+JSON.stringify(EXTRA)+';const WANT_SIDE='+JSON.stringify(SIDE)+';'+String.raw`
function sortedObject(o){const r={};Object.keys(o).sort().forEach(k=>r[k]=o[k]);return JSON.stringify(r);}
function zoneCounts(cards){const r={};(cards||[]).forEach(c=>{const n=cardName(c);r[n]=(r[n]||0)+1;});return sortedObject(r);}
function namedCounts(entries){const r={};(entries||[]).forEach(e=>{const n=String(e&&e.n||'');if(n)r[n]=(r[n]||0)+(Number(e.q)||1);});return sortedObject(r);}
function total(o){return Object.values(o).reduce((a,n)=>a+n,0);}
`;

/* A. The runtime builder exposes the exact requested recipe. */
harness(COMMON+String.raw`
resetA();
const rabbit=buildTestDeck('rabbit');
ok('A: requested Rabbit Laggia counts are Main 40 / Extra 15 / Side 15',rabbit.main.length===40&&rabbit.ex.length===15&&total(WANT_SIDE)===15&&rabbit.side.reduce((a,e)=>a+e.q,0)===15,JSON.stringify({main:rabbit.main.length,ex:rabbit.ex.length,side:rabbit.side}));
ok('A: Main Deck is the exact user-supplied multiset',zoneCounts(rabbit.main)===sortedObject(WANT_MAIN),zoneCounts(rabbit.main));
ok('A: Extra Deck is the exact user-supplied multiset',zoneCounts(rabbit.ex)===sortedObject(WANT_EXTRA),zoneCounts(rabbit.ex));
ok('A: Side Deck metadata is the exact user-supplied multiset',namedCounts(rabbit.side)===sortedObject(WANT_SIDE),namedCounts(rabbit.side));
ok('A: strict 1103 validation accepts the complete recipe',rabbit.miss.length===0&&rabbit.violations.length===0&&validateStrict1103TestDefinition(RABBIT_LAGGIA_DECK).length===0,JSON.stringify({miss:rabbit.miss,violations:rabbit.violations,definition:validateStrict1103TestDefinition(RABBIT_LAGGIA_DECK)}));
`);

/* B. Normal opponent-sample start keeps side metadata, while side cards never
   enter hand/Deck/Extra Deck.  The LOAD_DECK actions remain Replay-safe. */
harness(COMMON+String.raw`
resetA();
const mine=buildTestDeck('feature');
gameState.players[0].loadedDeckV32={source:'user',name:'user deck',main:mine.main.map(c=>c.id),ex:mine.ex.map(c=>c.id),side:[{n:'D.D.クロウ',q:2}]};
baselineA();
ok('B: sample opponent duel starts',startRabbitOpponentDuel(0)===true);
const p0=gameState.players[0],p1=gameState.players[1];
ok('B: Rabbit Laggia side metadata is preserved for Player 2',namedCounts(p1.loadedDeckV32.side)===sortedObject(WANT_SIDE),namedCounts(p1.loadedDeckV32.side));
ok('B: Player 1 side metadata also survives the new-duel start',namedCounts(p0.loadedDeckV32.side)===sortedObject({'D.D.クロウ':2}),namedCounts(p0.loadedDeckV32.side));
ok('B: side cards are not mixed into active zones',p1.deck.length+p1.hand.length===40&&p1.ex.length===15,JSON.stringify({main:p1.deck.length+p1.hand.length,ex:p1.ex.length}));
const pkg=v41ReplayPackage(gameState),audit=v44ReplayAuditPackage(pkg);
ok('B: sample start with side metadata is Replay-consistent',pkg.actions.length>0&&audit.ok&&audit.finalDigest===v41StateDigest(gameState),JSON.stringify(audit).slice(0,300));
`);
