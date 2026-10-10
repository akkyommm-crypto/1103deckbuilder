/* Auto cycle 45 dedicated tests. */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*$/m,'/* boot skipped */');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=45;PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();v41ResetActionJournal(gameState);gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});if(extra&&extra.event)c.event=extra.event;if(extra&&extra.battle)c.battle=extra.battle;if(extra&&extra.step)c.step=extra.step;return c;}
const TARGETS=['エンシェント・ホーリー・ワイバーン','エレキャッスル'];
TARGETS.forEach(n=>ok('cycle45 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle45 枚数は2',TARGETS.length===2);

reset0();
let wy=mk('エンシェント・ホーリー・ワイバーン'), foe=mk('青眼の白龍',1);
gameState.players[0].mz=[wy];gameState.players[1].mz=[foe];gameState.players[0].lp=9000;gameState.players[1].lp=7500;
let wySc=sc('エンシェント・ホーリー・ワイバーン');
ok('ワイバーン positive: LPが多い分ATK+1500',wySc.continuous.apply(wy,wy,{p:0}).atk===1500);
gameState.players[0].lp=6500;gameState.players[1].lp=8000;
ok('ワイバーン negative/ruling: LPが少ない分ATK-1500',wySc.continuous.apply(wy,wy,{p:0}).atk===-1500);
gameState.players[0].mz=[];gameState.players[0].grave=[wy];gameState.players[0].lp=2000;
let wyCtx=C(0,wy,'grave',0,'onBattleDestroy',{event:{card:wy,reason:'battle'}});
ok('ワイバーン positive: 戦闘破壊で墓地にいれば蘇生候補',wySc.passive.onBattleDestroy(wyCtx)===true);
let paid=false;wySc.cost(wyCtx,v=>{paid=v;});
ok('ワイバーン positive: 1000LPを支払う',paid===true&&gameState.players[0].lp===1000);
wySc.resolve(wyCtx);
ok('ワイバーン positive: 墓地から特殊召喚',gameState.players[0].mz.includes(wy)&&!gameState.players[0].grave.includes(wy));
reset0();wy=mk('エンシェント・ホーリー・ワイバーン');gameState.players[0].grave=[wy];gameState.players[0].lp=1000;
ok('ワイバーン negative: 1000LP以下では候補に出ない',
  wySc.passive.onBattleDestroy(C(0,wy,'grave',0,'onBattleDestroy',{event:{card:wy,reason:'battle'}}))===false);

reset0();
let castle=mk('エレキャッスル'), watt=mk('エレキンギョ',0,'up','def'), attacker=mk('青眼の白龍',1);
gameState.players[0].field=castle;gameState.players[0].mz=[watt];gameState.players[1].mz=[attacker];
let ecSc=sc('エレキャッスル');
let battle={atkCard:attacker,defCard:watt,damage:1500,toPlayer:0};
let ecCtx=C(0,castle,'field',0,'onDamageStep',{battle,step:'after'});
ok('エレキャッスル positive: エレキを攻撃した後に誘発',ecSc.passive.onDamageStep(ecCtx)===true);
const atk0=curATK(attacker);ecSc.resolve(ecCtx);
ok('エレキャッスル positive: 攻撃モンスターATK-1000',curATK(attacker)===atk0-1000);
let nonWatt=mk('ワイト',0,'up','def');gameState.players[0].mz=[nonWatt];
ok('エレキャッスル negative: エレキ以外を攻撃しても誘発しない',
  ecSc.passive.onDamageStep(C(0,castle,'field',0,'onDamageStep',{battle:{atkCard:attacker,defCard:nonWatt},step:'after'}))===false);
ok('エレキャッスル ruling: damage calc後以外は誘発しない',
  ecSc.passive.onDamageStep(C(0,castle,'field',0,'onDamageStep',{battle,step:'calc'}))===false);
castle.face='down';
ok('エレキャッスル negative: 自身が表側でなければ誘発しない',
  ecSc.passive.onDamageStep(C(0,castle,'field',0,'onDamageStep',{battle,step:'after'}))===false);

ok('cycle45 serialization: gameStateへ関数を保存していない',JSON.stringify(gameState).indexOf('function')<0);
`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,require,process,__dirname:path.join(ROOT,'tools'),__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};context.window=context;context.globalThis=context;
let thrown=false;
try{vm.runInNewContext(js,context,{filename:'battle.html',timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=context.__R||[];let f=0;for(const r of RR){console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.detail?' :: '+r.detail:''));if(!r.ok)f++;}
if(thrown||f||!RR.length)process.exit(2);
