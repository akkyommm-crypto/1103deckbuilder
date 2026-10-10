const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet(); gameState=newGame(); turnActions=[];
render=()=>{}; showToast=()=>{}; saveDuelSoon=()=>{}; clearSavedDuel=()=>{}; saveAdsChainSettings=()=>{}; closeSheet=()=>{}; openChainPriorityV2=()=>{};
PLAY_MODE=PLAY_MODES.DUEL;
function mk(name,owner){const id=findCardIndex(name); if(id<0) throw new Error('missing '+name); return {id,owner,face:'up',pos:'atk'};}
const R=[]; const ok=(name,v,detail='')=>R.push({name,ok:!!v,detail});
// Rabbit's two summons must be accumulated into one simultaneous special-summon event.
gameState=newGame(); gameState.activePlayer=0; gameState.phase='main1';
const rabbit=mk('レスキューラビット',0); gameState.players[0].mz=[rabbit];
gameState.players[0].deck=[mk('セイバーザウルス',0),mk('セイバーザウルス',0),mk('異次元の女戦士',0)];
RESOLUTION_SUMMON_BATCH_V2=[];
const rsc=CARD_SCRIPTS['レスキューラビット'];
const rctx=makeContext(0,rabbit,'mz',0,'activate',{}); rctx.selectedTargets=[{name:'セイバーザウルス'}];
rsc.resolve(rctx); flushResolutionSummonBatchV2();
const evItem=(gameState.deferredEvents||[]).find(x=>x.eventName==='onSpecialSummon');
ok('ラビット2体は1つの同時特殊召喚イベント',!!evItem&&Array.isArray(evItem.evt.uids)&&evItem.evt.uids.length===2,JSON.stringify(evItem&&evItem.evt));
const summoned=(evItem&&evItem.evt.uids||[]).map(u=>{const h=findCardByUid(u);return h&&h.card;}).filter(Boolean);
ok('ラビットでセイバーザウルス2体が場にいる',summoned.length===2&&summoned.every(c=>cardName(c)==='セイバーザウルス'),'mz='+gameState.players[0].mz.map(cardName).join(','));
// Bottomless set by P1. It must not target/select one; it processes every qualifying monster in this summon batch.
const bottom=mk('奈落の落とし穴',1); bottom.face='down'; bottom.setTurn=0; gameState.players[1].sz=[bottom];
const bsc=CARD_SCRIPTS['奈落の落とし穴'];
const bctx=makeContext(1,bottom,'sz',0,'onSpecialSummon',{event:{player:0,cards:summoned,kind:'effect'}});
ok('奈落は同時召喚2体に発動可能',bsc.condition(bctx)===true,bctx.reason||'');
ok('奈落は対象を取らない',typeof bsc.selectTargets!=='function','');
bsc.resolve(bctx);
ok('奈落で2体とも除外',gameState.players[0].banish.filter(c=>cardName(c)==='セイバーザウルス').length===2,'banish='+gameState.players[0].banish.map(cardName).join(','));
ok('奈落で2体とも場から消える',!gameState.players[0].mz.some(c=>cardName(c)==='セイバーザウルス'),'mz='+gameState.players[0].mz.map(cardName).join(','));
// A monster that was already on the field must not be swept up by Bottomless.
gameState=newGame(); gameState.phase='main1';
const old=mk('ライオウ',0), n1=mk('セイバーザウルス',0), n2=mk('セイバーザウルス',0); gameState.players[0].mz=[old,n1,n2];
const b2=mk('奈落の落とし穴',1); b2.face='down'; gameState.players[1].sz=[b2];
const c2=makeContext(1,b2,'sz',0,'onSpecialSummon',{event:{player:0,cards:[n1,n2],kind:'effect'}}); bsc.resolve(c2);
ok('以前から場にいた1500以上は除外しない',gameState.players[0].mz.includes(old)&&cardName(old)==='ライオウ','mz='+gameState.players[0].mz.map(cardName).join(','));
// Resolution-time ATK check: one member dropped below 1500 -> only the other is destroyed/banished.
gameState=newGame(); gameState.phase='main1';
const a=mk('セイバーザウルス',0), b=mk('セイバーザウルス',0); gameState.players[0].mz=[a,b]; a.mods=[{atk:-500}];
const b3=mk('奈落の落とし穴',1); b3.face='down'; gameState.players[1].sz=[b3];
const c3=makeContext(1,b3,'sz',0,'onSpecialSummon',{event:{player:0,cards:[a,b],kind:'effect'}}); bsc.resolve(c3);
ok('処理時1500未満は奈落を免れる',gameState.players[0].mz.includes(a)&&gameState.players[0].banish.includes(b),'atkA='+curATK(a)+' mz='+gameState.players[0].mz.map(cardName).join(',')+' banish='+gameState.players[0].banish.map(cardName).join(','));
globalThis.__BOTTOMLESS_BATCH__=R;
`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>false,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'bottomless-v361.js',timeout:30000});const r=context.__BOTTOMLESS_BATCH__;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}
