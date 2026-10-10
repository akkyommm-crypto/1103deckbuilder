/* Auto cycle 61 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.phase='main1';gameState.turn=61;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(card){return makeContext(0,card,'hand',0,'summonProcedure',{});}
const TARGETS=['岩の精霊 タイタン','炎の精霊 イフリート'];
TARGETS.forEach(n=>ok('cycle61 registration '+n,!!sc(n)));
ok('cycle61 枚数は2',TARGETS.length===2);
reset0();
let titan=mk('岩の精霊 タイタン'), earth=mk('D.D.アサイラント');
gameState.players[0].hand=[titan];gameState.players[0].grave=[earth];
let proc=sc('岩の精霊 タイタン').summonProcedure;
ok('岩の精霊 タイタン positive: 墓地地属性で手札特殊召喚legal',proc.condition(C(titan)));
API.selectCard=(label,list,cb)=>cb(list[0]);
let costOk=false;proc.cost(C(titan),v=>costOk=v);
ok('岩の精霊 タイタン positive: 地属性を除外する',costOk&&findCardByUid(earth.uid).zone==='banish');
proc.execute(C(titan));
ok('岩の精霊 タイタン positive: 自身を特殊召喚',findCardByUid(titan.uid).zone==='mz');
gameState.phase='battle';gameState.activePlayer=1;
ok('岩の精霊 タイタン ruling: 相手BP中のみATK+300',curATK(titan)===(dbOf(titan).atk||0)+300);
gameState.activePlayer=0;
ok('岩の精霊 タイタン negative: 自分BP中は上昇しない',curATK(titan)===(dbOf(titan).atk||0));
reset0();
titan=mk('岩の精霊 タイタン');gameState.players[0].hand=[titan];gameState.players[0].grave=[mk('ライオウ')];
ok('岩の精霊 タイタン negative: 地属性墓地なし不可',!proc.condition(C(titan)));
ok('岩の精霊 タイタン ruling: 通常召喚不可flag',sc('岩の精霊 タイタン').cannotNormalSummon===true);
reset0();
let ifrit=mk('炎の精霊 イフリート'), fire=mk('E・HERO バーストレディ');
gameState.players[0].hand=[ifrit];gameState.players[0].grave=[fire];
let iproc=sc('炎の精霊 イフリート').summonProcedure;
ok('炎の精霊 イフリート positive: 墓地炎属性で手札特殊召喚legal',iproc.condition(C(ifrit)));
costOk=false;iproc.cost(C(ifrit),v=>costOk=v);
ok('炎の精霊 イフリート positive: 炎属性を除外する',costOk&&findCardByUid(fire.uid).zone==='banish');
iproc.execute(C(ifrit));
ok('炎の精霊 イフリート positive: 自身を特殊召喚',findCardByUid(ifrit.uid).zone==='mz');
gameState.phase='battle';gameState.activePlayer=0;
ok('炎の精霊 イフリート ruling: 自分BP中のみATK+300',curATK(ifrit)===(dbOf(ifrit).atk||0)+300);
gameState.activePlayer=1;
ok('炎の精霊 イフリート negative: 相手BP中は上昇しない',curATK(ifrit)===(dbOf(ifrit).atk||0));
reset0();
ifrit=mk('炎の精霊 イフリート');gameState.players[0].hand=[ifrit];gameState.players[0].grave=[mk('ライオウ')];
ok('炎の精霊 イフリート negative: 炎属性墓地なし不可',!iproc.condition(C(ifrit)));
ok('炎の精霊 イフリート ruling: 通常召喚不可flag',sc('炎の精霊 イフリート').cannotNormalSummon===true);
ok('cycle61 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);
