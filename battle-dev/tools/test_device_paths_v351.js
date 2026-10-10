const fs=require('fs'),vm=require('vm');
const path=require('path'); const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet(); gameState=newGame(); turnActions=[];
render=()=>{}; showToast=()=>{}; saveDuelSoon=()=>{}; clearSavedDuel=()=>{}; saveAdsChainSettings=()=>{}; closeSheet=()=>{}; openChainPriorityV2=()=>{};
API.selectCard=(title,cands,done)=>{
  let pick=null;
  const by=n=>(cands||[]).find(x=>x&&x.db&&x.db.n===n);
  if(title.includes('オネスト')||title.includes('一緒に墓地')) pick=by('オネスト');
  if(title.includes('サイクロン')) pick=(cands||[]).find(x=>x.p===1)||cands[0];
  if(title.includes('強制脱出')) pick=by('サイバー・ドラゴン')||cands[0];
  if(title.includes('対象の「六武衆」')) pick=by('真六武衆－キザン')||cands[0];
  if(title.includes('特殊召喚する「六武衆」')) pick=by('六武衆－ザンジ')||cands[0];
  if(title.includes('天空の宝札')) pick=by('オネスト')||cands[0];
  if(!pick) pick=(cands||[])[0];
  if(!pick) throw new Error('no candidate '+title);
  done(pick);
};
function __solve(){
  while(gameState.chain.length){ const l=gameState.chain[gameState.chain.length-1]; act({type:'CHAIN_RESOLVE_TOP'}); resolveOnePreparedLinkV27(l); }
  gameState.chainWindow=null; reconcileProcedureBaseStats();
}
const R=[]; const ok=(name,v,detail='')=>R.push({name,ok:!!v,detail});
// 1 天空
v351SetPlayModeRaw(PLAY_MODES.DEVELOPER); startDeviceSmokeV351('specialLock');
let i=v351IndexOf(0,'hand','天空の宝札'); duelActivateFromHand(i); __solve();
let ri=v351IndexOf(0,'hand','死者蘇生'), ra=getLegalHandActions(0,ri).map(a=>a.id);
ok('天空: noSpecialSummon',gameState.players[0].temporaryFlags.noSpecialSummon===true,JSON.stringify(gameState.players[0].temporaryFlags));
ok('天空: noBattlePhase',gameState.players[0].temporaryFlags.noBattlePhase===true,'');
ok('天空: 死者蘇生の発動ボタンなし',!ra.includes('activate'),ra.join(','));
ok('天空: 2ドロー',gameState.players[0].hand.length===3,'hand='+gameState.players[0].hand.map(cardName).join('/'));
v351RestoreSmokeMode();
// 2 緑光
v351SetPlayModeRaw(PLAY_MODES.DEVELOPER); startDeviceSmokeV351('heraldMagic');
i=v351IndexOf(0,'hand','サイクロン'); duelActivateFromHand(i);
let res=getChainResponsesV2(1); ok('緑光: response candidate',res.some(x=>x.db.n==='緑光の宣告者'),res.map(x=>x.db.n).join(','));
let gi=v351IndexOf(1,'hand','緑光の宣告者'); duelActivateResponseV2(1,'hand',gi); __solve();
ok('緑光: コスト2枚墓地',gameState.players[1].grave.some(c=>cardName(c)==='緑光の宣告者')&&gameState.players[1].grave.some(c=>cardName(c)==='オネスト'),gameState.players[1].grave.map(cardName).join(','));
ok('緑光: 対象罠が残る',gameState.players[1].sz.some(c=>cardName(c)==='奈落の落とし穴'),gameState.players[1].sz.map(cardName).join(','));
ok('緑光: サイクロン墓地',gameState.players[0].grave.some(c=>cardName(c)==='サイクロン'),gameState.players[0].grave.map(cardName).join(','));
v351RestoreSmokeMode();
// 3 紫光
v351SetPlayModeRaw(PLAY_MODES.DEVELOPER); startDeviceSmokeV351('heraldTrap');
i=v351IndexOf(0,'sz','強制脱出装置'); duelActivateFromZone(0,'sz',i);
res=getChainResponsesV2(1); ok('紫光: response candidate',res.some(x=>x.db.n==='紫光の宣告者'),res.map(x=>x.db.n).join(','));
let pi=v351IndexOf(1,'hand','紫光の宣告者'); duelActivateResponseV2(1,'hand',pi); __solve();
ok('紫光: コスト2枚墓地',gameState.players[1].grave.some(c=>cardName(c)==='紫光の宣告者')&&gameState.players[1].grave.some(c=>cardName(c)==='オネスト'),gameState.players[1].grave.map(cardName).join(','));
ok('紫光: Cydraが場に残る',gameState.players[1].mz.some(c=>cardName(c)==='サイバー・ドラゴン'),gameState.players[1].mz.map(cardName).join(','));
v351RestoreSmokeMode();
// 4 荒行
v351SetPlayModeRaw(PLAY_MODES.DEVELOPER); startDeviceSmokeV351('asceticism');
i=v351IndexOf(0,'hand','六武衆の荒行'); duelActivateFromHand(i); __solve();
ok('荒行: ザンジ特殊召喚',gameState.players[0].mz.some(c=>cardName(c)==='六武衆－ザンジ'),gameState.players[0].mz.map(cardName).join(','));
ok('荒行: End破壊予約',gameState.reserved.some(x=>x.kind==='destroyUids'),JSON.stringify(gameState.reserved));
resolveReservedEffectsV30('endPhase');
ok('荒行: キザンのみ破壊',!gameState.players[0].mz.some(c=>cardName(c)==='真六武衆－キザン')&&gameState.players[0].mz.some(c=>cardName(c)==='六武衆－ザンジ'),'mz='+gameState.players[0].mz.map(cardName).join(',')+' grave='+gameState.players[0].grave.map(cardName).join(','));
v351RestoreSmokeMode();
// 5 ボルテック: damage-step passive candidate declaration + test board attack legality
v351SetPlayModeRaw(PLAY_MODES.DEVELOPER); startDeviceSmokeV351('voltic');
let vi=v351IndexOf(0,'mz','E・HERO ボルテック');
let va=getLegalZoneActions(0,'mz',vi).map(a=>a.id); ok('ボルテック: 攻撃開始合法',va.includes('attack'),va.join(','));
const vcard=gameState.players[0].mz[vi], vsc=CARD_SCRIPTS['E・HERO ボルテック'];
const vctx=makeContext(0,vcard,'mz',vi,'onDamageStep',{battle:{atkCard:vcard,damage:1000,toPlayer:1},step:'after'});
ok('ボルテック: damage-after誘発条件',!!vsc.passive.onDamageStep(vctx),'');
let vtargets=[]; vsc.selectTargets(vctx,t=>{vtargets=t||[]}); vctx.selectedTargets=vtargets; vsc.resolve(vctx);
ok('ボルテック: 除外エアーマン特殊召喚',gameState.players[0].mz.some(c=>cardName(c)==='E・HERO エアーマン'),'mz='+gameState.players[0].mz.map(cardName).join(','));
v351RestoreSmokeMode();
globalThis.__DEEP_PROBE__=R;
`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>false,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'v351deep.js',timeout:30000});const r=context.__DEEP_PROBE__;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}
