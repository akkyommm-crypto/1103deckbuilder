/* Auto cycle 48 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=48;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){return makeContext(p,card,zone,idx,ev||'activate',extra||{});}
function H(p,z,i){return {p,zone:z,index:i,card:gameState.players[p][z][i],db:dbOf(gameState.players[p][z][i])};}
const TARGETS=['狂植物の氾濫'];
TARGETS.forEach(n=>ok('cycle48 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle48 枚数は1',TARGETS.length===1);

reset0();
let spell=mk('狂植物の氾濫',0), plant=mk('ロードポイズン',0), plant2=mk('アイヴィ・ウォール',0), non=mk('ワイト',0), foePlant=mk('ロードポイズン',1);
gameState.players[0].sz=[spell];gameState.players[0].mz=[plant,non];gameState.players[1].mz=[foePlant];
gameState.players[0].grave=[plant2,mk('ロードポイズン',0)];
let s=sc('狂植物の氾濫'), ctx=C(0,spell,'sz',0,'activate');
ok('狂植物の氾濫 positive: 自分の表側植物がいれば発動可能',s.condition(ctx)===true);
const basePlant=curATK(plant), baseNon=curATK(non), baseFoe=curATK(foePlant);
s.resolve(ctx);
ok('狂植物の氾濫 positive: 自分墓地植物数×300だけ自分植物を強化',curATK(plant)===basePlant+600,'atk='+curATK(plant));
ok('狂植物の氾濫 negative: 非植物は強化しない',curATK(non)===baseNon);
ok('狂植物の氾濫 negative: 相手植物は強化しない',curATK(foePlant)===baseFoe);
ok('狂植物の氾濫 ruling: endPhase破壊をserializable scheduleで予約',
  API.schedules('f0.plantOvergrowthDestroy').length===1&&JSON.stringify(gameState).indexOf('function')<0);
let sch=API.schedules('f0.plantOvergrowthDestroy')[0];
gameState.players[0].mz.push(mk('ロードポイズン',0));
scheduleHandlerV7('f0.plantOvergrowthDestroy')(sch.args||sch);
ok('狂植物の氾濫 positive: エンド時は後から出た自分表側植物も破壊',gameState.players[0].mz.every(c=>dbOf(c).ra!=='植物'));
ok('狂植物の氾濫 negative: エンド破壊は相手植物へ及ばない',gameState.players[1].mz.some(c=>dbOf(c).ra==='植物'));
ok('狂植物の氾濫 negative: 非植物は破壊しない',gameState.players[0].mz.some(c=>dbOf(c).n==='ワイト'));

reset0();
let spell2=mk('狂植物の氾濫',0), noPlant=mk('ワイト',0);
gameState.players[0].sz=[spell2];gameState.players[0].mz=[noPlant];
ok('狂植物の氾濫 negative: 自分表側植物がなければ発動不可',sc('狂植物の氾濫').condition(C(0,spell2,'sz',0,'activate'))===false);

reset0();
let spell3=mk('狂植物の氾濫',0), downPlant=mk('ロードポイズン',0,'down','def');
gameState.players[0].sz=[spell3];gameState.players[0].mz=[downPlant];
ok('狂植物の氾濫 ruling: 裏側植物だけでは発動不可',sc('狂植物の氾濫').condition(C(0,spell3,'sz',0,'activate'))===false);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);
