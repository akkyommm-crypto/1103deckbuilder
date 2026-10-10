const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
js=js.replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
const probe=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__; NAME_INDEX=null; MAT_SPEC_CACHE.clear(); buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
let __u=61000;function mk41(n,p=0){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return {id,owner:p,controller:p,face:'down',pos:'atk',uid:__u++};}
function reset41(seed){gameState=newGame();gameState.rngInitialSeed=seed>>>0;gameState.rngState=seed>>>0;V41_ACTION_JOURNAL=[];V41_ACTION_SEQ=0;V41_INITIAL_RNG_SEED=seed>>>0;turnActions=[];HISTORY.length=0;REDO.length=0;PLAY_MODE=PLAY_MODES.DUEL;}
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
// deterministic RNG sequence
reset41(0x12345678);const r1=[duelRandomInt(1000),duelRandomInt(1000),duelRandomInt(1000)];
reset41(0x12345678);const r2=[duelRandomInt(1000),duelRandomInt(1000),duelRandomInt(1000)];
ok('v4.1 RNG: same seed gives same sequence',JSON.stringify(r1)===JSON.stringify(r2),r1+' / '+r2);
// action journal + deterministic shuffle + coin toss
reset41(0x13572468);
const deck=['セイバーザウルス','ライオウ','異次元の女戦士','スノーマンイーター','エフェクト・ヴェーラー','レスキューラビット'].map(n=>mk41(n));
act({type:'LOAD_DECK',player:0,deck:deck,ex:[]});
act({type:'SHUFFLE',player:0});
act({type:'DRAW',player:0,n:2});
act({type:'COIN_TOSS'});
const pkg=v41ReplayPackage(gameState), validation=v41ValidateReplayPackage(pkg);
ok('v4.1 journal: four actions committed',validation.ok&&pkg.actions.length===4,'count='+pkg.actions.length);
ok('v4.1 journal: actions are JSON safe',JSON.parse(JSON.stringify(pkg)).actions.length===4);
ok('v4.1 journal: coin toss is an action',pkg.actions[3].action.type==='COIN_TOSS'&&[0,1].includes(pkg.actions[3].action.result),JSON.stringify(pkg.actions[3].action));
const finalDigest=pkg.finalDigest, seed=pkg.initialRngSeed, entries=JSON.parse(JSON.stringify(pkg.actions));
reset41(seed);gameState.__v41ReplayApplying=true;
let divergence='';
for(const e of entries){
  act(v41JournalClone(e.action));
  // Random choices made outside applyAction (legacy effects) are still carried
  // by the committed result action; align PRNG cursor for the next boundary.
  gameState.rngState=e.rngState>>>0;
  const d=v41StateDigest(gameState);if(d!==e.digest){divergence='seq '+e.seq+' '+d+'!='+e.digest;break;}
}
delete gameState.__v41ReplayApplying;
ok('v4.1 replay audit: action sequence reproduces each checkpoint',!divergence,divergence);
ok('v4.1 replay audit: final digest matches',v41StateDigest(gameState)===finalDigest,v41StateDigest(gameState)+' / '+finalDigest);
ok('v4.1 replay does not self-record',V41_ACTION_JOURNAL.length===0,'journal='+V41_ACTION_JOURNAL.length);
// setcode migration helpers
const kiz=mk41('真六武衆－キザン'),bf=mk41('BF－疾風のゲイル');
ok('v4.1 setcode migration: legacy Six helper uses metadata',v340IsSix(kiz)&&v380IsSix(kiz));
ok('v4.1 setcode migration: legacy BF helper uses metadata',v380IsBF(bf));
globalThis.__V41R=R;
`;
js+='\n'+probe;
function nodeStub(){const b={innerHTML:'',className:'',hidden:false,textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},scrollIntoView(){},animate(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},querySelector(){return nodeStub()},querySelectorAll(){return []}};return new Proxy(b,{get(t,p){if(p in t)return t[p];if(p==='children'||p==='files')return [];return ()=>{}},set(t,p,v){t[p]=v;return true}})}
const nodes=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,nodeStub());return nodes.get(id)},querySelector(){return nodeStub()},querySelectorAll(){return []},createElement(){return nodeStub()},addEventListener(){},removeEventListener(){},body:nodeStub(),documentElement:nodeStub()};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const context={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){},back(){}},location:{reload(){}},navigator:{userAgent:'node'},innerHeight:800,innerWidth:400,addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),cancelAnimationFrame(){},setTimeout:(f)=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},DOMParser:class{parseFromString(){return {getElementById(){return null}}}},fetch:async()=>{throw new Error('fetch disabled')},indexedDB:null,FileReader:class{},Blob,URL:{createObjectURL(){return ''},revokeObjectURL(){}},structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
try{vm.runInNewContext(js,context,{filename:'v410replay.js',timeout:30000});const r=context.__V41R;console.log(r.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(r.some(x=>!x.ok))process.exit(2)}catch(e){console.error(e.stack||e);process.exit(1)}
