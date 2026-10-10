const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'dist', 'battle.html'), 'utf8');
let js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m, '/* boot skipped */');
function stub(){ return new Proxy({
  addEventListener(){},
  removeEventListener(){},
  classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
  style: {},
  dataset: {},
  appendChild(){},
  removeChild(){},
  remove(){},
  setAttribute(){},
  getAttribute(){ return null; },
  querySelector(){ return stub(); },
  querySelectorAll(){ return []; }
},{get:(t,p)=>p in t?t[p]:()=>{}}); }
const nodes = new Map();
const documentStub = {
  addEventListener(){},
  getElementById(id){ if(!nodes.has(id)) nodes.set(id,stub()); return nodes.get(id); },
  querySelector(){ return stub(); },
  querySelectorAll(){ return []; },
  createElement(){ return stub(); },
  body: stub(),
  documentElement: stub()
};
const store = new Map();
const localStorageStub = { getItem:k=>store.get(k)||null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) };
const context = {
  console,
  require,
  process,
  __dirname: path.join(ROOT, 'tools'),
  __DB__: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'carddata.json'), 'utf8')),
  structuredClone: global.structuredClone,
  document: documentStub,
  localStorage: localStorageStub,
  sessionStorage: localStorageStub,
  history: { pushState(){} },
  location: { reload(){} },
  navigator: { userAgent:'node' },
  addEventListener(){},
  removeEventListener(){},
  requestAnimationFrame:f=>f(),
  setTimeout:()=>0,
  clearTimeout(){},
  setInterval:()=>0,
  clearInterval(){},
  confirm:()=>true,
  prompt:()=>null,
  alert(){},
  Blob
};
js += String.raw`
CARD_DB=globalThis.__DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{}; showToast=()=>{}; saveDuelSoon=()=>{}; clearSavedDuel=()=>{}; closeSheet=()=>{};
openChainPriorityV2=()=>{}; enforceExclusions=()=>{}; enforceSinUpkeep=()=>{}; openPick=()=>{};
let uid=155000;
function mk(n,p=0){ return {id:findCardIndex(n),owner:p,controller:p,face:'up',pos:'atk',uid:uid++}; }
function endCtx(card){ return makeContext(0,card,'mz',0,'onEndPhase',{eventName:'onEndPhase'}); }
const results=[];
function ok(name, cond){ results.push({name, ok:!!cond}); }

gameState=newGame();
let ohka=mk('光神機－桜火');
gameState.players[0].hand=[ohka];
let meth=CARD_SCRIPTS['光神機－桜火'].normalSummonProcedure.methods[0];
let ohkaEff=nativeEffectsV4('光神機－桜火')[0];
ok('光神機－桜火 positive: リリースなし通常召喚手順', meth.tributes===0 && meth.modes.includes('summon'));
ok('光神機－桜火 ruling: 標準通常召喚も併存', CARD_SCRIPTS['光神機－桜火'].normalSummonProcedure.includeStandard===true);
gameState.activePlayer=0;
gameState.players[0].hand=[]; gameState.players[0].mz=[ohka]; ohka.normalSummonMethod='majesticMechOhka0';
ok('光神機－桜火 positive: 代替召喚なら自分Endに誘発', ohkaEff.condition(endCtx(ohka)));
ohkaEff.operation(endCtx(ohka));
ok('光神機－桜火 positive: Endに墓地へ送る', !!findCardByUid(ohka.uid) && findCardByUid(ohka.uid).zone==='grave');
gameState=newGame();
ohka=mk('光神機－桜火'); gameState.players[0].mz=[ohka]; gameState.activePlayer=0;
ok('光神機－桜火 negative: 通常手順以外では送らない', !ohkaEff.condition(endCtx(ohka)));

gameState=newGame();
let rose=mk('魔天使ローズ・ソーサラー'), plant=mk('キラー・トマト'), warrior=mk('クリッター');
gameState.players[0].hand=[rose]; gameState.players[0].mz=[plant];
let proc=CARD_SCRIPTS['魔天使ローズ・ソーサラー'].summonProcedure;
ok('魔天使ローズ・ソーサラー positive: 表側植物がいれば手札手順legal', proc.condition(makeContext(0,rose,'hand',0,'summonProcedure',{})));
gameState.players[0].mz=[warrior];
ok('魔天使ローズ・ソーサラー negative: 植物族なし不可', !proc.condition(makeContext(0,rose,'hand',0,'summonProcedure',{})));
gameState.players[0].mz=[plant]; plant.face='down';
ok('魔天使ローズ・ソーサラー negative: 裏側植物は戻せない', !proc.condition(makeContext(0,rose,'hand',0,'summonProcedure',{})));
gameState.players[0].mz=[mk('ライオウ'),mk('クリッター'),mk('サイバー・ドラゴン'),mk('キラー・トマト'),mk('アイヴィ・ウォール')];
gameState.players[0].mz[4].face='up';
ok('魔天使ローズ・ソーサラー negative: MZ満杯不可', !proc.condition(makeContext(0,rose,'hand',0,'summonProcedure',{})));
gameState=newGame();
rose=mk('魔天使ローズ・ソーサラー'); plant=mk('キラー・トマト');
gameState.players[0].hand=[rose]; gameState.players[0].mz=[plant];
API.selectCard=(label, list, cb)=>cb(list[0]);
let costDone=false;
proc.cost(makeContext(0,rose,'hand',0,'summonProcedure',{}), v=>{ costDone=v; });
ok('魔天使ローズ・ソーサラー positive: costで植物を手札へ戻す', costDone && gameState.players[0].hand.includes(plant) && !gameState.players[0].mz.includes(plant));
proc.execute(makeContext(0,rose,'hand',0,'summonProcedure',{position:'def'}));
ok('魔天使ローズ・ソーサラー positive: 自身を特殊召喚', gameState.players[0].mz.includes(rose));
ok('魔天使ローズ・ソーサラー ruling: 離れた場合除外flag', rose.banishWhenLeavesField===true);
globalThis.__cycle55Results=results;
`;
context.window = context;
context.globalThis = context;
vm.runInNewContext(js, context, {filename:'battle.html', timeout:60000});
let fail = 0;
for (const r of context.__cycle55Results) {
  console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name);
  if (!r.ok) fail++;
}
if (fail) process.exit(1);
