/* Auto cycle 63 dedicated positive / negative / ruling-edge tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.phase='main1';gameState.turn=63;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
const TARGETS=['E・HERO フェニックスガイ','M・HERO ヴェイパー','E・HERO シャイニング・フェニックスガイ','M・HERO 剛火','F・G・D'];
TARGETS.forEach(n=>ok('cycle63 registration '+n,!!sc(n)));ok('cycle63 枚数は5',TARGETS.length===5);

reset0();
let phoenix=mk('E・HERO フェニックスガイ'),foe=mk('青眼の白龍',1);gameState.players[0].mz=[phoenix];gameState.players[1].mz=[foe];
ok('フェニックスガイ positive: 戦闘破壊されない',battleProof(phoenix)===true);
ok('フェニックスガイ negative: 効果破壊耐性はない',protectionRecordV21(gameState,phoenix,{cause:'effect',sourcePlayer:1})===null);

reset0();
let vapor=mk('M・HERO ヴェイパー');foe=mk('青眼の白龍',1);gameState.players[0].mz=[vapor];gameState.players[1].mz=[foe];
ok('ヴェイパー positive: カード効果では破壊されない',!!protectionRecordV21(gameState,vapor,{cause:'effect',sourcePlayer:1}));
ok('ヴェイパー negative: 戦闘破壊耐性はない',protectionRecordV21(gameState,vapor,{cause:'battle',opponentCard:foe})===null);

reset0();
let shining=mk('E・HERO シャイニング・フェニックスガイ');gameState.players[0].mz=[shining];gameState.players[0].grave=[mk('E・HERO エアーマン'),mk('E・HERO バーストレディ'),mk('ワイト')];
ok('シャイニング・フェニックスガイ positive: 墓地E・HERO2体でATK+600',curATK(shining)===(dbOf(shining).atk||0)+600);
ok('シャイニング・フェニックスガイ ruling: 非E・HEROは数えない',curATK(shining)!==(dbOf(shining).atk||0)+900);
ok('シャイニング・フェニックスガイ positive: 戦闘破壊されない',battleProof(shining)===true);
shining.face='down';ok('シャイニング・フェニックスガイ negative: 裏側ではATK修整なし',curATK(shining)===(dbOf(shining).atk||0));

reset0();
let goka=mk('M・HERO 剛火');gameState.players[0].mz=[goka];gameState.players[0].grave=[mk('E・HERO エアーマン'),mk('D－HERO ディアボリックガイ'),mk('ワイト')];
ok('M・HERO 剛火 positive: 墓地HERO2体でATK+200',curATK(goka)===(dbOf(goka).atk||0)+200);
gameState.players[0].grave=[];ok('M・HERO 剛火 negative: 墓地HERO0体なら修整なし',curATK(goka)===(dbOf(goka).atk||0));

reset0();
let fgd=mk('F・G・D'),dark=mk('クリッター',1),light=mk('ライオウ',1);gameState.players[0].mz=[fgd];gameState.players[1].mz=[dark,light];
ok('F・G・D positive: 闇属性との戦闘では破壊されない',!!protectionRecordV21(gameState,fgd,{cause:'battle',opponentCard:dark}));
ok('F・G・D negative: 光属性との戦闘では破壊耐性なし',protectionRecordV21(gameState,fgd,{cause:'battle',opponentCard:light})===null);
API.setAttribute({p:1,zone:'mz',index:0,card:dark},'光','permanent');
ok('F・G・D ruling: current属性が光へ変われば耐性なし',protectionRecordV21(gameState,fgd,{cause:'battle',opponentCard:dark})===null);
ok('cycle63 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}if(thrown||f||!RR.length)process.exit(2);
