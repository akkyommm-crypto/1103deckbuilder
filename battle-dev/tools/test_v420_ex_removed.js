const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let __u=72000;function mk42(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face,pos,uid:__u++};}
function reset42(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=2;gameState.rngInitialSeed=0x42424242;gameState.rngState=0x42424242;turnActions=[];HISTORY.length=0;REDO.length=0;V41_ACTION_JOURNAL=[];V41_ACTION_SEQ=0;V41_INITIAL_RNG_SEED=gameState.rngInitialSeed;PLAY_MODE=PLAY_MODES.DUEL;ADS_CHAIN_MODE=ADS_CHAIN_MODES.AVAILABLE;}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
// Synchro PREPARE/COMMIT is fully actionized and preserves DEF.
reset42();let m1=mk42('ジャンク・シンクロン'),m2=mk42('セイバーザウルス'),ex=mk42('スターダスト・ドラゴン');gameState.players[0].mz=[m1,m2];gameState.players[0].ex=[ex];
act({type:'EX_SUMMON_PREPARE_V42',player:0,exIndex:0,materials:[0,1],kind:'synchro',pos:'def'});
ok('v4.2 EX prepare: pending is serializable',!!gameState.pendingExV2&&JSON.stringify(gameState.pendingExV2).length>10);
ok('v4.2 Synchro prepare: materials already in GY',gameState.players[0].grave.length===2&&gameState.players[0].mz.length===0,'grave='+gameState.players[0].grave.length);
ok('v4.2 EX prepare: EX monster removed pending',gameState.players[0].ex.length===0&&gameState.pendingExV2.exCard===ex);
act({type:'EX_SUMMON_COMMIT_V42',player:0});
ok('v4.2 Synchro commit: DEF preserved',gameState.players[0].mz[0]===ex&&ex.pos==='def','pos='+ex.pos);
ok('v4.2 Synchro commit: pending cleared',gameState.pendingExV2===null);
ok('v4.2 Replay journal contains EX prepare/commit',V41_ACTION_JOURNAL.slice(-2).map(e=>e.action.type).join(',')==='EX_SUMMON_PREPARE_V42,EX_SUMMON_COMMIT_V42',V41_ACTION_JOURNAL.slice(-2).map(e=>e.action.type).join(','));
// Summon-negation window itself is actionized too.
reset42();beginSummonWindowV2({player:0,name:'TEST',kind:'normal',label:'通常召喚',uid:999999,commit:'__NOOP__',cancel:'__NOOP__'});
ok('v4.2 summon window: OPEN/CLOSE are journal actions',V41_ACTION_JOURNAL.slice(-2).map(e=>e.action.type).join(',')==='SUMMON_WINDOW_OPEN_V42,SUMMON_WINDOW_CLOSE_V42',V41_ACTION_JOURNAL.slice(-2).map(e=>e.action.type).join(','));
// Xyz cancel: candidate materials + attempted Xyz go to GY.
reset42();m1=mk42('セイバーザウルス');m2=mk42('セイバーザウルス');ex=mk42('エヴォルカイザー・ラギア');gameState.players[0].mz=[m1,m2];gameState.players[0].ex=[ex];
act({type:'EX_SUMMON_PREPARE_V42',player:0,exIndex:0,materials:[0,1],kind:'xyz',pos:'def'});
ok('v4.2 Xyz prepare: materials held in pending',gameState.pendingExV2.materialCards.length===2&&gameState.players[0].grave.length===0);
act({type:'EX_SUMMON_CANCEL_V42',player:0});
ok('v4.2 Xyz negate: materials and Xyz to GY',gameState.players[0].grave.length===3&&gameState.players[0].grave.includes(ex),'grave='+gameState.players[0].grave.map(cardName));
// Removed metadata/events: Scout Plane from GY, Survivor from face-up MZ.
reset42();let scout=mk42('異次元の偵察機');gameState.players[0].grave=[scout];act({type:'FX_BANISH',player:0,zone:'grave',index:0,reason:'test remove'});
ok('v4.2 banish metadata: Scout Plane remembers turn/from',scout.banishInfo&&scout.banishInfo.turn===2&&scout.banishInfo.from==='grave',JSON.stringify(scout.banishInfo));
ok('v4.2 removed event queued centrally',(gameState.deferredEvents||[]).filter(x=>x.eventName==='onRemove').length===1,JSON.stringify(gameState.deferredEvents));
let sc=CARD_SCRIPTS['異次元の偵察機'],ctx=makeContext(0,scout,'banish',0,'onEndPhase',{event:{phase:'end'}});
ok('v4.2 Scout Plane: End Phase condition',sc.condition(ctx),ctx.reason||'');sc.resolve(ctx);
ok('v4.2 Scout Plane: returns in ATK',gameState.players[0].mz.includes(scout)&&scout.pos==='atk','mz='+gameState.players[0].mz.map(cardName)+' banish='+gameState.players[0].banish.map(cardName)+' reason='+ctx.reason);
ok('v4.2 Scout Plane: banish metadata clears after return',!scout.banishInfo);
reset42();let survivor=mk42('異次元の生還者');gameState.players[0].mz=[survivor];act({type:'FX_BANISH',player:0,zone:'mz',index:0,reason:'test remove'});sc=CARD_SCRIPTS['異次元の生還者'];ctx=makeContext(0,survivor,'banish',0,'onEndPhase',{event:{phase:'end'}});
ok('v4.2 Survivor: face-up field banish can return',sc.condition(ctx),ctx.reason||'');sc.resolve(ctx);
ok('v4.2 Survivor: returns in ATK',gameState.players[0].mz.includes(survivor)&&survivor.pos==='atk','mz='+gameState.players[0].mz.map(cardName)+' banish='+gameState.players[0].banish.map(cardName)+' reason='+ctx.reason);
reset42();survivor=mk42('異次元の生還者');gameState.players[0].grave=[survivor];act({type:'FX_BANISH',player:0,zone:'grave',index:0,reason:'test remove'});sc=CARD_SCRIPTS['異次元の生還者'];ctx=makeContext(0,survivor,'banish',0,'onEndPhase',{event:{phase:'end'}});
ok('v4.2 Survivor: banished from GY does not return',sc.condition(ctx)===false,ctx.reason||'');
// Event collector now sees banished-zone handlers.
reset42();scout=mk42('異次元の偵察機');gameState.players[0].banish=[scout];scout.banishInfo={turn:2,from:'grave',face:'up'};const hs=collectHandlers('onEndPhase',{phase:'end'});
ok('v4.2 event collector scans REMOVED',hs.some(x=>x.card===scout&&x.zone==='banish'),'handlers='+hs.map(x=>x.name+':'+x.zone));
ok('v4.2 LOCATION locates banished card',locationOfCardV4(scout)===LOCATION.REMOVED,'loc='+locationOfCardV4(scout));
globalThis.__V42R=R;
`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},scrollIntoView(){},animate(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){},back(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'v420.js',timeout:30000});const r=context.__V42R;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}
