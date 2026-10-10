/* Auto cycle 53 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=53;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){return makeContext(p,card,zone,idx,ev||'activate',extra||{});}
const TARGETS=['疫病狼'];
TARGETS.forEach(n=>ok('cycle53 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle53 枚数は1',TARGETS.length===1);

reset0();
let wolf=mk('疫病狼',0,'up','atk');gameState.players[0].mz=[wolf];
let wolfSc=sc('疫病狼'), ctx=C(0,wolf,'mz',0,'activate');
ok('疫病狼 positive: 表側MZなら発動可能',wolfSc.condition(ctx)===true);
ok('疫病狼 ruling: 1ターンに1度',wolfSc.countLimit===1);
const original=Math.max(0,dbOf(wolf).atk||0);
wolfSc.resolve(ctx);
ok('疫病狼 positive: 元々の攻撃力の倍になる',curATK(wolf)===original*2,'atk='+curATK(wolf));
ok('疫病狼 positive: エンドフェイズ破壊をv7.destroyUidで予約',
  API.schedules('v7.destroyUid').some(s=>s.args&&s.args.uid===wolf.uid&&s.at==='endPhase'));
ok('疫病狼 ruling: schedule state is serializable',JSON.stringify(gameState).indexOf('function')<0);
let sch=API.schedules('v7.destroyUid').find(s=>s.args&&s.args.uid===wolf.uid);
scheduleHandlerV7('v7.destroyUid')(sch.args||sch);
ok('疫病狼 positive: エンドフェイズ時に自身を破壊',gameState.players[0].grave.some(c=>c.uid===wolf.uid));

reset0();
let down=mk('疫病狼',0,'down','def');gameState.players[0].mz=[down];
ok('疫病狼 negative: 裏側では発動不可',sc('疫病狼').condition(C(0,down,'mz',0,'activate'))===false);
reset0();
let handWolf=mk('疫病狼',0,'up','atk');gameState.players[0].hand=[handWolf];
ok('疫病狼 negative: MZ以外では発動不可',sc('疫病狼').condition(C(0,handWolf,'hand',0,'activate'))===false);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);
